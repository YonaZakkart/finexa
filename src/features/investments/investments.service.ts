import { assertValidTransaction } from '@/features/balance/validation';
import { createTransaction } from '@/features/transactions/transactions.repository';
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
  updateInvestment,
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

export async function updatePortfolio(id: string, input: PortfolioInput): Promise<void> {
  const normalized = normalizePortfolio(input);
  assertValidPortfolio(normalized);

  await db.transaction('rw', db.portfolios, async () => {
    const portfolio = await getPortfolio(id);

    if (!portfolio) {
      throw new InvestmentError('portfolioNotFound');
    }

    await putPortfolio({
      ...portfolio,
      ...normalized,
      updatedAt: new Date().toISOString(),
    });
  });

  await useAppStore.getState().sync();
}

export async function deletePortfolio(id: string, affectsBalance: boolean): Promise<void> {
  await db.transaction('rw', db.portfolios, db.investments, db.transactions, async () => {
    const portfolio = await getPortfolio(id);

    if (!portfolio) {
      throw new InvestmentError('portfolioNotFound');
    }

    const investments = await db.investments.where('portfolioId').equals(id).toArray();
    const transactionIds = investments
      .map((investment) => investment.transactionId)
      .filter((transactionId): transactionId is string => Boolean(transactionId));

    await db.investments.bulkDelete(investments.map((investment) => investment.id));

    if (transactionIds.length > 0) {
      if (affectsBalance) {
        await db.transactions.bulkDelete(transactionIds);
      } else {
        await db.transactions
          .where('id')
          .anyOf(transactionIds)
          .modify((transaction) => {
            delete transaction.relatedInvestmentId;
            delete transaction.relatedPortfolioId;
          });
      }
    }

    await db.portfolios.delete(id);
  });

  await useAppStore.getState().sync();
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

  const investment = await db.transaction(
    'rw',
    db.portfolios,
    db.investments,
    db.transactions,
    async () => {
      const portfolio = await getPortfolio(normalized.portfolioId);

      if (!portfolio) {
        throw new InvestmentError('portfolioNotFound');
      }

      const created = await createInvestmentRecord(normalized);
      const transactionInput = {
        type: 'investment' as const,
        direction: 'debit' as const,
        amount: normalized.depositTotal,
        date: normalized.date,
      };
      assertValidTransaction(transactionInput);
      const transaction = await createTransaction({
        ...transactionInput,
        type: 'investment',
        direction: 'debit',
        amount: normalized.depositTotal,
        date: normalized.date,
        relatedInvestmentId: created.id,
        relatedPortfolioId: portfolio.id,
        source: 'system',
      });
      await updateInvestment(created.id, { transactionId: transaction.id });
      await putPortfolio({ ...portfolio, updatedAt: new Date().toISOString() });
      return { ...created, transactionId: transaction.id };
    }
  );

  await useAppStore.getState().sync();
  return investment;
}

export async function deleteInvestment(id: string, affectsBalance: boolean): Promise<void> {
  await db.transaction('rw', db.portfolios, db.investments, db.transactions, async () => {
    const investment = await db.investments.get(id);

    if (!investment) {
      throw new InvestmentError('investmentNotFound');
    }

    const portfolio = await getPortfolio(investment.portfolioId);
    await db.investments.delete(id);

    if (affectsBalance && investment.transactionId) {
      await db.transactions.delete(investment.transactionId);
    }

    if (portfolio) {
      await putPortfolio({ ...portfolio, updatedAt: new Date().toISOString() });
    }
  });

  await useAppStore.getState().sync();
}

export async function editInvestment(
  id: string,
  input: InvestmentInput,
  affectsBalance: boolean
): Promise<void> {
  const normalized = normalizeInvestment(input);
  assertValidInvestment(normalized);

  await db.transaction('rw', db.portfolios, db.investments, db.transactions, async () => {
    const existing = await db.investments.get(id);

    if (!existing) {
      throw new InvestmentError('investmentNotFound');
    }

    const portfolio = await getPortfolio(existing.portfolioId);

    await updateInvestment(id, {
      ...normalized,
      portfolioId: existing.portfolioId,
      transactionId: existing.transactionId,
    });

    if (affectsBalance && existing.transactionId) {
      await db.transactions.update(existing.transactionId, {
        amount: normalized.depositTotal,
        date: normalized.date,
      });
    }

    if (portfolio) {
      await putPortfolio({ ...portfolio, updatedAt: new Date().toISOString() });
    }
  });

  await useAppStore.getState().sync();
}
