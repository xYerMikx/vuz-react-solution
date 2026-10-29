export interface CacheStore {
  get(key: string): Promise<string | null>;
  setex(key: string, ttlSeconds: number, value: string): Promise<unknown>;
}

type CacheRead =
  | { status: "hit"; value: string }
  | { status: "miss" }
  | { status: "unavailable" };

export async function readCache(
  store: CacheStore,
  key: string,
  onError?: (error: unknown) => void,
): Promise<CacheRead> {
  try {
    const value = await store.get(key);

    if (value === null) {
      return { status: "miss" };
    }

    return { status: "hit", value };
  } catch (error) {
    onError?.(error);
    return { status: "unavailable" };
  }
}

export async function readThroughCache<T>(
  store: CacheStore,
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
  onError?: (error: unknown) => void,
): Promise<T> {
  const cached = await readCache(store, key, onError);
  if (cached.status === "hit") {
    const parsed = parseCachedValue<T>(cached.value);
    if (parsed !== undefined) return parsed;
  }

  const value = await load();
  if (cached.status !== "unavailable") {
    await writeCache(store, key, ttlSeconds, JSON.stringify(value), onError);
  }
  return value;
}

function parseCachedValue<T>(value: string): T | undefined {
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

async function writeCache(
  store: CacheStore,
  key: string,
  ttlSeconds: number,
  value: string,
  onError?: (error: unknown) => void,
): Promise<void> {
  try {
    await store.setex(key, ttlSeconds, value);
  } catch (error) {
    onError?.(error);
  }
}
