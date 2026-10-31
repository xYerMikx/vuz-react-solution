import type { Character } from "@features/characters/model";
import type { RosterCharacter } from "@features/squad/roster-character";

import { getCharacterMatchesFilters } from "./get-character-matches-filters";

interface VisibleCharactersInput {
  myTeam: boolean;
  catalog: Character[];
  squadCatalog: Character[];
  members: RosterCharacter[];
  search: string;
  tags: string[];
}

export function getVisibleCharacters({
  myTeam,
  catalog,
  squadCatalog,
  members,
  search,
  tags,
}: VisibleCharactersInput): Character[] {
  if (!myTeam) {
    return catalog;
  }

  return getCharactersInMemberOrder(squadCatalog, members).filter((character) =>
    getCharacterMatchesFilters(character, search, tags),
  );
}

function getCharactersInMemberOrder(
  characters: Character[],
  members: RosterCharacter[],
): Character[] {
  const byId = new Map(
    characters.map((character) => [character.id, character]),
  );
  const ordered: Character[] = [];

  for (const member of members) {
    const character = byId.get(member.id);

    if (!character) {
      continue;
    }

    ordered.push(character);
  }

  return ordered;
}
