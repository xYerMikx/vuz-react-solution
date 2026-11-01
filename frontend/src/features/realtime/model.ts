export interface CharacterPopularity {
  id: number;
  name: string;
  thumbnail: string | null;
  picks: number;
}

export interface SquadDeleted {
  squadId: string;
  updatedAt: string;
}
