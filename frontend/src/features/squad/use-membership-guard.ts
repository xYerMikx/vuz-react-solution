import { useEffect, useRef } from "react";

import { getProjectedMemberIds } from "./get-projected-member-ids";
import { SQUAD_SIZE_LIMIT } from "./model";
import type { RosterCharacter } from "./roster-character";

export interface MembershipGuard {
  startAddingMember: (characterId: number) => number[] | null;
  startRemovingMember: (characterId: number) => number[] | null;
  startCreatingSquad: (characterId: number) => number[] | null;
  finishMemberRequest: (characterId: number) => number[];
}

export function useMembershipGuard(
  members: RosterCharacter[],
): MembershipGuard {
  const renderedRosterRef = useRef(members);
  const requestsRef = useRef(new Map<number, "add" | "remove">());
  const squadCreationRef = useRef(false);

  useEffect(() => {
    renderedRosterRef.current = members;
  }, [members]);

  const getBusyIds = (): number[] => [...requestsRef.current.keys()];

  const reserve = (
    characterId: number,
    operation: "add" | "remove",
  ): number[] | null => {
    if (requestsRef.current.has(characterId) || squadCreationRef.current) {
      return null;
    }

    const ids = getProjectedMemberIds(
      renderedRosterRef.current,
      requestsRef.current,
    );
    const selected = ids.has(characterId);

    if (operation === "add" && (selected || ids.size >= SQUAD_SIZE_LIMIT)) {
      return null;
    }

    if (operation === "remove" && !selected) {
      return null;
    }

    requestsRef.current.set(characterId, operation);

    return getBusyIds();
  };

  const startAddingMember = (characterId: number): number[] | null =>
    reserve(characterId, "add");

  const startRemovingMember = (characterId: number): number[] | null =>
    reserve(characterId, "remove");

  const startCreatingSquad = (characterId: number): number[] | null => {
    const busy = reserve(characterId, "add");

    if (!busy) {
      return null;
    }

    squadCreationRef.current = true;

    return busy;
  };

  const finishMemberRequest = (characterId: number): number[] => {
    squadCreationRef.current = false;
    requestsRef.current.delete(characterId);

    return getBusyIds();
  };

  return {
    startAddingMember,
    startRemovingMember,
    startCreatingSquad,
    finishMemberRequest,
  };
}
