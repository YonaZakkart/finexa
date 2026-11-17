import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionError } from '@/features/balance/errors';
import { record } from '@/features/balance/transactions.service';
import { getLocalDateString } from '@/lib/date';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/app.store';
import { selectBalance, selectNetBalance, selectTotalDebt } from '@/stores/selectors';
import { completeOnboarding, skipOnboarding } from './onboarding.service';

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

describe('completeOnboarding', () => {
  it('stores the profile, the initial balance and the debts', async () => {
    await completeOnboarding({
      profile: {
        userName: 'Ana',
        employmentStatus: 'employed',
        salary: 1500,
        salaryFrequency: 'monthly',
        paymentDates: ['15'],
      },
      initialBalance: 100,
      debts: [
        { name: 'Credit card', amount: 30 },
        { name: 'Loan', amount: 20 },
      ],
    });

    const state = useAppStore.getState();
    expect(state.settings).toMatchObject({
      onboardingCompleted: true,
      userName: 'Ana',
      employmentStatus: 'employed',
      salary: 1500,
      salaryFrequency: 'monthly',
      paymentDates: ['15'],
    });

    const rows = await db.transactions.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: 'initial_balance',
      direction: 'credit',
      amount: 100,
      date: getLocalDateString(),
    });

    const debts = await db.debts.toArray();
    expect(debts).toHaveLength(2);
    expect(debts.every((debt) => debt.status === 'active')).toBe(true);

    expect(selectBalance(state)).toBe(100);
    expect(selectTotalDebt(state)).toBe(50);
    expect(selectNetBalance(state)).toBe(50);
  });

  it('creates debts without touching the balance', async () => {
    await completeOnboarding({ debts: [{ name: 'Credit card', amount: 30 }] });

    expect(await db.transactions.count()).toBe(0);

    const state = useAppStore.getState();
    expect(selectBalance(state)).toBe(0);
    expect(selectTotalDebt(state)).toBe(30);
    expect(selectNetBalance(state)).toBe(-30);
  });

  it('skips the initial balance when it is zero', async () => {
    await completeOnboarding({ initialBalance: 0, profile: { userName: 'Ana' } });

    expect(await db.transactions.count()).toBe(0);
    expect(await db.debts.count()).toBe(0);
    expect(useAppStore.getState().settings).toMatchObject({
      onboardingCompleted: true,
      userName: 'Ana',
    });
  });

  it('rounds the initial balance and debt amounts', async () => {
    await completeOnboarding({
      initialBalance: 100.005,
      debts: [{ name: 'Credit card', amount: 30.005 }],
    });

    const [transaction] = await db.transactions.toArray();
    const [debt] = await db.debts.toArray();

    expect(transaction.amount).toBe(100.01);
    expect(debt.amount).toBe(30.01);
  });

  it('trims debt names', async () => {
    await completeOnboarding({ debts: [{ name: '  Credit card  ', amount: 30 }] });

    expect((await db.debts.toArray())[0].name).toBe('Credit card');
  });

  it('rejects invalid input without writing', async () => {
    await expectError(completeOnboarding({ initialBalance: -5 }), 'invalidAmount');
    await expectError(completeOnboarding({ initialBalance: Number.NaN }), 'invalidAmount');
    await expectError(completeOnboarding({ debts: [{ name: '', amount: 10 }] }), 'invalidDebtName');
    await expectError(
      completeOnboarding({ debts: [{ name: 'a'.repeat(81), amount: 10 }] }),
      'invalidDebtName'
    );
    await expectError(
      completeOnboarding({ debts: [{ name: 'Card', amount: 0 }] }),
      'invalidAmount'
    );
    await expectError(completeOnboarding({ profile: { salary: -1 } }), 'invalidSalary');

    expect(await db.transactions.count()).toBe(0);
    expect(await db.debts.count()).toBe(0);
    expect(await db.settings.count()).toBe(0);
  });

  it('allows only one initial balance', async () => {
    await record({
      type: 'initial_balance',
      direction: 'credit',
      amount: 10,
      date: getLocalDateString(),
    });

    await expectError(
      completeOnboarding({ initialBalance: 50, debts: [{ name: 'Card', amount: 30 }] }),
      'initialBalanceExists'
    );

    expect(await db.transactions.count()).toBe(1);
    expect(await db.debts.count()).toBe(0);
    expect((await db.settings.get('app'))?.onboardingCompleted).toBe(false);
  });

  it('rolls back every write when a debt fails', async () => {
    vi.spyOn(db.debts, 'add').mockRejectedValueOnce(new Error('write failed'));

    await expect(
      completeOnboarding({ initialBalance: 100, debts: [{ name: 'Card', amount: 30 }] })
    ).rejects.toThrow();

    expect(await db.transactions.count()).toBe(0);
    expect(await db.debts.count()).toBe(0);
    expect((await db.settings.get('app'))?.onboardingCompleted ?? false).toBe(false);
    expect(useAppStore.getState().transactions).toHaveLength(0);
  });
});

describe('skipOnboarding', () => {
  it('marks the onboarding as completed without creating data', async () => {
    await skipOnboarding();

    expect((await db.settings.get('app'))?.onboardingCompleted).toBe(true);
    expect(await db.transactions.count()).toBe(0);
    expect(await db.debts.count()).toBe(0);
    expect(useAppStore.getState().settings?.onboardingCompleted).toBe(true);
  });
});
