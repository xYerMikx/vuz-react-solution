import { baseApi } from "@shared/api/base-api";

import type { Credentials, PublicUser } from "./model";

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<PublicUser, void>({
      query: () => "/auth/me",
    }),
    login: build.mutation<PublicUser, Credentials>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(authApi.util.upsertQueryData("getMe", undefined, data));
        } catch {
          // The form renders the rejected login.
        }
      },
    }),
    register: build.mutation<PublicUser, Credentials>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(authApi.util.upsertQueryData("getMe", undefined, data));
        } catch {
          // The form renders the rejected registration.
        }
      },
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} = authApi;
