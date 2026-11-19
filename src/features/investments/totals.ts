import { roundMoney } from '@/lib/money';
import type { Investment, Portfolio } from '@/types';

export interface PortfolioTotals {
  investedTotal: number;
  depositedTotal: number;
  commissionsTotal: number;
  residualTotal: number;
  breakEven: number;
}

export interface GlobalInvestmentTotals extends PortfolioTotals {
  currentBalance: number;
}

export function calculatePortfolioTotals(investments: Investment[]): PortfolioTotals {
  const investedTotal = roundMoney(
    investments.reduce((sum, investment) => sum + investment.purchaseAmount, 0)
  );
  const depositedTotal = roundMoney(
    investments.reduce((sum, investment) => sum + investment.depositTotal, 0)
  );
  const commissionsTotal = roundMoney(
    investments.reduce(
      (sum, investment) =>
        sum +
        investment.bankCommission +
        investment.brokerCommission +
        investment.purchaseCommission,
      0
    )
  );
  const residualTotal = roundMoney(
    investments.reduce((sum, investment) => sum + investment.residualDelta, 0)
  );

  return {
    investedTotal,
    depositedTotal,
    commissionsTotal,
    residualTotal,
    breakEven: roundMoney(investedTotal + commissionsTotal),
  };
}

export function calculateGlobalTotals(
  portfolios: Portfolio[],
  investments: Investment[]
): GlobalInvestmentTotals {
  return {
    ...calculatePortfolioTotals(investments),
    currentBalance: roundMoney(
      portfolios.reduce((sum, portfolio) => sum + portfolio.currentBalance, 0)
    ),
  };
}
