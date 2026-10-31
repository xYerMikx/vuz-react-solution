import { TagChip } from "@shared/ui/tag-chip";

import { getCharacterLabel } from "./get-character-label";

interface FilterTagProps {
  tag: string;
  pressed: boolean;
  onToggleTag: (tag: string) => void;
}

export function FilterTag({ tag, pressed, onToggleTag }: FilterTagProps) {
  const handleClick = () => {
    onToggleTag(tag);
  };

  return (
    <TagChip
      label={getCharacterLabel(tag)}
      pressed={pressed}
      onClick={handleClick}
    />
  );
}
