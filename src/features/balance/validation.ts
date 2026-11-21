import { getCategory, getSubcategory } from '@/features/expenses/categories';
import { getLocalDateString, isValidLocalDate } from '@/lib/date';
import type { Transaction, TransactionDirection, TransactionType } from '@/types';
import { TransactionError } from './errors';

export const MAX_NOTE_LENGTH = 280;

const EXPECTED_DIRECTIONS: Partial<Record<TransactionType, TransactionDirection>> = {
  income: 'credit',
  initial_balance: 'credit',
  expense: 'debit',
  debt_payment: 'debit',
  investment: 'debit',
};

export type TransactionInput = Pick<
  Transaction,
  'type' | 'direction' | 'amount' | 'date' | 'category' | 'subcategory' | 'note' | 'relatedDebtId'
>;

export function assertValidAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new TransactionError('invalidAmount');
  }
}

export function assertValidDate(date: string, today = getLocalDateString()): void {
  if (!isValidLocalDate(date) || date > today) {
    throw new TransactionError('invalidDate');
  }
}

export function assertValidNote(note?: string): void {
  if (note && note.length > MAX_NOTE_LENGTH) {
    throw new TransactionError('invalidNote');
  }
}

export function assertValidDirection(type: TransactionType, direction: TransactionDirection): void {
  const expected = EXPECTED_DIRECTIONS[type];

  if (expected && expected !== direction) {
    throw new TransactionError('invalidDirection');
  }
}

export function assertValidCategory(category?: string, subcategory?: string): void {
  if (!category) {
    throw new TransactionError('missingCategory');
  }

  const found = getCategory(category);

  if (!found) {
    throw new TransactionError('unknownCategory');
  }

  if (found.subcategories.length > 0 && !subcategory) {
    throw new TransactionError('missingSubcategory');
  }

  if (subcategory && !getSubcategory(category, subcategory)) {
    throw new TransactionError('unknownSubcategory');
  }
}

export function assertValidTransaction(input: TransactionInput): void {
  assertValidAmount(input.amount);
  assertValidDate(input.date);
  assertValidNote(input.note);
  assertValidDirection(input.type, input.direction);

  if (input.type === 'expense') {
    assertValidCategory(input.category, input.subcategory);
  }

  if (input.type === 'debt_payment' && !input.relatedDebtId) {
    throw new TransactionError('missingDebtId');
  }
}
