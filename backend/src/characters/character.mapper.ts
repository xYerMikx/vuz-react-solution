export interface CharacterResponse {
  id: number;
  name: string;
  quote: string | null;
  image: string;
  thumbnail: string | null;
  universe: string;
  tags: { slot: number; tag_name: string }[];
  abilities: { abilityName: string; abilityScore: number }[];
}

export interface CharacterRow {
  id: number;
  name: string;
  quote: string | null;
  image: string;
  thumbnail: string | null;
  universe: { name: string };
  tags: { slot: number; tag: { name: string } }[];
  abilities: { score: number; ability: { name: string } }[];
}

export function toCharacter(row: CharacterRow): CharacterResponse {
  return {
    id: row.id,
    name: row.name,
    quote: row.quote,
    image: row.image,
    thumbnail: row.thumbnail,
    universe: row.universe.name,
    tags: row.tags.map((tag) => ({ slot: tag.slot, tag_name: tag.tag.name })),
    abilities: row.abilities.map((ability) => ({
      abilityName: ability.ability.name,
      abilityScore: ability.score,
    })),
  };
}
