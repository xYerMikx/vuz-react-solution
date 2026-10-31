import { useState } from "react";

import { getVisibleMembers } from "./get-visible-members";
import type { PendingMembership } from "./pending-membership";
import type { RosterMutationContext } from "./roster-mutation";
import { useMembershipGuard } from "./use-membership-guard";
import { useRosterCreate } from "./use-roster-create";
import { useRosterDelete } from "./use-roster-delete";
import { useRosterUpdate } from "./use-roster-update";
import { useSquadRecord } from "./use-squad-record";

export type { RosterCharacter } from "./roster-character";

export function useRoster() {
  const squad = useSquadRecord();
  const [pending, setPending] = useState<Record<number, PendingMembership>>({});
  const [busyIds, setBusyIds] = useState<number[]>([]);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const members = getVisibleMembers(squad.members, pending);
  const guard = useMembershipGuard(members);
  const context: RosterMutationContext = {
    squadId: squad.squadId,
    guard,
    setPending,
    setBusyIds,
    setRosterError,
  };
  const created = useRosterCreate(context);
  const updated = useRosterUpdate(context);
  const removed = useRosterDelete(context);

  return {
    squadId: squad.squadId,
    members,
    statistics: squad.statistics,
    pendingCount: Object.keys(pending).length,
    busyIds,
    creating: created.creating,
    squadLoading: squad.isLoading,
    squadError: squad.isError,
    rosterError,
    refetchSquad: squad.refetch,
    createSquadWithMember: created.createSquadWithMember,
    addMember: updated.addMember,
    removeMember: removed.removeMember,
  };
}
