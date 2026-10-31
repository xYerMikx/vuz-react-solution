import { useRemoveMemberMutation } from "./api";
import { getRosterErrorMessage } from "./get-roster-error-message";
import { withoutPendingMember } from "./pending-membership";
import type { RosterCharacter } from "./roster-character";
import type { RosterMutationContext } from "./roster-mutation";

export function useRosterDelete({
  squadId,
  guard,
  setPending,
  setBusyIds,
  setRosterError,
}: RosterMutationContext) {
  const [removeMemberRequest] = useRemoveMemberMutation();

  const removeMember = async (character: RosterCharacter) => {
    if (!squadId) {
      return;
    }

    const busyIds = guard.startRemovingMember(character.id);

    if (!busyIds) {
      return;
    }

    setBusyIds(busyIds);
    setRosterError(null);
    setPending((current) => ({
      ...current,
      [character.id]: { operation: "remove", character },
    }));

    try {
      await removeMemberRequest({
        squadId,
        characterId: character.id,
      }).unwrap();
    } catch (error) {
      setRosterError(getRosterErrorMessage(error));
    } finally {
      setBusyIds(guard.finishMemberRequest(character.id));
      setPending((current) => withoutPendingMember(current, character.id));
    }
  };

  return { removeMember };
}
