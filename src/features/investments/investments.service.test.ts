import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/app.store';
import { InvestmentError } from './investments.errors';
import {
  createPortfolio,
  deletePortfolio,
  editInvestment,
  registerInvestment,
  updateBalance,
  updatePortfolio,
} from './investments.service';
import { getPortfolioStatus } from './status';
import { calculatePortfolioTotals } from './totals';
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

describe('updatePortfolio', () => {
  it('updates the name, type and broker while keeping the balance and creation date', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });
    await db.portfolios.update(portfolio.id, { currentBalance: 120 });

    await updatePortfolio(portfolio.id, { name: '  NVIDIA  ', type: 'stocks', broker: ' XTB ' });

    const stored = await db.portfolios.get(portfolio.id);

    expect(stored).toMatchObject({
      name: 'NVIDIA',
      type: 'stocks',
      broker: 'XTB',
      currentBalance: 120,
      createdAt: portfolio.createdAt,
    });
    expect(stored?.updatedAt).not.toBe(portfolio.updatedAt);
    expect(useAppStore.getState().portfolios[0]).toMatchObject({ name: 'NVIDIA' });
  });

  it('rejects an invalid portfolio without writing', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    await expect(
      updatePortfolio(portfolio.id, { name: '   ', type: 'etf', broker: 'Hapi' })
    ).rejects.toThrow(InvestmentError);

    expect((await db.portfolios.get(portfolio.id))?.name).toBe('VOO');
  });

  it('rejects a missing portfolio', async () => {
    await expect(
      updatePortfolio('missing', { name: 'VOO', type: 'etf', broker: 'Hapi' })
    ).rejects.toThrow(InvestmentError);
  });
});

describe('deletePortfolio', () => {
  it('rejects a missing portfolio', async () => {
    await expect(deletePortfolio('missing', true)).rejects.toThrow(InvestmentError);
  });

  it('deletes the portfolio, its investments and their balance outflows', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });
    await registerInvestment(investmentInput(portfolio.id));

    await deletePortfolio(portfolio.id, true);

    expect(await db.portfolios.count()).toBe(0);
    expect(await db.investments.count()).toBe(0);
    expect(await db.transactions.count()).toBe(0);
    expect(useAppStore.getState().portfolios).toHaveLength(0);
    expect(useAppStore.getState().transactions).toHaveLength(0);
  });

  it('keeps the balance outflow as a generic movement when not reverting it', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });
    const investment = await registerInvestment(investmentInput(portfolio.id));

    await deletePortfolio(portfolio.id, false);

    const transactions = await db.transactions.toArray();

    expect(await db.portfolios.count()).toBe(0);
    expect(await db.investments.count()).toBe(0);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].id).toBe(investment.transactionId);
    expect(transactions[0].relatedInvestmentId).toBeUndefined();
    expect(transactions[0].relatedPortfolioId).toBeUndefined();
    expect(useAppStore.getState().transactions).toHaveLength(1);
  });

  it('does not touch transactions of other portfolios', async () => {
    const keep = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });
    const remove = await createPortfolio({ name: 'BTC', type: 'crypto', broker: 'Binance' });
    await registerInvestment(investmentInput(keep.id));
    await registerInvestment(investmentInput(remove.id));

    await deletePortfolio(remove.id, true);

    const transactions = await db.transactions.toArray();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].relatedPortfolioId).toBe(keep.id);
    expect(await db.portfolios.count()).toBe(1);
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

  it('keeps the portfolio unchanged when the balance is invalid', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });
    await registerInvestment(investmentInput(portfolio.id));

    await expect(updateBalance(portfolio.id, -1)).rejects.toMatchObject({
      code: 'invalidBalance',
    });

    const stored = await db.portfolios.get(portfolio.id);

    expect(stored?.currentBalance).toBe(0);
    expect(stored?.balanceUpdatedAt).toBeUndefined();
  });

  it('updates the balance, timestamps and store without touching transactions', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });
    await registerInvestment(investmentInput(portfolio.id));

    await updateBalance(portfolio.id, 150.005);

    const updated = await db.portfolios.get(portfolio.id);

    expect(updated?.currentBalance).toBe(150.01);
    expect(updated?.balanceUpdatedAt).toBeTruthy();
    expect(updated?.updatedAt).toBeTruthy();
    expect(await db.transactions.count()).toBe(1);
    expect(useAppStore.getState().portfolios[0].currentBalance).toBe(150.01);
  });
});

describe('registerInvestment', () => {
  it('rejects a missing portfolio', async () => {
    await expect(registerInvestment(investmentInput('missing'))).rejects.toMatchObject({
      code: 'portfolioNotFound',
    });
  });

  it('trims the portfolio id before persisting', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    const investment = await registerInvestment(investmentInput(`  ${portfolio.id}  `));

    expect(investment.portfolioId).toBe(portfolio.id);
  });

  it('rounds amounts, persists the investment and syncs the store', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    const investment = await registerInvestment(
      investmentInput(portfolio.id, { depositTotal: 100.004, bankCommission: 0.004 })
    );

    expect(investment.depositTotal).toBe(100);
    expect(investment.bankCommission).toBe(0);
    expect(await db.investments.count()).toBe(1);
    expect(await db.transactions.count()).toBe(1);
    expect(investment.transactionId).toBeTruthy();
    const outflow = await db.transactions.get(investment.transactionId ?? '');
    expect(outflow).toMatchObject({
      type: 'investment',
      direction: 'debit',
      amount: 100,
      relatedInvestmentId: investment.id,
    });
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
    expect(await db.transactions.count()).toBe(1);
  });

  it('supports the full portfolio flow and derived totals', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    await registerInvestment(
      investmentInput(portfolio.id, {
        depositTotal: 100,
        bankCommission: 0.5,
        brokerCommission: 0.2,
        availableTotal: 99.3,
        purchaseAmount: 99,
        purchaseCommission: 0.3,
        residualDelta: 0,
      })
    );
    await registerInvestment(
      investmentInput(portfolio.id, {
        date: '2020-01-16',
        depositTotal: 50,
        bankCommission: 0,
        brokerCommission: 0,
        availableTotal: 50,
        purchaseAmount: 50,
        purchaseCommission: 0.5,
        commissionFromResidual: true,
        residualDelta: -0.5,
      })
    );
    await updateBalance(portfolio.id, 160);

    const investments = await db.investments.where('portfolioId').equals(portfolio.id).toArray();
    const totals = calculatePortfolioTotals(investments);

    expect(totals).toMatchObject({
      investedTotal: 149,
      depositedTotal: 150,
      commissionsTotal: 1.5,
      residualTotal: -0.5,
      breakEven: 150.5,
    });
    expect(getPortfolioStatus(160, totals, true)).toBe('green');
    expect(useAppStore.getState().portfolios[0].currentBalance).toBe(160);
  });

  it('edits an investment and updates the linked outflow only when requested', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });
    const created = await registerInvestment(
      investmentInput(portfolio.id, {
        depositTotal: 100,
        availableTotal: 100,
        purchaseAmount: 100,
        purchaseCommission: 0,
      })
    );

    await editInvestment(
      created.id,
      investmentInput(portfolio.id, {
        depositTotal: 200,
        availableTotal: 200,
        purchaseAmount: 150,
        purchaseCommission: 0,
      }),
      true
    );

    const updated = await db.investments.get(created.id);
    expect(updated?.depositTotal).toBe(200);
    expect((await db.transactions.get(created.transactionId ?? ''))?.amount).toBe(200);

    await editInvestment(
      created.id,
      investmentInput(portfolio.id, {
        depositTotal: 300,
        availableTotal: 300,
        purchaseAmount: 150,
        purchaseCommission: 0,
      }),
      false
    );

    expect((await db.transactions.get(created.transactionId ?? ''))?.amount).toBe(200);
  });

  it('rejects a purchase above the available total without writing', async () => {
    const portfolio = await createPortfolio({ name: 'VOO', type: 'etf', broker: 'Hapi' });

    await expect(
      registerInvestment(investmentInput(portfolio.id, { purchaseAmount: 100 }))
    ).rejects.toMatchObject({ code: 'purchaseExceedsAvailable' });

    expect(await db.investments.count()).toBe(0);
  });
});
