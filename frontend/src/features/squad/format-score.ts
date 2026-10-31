export function formatAverage(value: number): string {
  return Number(value.toFixed(2)).toString();
}

export function isPerfectScore(value: number): boolean {
  return Number(value.toFixed(2)) === 10;
}
