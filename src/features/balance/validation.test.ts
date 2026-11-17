import { describe, expect, it } from 'vitest';
import type { TransactionErrorCode } from './errors';
import { TransactionError } from './errors';
import {
  assertValidAmount,
  assertValidCategory,
  assertValidDate,
  assertValidDirection,
  assertValidNote,
  assertValidTransaction,
  MAX_NOTE_LENGTH,
  type TransactionInput,
} from './validation';

function expectErrorCode(run: () => void, code: TransactionErrorCode): void {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(TransactionError);
    expect((error as TransactionError).code).toBe(code);
    return;
  }

  throw new Error(`Expected TransactionError with code "${code}"`);
}

function input(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    type: 'expense',
    direction: 'debit',
    amount: 10,
    date: '2026-11-17',
    category: 'daily',
    subcategory: 'daily.food',
    ...overrides,
  };
}

describe('assertValidAmount', () => {
  it('accepts positive finite amounts', () => {
    expect(() => assertValidAmount(0.01)).not.toThrow();
    expect(() => assertValidAmount(100)).not.toThrow();
  });

  it('rejects zero, negative and non-finite amounts', () => {
    expectErrorCode(() => assertValidAmount(0), 'invalidAmount');
    expectErrorCode(() => assertValidAmount(-5), 'invalidAmount');
    expectErrorCode(() => assertValidAmount(Number.NaN), 'invalidAmount');
    expectErrorCode(() => assertValidAmount(Number.POSITIVE_INFINITY), 'invalidAmount');
  });
});

describe('assertValidDate', () => {
  const today = '2026-11-17';

  it('accepts past and current dates', () => {
    expect(() => assertValidDate('2026-11-17', today)).not.toThrow();
    expect(() => assertValidDate('2025-01-01', today)).not.toThrow();
  });

  it('rejects future and invalid dates', () => {
    expectErrorCode(() => assertValidDate('2026-11-18', today), 'invalidDate');
    expectErrorCode(() => assertValidDate('2026-02-31', today), 'invalidDate');
    expectErrorCode(() => assertValidDate('17/11/2026', today), 'invalidDate');
  });
});

describe('assertValidNote', () => {
  it('accepts notes up to the limit', () => {
    expect(() => assertValidNote()).not.toThrow();
    expect(() => assertValidNote('a'.repeat(MAX_NOTE_LENGTH))).not.toThrow();
  });

  it('rejects notes over the limit', () => {
    expectErrorCode(() => assertValidNote('a'.repeat(MAX_NOTE_LENGTH + 1)), 'invalidNote');
  });
});

describe('assertValidDirection', () => {
  it('accepts the documented direction for each type', () => {
    expect(() => assertValidDirection('income', 'credit')).not.toThrow();
    expect(() => assertValidDirection('initial_balance', 'credit')).not.toThrow();
    expect(() => assertValidDirection('expense', 'debit')).not.toThrow();
    expect(() => assertValidDirection('debt_payment', 'debit')).not.toThrow();
    expect(() => assertValidDirection('adjustment', 'credit')).not.toThrow();
    expect(() => assertValidDirection('adjustment', 'debit')).not.toThrow();
  });

  it('rejects a direction that contradicts the type', () => {
    expectErrorCode(() => assertValidDirection('income', 'debit'), 'invalidDirection');
    expectErrorCode(() => assertValidDirection('initial_balance', 'debit'), 'invalidDirection');
    expectErrorCode(() => assertValidDirection('expense', 'credit'), 'invalidDirection');
    expectErrorCode(() => assertValidDirection('debt_payment', 'credit'), 'invalidDirection');
  });
});

describe('assertValidCategory', () => {
  it('accepts a category with its subcategory', () => {
    expect(() => assertValidCategory('daily', 'daily.food')).not.toThrow();
    expect(() => assertValidCategory('other')).not.toThrow();
  });

  it('requires a category', () => {
    expectErrorCode(() => assertValidCategory(), 'missingCategory');
  });

  it('rejects unknown categories and subcategories', () => {
    expectErrorCode(() => assertValidCategory('unknown', 'unknown.foo'), 'unknownCategory');
    expectErrorCode(() => assertValidCategory('daily', 'daily.unknown'), 'unknownSubcategory');
    expectErrorCode(() => assertValidCategory('other', 'other.foo'), 'unknownSubcategory');
  });

  it('requires a subcategory when the category has subcategories', () => {
    expectErrorCode(() => assertValidCategory('daily'), 'missingSubcategory');
  });
});

describe('assertValidTransaction', () => {
  it('accepts a valid expense', () => {
    expect(() => assertValidTransaction(input())).not.toThrow();
  });

  it('accepts an income without category', () => {
    expect(() =>
      assertValidTransaction(
        input({ type: 'income', direction: 'credit', category: undefined, subcategory: undefined })
      )
    ).not.toThrow();
  });

  it('requires a category on expenses', () => {
    expectErrorCode(
      () => assertValidTransaction(input({ category: undefined })),
      'missingCategory'
    );
  });

  it('requires a debt id on debt payments', () => {
    expectErrorCode(
      () =>
        assertValidTransaction(
          input({
            type: 'debt_payment',
            direction: 'debit',
            category: undefined,
            subcategory: undefined,
          })
        ),
      'missingDebtId'
    );
  });

  it('validates amount, date and note', () => {
    expectErrorCode(() => assertValidTransaction(input({ amount: 0 })), 'invalidAmount');
    expectErrorCode(() => assertValidTransaction(input({ date: '2026-02-31' })), 'invalidDate');
    expectErrorCode(
      () => assertValidTransaction(input({ note: 'a'.repeat(MAX_NOTE_LENGTH + 1) })),
      'invalidNote'
    );
  });
});
