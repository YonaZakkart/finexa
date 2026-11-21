import { describe, expect, it } from 'vitest';
import type { Debt, Transaction } from '@/types';
import {
  calculateBalance,
  calculateNetBalance,
  calculateTotalDebt,
  getTransactionEffect,
} from './balance';

let sequence = 0;

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  sequence += 1;

  return {
    id: `tx-${sequence}`,
    type: 'income',
    direction: 'credit',
    amount: 0,
    date: '2026-11-17',
    createdAt: '2026-11-17T10:00:00.000Z',
    ...overrides,
  };
}

function debt(overrides: Partial<Debt> = {}): Debt {
  sequence += 1;

  return {
    id: `debt-${sequence}`,
    name: 'Credit card',
    amount: 0,
    status: 'active',
    createdAt: '2026-11-17T10:00:00.000Z',
    ...overrides,
  };
}

describe('getTransactionEffect', () => {
  it('adds credits and subtracts debits', () => {
    expect(getTransactionEffect(transaction({ direction: 'credit', amount: 25 }))).toBe(25);
    expect(getTransactionEffect(transaction({ direction: 'debit', amount: 25 }))).toBe(-25);
  });

  it('ignores transactions that do not affect the balance', () => {
    expect(
      getTransactionEffect(
        transaction({ type: 'investment', direction: 'debit', amount: 25, affectsBalance: false })
      )
    ).toBe(0);
  });
});

describe('calculateBalance', () => {
  it('returns zero for an empty ledger', () => {
    expect(calculateBalance([])).toBe(0);
  });

  it('applies the effect of every transaction type', () => {
    const ledger = [
      transaction({ type: 'initial_balance', direction: 'credit', amount: 100 }),
      transaction({ type: 'income', direction: 'credit', amount: 50 }),
      transaction({ type: 'expense', direction: 'debit', amount: 20 }),
      transaction({ type: 'adjustment', direction: 'credit', amount: 5 }),
      transaction({ type: 'adjustment', direction: 'debit', amount: 3 }),
      transaction({ type: 'debt_payment', direction: 'debit', amount: 30 }),
    ];

    expect(calculateBalance(ledger)).toBe(102);
  });

  it('follows the documented balance matrix', () => {
    const initial = transaction({ type: 'initial_balance', direction: 'credit', amount: 100 });
    expect(calculateBalance([initial])).toBe(100);

    const income = transaction({ type: 'income', direction: 'credit', amount: 50 });
    expect(calculateBalance([initial, income])).toBe(150);

    const expense = transaction({ type: 'expense', direction: 'debit', amount: 20 });
    expect(calculateBalance([initial, income, expense])).toBe(130);
  });

  it('rounds the final sum', () => {
    const ledger = [
      transaction({ direction: 'credit', amount: 0.1 }),
      transaction({ direction: 'credit', amount: 0.2 }),
    ];

    expect(calculateBalance(ledger)).toBe(0.3);
  });

  it('supports a negative balance', () => {
    expect(calculateBalance([transaction({ direction: 'debit', amount: 15.5 })])).toBe(-15.5);
  });

  it('skips movements flagged as not affecting the balance', () => {
    const ledger = [
      transaction({ type: 'income', direction: 'credit', amount: 100 }),
      transaction({ type: 'investment', direction: 'debit', amount: 40, affectsBalance: false }),
      transaction({ type: 'investment', direction: 'debit', amount: 10 }),
    ];

    expect(calculateBalance(ledger)).toBe(90);
  });
});

describe('calculateTotalDebt', () => {
  it('sums only active debts', () => {
    const debts = [
      debt({ amount: 30 }),
      debt({ amount: 20 }),
      debt({ amount: 100, status: 'paid', paidAt: '2026-11-17T10:00:00.000Z' }),
    ];

    expect(calculateTotalDebt(debts)).toBe(50);
    expect(calculateTotalDebt([])).toBe(0);
  });

  it('rounds the sum', () => {
    expect(calculateTotalDebt([debt({ amount: 0.1 }), debt({ amount: 0.2 })])).toBe(0.3);
  });
});

describe('calculateNetBalance', () => {
  it('subtracts the total debt from the balance', () => {
    expect(calculateNetBalance(130, 30)).toBe(100);
    expect(calculateNetBalance(0, 0)).toBe(0);
    expect(calculateNetBalance(-10, 5)).toBe(-15);
  });

  it('matches the documented debt scenarios', () => {
    const ledger = [
      transaction({ type: 'initial_balance', direction: 'credit', amount: 100 }),
      transaction({ type: 'income', direction: 'credit', amount: 50 }),
      transaction({ type: 'expense', direction: 'debit', amount: 20 }),
    ];
    const activeDebts = [debt({ amount: 30 })];

    expect(calculateBalance(ledger)).toBe(130);
    expect(calculateNetBalance(calculateBalance(ledger), calculateTotalDebt(activeDebts))).toBe(
      100
    );

    const paidWithImpact = [
      ...ledger,
      transaction({ type: 'debt_payment', direction: 'debit', amount: 30 }),
    ];
    const paidDebts = [debt({ amount: 30, status: 'paid', paidAt: '2026-11-17T10:00:00.000Z' })];

    expect(calculateBalance(paidWithImpact)).toBe(100);
    expect(
      calculateNetBalance(calculateBalance(paidWithImpact), calculateTotalDebt(paidDebts))
    ).toBe(100);

    expect(calculateBalance(ledger)).toBe(130);
    expect(calculateNetBalance(calculateBalance(ledger), calculateTotalDebt(paidDebts))).toBe(130);
  });
});
