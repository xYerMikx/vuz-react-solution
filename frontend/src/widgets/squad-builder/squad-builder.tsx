import { useEffect, useRef, useState } from "react";
import { Button, CircularProgress } from "@mui/material";

import {
  useGetCharacterFiltersQuery,
  useGetCharactersByIdsQuery,
  useListCharactersQuery,
} from "@features/characters/api";
import type { RosterCharacter } from "@features/squad/roster-character";
import { useRoster } from "@features/squad/use-roster";
import logo from "@shared/assets/mortal-kombat-logo.webp";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";

import { CharacterFilterBar } from "./character-filter-bar";
import { CharacterTable } from "./character-table";
import { getEmptyListLabel } from "./get-empty-list-label";
import { getListFilterKey } from "./get-list-filter-key";
import { getVisibleCharacters } from "./get-visible-characters";
import { SquadHeader } from "./squad-header";
import styles from "./squad-builder.module.css";

const SEARCH_DEBOUNCE_MS = 300;

interface SquadBuilderProps {
  loggingOut: boolean;
  onLogout: () => void;
}

interface PageRequest {
  filterKey: string;
  cursor?: string;
}

export function SquadBuilder({ loggingOut, onLogout }: SquadBuilderProps) {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [myTeam, setMyTeam] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const filterKey = getListFilterKey(debouncedSearch, selectedTags);
  const [pageRequest, setPageRequest] = useState<PageRequest>({ filterKey });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const roster = useRoster();
  const filters = useGetCharacterFiltersQuery();
  const cursor =
    pageRequest.filterKey === filterKey ? pageRequest.cursor : undefined;
  const page = useListCharactersQuery(
    {
      search: debouncedSearch,
      tags: selectedTags,
      cursor,
    },
    { skip: myTeam },
  );
  const memberIds = roster.members.map((member) => member.id);
  const squadCharacters = useGetCharactersByIdsQuery(memberIds, {
    skip: !myTeam || memberIds.length === 0,
  });
  const nextCursor = page.data?.nextCursor ?? null;

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node || myTeam || !nextCursor || page.isFetching) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting) {
        return;
      }

      setPageRequest((current) => {
        if (current.filterKey === filterKey && current.cursor === nextCursor) {
          return current;
        }

        return { filterKey, cursor: nextCursor };
      });
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [filterKey, myTeam, nextCursor, page.isFetching]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  };

  const handleToggleMyTeam = () => {
    setMyTeam((current) => !current);
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
    setMyTeam(false);
  };

  const handleAdd = (character: RosterCharacter) => {
    if (!roster.squadId) {
      void roster.createSquadWithMember(character);

      return;
    }

    void roster.addMember(character);
  };

  const handleRemove = (character: RosterCharacter) => {
    void roster.removeMember(character);
  };

  const handleRetryFilters = () => {
    void filters.refetch();
  };

  const handleRetryPage = () => {
    void page.refetch();
  };

  const handleRetrySquadCharacters = () => {
    void squadCharacters.refetch();
  };

  const rows = getVisibleCharacters({
    myTeam,
    catalog: page.data?.items ?? [],
    squadCatalog: squadCharacters.data ?? [],
    members: roster.members,
    search: debouncedSearch,
    tags: selectedTags,
  });
  const showTable = rows.length > 0;
  const listLoading = myTeam
    ? squadCharacters.isLoading && memberIds.length > 0
    : page.isLoading;
  const listError = myTeam ? squadCharacters.isError : page.isError;
  const membershipLocked =
    roster.squadLoading || roster.squadError || roster.creating;

  return (
    <main className={styles.page}>
      <div className={styles.bar}>
        <div className={styles.logout}>
          <Button color="inherit" loading={loggingOut} onClick={onLogout}>
            Log out
          </Button>
        </div>
        <img
          className={styles.logo}
          src={logo}
          alt="Mortal Kombat"
          width={96}
          height={96}
        />
      </div>
      <div className={styles.content}>
        {roster.squadLoading ? (
          <div className={styles.status}>
            <CircularProgress />
          </div>
        ) : (
          <SquadHeader
            members={roster.members}
            statistics={roster.statistics}
            pendingCount={roster.pendingCount}
            busyIds={roster.busyIds}
            onRemove={handleRemove}
          />
        )}
        {roster.rosterError && (
          <p className={styles.message}>{roster.rosterError}</p>
        )}
        {roster.squadError && (
          <div className={styles.status}>
            <Button onClick={roster.refetchSquad}>Try again</Button>
          </div>
        )}
        <CharacterFilterBar
          search={search}
          tags={filters.data?.tags ?? []}
          selectedTags={selectedTags}
          myTeam={myTeam}
          onSearchChange={handleSearchChange}
          onToggleTag={handleToggleTag}
          onToggleMyTeam={handleToggleMyTeam}
          onClear={handleClearFilters}
        />
        {filters.isError && (
          <div className={styles.status}>
            <Button onClick={handleRetryFilters}>Try again</Button>
          </div>
        )}
        {listLoading && (
          <div className={styles.status}>
            <CircularProgress />
          </div>
        )}
        {!myTeam && page.isError && (
          <div className={styles.status}>
            <Button onClick={handleRetryPage}>Try again</Button>
          </div>
        )}
        {myTeam && squadCharacters.isError && (
          <div className={styles.status}>
            <Button onClick={handleRetrySquadCharacters}>Try again</Button>
          </div>
        )}
        {!listLoading && !showTable && !listError && (
          <p className={styles.message}>
            {getEmptyListLabel(myTeam, roster.members.length)}
          </p>
        )}
        {showTable && (
          <CharacterTable
            characters={rows}
            selectedIds={memberIds}
            busyIds={roster.busyIds}
            memberCount={roster.members.length}
            membershipLocked={membershipLocked}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        )}
        {!myTeam && page.isFetching && !page.isLoading && (
          <div className={styles.status}>
            <CircularProgress size={28} />
          </div>
        )}
        <div ref={sentinelRef} className={styles.sentinel} />
      </div>
    </main>
  );
}
