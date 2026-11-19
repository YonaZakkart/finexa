import { db } from '@/lib/db';
import { roundMoney } from '@/lib/money';
import { useAppStore } from '@/stores/app.store';
import type { Investment, Portfolio } from '@/types';
import { InvestmentError } from './investments.errors';
import {
  countInvestments,
  createInvestment as createInvestmentRecord,
  createPortfolio as createPortfolioRecord,
  getPortfolio,
  putPortfolio,
} from './investments.repository';
import {
  assertCanUpdateBalance,
  assertValidBalance,
  assertValidInvestment,
  assertValidPortfolio,
  type InvestmentInput,
  type PortfolioInput,
} from './validation';

function normalizePortfolio(input: PortfolioInput): PortfolioInput {
  return {
    ...input,
    name: input.name.trim(),
    broker: input.broker.trim(),
  };
}

function normalizeInvestment(input: InvestmentInput): InvestmentInput {
  return {
    ...input,
    portfolioId: input.portfolioId.trim(),
    depositTotal: roundMoney(input.depositTotal),
    bankCommission: roundMoney(input.bankCommission),
    brokerCommission: roundMoney(input.brokerCommission),
    availableTotal: roundMoney(input.availableTotal),
    purchaseAmount: roundMoney(input.purchaseAmount),
    purchaseCommission: roundMoney(input.purchaseCommission),
    residualDelta: roundMoney(input.residualDelta),
  };
}

export async function createPortfolio(input: PortfolioInput): Promise<Portfolio> {
  const normalized = normalizePortfolio(input);
  assertValidPortfolio(normalized);

  const portfolio = await db.transaction('rw', db.portfolios, () =>
    createPortfolioRecord(normalized)
  );

  await useAppStore.getState().sync();
  return portfolio;
}

export async function updateBalance(portfolioId: string, balance: number): Promise<void> {
  const rounded = roundMoney(balance);
  assertValidBalance(rounded);

  await db.transaction('rw', db.portfolios, db.investments, async () => {
    const portfolio = await getPortfolio(portfolioId);

    if (!portfolio) {
      throw new InvestmentError('portfolioNotFound');
    }

    const investmentCount = await countInvestments(portfolioId);
    assertCanUpdateBalance(investmentCount > 0);

    const now = new Date().toISOString();
    await putPortfolio({
      ...portfolio,
      currentBalance: rounded,
      balanceUpdatedAt: now,
      updatedAt: now,
    });
  });

  await useAppStore.getState().sync();
}

export async function registerInvestment(input: InvestmentInput): Promise<Investment> {
  const normalized = normalizeInvestment(input);
  assertValidInvestment(normalized);

  const investment = await db.transaction('rw', db.portfolios, db.investments, async () => {
    const portfolio = await getPortfolio(normalized.portfolioId);

    if (!portfolio) {
      throw new InvestmentError('portfolioNotFound');
    }

    const created = await createInvestmentRecord(normalized);
    await putPortfolio({ ...portfolio, updatedAt: new Date().toISOString() });
    return created;
  });

  await useAppStore.getState().sync();
  return investment;
}
