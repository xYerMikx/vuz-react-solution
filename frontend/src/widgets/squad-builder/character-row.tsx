import classNames from "classnames";

import type { Character } from "@features/characters/model";
import type { RosterCharacter } from "@features/squad/roster-character";
import { CharacterPortrait } from "@shared/ui/character-portrait";

import { getCharacterLabel } from "./get-character-label";
import { ABILITY_ORDER, getAbilityScore } from "./squad-stats";
import { AbilityScore } from "./ability-score";
import styles from "./squad-builder.module.css";

interface CharacterRowProps {
  character: Character;
  selected: boolean;
  busy: boolean;
  squadFull: boolean;
  membershipLocked: boolean;
  onAdd: (character: RosterCharacter) => void;
  onRemove: (character: RosterCharacter) => void;
}

export function CharacterRow({
  character,
  selected,
  busy,
  squadFull,
  membershipLocked,
  onAdd,
  onRemove,
}: CharacterRowProps) {
  const disabled = membershipLocked || busy || (!selected && squadFull);

  const handleChange = () => {
    if (selected) {
      onRemove(character);

      return;
    }

    onAdd(character);
  };

  return (
    <div
      className={classNames(
        styles.grid,
        styles.row,
        selected && styles.rowSelected,
      )}
    >
      <div className={styles.character}>
        <span
          className={classNames(
            styles.checkboxHit,
            disabled && styles.checkboxLocked,
          )}
        >
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={selected}
            disabled={disabled}
            aria-label={`Select ${character.name}`}
            onChange={handleChange}
          />
        </span>
        <CharacterPortrait
          name={character.name}
          thumbnail={character.thumbnail}
          size={42}
          imageClassName={styles.portrait}
          fallbackClassName={styles.portraitFallback}
        />
        <span>{character.name}</span>
      </div>
      <div className={styles.tags}>
        {character.tags.map((tag) => (
          <span key={tag.tagName} className={styles.tag}>
            {getCharacterLabel(tag.tagName)}
          </span>
        ))}
      </div>
      {ABILITY_ORDER.map((ability) => (
        <AbilityScore
          key={ability}
          value={getAbilityScore(character.abilities, ability)}
        />
      ))}
    </div>
  );
}
