export const SQUAD_NAME = "My team";
export const SQUAD_SIZE_LIMIT = 6;

export interface SquadSummary {
  id: string;
  name: string;
  memberCount: number;
}

export interface SquadCharacter {
  id: number;
  name: string;
  thumbnail: string | null;
  universe: string;
}

export interface SquadMember {
  position: number;
  character: SquadCharacter;
}

export interface SquadStatistic {
  abilityName: string;
  average: number;
}

export interface SquadDetail {
  id: string;
  name: string;
  updatedAt: string;
  members: SquadMember[];
  statistics: SquadStatistic[];
}

export interface CreateSquadArgs {
  name: string;
  characterIds: number[];
}

export interface MemberArgs {
  squadId: string;
  characterId: number;
}
