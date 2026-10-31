import type { RosterCharacter } from "@features/squad/roster-character";
import { CharacterPortrait } from "@shared/ui/character-portrait";

import styles from "./squad-builder.module.css";

interface ChampionAvatarProps {
  member: RosterCharacter;
  busy: boolean;
  onRemove: (character: RosterCharacter) => void;
}

export function ChampionAvatar({
  member,
  busy,
  onRemove,
}: ChampionAvatarProps) {
  const handleRemove = () => {
    onRemove(member);
  };

  return (
    <button
      type="button"
      className={styles.avatarButton}
      aria-label={`Remove ${member.name}`}
      disabled={busy}
      onClick={handleRemove}
    >
      <CharacterPortrait
        name={member.name}
        thumbnail={member.thumbnail}
        size={72}
        imageClassName={styles.avatarImage}
        fallbackClassName={styles.avatarFallback}
      />
      <span className={styles.removeLabel}>Remove</span>
    </button>
  );
}
