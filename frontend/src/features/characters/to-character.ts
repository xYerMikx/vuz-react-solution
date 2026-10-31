import type { Character, CharacterAbility, CharacterPage } from "./model";

export interface CharacterTagDto {
  slot: number;
  tag_name: string;
}

export interface CharacterDto {
  id: number;
  name: string;
  quote: string | null;
  image: string;
  thumbnail: string | null;
  universe: string;
  tags: CharacterTagDto[];
  abilities: CharacterAbility[];
}

export interface CharacterPageDto {
  items: CharacterDto[];
  nextCursor: string | null;
}

export function toCharacter(dto: CharacterDto): Character {
  return {
    id: dto.id,
    name: dto.name,
    quote: dto.quote,
    image: dto.image,
    thumbnail: dto.thumbnail,
    universe: dto.universe,
    tags: dto.tags.map((tag) => ({ slot: tag.slot, tagName: tag.tag_name })),
    abilities: dto.abilities,
  };
}

export function toCharacters(value: unknown): Character[] {
  if (!Array.isArray(value)) {
    throw new Error("Character list was not recognized");
  }

  return value.map((item) => {
    const dto = readCharacterDto(item);

    if (!dto) {
      throw new Error("Character response was not recognized");
    }

    return toCharacter(dto);
  });
}

export function toCharacterPage(dto: CharacterPageDto): CharacterPage {
  return {
    items: dto.items.map(toCharacter),
    nextCursor: dto.nextCursor,
  };
}

export function readCharacterDto(value: unknown): CharacterDto | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  if (!("id" in value) || !("name" in value) || !("tags" in value)) {
    return null;
  }

  const dto = value as CharacterDto;

  if (typeof dto.id !== "number" || typeof dto.name !== "string") {
    return null;
  }

  if (!Array.isArray(dto.tags) || !Array.isArray(dto.abilities)) {
    return null;
  }

  return dto;
}
