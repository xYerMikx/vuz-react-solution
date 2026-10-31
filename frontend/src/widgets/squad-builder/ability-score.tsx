import classNames from "classnames";

import { isPerfectScore } from "@features/squad/format-score";

import styles from "./squad-builder.module.css";

interface AbilityScoreProps {
  value: number | null;
}

export function AbilityScore({ value }: AbilityScoreProps) {
  if (value === null) {
    return <div className={styles.score}>-</div>;
  }

  return (
    <div
      className={classNames(
        styles.score,
        isPerfectScore(value) && styles.perfect,
      )}
    >
      {value}
    </div>
  );
}
