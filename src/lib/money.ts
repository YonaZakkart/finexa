export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toCents(value: number): number {
  return Math.round(value * 100);
}

export function moneyEquals(a: number, b: number): boolean {
  return toCents(a) === toCents(b);
}
