import { useCreateSquadMutation } from "./api";
import { getRosterErrorMessage } from "./get-roster-error-message";
import { SQUAD_NAME } from "./model";
import { withoutPendingMember } from "./pending-membership";
import type { RosterCharacter } from "./roster-character";
import type { RosterMutationContext } from "./roster-mutation";

export function useRosterCreate({
  squadId,
  guard,
  setPending,
  setBusyIds,
  setRosterError,
}: RosterMutationContext) {
  const [createSquad, { isLoading }] = useCreateSquadMutation();

  const createSquadWithMember = async (character: RosterCharacter) => {
    if (squadId) {
      return;
    }

    const busyIds = guard.startCreatingSquad(character.id);

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
      await createSquad({
        name: SQUAD_NAME,
        characterIds: [character.id],
      }).unwrap();
    } catch (error) {
      setRosterError(getRosterErrorMessage(error));
    } finally {
      setBusyIds(guard.finishMemberRequest(character.id));
      setPending((current) => withoutPendingMember(current, character.id));
    }
  };

  return { createSquadWithMember, creating: isLoading };
}
