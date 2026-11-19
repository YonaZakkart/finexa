import {
  calculateBalance,
  calculateNetBalance,
  calculateTotalDebt,
} from '@/features/balance/balance';
import { getPortfolioStatus, type PortfolioStatus } from '@/features/investments/status';
import {
  calculateGlobalTotals,
  calculatePortfolioTotals,
  type GlobalInvestmentTotals,
  type PortfolioTotals,
} from '@/features/investments/totals';
import type { Debt, Investment, Portfolio, Transaction } from '@/types';

interface BalanceState {
  transactions: Transaction[];
  debts: Debt[];
}

interface InvestmentState {
  portfolios: Portfolio[];
  investments: Investment[];
}

export function selectBalance(state: BalanceState): number {
  return calculateBalance(state.transactions);
}

export function selectTotalDebt(state: BalanceState): number {
  return calculateTotalDebt(state.debts);
}

export function selectNetBalance(state: BalanceState): number {
  return calculateNetBalance(selectBalance(state), selectTotalDebt(state));
}

export function selectPortfolioInvestments(
  state: InvestmentState,
  portfolioId: string
): Investment[] {
  return state.investments
    .filter((investment) => investment.portfolioId === portfolioId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function selectPortfolioTotals(
  state: InvestmentState,
  portfolioId: string
): PortfolioTotals {
  return calculatePortfolioTotals(selectPortfolioInvestments(state, portfolioId));
}

export function selectPortfolioStatus(
  state: InvestmentState,
  portfolioId: string
): PortfolioStatus {
  const investments = selectPortfolioInvestments(state, portfolioId);
  const portfolio = state.portfolios.find((item) => item.id === portfolioId);

  return getPortfolioStatus(
    portfolio?.currentBalance ?? 0,
    calculatePortfolioTotals(investments),
    investments.length > 0
  );
}

export function selectGlobalInvestmentTotals(state: InvestmentState): GlobalInvestmentTotals {
  return calculateGlobalTotals(state.portfolios, state.investments);
}
