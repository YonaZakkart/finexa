import Dexie from 'dexie';
import { db } from '@/lib/db';
import type { Investment, Portfolio } from '@/types';

export type NewPortfolio = Pick<Portfolio, 'name' | 'type' | 'broker'>;
export type NewInvestment = Omit<Investment, 'id' | 'createdAt'>;

export async function createPortfolio(input: NewPortfolio): Promise<Portfolio> {
  const now = new Date().toISOString();
  const portfolio: Portfolio = {
    ...input,
    id: crypto.randomUUID(),
    currentBalance: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.portfolios.add(portfolio);
  return portfolio;
}

export async function getPortfolio(id: string): Promise<Portfolio | undefined> {
  return db.portfolios.get(id);
}

export async function listPortfolios(): Promise<Portfolio[]> {
  const rows = await db.portfolios.toArray();
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export async function putPortfolio(portfolio: Portfolio): Promise<void> {
  await db.portfolios.put(portfolio);
}

export async function createInvestment(input: NewInvestment): Promise<Investment> {
  const investment: Investment = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  await db.investments.add(investment);
  return investment;
}

export async function updateInvestment(
  id: string,
  patch: Partial<Omit<Investment, 'id' | 'createdAt'>>
): Promise<void> {
  await db.investments.update(id, patch);
}

export async function listInvestments(portfolioId: string): Promise<Investment[]> {
  const rows = await db.investments
    .where('[portfolioId+date]')
    .between([portfolioId, Dexie.minKey], [portfolioId, Dexie.maxKey])
    .toArray();

  return rows.sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)
  );
}

export async function countInvestments(portfolioId: string): Promise<number> {
  return db.investments.where('portfolioId').equals(portfolioId).count();
}
