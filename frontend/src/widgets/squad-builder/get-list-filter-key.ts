export function getListFilterKey(search: string, tags: string[]): string {
  return JSON.stringify({ search, tags: [...tags].sort() });
}
