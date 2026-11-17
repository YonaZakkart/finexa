import { TransactionError } from '@/features/balance/errors';
import { db } from '@/lib/db';
import { roundMoney } from '@/lib/money';
import { useAppStore } from '@/stores/app.store';
import type { Debt } from '@/types';
import { MAX_DEBT_NAME_LENGTH } from './constants';
import { createDebt as createDebtRecord } from './debts.repository';

export interface NewDebtInput {
  name: string;
  amount: number;
}

export async function createDebt(input: NewDebtInput): Promise<Debt> {
  const name = input.name.trim();

  if (name.length === 0 || name.length > MAX_DEBT_NAME_LENGTH) {
    throw new TransactionError('invalidDebtName');
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new TransactionError('invalidAmount');
  }

  const debt = await db.transaction('rw', db.debts, () =>
    createDebtRecord({ name, amount: roundMoney(input.amount) })
  );

  await useAppStore.getState().sync();
  return debt;
}
