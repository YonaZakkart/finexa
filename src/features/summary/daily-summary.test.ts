import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/types';
import { calculateDailySummary } from './daily-summary';

let sequence = 0;

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  sequence += 1;

  return {
    id: `tx-${sequence}`,
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

describe('calculateDailySummary', () => {
  it('returns an empty summary', () => {
    expect(calculateDailySummary([])).toEqual({
      total: 0,
      count: 0,
      dominantCategoryId: null,
    });
  });

  it('sums expenses and picks the dominant category', () => {
    const summary = calculateDailySummary([
      transaction({ category: 'daily', amount: 10 }),
      transaction({ category: 'mobility', amount: 20 }),
      transaction({ category: 'daily', amount: 5 }),
    ]);

    expect(summary).toEqual({
      total: 35,
      count: 3,
      dominantCategoryId: 'mobility',
    });
  });

  it('breaks ties by catalog order', () => {
    const mobilityWins = calculateDailySummary([
      transaction({ category: 'daily', amount: 10 }),
      transaction({ category: 'mobility', amount: 10 }),
    ]);
    const dailyWins = calculateDailySummary([
      transaction({ category: 'utilities', amount: 10 }),
      transaction({ category: 'daily', amount: 10 }),
    ]);

    expect(mobilityWins.dominantCategoryId).toBe('mobility');
    expect(dailyWins.dominantCategoryId).toBe('daily');
  });

  it('ignores non-expense transactions', () => {
    const summary = calculateDailySummary([
      transaction({ amount: 10 }),
      transaction({ type: 'income', direction: 'credit', category: undefined, amount: 50 }),
      transaction({ type: 'adjustment', category: undefined, amount: 5 }),
      transaction({ type: 'debt_payment', category: undefined, amount: 30 }),
    ]);

    expect(summary).toEqual({
      total: 10,
      count: 1,
      dominantCategoryId: 'daily',
    });
  });

  it('rounds the total', () => {
    const summary = calculateDailySummary([
      transaction({ amount: 0.1 }),
      transaction({ amount: 0.2 }),
    ]);

    expect(summary.total).toBe(0.3);
  });
});
