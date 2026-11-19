import { toCents } from '@/lib/money';
import type { PortfolioTotals } from './totals';

export type PortfolioStatus = 'neutral' | 'red' | 'yellow' | 'green';

export function getPortfolioStatus(
  currentBalance: number,
  totals: PortfolioTotals,
  hasInvestments: boolean
): PortfolioStatus {
  if (!hasInvestments) {
    return 'neutral';
  }

  const balance = toCents(currentBalance);
  const invested = toCents(totals.investedTotal);
  const breakEven = toCents(totals.breakEven);

  if (balance < invested) {
    return 'red';
  }

  if (balance <= breakEven) {
    return 'yellow';
  }

  return 'green';
}
