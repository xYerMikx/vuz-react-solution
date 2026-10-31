import { Chip } from "@mui/material";

import { CheckIcon } from "./check-icon";
import styles from "./tag-chip.module.css";

interface TagChipProps {
  label: string;
  pressed: boolean;
  onClick: () => void;
}

export function TagChip({ label, pressed, onClick }: TagChipProps) {
  const text = pressed ? (
    <span className={styles.pressedLabel}>
      <CheckIcon />
      {label}
    </span>
  ) : (
    label
  );

  return (
    <Chip
      label={text}
      color="primary"
      variant={pressed ? "filled" : "outlined"}
      aria-pressed={pressed}
      onClick={onClick}
    />
  );
}
