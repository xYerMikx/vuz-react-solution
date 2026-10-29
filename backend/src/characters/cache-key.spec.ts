import { describe, expect, it } from "@jest/globals";

import { getFiltersCacheKey, getListCacheKey } from "./cache-key";

const input = {
  search: "ninja",
  tags: ["monster", "melee"],
  universe: "",
  limit: 20,
  cursor: "",
  sort: "name" as const,
};

describe("cache keys", () => {
  it("ignores the order of tags", () => {
    const reversed = { ...input, tags: ["melee", "monster"] };
    expect(getListCacheKey("1", input)).toBe(getListCacheKey("1", reversed));
  });

  it("changes when the search changes", () => {
    expect(getListCacheKey("1", input)).not.toBe(
      getListCacheKey("1", { ...input, search: "god" }),
    );
  });

  it("includes the cache version", () => {
    expect(getListCacheKey("1", input)).not.toBe(getListCacheKey("2", input));
    expect(getFiltersCacheKey("3")).toBe("chars:v3:filters");
  });
});
