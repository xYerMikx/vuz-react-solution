import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@generated/prisma/client";

import { PrismaService } from "@/prisma/prisma.service";
import { readCache, readThroughCache } from "@/redis/read-through-cache";
import { RedisService } from "@/redis/redis.service";

import { getFiltersCacheKey, getListCacheKey } from "./cache-key";
import {
  toCharacter,
  type CharacterResponse,
  type CharacterRow,
} from "./character.mapper";
import { encodePageCursor } from "./cursor";
import { normalizeListQuery, readPageCursor } from "./list-query";
import { type ListCharactersQuery } from "./dto/list-characters.query";

const CACHE_TTL_SECONDS = 600;

const characterInclude = {
  universe: { select: { name: true } },
  tags: {
    orderBy: { slot: "asc" as const },
    select: { slot: true, tag: { select: { name: true } } },
  },
  abilities: {
    orderBy: { ability: { name: "asc" as const } },
    select: { score: true, ability: { select: { name: true } } },
  },
};

export interface CharacterListResponse {
  items: CharacterResponse[];
  nextCursor: string | null;
}

export interface CharacterFiltersResponse {
  tags: string[];
  universes: string[];
}

@Injectable()
export class CharactersService {
  private readonly logger = new Logger(CharactersService.name);
  private readonly reportCacheFailure = (error: unknown): void => {
    const message = error instanceof Error ? error.message : "unknown error";
    this.logger.warn(`Character cache skipped: ${message}`);
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async list(query: ListCharactersQuery): Promise<CharacterListResponse> {
    const input = normalizeListQuery(query);
    const version = await this.getCacheVersion();
    if (version === null) return this.queryList(input);
    return readThroughCache(
      this.redis.client,
      getListCacheKey(version, input),
      CACHE_TTL_SECONDS,
      () => this.queryList(input),
      this.reportCacheFailure,
    );
  }

  async filters(): Promise<CharacterFiltersResponse> {
    const version = await this.getCacheVersion();
    if (version === null) return this.queryFilters();
    return readThroughCache(
      this.redis.client,
      getFiltersCacheKey(version),
      CACHE_TTL_SECONDS,
      () => this.queryFilters(),
      this.reportCacheFailure,
    );
  }

  async findOne(id: number): Promise<CharacterResponse> {
    const row = await this.prisma.character.findUnique({
      where: { id },
      include: characterInclude,
    });
    if (!row) {
      throw new NotFoundException({
        error: "CHARACTER_NOT_FOUND",
        message: "Character not found",
      });
    }
    return toCharacter(row);
  }

  private async queryList(
    input: ReturnType<typeof normalizeListQuery>,
  ): Promise<CharacterListResponse> {
    const whereInput: Prisma.CharacterWhereInput = {};
    const andInput: Prisma.CharacterWhereInput[] = [];

    if (input.search) {
      andInput.push({
        name: { contains: input.search, mode: "insensitive" },
      });
    }
    if (input.tags.length > 0) {
      andInput.push({
        tags: { some: { tag: { name: { in: input.tags } } } },
      });
    }
    if (input.universe) {
      andInput.push({
        universe: { name: { equals: input.universe, mode: "insensitive" } },
      });
    }
    if (input.cursor && input.sort === "name") {
      const cursor = readPageCursor(input.cursor, "name");
      andInput.push({
        OR: [
          { name: { gt: cursor.name } },
          { name: cursor.name, id: { gt: cursor.id } },
        ],
      });
    } else if (input.cursor) {
      const cursor = readPageCursor(input.cursor, "id");
      andInput.push({ id: { gt: cursor.id } });
    }
    if (andInput.length > 0) whereInput.AND = andInput;

    const rows = await this.prisma.character.findMany({
      where: whereInput,
      include: characterInclude,
      orderBy:
        input.sort === "id" ? { id: "asc" } : [{ name: "asc" }, { id: "asc" }],
      take: input.limit + 1,
    });

    const page = rows.slice(0, input.limit);
    const last = page.at(-1);
    const hasNext = rows.length > input.limit;

    return {
      items: page.map((row) => toCharacter(row as CharacterRow)),
      nextCursor: hasNext && last ? encodePageCursor(last, input.sort) : null,
    };
  }

  private async queryFilters(): Promise<CharacterFiltersResponse> {
    const [tags, universes] = await Promise.all([
      this.prisma.tag.findMany({
        orderBy: { id: "asc" },
        select: { name: true },
      }),
      this.prisma.universe.findMany({
        orderBy: { id: "asc" },
        select: { name: true },
      }),
    ]);
    return {
      tags: tags.map((tag) => tag.name),
      universes: universes.map((universe) => universe.name),
    };
  }

  private async getCacheVersion(): Promise<string | null> {
    const version = await readCache(
      this.redis.client,
      "chars:version",
      this.reportCacheFailure,
    );
    if (version.status === "unavailable") return null;
    if (version.status === "miss") return "0";
    return version.value;
  }
}
