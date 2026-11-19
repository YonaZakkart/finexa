import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import {
  countInvestments,
  createInvestment,
  createPortfolio,
  getPortfolio,
  listInvestments,
  listPortfolios,
  type NewInvestment,
  putPortfolio,
} from './investments.repository';

function investmentInput(
  portfolioId: string,
  overrides: Partial<NewInvestment> = {}
): NewInvestment {
  return {
    portfolioId,
    date: '2026-11-18',
    depositTotal: 100,
    bankCommission: 0,
    brokerCommission: 0,
    availableTotal: 100,
    purchaseAmount: 100,
    purchaseCommission: 0,
    commissionFromResidual: false,
    residualDelta: 0,
    ...overrides,
  };
}

beforeEach(async () => {
  await db.open();
  await db.transaction('rw', db.portfolios, db.investments, async () => {
    await Promise.all([db.portfolios.clear(), db.investments.clear()]);
  });
});

afterEach(async () => {
  await db.delete();
});

describe('investments repository', () => {
  it('creates a portfolio with default balance and timestamps', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    expect(portfolio.id).toBeTruthy();
    expect(portfolio.currentBalance).toBe(0);
    expect(portfolio.balanceUpdatedAt).toBeUndefined();
    expect(portfolio.createdAt).toBeTruthy();
    expect(portfolio.updatedAt).toBe(portfolio.createdAt);
    expect(await getPortfolio(portfolio.id)).toEqual(portfolio);
  });

  it('lists portfolios sorted by name', async () => {
    await createPortfolio({ name: 'NVIDIA', type: 'stocks', broker: 'XTB' });
    await createPortfolio({ name: 'Apple', type: 'stocks', broker: 'Hapi' });

    const rows = await listPortfolios();

    expect(rows.map((portfolio) => portfolio.name)).toEqual(['Apple', 'NVIDIA']);
  });

  it('updates a portfolio', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    await putPortfolio({
      ...portfolio,
      currentBalance: 150,
      balanceUpdatedAt: '2026-11-18T12:00:00.000Z',
    });

    expect((await getPortfolio(portfolio.id))?.currentBalance).toBe(150);
  });

  it('creates investments and lists them by date descending', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });
    const older = await createInvestment(investmentInput(portfolio.id, { date: '2026-11-17' }));
    const newer = await createInvestment(investmentInput(portfolio.id, { date: '2026-11-18' }));

    expect(older.id).toBeTruthy();
    expect(older.createdAt).toBeTruthy();

    const rows = await listInvestments(portfolio.id);

    expect(rows.map((investment) => investment.id)).toEqual([newer.id, older.id]);
  });

  it('counts investments per portfolio', async () => {
    const first = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });
    const second = await createPortfolio({ name: 'NVIDIA', type: 'stocks', broker: 'XTB' });

    await createInvestment(investmentInput(first.id));
    await createInvestment(investmentInput(first.id, { date: '2026-11-19' }));
    await createInvestment(investmentInput(second.id));

    expect(await countInvestments(first.id)).toBe(2);
    expect(await countInvestments(second.id)).toBe(1);
    expect(await countInvestments('missing')).toBe(0);
  });

  it('lists only the investments of the requested portfolio', async () => {
    const first = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });
    const second = await createPortfolio({ name: 'NVIDIA', type: 'stocks', broker: 'XTB' });

    await createInvestment(investmentInput(first.id));
    await createInvestment(investmentInput(second.id));

    const rows = await listInvestments(first.id);

    expect(rows).toHaveLength(1);
    expect(rows[0].portfolioId).toBe(first.id);
  });
});
