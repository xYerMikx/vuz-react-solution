export const SQUAD_SIZE_LIMIT = 6;

export type RosterRejection = "SQUAD_FULL" | "DUPLICATE_MEMBER";

export function rejectAdd(
  memberIds: number[],
  characterId: number,
): RosterRejection | null {
  if (memberIds.includes(characterId)) {
    return "DUPLICATE_MEMBER";
  }

  if (memberIds.length >= SQUAD_SIZE_LIMIT) {
    return "SQUAD_FULL";
  }

  return null;
}

export function rejectRoster(characterIds: number[]): RosterRejection | null {
  const unique = new Set(characterIds);

  if (unique.size !== characterIds.length) {
    return "DUPLICATE_MEMBER";
  }

  if (characterIds.length > SQUAD_SIZE_LIMIT) {
    return "SQUAD_FULL";
  }

  return null;
}
