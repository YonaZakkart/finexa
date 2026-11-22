import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DB_NAME, db } from '@/lib/db';

const LEGACY_STORES = {
  transactions: 'id, date, type, relatedDebtId, [date+type]',
  debts: 'id, status, createdAt',
  settings: 'id',
};

async function seedVersion1(): Promise<void> {
  const legacy = new Dexie(DB_NAME);
  legacy.version(1).stores(LEGACY_STORES);
  await legacy.open();

  await legacy.table('transactions').add({
    id: 'legacy-transaction',
    type: 'expense',
    direction: 'debit',
    amount: 12.5,
    category: 'daily',
    subcategory: 'daily.food',
    date: '2026-11-16',
    createdAt: '2026-11-16T10:00:00.000Z',
  });

  await legacy.table('debts').add({
    id: 'legacy-debt',
    name: 'Tarjeta',
    amount: 200,
    status: 'active',
    createdAt: '2026-11-16T10:00:00.000Z',
  });

  await legacy.table('settings').add({
    id: 'app',
    language: 'es',
    theme: 'glass-dark',
    currency: 'USD',
    onboardingCompleted: true,
    createdAt: '2026-11-16T10:00:00.000Z',
    updatedAt: '2026-11-16T10:00:00.000Z',
  });

  legacy.close();
}

beforeEach(async () => {
  db.close();
  await Dexie.delete(DB_NAME);
  await seedVersion1();
});

afterEach(async () => {
  db.close();
  await Dexie.delete(DB_NAME);
});

describe('Dexie v1 to v2 migration', () => {
  it('upgrades the schema and preserves the MVP data', async () => {
    await db.open();

    expect(db.verno).toBe(4);
    expect(await db.transactions.count()).toBe(1);
    expect(await db.debts.count()).toBe(1);
    expect(await db.settings.count()).toBe(1);
    expect((await db.transactions.get('legacy-transaction'))?.amount).toBe(12.5);
    expect((await db.debts.get('legacy-debt'))?.name).toBe('Tarjeta');
    expect((await db.settings.get('app'))?.language).toBe('es');
  });

  it('creates empty portfolios, investments and balance snapshots tables', async () => {
    await db.open();

    expect(await db.portfolios.count()).toBe(0);
    expect(await db.investments.count()).toBe(0);
    expect(await db.balanceSnapshots.count()).toBe(0);
  });

  it('accepts writes to the new tables after the upgrade', async () => {
    await db.open();
    const now = new Date().toISOString();

    await db.portfolios.add({
      id: 'portfolio-1',
      name: 'VOO',
      type: 'etf',
      broker: 'Hapi',
      currentBalance: 0,
      createdAt: now,
      updatedAt: now,
    });
    await db.investments.add({
      id: 'investment-1',
      portfolioId: 'portfolio-1',
      date: '2026-11-18',
      depositTotal: 100,
      bankCommission: 0,
      brokerCommission: 0,
      availableTotal: 100,
      purchaseAmount: 100,
      purchaseCommission: 0,
      commissionFromResidual: false,
      residualDelta: 0,
      createdAt: now,
    });

    expect(await db.portfolios.count()).toBe(1);
    expect(await db.investments.count()).toBe(1);
  });

  it('accepts balance snapshots after the upgrade', async () => {
    await db.open();
    const now = new Date().toISOString();

    await db.balanceSnapshots.add({
      id: 'snapshot-1',
      portfolioId: 'portfolio-1',
      date: '2026-11-21',
      balance: 150,
      createdAt: now,
      updatedAt: now,
    });

    expect(await db.balanceSnapshots.count()).toBe(1);
  });
});
