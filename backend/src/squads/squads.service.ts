import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Prisma } from "@generated/prisma/client";

import { PrismaService } from "@/prisma/prisma.service";
import { SquadRealtime } from "@/realtime/squad-realtime";

import { type CreateSquadDto } from "./dto/create-squad.dto";
import { type UpdateSquadDto } from "./dto/update-squad.dto";
import {
  isSquadNameLengthValid,
  normalizeSquadName,
} from "./normalize-squad-name";
import {
  toSquadDetail,
  type SquadDetail,
  type SquadStatisticResponse,
} from "./squad.mapper";
import { rejectAdd, rejectRoster, type RosterRejection } from "./squad.rules";

const UNIQUE_CONSTRAINT_FAILED = "P2002";
const FOREIGN_KEY_CONSTRAINT_FAILED = "P2003";

const memberInclude = {
  orderBy: { position: "asc" as const },
  select: {
    position: true,
    character: {
      select: {
        id: true,
        name: true,
        thumbnail: true,
        universe: { select: { name: true } },
      },
    },
  },
};

interface AbilityAverageRow {
  abilityName: string;
  average: unknown;
}

export interface SquadSummary {
  id: string;
  name: string;
  memberCount: number;
}

type Transaction = Prisma.TransactionClient;

@Injectable()
export class SquadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: SquadRealtime,
  ) {}

  async list(userId: string): Promise<SquadSummary[]> {
    const squads = await this.prisma.squad.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true } },
      },
    });
    return squads.map((squad) => ({
      id: squad.id,
      name: squad.name,
      memberCount: squad._count.members,
    }));
  }

  async create(userId: string, body: CreateSquadDto): Promise<SquadDetail> {
    const name = this.readName(body.name);
    const characterIds = body.characterIds ?? [];
    this.throwIfRosterRejected(rejectRoster(characterIds));

    const squadId = await this.prisma.$transaction(async (tx) => {
      const squad = await tx.squad.create({ data: { userId, name } });
      await this.lockSquad(tx, userId, squad.id);
      await this.replaceMembers(tx, squad.id, characterIds);
      return squad.id;
    });
    const squad = await this.findOne(userId, squadId);

    await this.realtime.publishSquad(userId, squad, characterIds.length > 0);

    return squad;
  }

  async findOne(userId: string, squadId: string): Promise<SquadDetail> {
    const squad = await this.prisma.squad.findFirst({
      where: { id: squadId, userId },
      select: { id: true, name: true, updatedAt: true, members: memberInclude },
    });
    if (!squad) throw this.squadNotFound();
    const statistics = await this.loadStatistics(squadId);
    return toSquadDetail(squad, statistics);
  }

  async update(
    userId: string,
    squadId: string,
    body: UpdateSquadDto,
  ): Promise<SquadDetail> {
    if (body.name === undefined && body.characterIds === undefined) {
      throw new BadRequestException({
        error: "VALIDATION_ERROR",
        message: "Provide a name or a character list",
      });
    }
    const name = body.name === undefined ? undefined : this.readName(body.name);
    if (body.characterIds) {
      this.throwIfRosterRejected(rejectRoster(body.characterIds));
    }

    await this.prisma.$transaction(async (tx) => {
      await this.lockSquad(tx, userId, squadId);
      if (name !== undefined) {
        await tx.squad.update({ where: { id: squadId }, data: { name } });
      }
      if (body.characterIds) {
        await this.replaceMembers(tx, squadId, body.characterIds);
      }
    });
    const squad = await this.findOne(userId, squadId);

    await this.realtime.publishSquad(
      userId,
      squad,
      body.characterIds !== undefined,
    );

    return squad;
  }

  async remove(userId: string, squadId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.lockSquad(tx, userId, squadId);
      await tx.squad.delete({ where: { id: squadId } });
    });
    await this.realtime.publishSquadRemoved(
      userId,
      squadId,
      new Date().toISOString(),
    );
  }

  async addMember(
    userId: string,
    squadId: string,
    characterId: number,
  ): Promise<SquadDetail> {
    await this.prisma.$transaction(async (tx) => {
      await this.lockSquad(tx, userId, squadId);
      const members = await tx.squadMember.findMany({
        where: { squadId },
        select: { characterId: true, position: true },
      });
      this.throwIfRosterRejected(
        rejectAdd(
          members.map((member) => member.characterId),
          characterId,
        ),
      );
      await this.assertCharactersExist(tx, [characterId]);
      const position =
        members.reduce(
          (highest, member) => Math.max(highest, member.position),
          0,
        ) + 1;
      try {
        await tx.squadMember.create({
          data: { squadId, characterId, position },
        });
      } catch (error) {
        this.rethrowConstraint(error);
      }
    });
    const squad = await this.findOne(userId, squadId);

    await this.realtime.publishSquad(userId, squad, true);

    return squad;
  }

  async removeMember(
    userId: string,
    squadId: string,
    characterId: number,
  ): Promise<SquadDetail> {
    await this.prisma.$transaction(async (tx) => {
      await this.lockSquad(tx, userId, squadId);
      const member = await tx.squadMember.findUnique({
        where: { squadId_characterId: { squadId, characterId } },
        select: { characterId: true },
      });
      if (!member) {
        throw new NotFoundException({
          error: "MEMBER_NOT_FOUND",
          message: "Character is not in this squad",
        });
      }
      await tx.squadMember.delete({
        where: { squadId_characterId: { squadId, characterId } },
      });
    });
    const squad = await this.findOne(userId, squadId);

    await this.realtime.publishSquad(userId, squad, true);

    return squad;
  }

  private async lockSquad(
    tx: Transaction,
    userId: string,
    squadId: string,
  ): Promise<void> {
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Squad"
      WHERE id = ${squadId} AND "userId" = ${userId}
      FOR UPDATE
    `;
    if (!rows[0]) throw this.squadNotFound();
  }

  private async replaceMembers(
    tx: Transaction,
    squadId: string,
    characterIds: number[],
  ): Promise<void> {
    await this.assertCharactersExist(tx, characterIds);
    await tx.squadMember.deleteMany({ where: { squadId } });
    if (characterIds.length === 0) return;
    await tx.squadMember.createMany({
      data: characterIds.map((characterId, index) => ({
        squadId,
        characterId,
        position: index + 1,
      })),
    });
  }

  private async assertCharactersExist(
    tx: Transaction,
    characterIds: number[],
  ): Promise<void> {
    if (characterIds.length === 0) return;
    const found = await tx.character.findMany({
      where: { id: { in: characterIds } },
      select: { id: true },
    });
    if (found.length !== new Set(characterIds).size) {
      throw new UnprocessableEntityException({
        error: "CHARACTER_NOT_FOUND",
        message: "Character not found",
      });
    }
  }

  private async loadStatistics(
    squadId: string,
  ): Promise<SquadStatisticResponse[]> {
    const rows = await this.prisma.$queryRaw<AbilityAverageRow[]>`
      SELECT a.name AS "abilityName",
             ROUND(AVG(ca.score)::numeric, 2) AS average
      FROM "SquadMember" sm
      JOIN "CharacterAbility" ca ON ca."characterId" = sm."characterId"
      JOIN "Ability" a ON a.id = ca."abilityId"
      WHERE sm."squadId" = ${squadId}
      GROUP BY a.id, a.name
      ORDER BY a.name
    `;
    return rows.map((row) => ({
      abilityName: row.abilityName,
      average: readAverage(row.average),
    }));
  }

  private readName(name: string): string {
    const normalized = normalizeSquadName(name);
    if (!isSquadNameLengthValid(normalized)) {
      throw new BadRequestException({
        error: "VALIDATION_ERROR",
        message: "Squad name must be 1-40 characters",
      });
    }
    return normalized;
  }

  private throwIfRosterRejected(rejection: RosterRejection | null): void {
    if (rejection === null) return;
    if (rejection === "SQUAD_FULL") {
      throw new UnprocessableEntityException({
        error: "SQUAD_FULL",
        message: "A squad cannot have more than 6 characters",
      });
    }
    throw new ConflictException({
      error: "DUPLICATE_MEMBER",
      message: "Character is already in this squad",
    });
  }

  private rethrowConstraint(error: unknown): never {
    if (isPrismaCode(error, UNIQUE_CONSTRAINT_FAILED)) {
      throw new ConflictException({
        error: "DUPLICATE_MEMBER",
        message: "Character is already in this squad",
      });
    }
    if (isPrismaCode(error, FOREIGN_KEY_CONSTRAINT_FAILED)) {
      throw new UnprocessableEntityException({
        error: "CHARACTER_NOT_FOUND",
        message: "Character not found",
      });
    }
    throw error;
  }

  private squadNotFound(): NotFoundException {
    return new NotFoundException({
      error: "SQUAD_NOT_FOUND",
      message: "Squad not found",
    });
  }
}

function isPrismaCode(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

function readAverage(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (
    typeof value === "object" &&
    value !== null &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    return Number(value.toString());
  }
  throw new Error("Unexpected ability average");
}
