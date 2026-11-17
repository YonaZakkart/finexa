import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDebt, listDebts, updateDebt } from '@/features/debts/debts.repository';
import { getSettings, updateSettings } from '@/features/settings/settings.service';
import {
  createTransaction,
  listExpensesByDate,
  listTransactionsBetween,
  listTransactionsByDate,
  type NewTransaction,
  updateTransaction,
} from '@/features/transactions/transactions.repository';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/app.store';

const expense: NewTransaction = {
  type: 'expense',
  direction: 'debit',
  amount: 12.5,
  category: 'daily',
  subcategory: 'daily.food',
  date: '2026-11-16',
};

beforeEach(async () => {
  useAppStore.getState().reset();
  await db.open();
  await db.transaction('rw', db.transactions, db.debts, db.settings, async () => {
    await Promise.all([db.transactions.clear(), db.debts.clear(), db.settings.clear()]);
  });
});

afterEach(async () => {
  useAppStore.getState().reset();
  await db.delete();
});

describe('settings service', () => {
  it('creates defaults once', async () => {
    const first = await getSettings();
    const second = await getSettings();

    expect(first).toMatchObject({
      id: 'app',
      language: 'en',
      theme: 'glass-dark',
      currency: 'USD',
      onboardingCompleted: false,
    });
    expect(second).toEqual(first);
    expect(await db.settings.count()).toBe(1);
  });

  it('updates settings and refreshed updatedAt', async () => {
    await getSettings();
    const updated = await updateSettings({
      onboardingCompleted: true,
      language: 'es',
      userName: 'Ana',
    });

    expect(updated.onboardingCompleted).toBe(true);
    expect(updated.language).toBe('es');
    expect(updated.userName).toBe('Ana');
    expect(updated.updatedAt >= updated.createdAt).toBe(true);
    expect((await db.settings.get('app'))?.language).toBe('es');
  });
});

describe('transactions repository', () => {
  it('creates transactions and filters by date', async () => {
    const created = await createTransaction(expense);
    await createTransaction({
      type: 'income',
      direction: 'credit',
      amount: 100,
      date: '2026-11-16',
    });

    expect(created.id).toBeTruthy();
    expect(await listTransactionsByDate('2026-11-16')).toHaveLength(2);
    expect(await listTransactionsByDate('2026-11-15')).toHaveLength(0);
    expect(await listTransactionsBetween('2026-11-15', '2026-11-17')).toHaveLength(2);
  });

  it('lists only expenses for a date using the compound index', async () => {
    await db.transactions.bulkAdd([
      {
        id: 'expense-1',
        type: 'expense',
        direction: 'debit',
        amount: 10,
        date: '2026-11-16',
        category: 'daily',
        subcategory: 'daily.food',
        createdAt: '2026-11-16T10:00:00.000Z',
      },
      {
        id: 'expense-2',
        type: 'expense',
        direction: 'debit',
        amount: 20,
        date: '2026-11-16',
        category: 'mobility',
        subcategory: 'mobility.fuel',
        createdAt: '2026-11-16T12:00:00.000Z',
      },
      {
        id: 'income-1',
        type: 'income',
        direction: 'credit',
        amount: 50,
        date: '2026-11-16',
        createdAt: '2026-11-16T13:00:00.000Z',
      },
      {
        id: 'expense-3',
        type: 'expense',
        direction: 'debit',
        amount: 30,
        date: '2026-11-17',
        category: 'other',
        createdAt: '2026-11-17T10:00:00.000Z',
      },
    ]);

    const rows = await listExpensesByDate('2026-11-16');

    expect(rows.map((row) => row.id)).toEqual(['expense-2', 'expense-1']);
  });

  it('updates transaction fields', async () => {
    const created = await createTransaction(expense);
    await updateTransaction(created.id, { note: 'Almuerzo' });

    expect((await db.transactions.get(created.id))?.note).toBe('Almuerzo');
  });
});

describe('debts repository', () => {
  it('creates, lists and updates debts', async () => {
    const debt = await createDebt({ name: 'Tarjeta', amount: 200 });

    expect(await listDebts('active')).toHaveLength(1);

    await updateDebt(debt.id, {
      status: 'paid',
      paidAt: '2026-11-16T10:00:00.000Z',
      affectsBalance: true,
    });

    expect(await listDebts('active')).toHaveLength(0);
    expect(await listDebts('paid')).toHaveLength(1);
  });
});

describe('app store hydration', () => {
  it('loads settings, transactions and debts from Dexie', async () => {
    await createTransaction(expense);
    await createDebt({ name: 'Tarjeta', amount: 200 });
    await getSettings();

    await useAppStore.getState().hydrate();

    const state = useAppStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.error).toBeNull();
    expect(state.settings?.id).toBe('app');
    expect(state.transactions).toHaveLength(1);
    expect(state.debts).toHaveLength(1);
  });
});
