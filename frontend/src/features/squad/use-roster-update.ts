import { useAddMemberMutation } from "./api";
import { getRosterErrorMessage } from "./get-roster-error-message";
import { withoutPendingMember } from "./pending-membership";
import type { RosterCharacter } from "./roster-character";
import type { RosterMutationContext } from "./roster-mutation";

export function useRosterUpdate({
  squadId,
  guard,
  setPending,
  setBusyIds,
  setRosterError,
}: RosterMutationContext) {
  const [addMemberRequest] = useAddMemberMutation();

  const addMember = async (character: RosterCharacter) => {
    if (!squadId) {
      return;
    }

    const busyIds = guard.startAddingMember(character.id);

    if (!busyIds) {
      return;
    }

    setBusyIds(busyIds);
    setRosterError(null);
    setPending((current) => ({
      ...current,
      [character.id]: { operation: "add", character },
    }));

    try {
      await addMemberRequest({
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

  return { addMember };
}
