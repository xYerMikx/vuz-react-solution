import { baseApi } from "@shared/api/base-api";

import { getNextSquadSummaries } from "./get-next-squad-summaries";
import type {
  CreateSquadArgs,
  MemberArgs,
  SquadDetail,
  SquadSummary,
} from "./model";

async function cacheFulfilledSquad(
  queryFulfilled: Promise<{ data: SquadDetail }>,
  save: (squad: SquadDetail) => void,
): Promise<void> {
  try {
    const { data } = await queryFulfilled;

    save(data);
  } catch {
    // The request failed, so the cache stays unchanged.
  }
}

function saveSquad(
  squad: SquadDetail,
  dispatch: {
    (action: unknown): unknown;
  },
): void {
  dispatch(squadApi.util.upsertQueryData("getSquad", squad.id, squad));
  dispatch(
    squadApi.util.updateQueryData("listSquads", undefined, (summaries) =>
      getNextSquadSummaries(summaries, squad),
    ),
  );
}

export const squadApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSquads: build.query<SquadSummary[], void>({
      query: () => "/squads",
    }),
    getSquad: build.query<SquadDetail, string>({
      query: (squadId) => `/squads/${squadId}`,
    }),
    createSquad: build.mutation<SquadDetail, CreateSquadArgs>({
      query: (body) => ({ url: "/squads", method: "POST", body }),
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        await cacheFulfilledSquad(queryFulfilled, (squad) => {
          saveSquad(squad, dispatch);
        });
      },
    }),
    addMember: build.mutation<SquadDetail, MemberArgs>({
      query: ({ squadId, characterId }) => ({
        url: `/squads/${squadId}/characters/${characterId}`,
        method: "POST",
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        await cacheFulfilledSquad(queryFulfilled, (squad) => {
          saveSquad(squad, dispatch);
        });
      },
    }),
    removeMember: build.mutation<SquadDetail, MemberArgs>({
      query: ({ squadId, characterId }) => ({
        url: `/squads/${squadId}/characters/${characterId}`,
        method: "DELETE",
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        await cacheFulfilledSquad(queryFulfilled, (squad) => {
          saveSquad(squad, dispatch);
        });
      },
    }),
  }),
});

export const {
  useAddMemberMutation,
  useCreateSquadMutation,
  useGetSquadQuery,
  useListSquadsQuery,
  useRemoveMemberMutation,
} = squadApi;
