import { PrismaService } from "@/prisma/prisma.service";

const POPULARITY_LIMIT = 5;

export interface CharacterPopularity {
  id: number;
  name: string;
  thumbnail: string | null;
  picks: number;
}

interface PopularityRow {
  id: number;
  name: string;
  thumbnail: string | null;
  picks: unknown;
}

export async function getCharacterPopularity(
  prisma: PrismaService,
): Promise<CharacterPopularity[]> {
  const rows = await prisma.$queryRaw<PopularityRow[]>`
    SELECT c.id, c.name, c.thumbnail, COUNT(*)::int AS picks
    FROM "SquadMember" sm
    JOIN "Character" c ON c.id = sm."characterId"
    GROUP BY c.id
    ORDER BY picks DESC, c.name ASC
    LIMIT ${POPULARITY_LIMIT}
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    thumbnail: row.thumbnail,
    picks: readPicks(row.picks),
  }));
}

function readPicks(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  throw new Error("Unexpected pick count");
}
