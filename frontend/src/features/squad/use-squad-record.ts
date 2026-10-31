import { useGetSquadQuery, useListSquadsQuery } from "./api";

export function useSquadRecord() {
  const squads = useListSquadsQuery();
  const squadId = squads.data?.[0]?.id;
  const squad = useGetSquadQuery(squadId ?? "", { skip: !squadId });

  const refetch = () => {
    void squads.refetch();

    if (squadId) {
      void squad.refetch();
    }
  };

  return {
    squadId,
    members: squad.data?.members ?? [],
    statistics: squad.data?.statistics ?? [],
    isLoading: squads.isLoading || Boolean(squadId && squad.isLoading),
    isError: squads.isError || squad.isError,
    refetch,
  };
}
