import type { CharacterAbility } from "@features/characters/model";

import type { SquadMember } from "./model";

export interface RosterCharacter {
  id: number;
  name: string;
  thumbnail: string | null;
  abilities: CharacterAbility[] | null;
}

export function getRosterCharacter(member: SquadMember): RosterCharacter {
  return {
    id: member.character.id,
    name: member.character.name,
    thumbnail: member.character.thumbnail,
    abilities: null,
  };
}
