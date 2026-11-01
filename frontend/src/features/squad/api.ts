import { baseApi } from "@shared/api/base-api";

import {
  getNextSquadSummaries,
  getSquadSummariesAfterRemoval,
} from "./get-next-squad-summaries";
import { isStaleSquadRevision } from "./is-stale-squad-revision";
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

type SquadDispatch = (action: unknown) => unknown;

export function saveSquad(squad: SquadDetail, dispatch: SquadDispatch): void {
  if (isStaleSquadRevision(squad.id, squad.updatedAt)) {
    return;
  }

  dispatch(squadApi.util.upsertQueryData("getSquad", squad.id, squad));
  dispatch(
    squadApi.util.updateQueryData("listSquads", undefined, (summaries) =>
      getNextSquadSummaries(summaries, squad),
    ),
  );
}

export function removeSquad(
  squadId: string,
  updatedAt: string,
  dispatch: SquadDispatch,
): void {
  if (isStaleSquadRevision(squadId, updatedAt)) {
    return;
  }

  dispatch(
    squadApi.util.updateQueryData("listSquads", undefined, (summaries) =>
      getSquadSummariesAfterRemoval(summaries, squadId),
    ),
  );
}

export const squadApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listSquads: build.query<SquadSummary[], void>({
      query: () => "/squads",
      providesTags: ["Squad"],
    }),
    getSquad: build.query<SquadDetail, string>({
      query: (squadId) => `/squads/${squadId}`,
      providesTags: ["Squad"],
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
