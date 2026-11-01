const revisions = new Map<string, string>();

export function isStaleSquadRevision(
  squadId: string,
  updatedAt: string,
): boolean {
  const known = revisions.get(squadId);

  if (known !== undefined && updatedAt < known) {
    return true;
  }

  revisions.set(squadId, updatedAt);

  return false;
}
