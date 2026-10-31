import type { RosterCharacter } from "./roster-character";

export function getProjectedMemberIds(
  members: RosterCharacter[],
  inflight: Map<number, "add" | "remove">,
): Set<number> {
  const ids = new Set(members.map((member) => member.id));

  for (const [id, operation] of inflight) {
    if (operation === "add") {
      ids.add(id);
    } else {
      ids.delete(id);
    }
  }

  return ids;
}
