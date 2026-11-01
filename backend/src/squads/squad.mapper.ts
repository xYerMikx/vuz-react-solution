export interface SquadCharacterResponse {
  id: number;
  name: string;
  thumbnail: string | null;
  universe: string;
}

export interface SquadMemberResponse {
  position: number;
  character: SquadCharacterResponse;
}

export interface SquadStatisticResponse {
  abilityName: string;
  average: number;
}

export interface SquadDetail {
  id: string;
  name: string;
  updatedAt: string;
  members: SquadMemberResponse[];
  statistics: SquadStatisticResponse[];
}

export interface SquadMemberRow {
  position: number;
  character: {
    id: number;
    name: string;
    thumbnail: string | null;
    universe: { name: string };
  };
}

export function toSquadDetail(
  squad: {
    id: string;
    name: string;
    updatedAt: Date;
    members: SquadMemberRow[];
  },
  statistics: SquadStatisticResponse[],
): SquadDetail {
  return {
    id: squad.id,
    name: squad.name,
    updatedAt: squad.updatedAt.toISOString(),
    members: squad.members.map((member) => ({
      position: member.position,
      character: {
        id: member.character.id,
        name: member.character.name,
        thumbnail: member.character.thumbnail,
        universe: member.character.universe.name,
      },
    })),
    statistics,
  };
}
