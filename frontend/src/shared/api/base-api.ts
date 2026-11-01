import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { API_URL } from "@shared/config/env";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
});

const NO_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

let refreshInFlightPromise: Promise<boolean> | null = null;

export function refreshAccess(): Promise<boolean> {
  if (!refreshInFlightPromise) {
    refreshInFlightPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .finally(() => {
        refreshInFlightPromise = null;
      });
  }

  return refreshInFlightPromise;
}

function requestPath(args: string | FetchArgs): string {
  if (typeof args === "string") {
    return args;
  }

  return args.url;
}

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const path = requestPath(args);
  const skipRefresh = NO_REFRESH.some((endpoint) => path.startsWith(endpoint));

  if (result.error?.status !== 401 || skipRefresh) {
    return result;
  }

  const refreshed = await refreshAccess();

  if (!refreshed) {
    return result;
  }

  return rawBaseQuery(args, api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Squad"],
  endpoints: () => ({}),
});
