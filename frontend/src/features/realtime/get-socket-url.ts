export function getSocketUrl(apiUrl: string): string {
  return new URL(apiUrl).origin;
}
