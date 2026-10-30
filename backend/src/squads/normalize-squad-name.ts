export const SQUAD_NAME_MAX_LENGTH = 40;

export function normalizeSquadName(name: string): string {
  return name.trim();
}

export function isSquadNameLengthValid(name: string): boolean {
  return name.length >= 1 && name.length <= SQUAD_NAME_MAX_LENGTH;
}
