import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDebt } from '@/features/debts/debts.repository';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/app.store';
import { selectBalance, selectNetBalance, selectTotalDebt } from '@/stores/selectors';
import { TransactionError } from './errors';
import { type NewTransaction, payDebt, record, updateExpense } from './transactions.service';

const DATE = '2020-01-15';

function expenseInput(overrides: Partial<NewTransaction> = {}): NewTransaction {
  return {
    type: 'expense',
    direction: 'debit',
    amount: 20,
    category: 'daily',
    subcategory: 'daily.food',
    date: DATE,
    ...overrides,
  };
}

function incomeInput(amount: number): NewTransaction {
  return { type: 'income', direction: 'credit', amount, date: DATE };
}

async function expectError(
  promise: Promise<unknown>,
  code: TransactionError['code']
): Promise<void> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(TransactionError);
    expect((error as TransactionError).code).toBe(code);
    return;
  }

  throw new Error(`Expected TransactionError with code "${code}"`);
}

beforeEach(async () => {
  useAppStore.getState().reset();
  await db.open();
  await db.transaction('rw', db.transactions, db.debts, db.settings, async () => {
    await Promise.all([db.transactions.clear(), db.debts.clear(), db.settings.clear()]);
  });
});

afterEach(async () => {
  vi.restoreAllMocks();
  useAppStore.getState().reset();
  await db.delete();
});

describe('record', () => {
  it('stores a transaction and syncs the store', async () => {
    const transaction = await record(incomeInput(50));

    expect(transaction.id).toBeTruthy();
    expect(transaction.createdAt).toBeTruthy();
    expect(await db.transactions.count()).toBe(1);
    expect(useAppStore.getState().transactions).toHaveLength(1);
    expect(selectBalance(useAppStore.getState())).toBe(50);
  });

  it('rounds the amount before writing', async () => {
    const transaction = await record(expenseInput({ amount: 10.005 }));

    expect(transaction.amount).toBe(10.01);
    expect((await db.transactions.get(transaction.id))?.amount).toBe(10.01);
  });

  it('rejects invalid input without writing', async () => {
    await expectError(record(expenseInput({ amount: 0 })), 'invalidAmount');
    await expectError(record(expenseInput({ direction: 'credit' })), 'invalidDirection');
    await expectError(
      record(expenseInput({ category: undefined, subcategory: undefined })),
      'missingCategory'
    );
    await expectError(record(expenseInput({ date: '2999-01-01' })), 'invalidDate');

    expect(await db.transactions.count()).toBe(0);
    expect(useAppStore.getState().transactions).toHaveLength(0);
  });

  it('allows only one initial balance', async () => {
    await record({
      type: 'initial_balance',
      direction: 'credit',
      amount: 100,
      date: DATE,
    });

    await expectError(
      record({ type: 'initial_balance', direction: 'credit', amount: 50, date: DATE }),
      'initialBalanceExists'
    );
    expect(await db.transactions.count()).toBe(1);
  });
});

describe('updateExpense', () => {
  it('applies the new amount when the change affects the balance', async () => {
    const expense = await record(expenseInput({ amount: 20 }));

    await updateExpense(expense.id, { amount: 25 }, true);

    const rows = await db.transactions.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(25);
    expect(selectBalance(useAppStore.getState())).toBe(-25);
  });

  it('creates a credit adjustment when an increase must not affect the balance', async () => {
    const expense = await record(expenseInput({ amount: 20 }));

    await updateExpense(expense.id, { amount: 25 }, false);

    const rows = await db.transactions.toArray();
    const adjustment = rows.find((row) => row.type === 'adjustment');

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === expense.id)?.amount).toBe(25);
    expect(adjustment).toMatchObject({
      direction: 'credit',
      amount: 5,
      date: DATE,
      source: 'edit_compensation',
    });
    expect(selectBalance(useAppStore.getState())).toBe(-20);
  });

  it('creates a debit adjustment when a decrease must not affect the balance', async () => {
    const expense = await record(expenseInput({ amount: 20 }));

    await updateExpense(expense.id, { amount: 15 }, false);

    const rows = await db.transactions.toArray();
    const adjustment = rows.find((row) => row.type === 'adjustment');

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.id === expense.id)?.amount).toBe(15);
    expect(adjustment).toMatchObject({
      direction: 'debit',
      amount: 5,
      source: 'edit_compensation',
    });
    expect(selectBalance(useAppStore.getState())).toBe(-20);
  });

  it('updates metadata without touching the balance', async () => {
    const expense = await record(expenseInput({ amount: 20, note: 'Lunch' }));

    await updateExpense(
      expense.id,
      { note: 'Dinner', category: 'mobility', subcategory: 'mobility.fuel', date: '2020-01-16' },
      false
    );

    const rows = await db.transactions.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      amount: 20,
      note: 'Dinner',
      category: 'mobility',
      subcategory: 'mobility.fuel',
      date: '2020-01-16',
    });
    expect(selectBalance(useAppStore.getState())).toBe(-20);
  });

  it('keeps untouched fields when the patch omits them', async () => {
    const expense = await record(expenseInput({ amount: 20, note: 'Lunch' }));

    await updateExpense(expense.id, { amount: 22 }, true);

    expect(await db.transactions.get(expense.id)).toMatchObject({
      amount: 22,
      note: 'Lunch',
      category: 'daily',
      subcategory: 'daily.food',
      date: DATE,
    });
  });

  it('does not create an adjustment when the amount does not change', async () => {
    const expense = await record(expenseInput({ amount: 20 }));

    await updateExpense(expense.id, { amount: 20, note: 'Same' }, false);

    expect(await db.transactions.count()).toBe(1);
    expect(selectBalance(useAppStore.getState())).toBe(-20);
  });

  it('rejects missing and non-expense transactions', async () => {
    await expectError(updateExpense('missing', { amount: 10 }, true), 'transactionNotFound');

    const income = await record(incomeInput(50));
    await expectError(updateExpense(income.id, { amount: 10 }, true), 'notAnExpense');
  });

  it('rejects an invalid patch without writing', async () => {
    const expense = await record(expenseInput({ amount: 20 }));

    await expectError(updateExpense(expense.id, { amount: -1 }, true), 'invalidAmount');
    await expectError(updateExpense(expense.id, { category: 'unknown' }, true), 'unknownCategory');

    expect((await db.transactions.get(expense.id))?.amount).toBe(20);
    expect(await db.transactions.count()).toBe(1);
  });

  it('rolls back the update when the adjustment write fails', async () => {
    const expense = await record(expenseInput({ amount: 20 }));
    vi.spyOn(db.transactions, 'add').mockRejectedValueOnce(new Error('write failed'));

    await expect(updateExpense(expense.id, { amount: 25 }, false)).rejects.toThrow();

    const rows = await db.transactions.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(20);
    expect(selectBalance(useAppStore.getState())).toBe(-20);
  });
});

describe('payDebt', () => {
  it('marks the debt as paid and subtracts it from the balance when it affects the balance', async () => {
    await record({ type: 'initial_balance', direction: 'credit', amount: 100, date: DATE });
    const debt = await createDebt({ name: 'Credit card', amount: 30 });

    await payDebt(debt.id, true);

    const stored = await db.debts.get(debt.id);
    const payment = (await db.transactions.toArray()).find((row) => row.type === 'debt_payment');

    expect(stored).toMatchObject({ status: 'paid', affectsBalance: true });
    expect(stored?.paidAt).toBeTruthy();
    expect(payment).toMatchObject({
      direction: 'debit',
      amount: 30,
      relatedDebtId: debt.id,
    });

    const state = useAppStore.getState();
    expect(selectBalance(state)).toBe(70);
    expect(selectTotalDebt(state)).toBe(0);
    expect(selectNetBalance(state)).toBe(70);
  });

  it('keeps the balance intact when the payment does not affect it', async () => {
    await record({ type: 'initial_balance', direction: 'credit', amount: 100, date: DATE });
    const debt = await createDebt({ name: 'Credit card', amount: 30 });

    await payDebt(debt.id, false);

    expect(await db.transactions.count()).toBe(1);
    expect((await db.debts.get(debt.id))?.status).toBe('paid');

    const state = useAppStore.getState();
    expect(selectBalance(state)).toBe(100);
    expect(selectTotalDebt(state)).toBe(0);
    expect(selectNetBalance(state)).toBe(100);
  });

  it('rejects unknown and already paid debts', async () => {
    await expectError(payDebt('missing', true), 'debtNotFound');

    const debt = await createDebt({ name: 'Credit card', amount: 30 });
    await payDebt(debt.id, false);
    await expectError(payDebt(debt.id, true), 'debtAlreadyPaid');

    expect(await db.transactions.count()).toBe(0);
  });

  it('rolls back the debt payment when the transaction write fails', async () => {
    const debt = await createDebt({ name: 'Credit card', amount: 30 });
    vi.spyOn(db.transactions, 'add').mockRejectedValueOnce(new Error('write failed'));

    await expect(payDebt(debt.id, true)).rejects.toThrow();

    expect((await db.debts.get(debt.id))?.status).toBe('active');
    expect(await db.transactions.count()).toBe(0);
    expect(useAppStore.getState().debts).toHaveLength(0);
  });
});
