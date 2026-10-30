import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import request from "supertest";

import { AppModule } from "@/app.module";
import { PrismaService } from "@/prisma/prisma.service";
import { setupApp } from "@/setup-app";

import { cookieValue } from "./cookie";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readErrorCode(body: unknown): string {
  if (!isRecord(body) || typeof body.error !== "string") {
    throw new Error("Unexpected error payload");
  }
  return body.error;
}

function readSquadId(body: unknown): string {
  if (!isRecord(body) || typeof body.id !== "string") {
    throw new Error("Unexpected squad payload");
  }
  return body.id;
}

function readMembers(body: unknown): { id: number }[] {
  if (!isRecord(body) || !Array.isArray(body.members)) {
    throw new Error("Unexpected squad payload");
  }
  return body.members.map((member) => {
    if (
      !isRecord(member) ||
      !isRecord(member.character) ||
      typeof member.character.id !== "number"
    ) {
      throw new Error("Unexpected squad member");
    }
    return { id: member.character.id };
  });
}

function readStatistics(
  body: unknown,
): { abilityName: string; average: number }[] {
  if (!isRecord(body) || !Array.isArray(body.statistics)) {
    throw new Error("Unexpected statistics");
  }
  return body.statistics.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.abilityName !== "string" ||
      typeof item.average !== "number"
    ) {
      throw new Error("Unexpected statistic");
    }
    return { abilityName: item.abilityName, average: item.average };
  });
}

function roundAverage(scores: number[]): number {
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.round(mean * 100) / 100;
}

describe("Squads", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ownerCookie: string;
  let strangerCookie: string;
  let characterIds: number[];

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const server = app.getHttpServer();
    const password = "correct-horse";
    const owner = await request(server)
      .post("/api/v1/auth/register")
      .send({ email: `owner-${randomUUID()}@example.com`, password })
      .expect(201);
    const stranger = await request(server)
      .post("/api/v1/auth/register")
      .send({ email: `stranger-${randomUUID()}@example.com`, password })
      .expect(201);
    ownerCookie = `access_token=${cookieValue(owner, "access_token")}`;
    strangerCookie = `access_token=${cookieValue(stranger, "access_token")}`;

    const characters = await prisma.character.findMany({
      select: { id: true },
      orderBy: { id: "asc" },
      take: 8,
    });
    if (characters.length < 8) throw new Error("Expected seeded characters");
    characterIds = characters.map((character) => character.id);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createSquad(
    name: string,
    ids: number[] = [],
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post("/api/v1/squads")
      .set("Cookie", ownerCookie)
      .send({ name, characterIds: ids })
      .expect(201);
    return readSquadId(response.body);
  }

  it("rejects squad routes without an access cookie", async () => {
    const server = app.getHttpServer();
    await request(server).get("/api/v1/squads").expect(401);
    await request(server)
      .post("/api/v1/squads")
      .send({ name: "Nope" })
      .expect(401);
  });

  it("stores a trimmed name and hides the squad from another user", async () => {
    const server = app.getHttpServer();
    const created = await request(server)
      .post("/api/v1/squads")
      .set("Cookie", ownerCookie)
      .send({ name: "  Earthrealm  ", characterIds: [characterIds[0]] })
      .expect(201);
    const squadId = readSquadId(created.body);
    if (!isRecord(created.body) || created.body.name !== "Earthrealm") {
      throw new Error("Name was not trimmed");
    }

    const mine = await request(server)
      .get("/api/v1/squads")
      .set("Cookie", ownerCookie)
      .expect(200);
    if (!Array.isArray(mine.body)) throw new Error("Expected a squad list");
    expect(
      mine.body.some((item) => isRecord(item) && item.id === squadId),
    ).toBe(true);

    const theirs = await request(server)
      .get("/api/v1/squads")
      .set("Cookie", strangerCookie)
      .expect(200);
    if (!Array.isArray(theirs.body)) throw new Error("Expected a squad list");
    expect(
      theirs.body.some((item) => isRecord(item) && item.id === squadId),
    ).toBe(false);

    const calls = [
      () => request(server).get(`/api/v1/squads/${squadId}`),
      () =>
        request(server)
          .patch(`/api/v1/squads/${squadId}`)
          .send({ name: "Stolen" }),
      () => request(server).delete(`/api/v1/squads/${squadId}`),
      () =>
        request(server).post(
          `/api/v1/squads/${squadId}/characters/${characterIds[1]}`,
        ),
      () =>
        request(server).delete(
          `/api/v1/squads/${squadId}/characters/${characterIds[0]}`,
        ),
    ];
    for (const call of calls) {
      const response = await call().set("Cookie", strangerCookie);
      expect(response.status).toBe(404);
      expect(readErrorCode(response.body)).toBe("SQUAD_NOT_FOUND");
    }
  });

  it("renames, replaces the roster, removes a member, and deletes the squad", async () => {
    const server = app.getHttpServer();
    const squadId = await createSquad("Defenders", [
      characterIds[0] ?? 0,
      characterIds[1] ?? 0,
    ]);

    const renamed = await request(server)
      .patch(`/api/v1/squads/${squadId}`)
      .set("Cookie", ownerCookie)
      .send({ name: "Champions" })
      .expect(200);
    if (!isRecord(renamed.body) || renamed.body.name !== "Champions") {
      throw new Error("Squad was not renamed");
    }

    const replaced = await request(server)
      .patch(`/api/v1/squads/${squadId}`)
      .set("Cookie", ownerCookie)
      .send({ characterIds: [characterIds[2]] })
      .expect(200);
    expect(readMembers(replaced.body).map((member) => member.id)).toEqual([
      characterIds[2],
    ]);

    const removed = await request(server)
      .delete(`/api/v1/squads/${squadId}/characters/${characterIds[2]}`)
      .set("Cookie", ownerCookie)
      .expect(200);
    expect(readMembers(removed.body)).toEqual([]);

    const missing = await request(server)
      .delete(`/api/v1/squads/${squadId}/characters/${characterIds[2]}`)
      .set("Cookie", ownerCookie)
      .expect(404);
    expect(readErrorCode(missing.body)).toBe("MEMBER_NOT_FOUND");

    await request(server)
      .delete(`/api/v1/squads/${squadId}`)
      .set("Cookie", ownerCookie)
      .expect(204);
    const gone = await request(server)
      .get(`/api/v1/squads/${squadId}`)
      .set("Cookie", ownerCookie)
      .expect(404);
    expect(readErrorCode(gone.body)).toBe("SQUAD_NOT_FOUND");
  });

  it("rejects a duplicate member and an unknown character", async () => {
    const server = app.getHttpServer();
    const squadId = await createSquad("Duplicates", [characterIds[0] ?? 0]);

    const duplicate = await request(server)
      .post(`/api/v1/squads/${squadId}/characters/${characterIds[0]}`)
      .set("Cookie", ownerCookie)
      .expect(409);
    expect(readErrorCode(duplicate.body)).toBe("DUPLICATE_MEMBER");

    const missing = await request(server)
      .post(`/api/v1/squads/${squadId}/characters/999999`)
      .set("Cookie", ownerCookie)
      .expect(422);
    expect(readErrorCode(missing.body)).toBe("CHARACTER_NOT_FOUND");
  });

  it("stops at six members", async () => {
    const server = app.getHttpServer();
    const squadId = await createSquad("Full", characterIds.slice(0, 6));
    const extra = characterIds[6];
    if (extra === undefined) throw new Error("Missing a seventh character");

    const overflow = await request(server)
      .post(`/api/v1/squads/${squadId}/characters/${extra}`)
      .set("Cookie", ownerCookie)
      .expect(422);
    expect(readErrorCode(overflow.body)).toBe("SQUAD_FULL");

    const squad = await request(server)
      .get(`/api/v1/squads/${squadId}`)
      .set("Cookie", ownerCookie)
      .expect(200);
    expect(readMembers(squad.body)).toHaveLength(6);
  });

  it("lets only one of two parallel adds become the sixth member", async () => {
    const server = app.getHttpServer();
    const squadId = await createSquad("Race", characterIds.slice(0, 5));
    const first = characterIds[5];
    const second = characterIds[6];
    if (first === undefined || second === undefined) {
      throw new Error("Missing characters for the race");
    }

    const [left, right] = await Promise.all([
      request(server)
        .post(`/api/v1/squads/${squadId}/characters/${first}`)
        .set("Cookie", ownerCookie),
      request(server)
        .post(`/api/v1/squads/${squadId}/characters/${second}`)
        .set("Cookie", ownerCookie),
    ]);
    const statuses = [left.status, right.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 422]);
    expect(
      [left, right].some(
        (response) =>
          response.status === 422 &&
          readErrorCode(response.body) === "SQUAD_FULL",
      ),
    ).toBe(true);

    const squad = await request(server)
      .get(`/api/v1/squads/${squadId}`)
      .set("Cookie", ownerCookie)
      .expect(200);
    expect(readMembers(squad.body)).toHaveLength(6);
  });

  it("lets only one of two parallel adds of the same character succeed", async () => {
    const server = app.getHttpServer();
    const squadId = await createSquad("Same");
    const characterId = characterIds[0];
    if (characterId === undefined) throw new Error("Missing a character");

    const [left, right] = await Promise.all([
      request(server)
        .post(`/api/v1/squads/${squadId}/characters/${characterId}`)
        .set("Cookie", ownerCookie),
      request(server)
        .post(`/api/v1/squads/${squadId}/characters/${characterId}`)
        .set("Cookie", ownerCookie),
    ]);
    const statuses = [left.status, right.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);
    expect(
      [left, right].some(
        (response) =>
          response.status === 409 &&
          readErrorCode(response.body) === "DUPLICATE_MEMBER",
      ),
    ).toBe(true);

    const squad = await request(server)
      .get(`/api/v1/squads/${squadId}`)
      .set("Cookie", ownerCookie)
      .expect(200);
    expect(readMembers(squad.body)).toHaveLength(1);
  });

  it("returns ability averages and recalculates them after a removal", async () => {
    const server = app.getHttpServer();
    const first = characterIds[0];
    const second = characterIds[1];
    if (first === undefined || second === undefined) {
      throw new Error("Missing characters for statistics");
    }
    const squadId = await createSquad("Averages", [first, second]);

    const scores = await prisma.characterAbility.findMany({
      where: { characterId: { in: [first, second] } },
      select: {
        characterId: true,
        score: true,
        ability: { select: { name: true } },
      },
    });
    const created = await request(server)
      .get(`/api/v1/squads/${squadId}`)
      .set("Cookie", ownerCookie)
      .expect(200);
    expect(readStatistics(created.body)).toEqual(
      averagesFor(
        scores.filter(
          (row) => row.characterId === first || row.characterId === second,
        ),
      ),
    );

    await request(server)
      .delete(`/api/v1/squads/${squadId}/characters/${second}`)
      .set("Cookie", ownerCookie)
      .expect(200);
    const remaining = await request(server)
      .get(`/api/v1/squads/${squadId}`)
      .set("Cookie", ownerCookie)
      .expect(200);
    expect(readStatistics(remaining.body)).toEqual(
      averagesFor(scores.filter((row) => row.characterId === first)),
    );
  });
});

function averagesFor(
  rows: { score: number; ability: { name: string } }[],
): { abilityName: string; average: number }[] {
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const scores = groups.get(row.ability.name) ?? [];
    scores.push(row.score);
    groups.set(row.ability.name, scores);
  }
  return [...groups.entries()]
    .map(([abilityName, scores]) => ({
      abilityName,
      average: roundAverage(scores),
    }))
    .sort((left, right) => left.abilityName.localeCompare(right.abilityName));
}
