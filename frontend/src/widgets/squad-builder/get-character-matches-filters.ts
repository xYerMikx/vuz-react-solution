import type { Character } from "@features/characters/model";

export function getCharacterMatchesFilters(
  character: Character,
  search: string,
  tags: string[],
): boolean {
  if (!getCharacterMatchesSearch(character, search)) {
    return false;
  }

  if (tags.length === 0) {
    return true;
  }

  const names = new Set(character.tags.map((tag) => tag.tagName));

  return tags.some((tag) => names.has(tag));
}

function getCharacterMatchesSearch(
  character: Character,
  search: string,
): boolean {
  const needle = search.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  if (character.name.toLowerCase().includes(needle)) {
    return true;
  }

  return character.tags.some((tag) => tag.tagName.includes(needle));
}
