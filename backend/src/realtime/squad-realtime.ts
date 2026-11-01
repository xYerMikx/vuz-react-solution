import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/prisma/prisma.service";
import type { SquadDetail } from "@/squads/squad.mapper";

import { getCharacterPopularity } from "./get-character-popularity";
import { RealtimeGateway } from "./realtime.gateway";

@Injectable()
export class SquadRealtime {
  constructor(
    private readonly gateway: RealtimeGateway,
    private readonly prisma: PrismaService,
  ) {}

  async publishSquad(
    userId: string,
    squad: SquadDetail,
    rosterChanged: boolean,
  ): Promise<void> {
    this.gateway.emitSquad(userId, squad);

    if (!rosterChanged) {
      return;
    }

    await this.publishPopularity();
  }

  async publishSquadRemoved(
    userId: string,
    squadId: string,
    updatedAt: string,
  ): Promise<void> {
    this.gateway.emitSquadRemoved(userId, squadId, updatedAt);
    await this.publishPopularity();
  }

  endSession(userId: string): void {
    this.gateway.endSession(userId);
  }

  private async publishPopularity(): Promise<void> {
    const characters = await getCharacterPopularity(this.prisma);
    this.gateway.emitPopularity(characters);
  }
}
