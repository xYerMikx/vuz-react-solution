import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";

import { PrismaService } from "@/prisma/prisma.service";
import type { SquadDetail } from "@/squads/squad.mapper";

import {
  getCharacterPopularity,
  type CharacterPopularity,
} from "./get-character-popularity";
import { getUserRoom } from "./get-user-room";
import { readAccessToken } from "./read-access-token";
import {
  POPULARITY_UPDATED,
  SESSION_ENDED,
  SQUAD_DELETED,
  SQUAD_UPDATED,
} from "./realtime.events";
import { REALTIME_PATH } from "./realtime.path";

interface AccessPayload {
  sub: string;
}

@Injectable()
@WebSocketGateway({ path: REALTIME_PATH })
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server?: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server): void {
    server.use((socket, next) => {
      const token = readAccessToken(readCookieHeader(socket));

      if (!token) {
        next(new Error("UNAUTHORIZED"));

        return;
      }

      try {
        const payload = this.jwt.verify<AccessPayload>(token);

        if (typeof payload.sub !== "string" || payload.sub.length === 0) {
          next(new Error("UNAUTHORIZED"));

          return;
        }

        socket.data = { userId: payload.sub };
        next();
      } catch {
        next(new Error("UNAUTHORIZED"));
      }
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    const userId = client.data?.userId;

    if (typeof userId !== "string" || userId.length === 0) {
      client.disconnect(true);

      return;
    }

    await client.join(getUserRoom(userId));
    const characters = await getCharacterPopularity(this.prisma);
    client.emit(POPULARITY_UPDATED, characters);
  }

  emitSquad(userId: string, squad: SquadDetail): void {
    this.server?.to(getUserRoom(userId)).emit(SQUAD_UPDATED, squad);
  }

  emitSquadRemoved(userId: string, squadId: string, updatedAt: string): void {
    this.server
      ?.to(getUserRoom(userId))
      .emit(SQUAD_DELETED, { squadId, updatedAt });
  }

  endSession(userId: string): void {
    const server = this.server;

    if (!server) {
      return;
    }

    const room = getUserRoom(userId);

    try {
      server.to(room).emit(SESSION_ENDED);
      server.in(room).disconnectSockets(true);
    } catch (error) {
      this.logger.warn(
        `Failed to close sockets after logout: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  emitPopularity(characters: CharacterPopularity[]): void {
    this.server?.emit(POPULARITY_UPDATED, characters);
  }
}

function readCookieHeader(socket: Socket): string | undefined {
  const header = socket.handshake.headers.cookie;

  if (typeof header !== "string") {
    return undefined;
  }

  return header;
}
