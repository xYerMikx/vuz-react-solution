import { describe, expect, it, jest } from "@jest/globals";

import {
  readCache,
  readThroughCache,
  type CacheStore,
} from "./read-through-cache";

function store(overrides: Partial<CacheStore> = {}): CacheStore {
  return {
    get: jest.fn<CacheStore["get"]>().mockResolvedValue(null),
    setex: jest.fn<CacheStore["setex"]>().mockResolvedValue("OK"),
    ...overrides,
  };
}

describe("read-through cache", () => {
  it("returns a stored value without calling the loader", async () => {
    const cache = store({
      get: jest.fn<CacheStore["get"]>().mockResolvedValue(JSON.stringify(7)),
    });
    const load = jest.fn<() => Promise<number>>();

    await expect(readThroughCache(cache, "key", 10, load)).resolves.toBe(7);
    expect(load).not.toHaveBeenCalled();
    expect(cache.setex).not.toHaveBeenCalled();
  });

  it("loads from the database on a miss and stores the result", async () => {
    const cache = store();
    const load = jest.fn<() => Promise<number>>().mockResolvedValue(7);

    await expect(readThroughCache(cache, "key", 10, load)).resolves.toBe(7);
    expect(load).toHaveBeenCalledTimes(1);
    expect(cache.setex).toHaveBeenCalledWith("key", 10, "7");
  });

  it("returns the database value when the cache read fails", async () => {
    const cache = store({
      get: jest.fn<CacheStore["get"]>().mockRejectedValue(new Error("down")),
    });
    const load = jest.fn<() => Promise<number>>().mockResolvedValue(7);

    await expect(readThroughCache(cache, "key", 10, load)).resolves.toBe(7);
    expect(cache.setex).not.toHaveBeenCalled();
  });

  it("returns the database value when the cache write fails", async () => {
    const cache = store({
      setex: jest
        .fn<CacheStore["setex"]>()
        .mockRejectedValue(new Error("down")),
    });
    const load = jest.fn<() => Promise<number>>().mockResolvedValue(7);

    await expect(readThroughCache(cache, "key", 10, load)).resolves.toBe(7);
  });

  it("reloads when the stored JSON cannot be parsed", async () => {
    const cache = store({
      get: jest.fn<CacheStore["get"]>().mockResolvedValue("{"),
    });
    const load = jest.fn<() => Promise<number>>().mockResolvedValue(7);

    await expect(readThroughCache(cache, "key", 10, load)).resolves.toBe(7);
    expect(cache.setex).toHaveBeenCalledWith("key", 10, "7");
  });

  it("reports an unavailable version read", async () => {
    const cache = store({
      get: jest.fn<CacheStore["get"]>().mockRejectedValue(new Error("down")),
    });

    await expect(readCache(cache, "chars:version")).resolves.toEqual({
      status: "unavailable",
    });
  });
});
