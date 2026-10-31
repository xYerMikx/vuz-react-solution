import classNames from "classnames";

import { formatAverage, isPerfectScore } from "@features/squad/format-score";
import type { SquadStatistic } from "@features/squad/model";

import type { ABILITY_ORDER } from "./squad-stats";
import { getStatisticValue } from "./squad-stats";
import styles from "./squad-builder.module.css";

interface SquadStatProps {
  name: (typeof ABILITY_ORDER)[number];
  statistics: SquadStatistic[] | null;
}

export function SquadStat({ name, statistics }: SquadStatProps) {
  const value = getStatisticValue(statistics, name);
  const perfect = value !== null && isPerfectScore(value);

  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{name}</div>
      <div className={classNames(styles.statValue, perfect && styles.perfect)}>
        {value === null ? "-" : formatAverage(value)}
      </div>
    </div>
  );
}
