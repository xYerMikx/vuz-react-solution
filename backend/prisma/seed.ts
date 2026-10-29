import "dotenv/config";

import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import Redis from "ioredis";

import { PrismaClient } from "@generated/prisma/client";

interface RawAbility {
  abilityName: string;
  abilityScore: number;
}

interface RawTag {
  slot: number;
  tag_name: string;
}

interface RawCharacter {
  id: number;
  name: string;
  quote?: string;
  image: string;
  thumbnail?: string;
  universe: string;
  abilities: RawAbility[];
  tags?: RawTag[];
}

const databaseUrl = process.env["DATABASE_URL"];
const redisUrl = process.env["REDIS_URL"];

if (!databaseUrl || !redisUrl) {
  throw new Error("DATABASE_URL and REDIS_URL are required to seed");
}

const jsonPath =
  process.env["CHARACTERS_JSON_PATH"] ||
  path.resolve(__dirname, "../../frontend/src/data/characters.json");

const characters = JSON.parse(readFileSync(jsonPath, "utf8")) as RawCharacter[];

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main(): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const universeNames = [...new Set(characters.map((c) => c.universe))];
      const tagNames = [
        ...new Set(
          characters.flatMap((c) => c.tags?.map((t) => t.tag_name) ?? []),
        ),
      ];
      const abilityNames = [
        ...new Set(
          characters.flatMap((c) => c.abilities.map((a) => a.abilityName)),
        ),
      ];

      for (const name of universeNames) {
        await tx.universe.upsert({
          where: { name },
          create: { name },
          update: {},
        });
      }
      for (const name of tagNames) {
        await tx.tag.upsert({ where: { name }, create: { name }, update: {} });
      }
      for (const name of abilityNames) {
        await tx.ability.upsert({
          where: { name },
          create: { name },
          update: {},
        });
      }

      const universes = await tx.universe.findMany();
      const tags = await tx.tag.findMany();
      const abilities = await tx.ability.findMany();
      const universeId = new Map(universes.map((row) => [row.name, row.id]));
      const tagId = new Map(tags.map((row) => [row.name, row.id]));
      const abilityId = new Map(abilities.map((row) => [row.name, row.id]));

      for (const character of characters) {
        const ownerId = universeId.get(character.universe);
        if (ownerId === undefined) {
          throw new Error(`Universe missing for ${character.name}`);
        }

        await tx.character.upsert({
          where: { id: character.id },
          create: {
            id: character.id,
            name: character.name,
            quote: character.quote ?? null,
            image: character.image,
            thumbnail: character.thumbnail ?? null,
            universeId: ownerId,
          },
          update: {
            name: character.name,
            quote: character.quote ?? null,
            image: character.image,
            thumbnail: character.thumbnail ?? null,
            universeId: ownerId,
          },
        });

        await tx.characterTag.deleteMany({
          where: { characterId: character.id },
        });
        await tx.characterAbility.deleteMany({
          where: { characterId: character.id },
        });

        const characterTags = character.tags ?? [];
        if (characterTags.length > 0) {
          await tx.characterTag.createMany({
            data: characterTags.map((tag) => {
              const id = tagId.get(tag.tag_name);
              if (id === undefined) {
                throw new Error(`Tag missing: ${tag.tag_name}`);
              }
              return { characterId: character.id, tagId: id, slot: tag.slot };
            }),
          });
        }

        await tx.characterAbility.createMany({
          data: character.abilities.map((ability) => {
            const id = abilityId.get(ability.abilityName);
            if (id === undefined) {
              throw new Error(`Ability missing: ${ability.abilityName}`);
            }
            return {
              characterId: character.id,
              abilityId: id,
              score: ability.abilityScore,
            };
          }),
        });
      }
    },
    { timeout: 60_000 },
  );

  const redis = new Redis(redisUrl);
  await redis.incr("chars:version");
  await redis.quit();

  const count = await prisma.character.count();
  console.log(`Seeded ${count} characters from ${jsonPath}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
