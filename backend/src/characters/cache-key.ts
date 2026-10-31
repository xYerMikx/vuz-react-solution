import { createHash } from "node:crypto";

export interface ListCacheInput {
  search: string;
  tags: string[];
  universe: string;
  limit: number;
  cursor: string;
  sort: "name" | "id";
}

export function getListCacheKey(
  version: string,
  input: ListCacheInput,
): string {
  const stable = { ...input, tags: [...input.tags].sort() };
  const hash = createHash("sha1").update(JSON.stringify(stable)).digest("hex");

  return `chars:v${version}:name-or-tag:${hash}`;
}

export function getFiltersCacheKey(version: string): string {
  return `chars:v${version}:filters`;
}
