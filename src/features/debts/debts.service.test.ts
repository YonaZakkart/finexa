import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TransactionError } from '@/features/balance/errors';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/app.store';
import { selectBalance, selectTotalDebt } from '@/stores/selectors';
import { createDebt } from './debts.service';

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
  useAppStore.getState().reset();
  await db.delete();
});

describe('createDebt', () => {
  it('creates an active debt and syncs the store without touching the balance', async () => {
    const debt = await createDebt({ name: '  Credit card  ', amount: 30.005 });

    expect(debt).toMatchObject({
      name: 'Credit card',
      amount: 30.01,
      status: 'active',
    });

    const state = useAppStore.getState();
    expect(state.debts).toHaveLength(1);
    expect(selectBalance(state)).toBe(0);
    expect(selectTotalDebt(state)).toBe(30.01);
    expect(await db.transactions.count()).toBe(0);
  });

  it('rejects invalid input without writing', async () => {
    await expectError(createDebt({ name: '', amount: 10 }), 'invalidDebtName');
    await expectError(createDebt({ name: 'a'.repeat(81), amount: 10 }), 'invalidDebtName');
    await expectError(createDebt({ name: 'Card', amount: 0 }), 'invalidAmount');
    await expectError(createDebt({ name: 'Card', amount: -5 }), 'invalidAmount');
    await expectError(createDebt({ name: 'Card', amount: Number.NaN }), 'invalidAmount');

    expect(await db.debts.count()).toBe(0);
    expect(useAppStore.getState().debts).toHaveLength(0);
  });
});
