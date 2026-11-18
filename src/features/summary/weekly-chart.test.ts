import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/types';
import { calculateWeeklyChartData } from './weekly-chart';

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
    date: '2026-11-16',
    createdAt: '2026-11-16T10:00:00.000Z',
    ...overrides,
  };
}

describe('calculateWeeklyChartData', () => {
  it('aggregates expenses by day and category', () => {
    const data = calculateWeeklyChartData(
      [
        tx({ date: '2026-11-16', category: 'daily', amount: 10 }),
        tx({ date: '2026-11-18', category: 'mobility', amount: 20 }),
        tx({ date: '2026-11-15', category: 'daily', amount: 99 }),
        tx({
          type: 'income',
          direction: 'credit',
          category: undefined,
          date: '2026-11-16',
          amount: 50,
        }),
      ],
      '2026-11-16',
      'es'
    );

    expect(data.total).toBe(30);
    expect(data.categories.map((category) => category.id)).toEqual(['mobility', 'daily']);
    expect(data.rows).toHaveLength(7);
    expect(data.rows[0].daily).toBe(10);
    expect(data.rows[2].mobility).toBe(20);
  });

  it('returns no categories for an empty week', () => {
    const data = calculateWeeklyChartData([], '2026-11-16', 'es');
    expect(data.total).toBe(0);
    expect(data.categories).toEqual([]);
    expect(data.rows).toHaveLength(7);
  });
});
