export interface CharacterTag {
  slot: number;
  tagName: string;
}

export interface CharacterAbility {
  abilityName: string;
  abilityScore: number;
}

export interface Character {
  id: number;
  name: string;
  quote: string | null;
  image: string;
  thumbnail: string | null;
  universe: string;
  tags: CharacterTag[];
  abilities: CharacterAbility[];
}

export interface CharacterPage {
  items: Character[];
  nextCursor: string | null;
}

export interface CharacterFilters {
  tags: string[];
  universes: string[];
}

export interface CharacterListArgs {
  search: string;
  tags: string[];
  cursor?: string;
}
