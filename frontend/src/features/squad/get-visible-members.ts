import type { PendingMembership } from "./pending-membership";
import type { SquadMember } from "./model";
import { getRosterCharacter, type RosterCharacter } from "./roster-character";

export function getVisibleMembers(
  serverMembers: SquadMember[],
  pending: Record<number, PendingMembership>,
): RosterCharacter[] {
  const visible: RosterCharacter[] = [];

  for (const member of serverMembers) {
    const change = pending[member.character.id];

    if (change?.operation === "remove") {
      continue;
    }

    visible.push(getRosterCharacter(member));
  }

  for (const change of Object.values(pending)) {
    if (change.operation !== "add") {
      continue;
    }

    if (visible.some((member) => member.id === change.character.id)) {
      continue;
    }

    visible.push(change.character);
  }

  return visible;
}
