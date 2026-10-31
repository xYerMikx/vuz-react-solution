export function getEmptyListLabel(
  myTeam: boolean,
  memberCount: number,
): string {
  if (myTeam && memberCount === 0) {
    return "Your squad is empty";
  }

  return "No characters match these filters";
}
