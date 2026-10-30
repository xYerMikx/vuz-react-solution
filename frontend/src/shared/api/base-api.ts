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

type RawBaseQuery = typeof rawBaseQuery;

const NO_REFRESH = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

let refreshInFlightPromise: Promise<boolean> | null = null;

function requestPath(args: string | FetchArgs): string {
  if (typeof args === "string") {
    return args;
  }

  return args.url;
}

async function requestRefresh(
  api: Parameters<RawBaseQuery>[1],
  extraOptions: Parameters<RawBaseQuery>[2],
): Promise<boolean> {
  const refresh = await rawBaseQuery(
    { url: "/auth/refresh", method: "POST" },
    api,
    extraOptions,
  );

  return !refresh.error;
}

function refreshSession(
  api: Parameters<RawBaseQuery>[1],
  extraOptions: Parameters<RawBaseQuery>[2],
): Promise<boolean> {
  if (!refreshInFlightPromise) {
    refreshInFlightPromise = requestRefresh(api, extraOptions).finally(() => {
      refreshInFlightPromise = null;
    });
  }

  return refreshInFlightPromise;
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

  const refreshed = await refreshSession(api, extraOptions);

  if (!refreshed) {
    return result;
  }

  return rawBaseQuery(args, api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
});
