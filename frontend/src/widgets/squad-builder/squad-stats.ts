import type { CharacterAbility } from "@features/characters/model";
import type { SquadStatistic } from "@features/squad/model";

export const ABILITY_ORDER = [
  "Power",
  "Mobility",
  "Technique",
  "Survivability",
  "Energy",
] as const;

interface ScoredMember {
  abilities: CharacterAbility[] | null;
}

export function getDisplayedStatistics(
  serverStatistics: SquadStatistic[],
  members: ScoredMember[],
  pendingCount: number,
): SquadStatistic[] | null {
  if (members.length === 0) {
    return null;
  }

  if (pendingCount > 0) {
    const local = getAbilityAverages(members);

    if (local) {
      return local;
    }
  }

  if (serverStatistics.length === 0) {
    return null;
  }

  return serverStatistics;
}

function getAbilityAverages(members: ScoredMember[]): SquadStatistic[] | null {
  if (members.some((member) => member.abilities === null)) {
    return null;
  }

  const statistics: SquadStatistic[] = [];

  for (const abilityName of ABILITY_ORDER) {
    let total = 0;

    for (const member of members) {
      const ability = member.abilities?.find(
        (item) => item.abilityName === abilityName,
      );

      if (!ability) {
        return null;
      }

      total += ability.abilityScore;
    }

    statistics.push({
      abilityName,
      average: Math.round((total / members.length) * 100) / 100,
    });
  }

  return statistics;
}

export function getAbilityScore(
  abilities: CharacterAbility[],
  abilityName: string,
): number | null {
  const ability = abilities.find((item) => item.abilityName === abilityName);

  if (!ability) {
    return null;
  }

  return ability.abilityScore;
}

export function getStatisticValue(
  statistics: SquadStatistic[] | null,
  abilityName: string,
): number | null {
  if (!statistics) {
    return null;
  }

  const statistic = statistics.find((item) => item.abilityName === abilityName);

  if (!statistic) {
    return null;
  }

  return statistic.average;
}
