import { BadRequestException } from "@nestjs/common";

export const CHARACTER_ID_BATCH_LIMIT = 6;

export function parseCharacterIds(value: string): number[] {
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0 || parts.length > CHARACTER_ID_BATCH_LIMIT) {
    throw new BadRequestException({
      error: "VALIDATION_ERROR",
      message: `ids must contain 1 to ${CHARACTER_ID_BATCH_LIMIT} character ids`,
    });
  }

  const ids: number[] = [];
  const seen = new Set<number>();

  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      throw new BadRequestException({
        error: "VALIDATION_ERROR",
        message: "ids must be comma-separated integers",
      });
    }

    const id = Number(part);

    if (!Number.isSafeInteger(id) || id < 1 || seen.has(id)) {
      throw new BadRequestException({
        error: "VALIDATION_ERROR",
        message: "ids must be unique positive integers",
      });
    }

    seen.add(id);
    ids.push(id);
  }

  return ids;
}
