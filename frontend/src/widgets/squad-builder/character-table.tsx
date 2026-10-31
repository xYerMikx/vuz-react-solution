import classNames from "classnames";

import type { Character } from "@features/characters/model";
import { SQUAD_SIZE_LIMIT } from "@features/squad/model";
import type { RosterCharacter } from "@features/squad/roster-character";

import { CharacterRow } from "./character-row";
import { ABILITY_ORDER } from "./squad-stats";
import styles from "./squad-builder.module.css";

interface CharacterTableProps {
  characters: Character[];
  selectedIds: number[];
  busyIds: number[];
  memberCount: number;
  membershipLocked: boolean;
  onAdd: (character: RosterCharacter) => void;
  onRemove: (character: RosterCharacter) => void;
}

export function CharacterTable({
  characters,
  selectedIds,
  busyIds,
  memberCount,
  membershipLocked,
  onAdd,
  onRemove,
}: CharacterTableProps) {
  const squadFull = memberCount >= SQUAD_SIZE_LIMIT;

  return (
    <div className={styles.card}>
      <div className={classNames(styles.grid, styles.head)}>
        <div>Character</div>
        <div>Tags</div>
        {ABILITY_ORDER.map((ability) => (
          <div key={ability} className={styles.score}>
            {ability}
          </div>
        ))}
      </div>
      {characters.map((character) => (
        <CharacterRow
          key={character.id}
          character={character}
          selected={selectedIds.includes(character.id)}
          busy={busyIds.includes(character.id)}
          squadFull={squadFull}
          membershipLocked={membershipLocked}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
