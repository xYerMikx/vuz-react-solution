import { BadRequestException } from "@nestjs/common";

import { type ListCacheInput } from "./cache-key";
import {
  decodeCursor,
  type IdCursor,
  InvalidCursorError,
  type NameCursor,
} from "./cursor";
import { type ListCharactersQuery } from "./dto/list-characters.query";

export function normalizeListQuery(query: ListCharactersQuery): ListCacheInput {
  return {
    search: query.search?.trim().toLowerCase() ?? "",
    tags: parseTagList(query.tags),
    universe: query.universe?.trim() ?? "",
    limit: query.limit ?? 20,
    cursor: query.cursor ?? "",
    sort: query.sort ?? "name",
  };
}

export function readPageCursor(cursor: string, sort: "name"): NameCursor;
export function readPageCursor(cursor: string, sort: "id"): IdCursor;
export function readPageCursor(
  cursor: string,
  sort: "name" | "id",
): NameCursor | IdCursor {
  try {
    return sort === "name"
      ? decodeCursor(cursor, "name")
      : decodeCursor(cursor, "id");
  } catch (error) {
    if (error instanceof InvalidCursorError) {
      throw new BadRequestException({
        error: "VALIDATION_ERROR",
        message: "Invalid cursor",
      });
    }
    throw error;
  }
}

function parseTagList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);
}
