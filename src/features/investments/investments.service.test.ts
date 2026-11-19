import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/app.store';
import { createPortfolio, registerInvestment, updateBalance } from './investments.service';
import type { InvestmentInput } from './validation';

const PAST_DATE = '2020-01-15';

function investmentInput(
  portfolioId: string,
  overrides: Partial<InvestmentInput> = {}
): InvestmentInput {
  return {
    portfolioId,
    date: PAST_DATE,
    depositTotal: 100,
    bankCommission: 0.5,
    brokerCommission: 0.2,
    availableTotal: 99.3,
    purchaseAmount: 99,
    purchaseCommission: 0.3,
    commissionFromResidual: false,
    residualDelta: 0,
    ...overrides,
  };
}

beforeEach(async () => {
  useAppStore.getState().reset();
  await db.open();
  await db.transaction(
    'rw',
    db.portfolios,
    db.investments,
    db.transactions,
    db.settings,
    async () => {
      await Promise.all([
        db.portfolios.clear(),
        db.investments.clear(),
        db.transactions.clear(),
        db.settings.clear(),
      ]);
    }
  );
});

afterEach(async () => {
  useAppStore.getState().reset();
  await db.delete();
});

describe('createPortfolio', () => {
  it('trims the name and broker, persists the portfolio and syncs the store', async () => {
    const portfolio = await createPortfolio({
      name: '  VOO  ',
      type: 'etf',
      broker: '  Hapi  ',
    });

    expect(portfolio.name).toBe('VOO');
    expect(portfolio.broker).toBe('Hapi');
    expect(await db.portfolios.count()).toBe(1);
    expect(useAppStore.getState().portfolios).toHaveLength(1);
  });

  it('rejects an invalid portfolio without writing', async () => {
    await expect(
      createPortfolio({ name: '   ', type: 'etf', broker: 'Hapi' })
    ).rejects.toMatchObject({ code: 'invalidPortfolioName' });

    expect(await db.portfolios.count()).toBe(0);
  });
});

describe('updateBalance', () => {
  it('rejects a missing portfolio', async () => {
    await expect(updateBalance('missing', 100)).rejects.toMatchObject({
      code: 'portfolioNotFound',
    });
  });

  it('requires at least one investment', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    await expect(updateBalance(portfolio.id, 100)).rejects.toMatchObject({
      code: 'balanceRequiresInvestment',
    });
  });

  it('rejects a negative balance', async () => {
    await expect(updateBalance('any', -1)).rejects.toMatchObject({ code: 'invalidBalance' });
  });

  it('updates the balance, timestamps and store without touching transactions', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });
    await registerInvestment(investmentInput(portfolio.id));

    await updateBalance(portfolio.id, 150.005);

    const updated = await db.portfolios.get(portfolio.id);

    expect(updated?.currentBalance).toBe(150.01);
    expect(updated?.balanceUpdatedAt).toBeTruthy();
    expect(updated?.updatedAt).toBeTruthy();
    expect(await db.transactions.count()).toBe(0);
    expect(useAppStore.getState().portfolios[0].currentBalance).toBe(150.01);
  });
});

describe('registerInvestment', () => {
  it('rejects a missing portfolio', async () => {
    await expect(registerInvestment(investmentInput('missing'))).rejects.toMatchObject({
      code: 'portfolioNotFound',
    });
  });

  it('rounds amounts, persists the investment and syncs the store', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    const investment = await registerInvestment(
      investmentInput(portfolio.id, { depositTotal: 100.004, bankCommission: 0.004 })
    );

    expect(investment.depositTotal).toBe(100);
    expect(investment.bankCommission).toBe(0);
    expect(await db.investments.count()).toBe(1);
    expect(await db.transactions.count()).toBe(0);
    expect(useAppStore.getState().investments).toHaveLength(1);
  });

  it('rejects a negative residual in available mode without writing', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    await expect(
      registerInvestment(
        investmentInput(portfolio.id, { residualDelta: -0.01, commissionFromResidual: false })
      )
    ).rejects.toMatchObject({ code: 'residualNegativeNotAllowed' });

    expect(await db.investments.count()).toBe(0);
  });

  it('accepts a negative residual when the commission is paid from residual', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    const investment = await registerInvestment(
      investmentInput(portfolio.id, { residualDelta: -0.4, commissionFromResidual: true })
    );

    expect(investment.residualDelta).toBe(-0.4);
    expect(await db.investments.count()).toBe(1);
  });

  it('rejects a purchase above the available total without writing', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    await expect(
      registerInvestment(investmentInput(portfolio.id, { purchaseAmount: 100 }))
    ).rejects.toMatchObject({ code: 'purchaseExceedsAvailable' });

    expect(await db.investments.count()).toBe(0);
  });
});
