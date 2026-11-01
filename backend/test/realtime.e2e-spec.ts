import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { io, type Socket } from "socket.io-client";
import request from "supertest";

import { AppModule } from "@/app.module";
import { PrismaService } from "@/prisma/prisma.service";
import { attachRealtime } from "@/realtime/attach-realtime";
import type { RealtimeGateway } from "@/realtime/realtime.gateway";
import { SquadRealtime } from "@/realtime/squad-realtime";
import type { SquadDetail } from "@/squads/squad.mapper";
import {
  getCharacterPopularity,
  type CharacterPopularity,
} from "@/realtime/get-character-popularity";
import { RealtimeRedis } from "@/realtime/realtime.redis";
import {
  POPULARITY_UPDATED,
  SESSION_ENDED,
  SQUAD_UPDATED,
} from "@/realtime/realtime.events";
import { REALTIME_PATH } from "@/realtime/realtime.path";
import { setupApp } from "@/setup-app";

import { cookieValue } from "./cookie";

function readPort(app: INestApplication): number {
  const address = app.getHttpServer().address();

  if (typeof address === "object" && address !== null) {
    return address.port;
  }

  throw new Error("HTTP server is not listening");
}

function waitFor<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${event}`));
    }, 5_000);

    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function openSocket(url: string, cookie?: string): Promise<Socket> {
  const socket = io(url, {
    path: REALTIME_PATH,
    transports: ["websocket"],
    reconnection: false,
    extraHeaders: cookie ? { cookie } : undefined,
  });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("Timed out opening a socket"));
    }, 5_000);

    socket.once("connect", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("connect_error", (error: Error) => {
      clearTimeout(timer);
      socket.close();
      reject(error);
    });
  });
}

describe("Realtime", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let url: string;
  let ownerCookie: string;
  let ownerLogoutCookie: string;
  let strangerCookie: string;
  let characterId: number;
  const open: Socket[] = [];

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    setupApp(app);
    attachRealtime(app);
    await app.listen(0);
    await app.get(RealtimeRedis).pub.ping();
    prisma = app.get(PrismaService);
    url = `http://127.0.0.1:${readPort(app)}`;

    const server = app.getHttpServer();
    const password = "correct-horse";
    const owner = await request(server)
      .post("/api/v1/auth/register")
      .send({ email: `rt-owner-${randomUUID()}@example.com`, password })
      .expect(201);
    const stranger = await request(server)
      .post("/api/v1/auth/register")
      .send({ email: `rt-stranger-${randomUUID()}@example.com`, password })
      .expect(201);

    ownerCookie = `access_token=${cookieValue(owner, "access_token")}`;
    ownerLogoutCookie = `${ownerCookie}; refresh_token=${cookieValue(owner, "refresh_token")}`;
    strangerCookie = `access_token=${cookieValue(stranger, "access_token")}`;

    const character = await prisma.character.findFirst({
      select: { id: true },
      orderBy: { id: "desc" },
    });

    if (!character) {
      throw new Error("Expected a seeded character");
    }

    characterId = character.id;
  });

  afterAll(async () => {
    for (const socket of open) {
      socket.close();
    }

    await app.close();
  });

  it("rejects a handshake without the access cookie", async () => {
    const socket = io(url, {
      path: REALTIME_PATH,
      transports: ["websocket"],
      reconnection: false,
    });
    open.push(socket);

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Timed out waiting for the handshake to fail"));
      }, 5_000);

      socket.once("connect_error", () => {
        clearTimeout(timer);
        resolve();
      });
    });

    expect(socket.connected).toBe(false);
  });

  it("tells the owner's other session, and not another user, about a squad change", async () => {
    const owner = await openSocket(url, ownerCookie);
    const stranger = await openSocket(url, strangerCookie);
    open.push(owner, stranger);

    let leaked = false;
    stranger.on(SQUAD_UPDATED, () => {
      leaked = true;
    });
    const squadUpdate = waitFor<{ members: unknown[]; updatedAt: unknown }>(
      owner,
      SQUAD_UPDATED,
    );
    const popularity = waitFor<CharacterPopularity[]>(
      stranger,
      POPULARITY_UPDATED,
    );

    await request(app.getHttpServer())
      .post("/api/v1/squads")
      .set("Cookie", ownerCookie)
      .send({ name: "Realtime", characterIds: [characterId] })
      .expect(201);

    const squad = await squadUpdate;
    const ranking = await popularity;

    expect(squad.members).toHaveLength(1);
    expect(typeof squad.updatedAt).toBe("string");
    expect(leaked).toBe(false);
    expect(Array.isArray(ranking)).toBe(true);
  });

  it("broadcasts how many squads picked a character", async () => {
    const before = await getCharacterPopularity(prisma);
    const leader = before[0];

    if (!leader) {
      throw new Error("Expected at least one picked character");
    }

    const owner = await openSocket(url, ownerCookie);
    open.push(owner);
    await waitFor<CharacterPopularity[]>(owner, POPULARITY_UPDATED);
    const popularity = waitFor<CharacterPopularity[]>(
      owner,
      POPULARITY_UPDATED,
    );

    await request(app.getHttpServer())
      .post("/api/v1/squads")
      .set("Cookie", strangerCookie)
      .send({ name: "Also realtime", characterIds: [leader.id] })
      .expect(201);

    const ranking = await popularity;
    const first = ranking[0];

    expect(first?.id).toBe(leader.id);
    expect(first?.picks).toBe(leader.picks + 1);
  });

  it("closes this user's sockets on logout", async () => {
    const owner = await openSocket(url, ownerCookie);
    open.push(owner);
    const ended = waitFor<void>(owner, SESSION_ENDED);
    const closed = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Timed out waiting for the socket to close"));
      }, 5_000);

      owner.once("disconnect", () => {
        clearTimeout(timer);
        resolve();
      });
    });

    await request(app.getHttpServer())
      .post("/api/v1/auth/logout")
      .set("Cookie", ownerLogoutCookie)
      .expect(204);

    await ended;
    await closed;
  });
});

describe("SquadRealtime", () => {
  it("publishes the squad when the popularity query fails", async () => {
    const published: SquadDetail[] = [];
    const gateway = {
      emitSquad(_userId: string, squad: SquadDetail) {
        published.push(squad);
      },
      emitPopularity() {
        throw new Error("popularity was emitted");
      },
    };
    const prisma = {
      $queryRaw: () => Promise.reject(new Error("popularity failed")),
    };
    const realtime = new SquadRealtime(
      gateway as unknown as RealtimeGateway,
      prisma as unknown as PrismaService,
    );
    const squad: SquadDetail = {
      id: "squad",
      name: "My team",
      updatedAt: "2026-11-02T00:00:00.000Z",
      members: [],
      statistics: [],
    };

    await realtime.publishSquad("user", squad, true);

    expect(published).toEqual([squad]);
  });
});
