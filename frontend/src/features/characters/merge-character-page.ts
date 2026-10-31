import type { Character, CharacterPage } from "./model";

export function mergeCharacterPage(
  current: CharacterPage,
  incoming: CharacterPage,
  cursor: string | undefined,
): CharacterPage {
  if (!cursor) {
    return incoming;
  }

  return {
    items: appendCharacters(current.items, incoming.items),
    nextCursor: incoming.nextCursor,
  };
}

function appendCharacters(
  current: Character[],
  incoming: Character[],
): Character[] {
  const seen = new Set(current.map((item) => item.id));
  const items = [...current];

  for (const item of incoming) {
    if (seen.has(item.id)) {
      continue;
    }

    items.push(item);
  }

  return items;
}
