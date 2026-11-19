import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import type { Investment, Portfolio } from '@/types';

const portfolio: Portfolio = {
  id: 'portfolio-1',
  name: 'VOO',
  type: 'etf',
  broker: 'Hapi',
  currentBalance: 0,
  createdAt: '2026-11-18T10:00:00.000Z',
  updatedAt: '2026-11-18T10:00:00.000Z',
};

const investment: Investment = {
  id: 'investment-1',
  portfolioId: portfolio.id,
  date: '2026-11-18',
  depositTotal: 100,
  bankCommission: 0.5,
  brokerCommission: 0.2,
  availableTotal: 99.3,
  purchaseAmount: 99,
  purchaseCommission: 0.3,
  commissionFromResidual: false,
  residualDelta: 0,
  createdAt: '2026-11-18T10:05:00.000Z',
};

beforeEach(async () => {
  await db.open();
  await db.transaction('rw', db.portfolios, db.investments, async () => {
    await Promise.all([db.portfolios.clear(), db.investments.clear()]);
  });
});

afterEach(async () => {
  await db.delete();
});

describe('investment tables', () => {
  it('stores portfolios and investments with their fields intact', async () => {
    await db.portfolios.add(portfolio);
    await db.investments.add(investment);

    expect(await db.portfolios.get(portfolio.id)).toEqual(portfolio);
    expect(await db.investments.get(investment.id)).toEqual(investment);
  });

  it('queries investments by portfolio and by the compound index', async () => {
    await db.portfolios.add(portfolio);
    await db.investments.bulkAdd([
      investment,
      {
        ...investment,
        id: 'investment-2',
        date: '2026-11-19',
        createdAt: '2026-11-19T10:00:00.000Z',
      },
    ]);

    expect(await db.investments.where('portfolioId').equals(portfolio.id).count()).toBe(2);

    const rows = await db.investments
      .where('[portfolioId+date]')
      .equals([portfolio.id, '2026-11-18'])
      .toArray();

    expect(rows.map((row) => row.id)).toEqual(['investment-1']);
  });
});
