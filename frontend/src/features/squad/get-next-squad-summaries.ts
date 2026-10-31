import type { SquadDetail, SquadSummary } from "./model";

export function getNextSquadSummaries(
  summaries: readonly SquadSummary[],
  squad: SquadDetail,
): SquadSummary[] {
  const summary: SquadSummary = {
    id: squad.id,
    name: squad.name,
    memberCount: squad.members.length,
  };
  const index = summaries.findIndex((item) => item.id === squad.id);

  if (index === -1) {
    return [...summaries, summary];
  }

  return summaries.map((item, itemIndex) =>
    itemIndex === index ? summary : item,
  );
}
