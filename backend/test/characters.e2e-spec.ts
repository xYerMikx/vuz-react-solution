import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import request from "supertest";

import { AppModule } from "@/app.module";
import type { CharacterResponse } from "@/characters/character.mapper";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisService } from "@/redis/redis.service";
import { setupApp } from "@/setup-app";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCharacterResponse(value: unknown): value is CharacterResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    (value.quote === null || typeof value.quote === "string") &&
    typeof value.image === "string" &&
    (value.thumbnail === null || typeof value.thumbnail === "string") &&
    typeof value.universe === "string" &&
    Array.isArray(value.tags) &&
    Array.isArray(value.abilities)
  );
}

function readPage(body: unknown): {
  items: CharacterResponse[];
  nextCursor: string | null;
} {
  if (!isRecord(body) || !Array.isArray(body.items)) {
    throw new Error("Unexpected characters payload");
  }
  const items: CharacterResponse[] = [];
  for (const item of body.items) {
    if (!isCharacterResponse(item)) {
      throw new Error("Unexpected character");
    }
    items.push(item);
  }
  if (body.nextCursor !== null && typeof body.nextCursor !== "string") {
    throw new Error("Unexpected cursor");
  }
  return { items, nextCursor: body.nextCursor };
}

function readErrorCode(body: unknown): string {
  if (!isRecord(body) || typeof body.error !== "string") {
    throw new Error("Unexpected error payload");
  }
  return body.error;
}

describe("Characters", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("paginates with a cursor and does not repeat a character", async () => {
    const first = await request(app.getHttpServer())
      .get("/api/v1/characters")
      .query({ limit: 1 })
      .expect(200);

    const second = await request(app.getHttpServer())
      .get("/api/v1/characters")
      .query({ limit: 1, cursor: readPage(first.body).nextCursor })
      .expect(200);

    const firstItem = readPage(first.body).items[0];
    const secondItem = readPage(second.body).items[0];
    expect(firstItem).toBeDefined();
    expect(secondItem).toBeDefined();
    expect(secondItem?.id).not.toBe(firstItem?.id);
  });

  it("searches by name regardless of case", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/characters")
      .query({ search: "SCORP" })
      .expect(200);

    const names = readPage(response.body).items.map((item) => item.name);
    expect(names).toContain("Scorpion");
  });

  it("searches tag text and still requires the tag or the name", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/characters")
      .query({ search: "ninja", limit: 100 })
      .expect(200);

    const items = readPage(response.body).items;
    expect(items.some((item) => item.name === "Frost")).toBe(true);

    for (const item of items) {
      const matchesName = item.name.toLowerCase().includes("ninja");
      const matchesTag = item.tags.some((tag) =>
        tag.tag_name.includes("ninja"),
      );
      expect(matchesName || matchesTag).toBe(true);
    }
  });

  it("combines tag filters with OR", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/characters")
      .query({ tags: "robot,alien", limit: 100 })
      .expect(200);

    const items = readPage(response.body).items;
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const tags = item.tags.map((tag) => tag.tag_name);
      expect(tags.some((tag) => tag === "robot" || tag === "alien")).toBe(true);
    }
  });

  it("filters by universe", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/characters")
      .query({ universe: "mortal kombat", limit: 5 })
      .expect(200);

    for (const item of readPage(response.body).items) {
      expect(item.universe.toLowerCase()).toBe("mortal kombat");
    }
  });

  it("returns the filter values, keeping grapple and grappling apart", async () => {
    const response = await request(app.getHttpServer())
      .get("/api/v1/characters/filters")
      .expect(200);

    expect(response.body.tags).toEqual(
      expect.arrayContaining(["grapple", "grappling"]),
    );
    expect(response.body.universes.length).toBeGreaterThan(0);
  });

  it("returns several characters in the requested order", async () => {
    const page = await request(app.getHttpServer())
      .get("/api/v1/characters")
      .query({ limit: 2 })
      .expect(200);
    const ids = readPage(page.body).items.map((item) => item.id);
    const response = await request(app.getHttpServer())
      .get("/api/v1/characters/by-ids")
      .query({ ids: [...ids].reverse().join(",") })
      .expect(200);

    if (!Array.isArray(response.body)) {
      throw new Error("Unexpected characters payload");
    }

    const characters: CharacterResponse[] = [];

    for (const item of response.body) {
      if (!isCharacterResponse(item)) {
        throw new Error("Unexpected character");
      }

      characters.push(item);
    }

    expect(characters.map((item) => item.id)).toEqual([...ids].reverse());
    expect(characters[0]?.abilities.length).toBeGreaterThan(0);

    const invalid = await request(app.getHttpServer())
      .get("/api/v1/characters/by-ids")
      .query({ ids: "1,2,3,4,5,6,7" })
      .expect(400);
    expect(readErrorCode(invalid.body)).toBe("VALIDATION_ERROR");

    const duplicate = await request(app.getHttpServer())
      .get("/api/v1/characters/by-ids")
      .query({ ids: "2,2" })
      .expect(400);
    expect(readErrorCode(duplicate.body)).toBe("VALIDATION_ERROR");

    const text = await request(app.getHttpServer())
      .get("/api/v1/characters/by-ids")
      .query({ ids: "1,nope" })
      .expect(400);
    expect(readErrorCode(text.body)).toBe("VALIDATION_ERROR");

    const missing = await request(app.getHttpServer())
      .get("/api/v1/characters/by-ids")
      .query({ ids: "999999" })
      .expect(404);
    expect(readErrorCode(missing.body)).toBe("CHARACTER_NOT_FOUND");
  });

  it("rejects an invalid cursor and an unknown id", async () => {
    const cursor = await request(app.getHttpServer())
      .get("/api/v1/characters")
      .query({ cursor: "not-a-cursor" })
      .expect(400);
    expect(readErrorCode(cursor.body)).toBe("VALIDATION_ERROR");

    const missing = await request(app.getHttpServer())
      .get("/api/v1/characters/999999")
      .expect(404);
    expect(readErrorCode(missing.body)).toBe("CHARACTER_NOT_FOUND");
  });

  it("serves a repeated list from Redis until the cache version changes", async () => {
    const prisma = app.get(PrismaService);
    const redis = app.get(RedisService);
    const server = app.getHttpServer();

    const original = await request(server)
      .get("/api/v1/characters")
      .query({ search: "scorpion", limit: 5 })
      .expect(200);
    const scorpion = readPage(original.body).items.find(
      (item) => item.name === "Scorpion",
    );
    if (!scorpion) throw new Error("Scorpion was not found");

    await prisma.character.update({
      where: { id: scorpion.id },
      data: { name: "Scorpion Cached" },
    });

    try {
      const cached = await request(server)
        .get("/api/v1/characters")
        .query({ search: "scorpion", limit: 5 })
        .expect(200);
      expect(
        readPage(cached.body).items.some((item) => item.name === "Scorpion"),
      ).toBe(true);

      await redis.client.incr("chars:version");

      const fresh = await request(server)
        .get("/api/v1/characters")
        .query({ search: "scorpion", limit: 5 })
        .expect(200);
      expect(
        readPage(fresh.body).items.some(
          (item) => item.name === "Scorpion Cached",
        ),
      ).toBe(true);
    } finally {
      await prisma.character.update({
        where: { id: scorpion.id },
        data: { name: "Scorpion" },
      });
      await redis.client.incr("chars:version");
    }
  });
});
