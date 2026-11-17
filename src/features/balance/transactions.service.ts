import { createTransaction } from '@/features/transactions/transactions.repository';
import { getLocalDateString } from '@/lib/date';
import { db } from '@/lib/db';
import { roundMoney } from '@/lib/money';
import { useAppStore } from '@/stores/app.store';
import type { Transaction } from '@/types';
import { TransactionError } from './errors';
import { assertValidTransaction, type TransactionInput } from './validation';

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;
export type ExpensePatch = Partial<
  Pick<Transaction, 'amount' | 'category' | 'subcategory' | 'note' | 'date'>
>;

async function syncStore(): Promise<void> {
  const [transactions, debts] = await Promise.all([db.transactions.toArray(), db.debts.toArray()]);
  const { setTransactions, setDebts } = useAppStore.getState();

  setTransactions(transactions);
  setDebts(debts);
}

export async function record(input: NewTransaction): Promise<Transaction> {
  const normalized = { ...input, amount: roundMoney(input.amount) };
  assertValidTransaction(normalized);

  const transaction = await db.transaction('rw', db.transactions, async () => {
    if (normalized.type === 'initial_balance') {
      const existing = await db.transactions.where('type').equals('initial_balance').count();

      if (existing > 0) {
        throw new TransactionError('initialBalanceExists');
      }
    }

    return createTransaction(normalized);
  });

  await syncStore();
  return transaction;
}

export async function updateExpense(
  id: string,
  patch: ExpensePatch,
  affectsBalance: boolean
): Promise<void> {
  await db.transaction('rw', db.transactions, async () => {
    const current = await db.transactions.get(id);

    if (!current) {
      throw new TransactionError('transactionNotFound');
    }

    if (current.type !== 'expense') {
      throw new TransactionError('notAnExpense');
    }

    const nextAmount = patch.amount === undefined ? current.amount : roundMoney(patch.amount);
    const next: TransactionInput = {
      type: current.type,
      direction: current.direction,
      amount: nextAmount,
      date: patch.date ?? current.date,
      category: patch.category ?? current.category,
      subcategory: patch.subcategory ?? current.subcategory,
      note: patch.note ?? current.note,
      relatedDebtId: current.relatedDebtId,
    };

    assertValidTransaction(next);

    await db.transactions.put({ ...current, ...patch, amount: nextAmount });

    const delta = roundMoney(nextAmount - current.amount);

    if (!affectsBalance && delta !== 0) {
      await createTransaction({
        type: 'adjustment',
        direction: delta > 0 ? 'credit' : 'debit',
        amount: Math.abs(delta),
        date: next.date,
        source: 'edit_compensation',
      });
    }
  });

  await syncStore();
}

export async function payDebt(id: string, affectsBalance: boolean): Promise<void> {
  await db.transaction('rw', db.transactions, db.debts, async () => {
    const debt = await db.debts.get(id);

    if (!debt) {
      throw new TransactionError('debtNotFound');
    }

    if (debt.status === 'paid') {
      throw new TransactionError('debtAlreadyPaid');
    }

    const paidAt = new Date().toISOString();
    await db.debts.put({ ...debt, status: 'paid', paidAt, affectsBalance });

    if (affectsBalance) {
      await createTransaction({
        type: 'debt_payment',
        direction: 'debit',
        amount: roundMoney(debt.amount),
        date: getLocalDateString(),
        relatedDebtId: debt.id,
      });
    }
  });

  await syncStore();
}
