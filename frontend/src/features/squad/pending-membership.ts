import type { RosterCharacter } from "./roster-character";

export interface PendingMembership {
  operation: "add" | "remove";
  character: RosterCharacter;
}

export function withoutPendingMember(
  pending: Record<number, PendingMembership>,
  characterId: number,
): Record<number, PendingMembership> {
  const next: Record<number, PendingMembership> = {};

  for (const [id, change] of Object.entries(pending)) {
    if (Number(id) === characterId) {
      continue;
    }

    next[Number(id)] = change;
  }

  return next;
}
