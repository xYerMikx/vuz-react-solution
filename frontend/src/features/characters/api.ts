import { baseApi } from "@shared/api/base-api";

import { mergeCharacterPage } from "./merge-character-page";
import type {
  Character,
  CharacterFilters,
  CharacterListArgs,
  CharacterPage,
} from "./model";
import { toCharacterPage, toCharacters } from "./to-character";

const PAGE_LIMIT = 20;

export const charactersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listCharacters: build.query<CharacterPage, CharacterListArgs>({
      query: ({ search, tags, cursor }) => ({
        url: "/characters",
        params: {
          limit: PAGE_LIMIT,
          sort: "name",
          ...(search ? { search } : {}),
          ...(tags.length > 0 ? { tags: [...tags].sort().join(",") } : {}),
          ...(cursor ? { cursor } : {}),
        },
      }),
      serializeQueryArgs: ({ endpointName, queryArgs }) => ({
        endpointName,
        search: queryArgs.search,
        tags: [...queryArgs.tags].sort(),
      }),
      transformResponse: toCharacterPage,
      merge: (current, incoming, { arg }) =>
        mergeCharacterPage(current, incoming, arg.cursor),
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor,
    }),
    getCharacterFilters: build.query<CharacterFilters, void>({
      query: () => "/characters/filters",
    }),
    getCharactersByIds: build.query<Character[], number[]>({
      query: (ids) => ({
        url: "/characters/by-ids",
        params: { ids: ids.join(",") },
      }),
      transformResponse: toCharacters,
    }),
  }),
});

export const {
  useGetCharacterFiltersQuery,
  useGetCharactersByIdsQuery,
  useListCharactersQuery,
} = charactersApi;
