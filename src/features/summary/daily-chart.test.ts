import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/types';
import { calculateDailyCategoryData } from './daily-chart';

let seq = 0;
function tx(overrides: Partial<Transaction> = {}): Transaction {
  seq += 1;
  return {
    id: `tx-${seq}`,
    type: 'expense',
    direction: 'debit',
    amount: 10,
    category: 'daily',
    subcategory: 'daily.food',
    date: '2026-11-17',
    createdAt: '2026-11-17T10:00:00.000Z',
    ...overrides,
  };
}

describe('calculateDailyCategoryData', () => {
  it('returns an empty chart without expenses', () => {
    expect(calculateDailyCategoryData([])).toEqual({ slices: [], total: 0 });
  });

  it('aggregates by category and computes percentages', () => {
    const data = calculateDailyCategoryData([
      tx({ category: 'daily', amount: 10 }),
      tx({ category: 'mobility', amount: 20 }),
      tx({ category: 'daily', amount: 5 }),
      tx({ type: 'income', direction: 'credit', category: undefined, amount: 50 }),
    ]);

    expect(data.total).toBe(35);
    expect(data.slices.map((slice) => slice.categoryId)).toEqual(['mobility', 'daily']);
    expect(data.slices[0]).toMatchObject({ value: 20, percentage: 57.14 });
    expect(data.slices[1]).toMatchObject({ value: 15, percentage: 42.86 });
    expect(data.slices.reduce((sum, slice) => sum + slice.percentage, 0)).toBe(100);
  });

  it('makes rounded percentages sum to 100', () => {
    const data = calculateDailyCategoryData([
      tx({ category: 'daily', amount: 10 }),
      tx({ category: 'mobility', amount: 10 }),
      tx({ category: 'utilities', amount: 10 }),
    ]);

    expect(data.slices.reduce((sum, slice) => sum + slice.percentage, 0)).toBe(100);
  });

  it('rounds the total', () => {
    const data = calculateDailyCategoryData([tx({ amount: 0.1 }), tx({ amount: 0.2 })]);

    expect(data.total).toBe(0.3);
    expect(data.slices[0].percentage).toBe(100);
  });
});
