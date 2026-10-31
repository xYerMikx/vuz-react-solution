import type { SquadStatistic } from "@features/squad/model";
import type { RosterCharacter } from "@features/squad/roster-character";

import { ChampionAvatar } from "./champion-avatar";
import { SquadStat } from "./squad-stat";
import { getDisplayedStatistics } from "./squad-stats";
import styles from "./squad-builder.module.css";

interface SquadHeaderProps {
  members: RosterCharacter[];
  statistics: SquadStatistic[];
  pendingCount: number;
  busyIds: number[];
  onRemove: (character: RosterCharacter) => void;
}

const EMPTY_TITLE = "Select your squad to defend earthrealm";
const FILLED_TITLE = "Your champions!";

export function SquadHeader({
  members,
  statistics,
  pendingCount,
  busyIds,
  onRemove,
}: SquadHeaderProps) {
  const shown = getDisplayedStatistics(statistics, members, pendingCount);
  const title = members.length > 0 ? FILLED_TITLE : EMPTY_TITLE;

  return (
    <header>
      <h1 className={styles.heading}>{title}</h1>
      {members.length > 0 && (
        <div className={styles.avatars}>
          {members.map((member) => (
            <ChampionAvatar
              key={member.id}
              member={member}
              busy={busyIds.includes(member.id)}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
      <div className={styles.stats}>
        <div className={styles.statGroup}>
          <SquadStat name="Power" statistics={shown} />
          <SquadStat name="Mobility" statistics={shown} />
        </div>
        <div className={styles.rule} />
        <div className={styles.statGroup}>
          <SquadStat name="Technique" statistics={shown} />
        </div>
        <div className={styles.rule} />
        <div className={styles.statGroup}>
          <SquadStat name="Survivability" statistics={shown} />
          <SquadStat name="Energy" statistics={shown} />
        </div>
      </div>
      <p className={styles.footnote}>* Totals as average for squad</p>
    </header>
  );
}
