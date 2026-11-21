import { TransactionError } from '@/features/balance/errors';
import { db } from '@/lib/db';
import { roundMoney } from '@/lib/money';
import { useAppStore } from '@/stores/app.store';
import type { Debt } from '@/types';
import { MAX_DEBT_NAME_LENGTH } from './constants';
import { createDebt as createDebtRecord, updateDebt as updateDebtRecord } from './debts.repository';

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

export async function editDebt(id: string, input: NewDebtInput): Promise<void> {
  const name = input.name.trim();

  if (name.length === 0 || name.length > MAX_DEBT_NAME_LENGTH) {
    throw new TransactionError('invalidDebtName');
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new TransactionError('invalidAmount');
  }

  await db.transaction('rw', db.debts, async () => {
    const debt = await db.debts.get(id);

    if (!debt) {
      throw new TransactionError('debtNotFound');
    }

    await updateDebtRecord(id, { name, amount: roundMoney(input.amount) });
  });

  await useAppStore.getState().sync();
}

export async function deleteDebt(id: string, affectsBalance: boolean): Promise<void> {
  await db.transaction('rw', db.debts, db.transactions, async () => {
    const debt = await db.debts.get(id);

    if (!debt) {
      throw new TransactionError('debtNotFound');
    }

    await db.debts.delete(id);

    if (affectsBalance) {
      const payments = await db.transactions.where('relatedDebtId').equals(id).toArray();
      await db.transactions.bulkDelete(payments.map((payment) => payment.id));
    }
  });

  await useAppStore.getState().sync();
}
