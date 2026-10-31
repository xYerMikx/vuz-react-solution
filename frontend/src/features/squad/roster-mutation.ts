import type { Dispatch, SetStateAction } from "react";

import type { MembershipGuard } from "./use-membership-guard";
import type { PendingMembership } from "./pending-membership";

export interface RosterMutationContext {
  squadId: string | undefined;
  guard: MembershipGuard;
  setPending: Dispatch<SetStateAction<Record<number, PendingMembership>>>;
  setBusyIds: (ids: number[]) => void;
  setRosterError: (message: string | null) => void;
}
