import type { ChangeEvent } from "react";
import { Button } from "@mui/material";

import { SearchIcon } from "@shared/ui/search-icon";

import { FilterTag } from "./filter-tag";
import styles from "./squad-builder.module.css";

interface CharacterFilterBarProps {
  search: string;
  tags: string[];
  selectedTags: string[];
  myTeam: boolean;
  onSearchChange: (value: string) => void;
  onToggleTag: (tag: string) => void;
  onToggleMyTeam: () => void;
  onClear: () => void;
}

export function CharacterFilterBar({
  search,
  tags,
  selectedTags,
  myTeam,
  onSearchChange,
  onToggleTag,
  onToggleMyTeam,
  onClear,
}: CharacterFilterBarProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  return (
    <>
      <label className={styles.search}>
        <SearchIcon className={styles.searchIcon} />
        <input
          value={search}
          placeholder="Search Characters..."
          onChange={handleSearchChange}
        />
      </label>
      <div className={styles.chips}>
        {tags.map((tag) => (
          <FilterTag
            key={tag}
            tag={tag}
            pressed={selectedTags.includes(tag)}
            onToggleTag={onToggleTag}
          />
        ))}
      </div>
      <div className={styles.teamRow}>
        <Button
          variant={myTeam ? "contained" : "outlined"}
          aria-pressed={myTeam}
          onClick={onToggleMyTeam}
        >
          My Team
        </Button>
        {myTeam && (
          <span className={styles.teamNote}>Showing only your squad</span>
        )}
        <span className={styles.clear}>
          <Button
            color="inherit"
            disabled={selectedTags.length === 0 && !myTeam}
            onClick={onClear}
          >
            Clear all
          </Button>
        </span>
      </div>
    </>
  );
}
