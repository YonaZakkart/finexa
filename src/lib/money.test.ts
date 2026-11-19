import { describe, expect, it } from 'vitest';
import { moneyEquals, roundMoney, toCents } from './money';

describe('roundMoney', () => {
  it('rounds to two decimals', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(2.344)).toBe(2.34);
    expect(roundMoney(2.345)).toBe(2.35);
  });

  it('keeps integers and negative values', () => {
    expect(roundMoney(100)).toBe(100);
    expect(roundMoney(-12.5)).toBe(-12.5);
    expect(roundMoney(-0.1 - 0.2)).toBe(-0.3);
  });

  it('normalizes negative zero', () => {
    expect(roundMoney(-0)).toBe(0);
    expect(Object.is(roundMoney(-0), 0)).toBe(true);
  });
});

describe('toCents', () => {
  it('converts amounts to integer cents', () => {
    expect(toCents(10.25)).toBe(1025);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(-3.5)).toBe(-350);
  });
});

describe('moneyEquals', () => {
  it('compares amounts by cents', () => {
    expect(moneyEquals(0.1 + 0.2, 0.3)).toBe(true);
    expect(moneyEquals(10.001, 10)).toBe(true);
    expect(moneyEquals(10.01, 10)).toBe(false);
  });
});
