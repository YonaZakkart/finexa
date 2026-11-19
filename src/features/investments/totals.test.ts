import { describe, expect, it } from 'vitest';
import type { Investment, Portfolio } from '@/types';
import { calculateGlobalTotals, calculatePortfolioTotals } from './totals';

function makeInvestment(overrides: Partial<Investment> = {}): Investment {
  return {
    id: 'investment-1',
    portfolioId: 'portfolio-1',
    date: '2026-11-18',
    depositTotal: 100,
    bankCommission: 0,
    brokerCommission: 0,
    availableTotal: 100,
    purchaseAmount: 100,
    purchaseCommission: 0,
    commissionFromResidual: false,
    residualDelta: 0,
    createdAt: '2026-11-18T10:00:00.000Z',
    ...overrides,
  };
}

function makePortfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    id: 'portfolio-1',
    name: 'VOO',
    type: 'etf',
    broker: 'Hapi',
    currentBalance: 0,
    createdAt: '2026-11-18T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
    ...overrides,
  };
}

describe('calculatePortfolioTotals', () => {
  it('returns zeros for an empty portfolio', () => {
    expect(calculatePortfolioTotals([])).toEqual({
      investedTotal: 0,
      depositedTotal: 0,
      commissionsTotal: 0,
      residualTotal: 0,
      breakEven: 0,
    });
  });

  it('sums purchases, deposits, commissions and residual', () => {
    const investments = [
      makeInvestment({
        id: 'investment-1',
        purchaseAmount: 99,
        depositTotal: 100,
        bankCommission: 0.5,
        brokerCommission: 0.2,
        purchaseCommission: 0.3,
        residualDelta: 0,
      }),
      makeInvestment({
        id: 'investment-2',
        purchaseAmount: 50,
        depositTotal: 60,
        bankCommission: 0.1,
        brokerCommission: 0.1,
        purchaseCommission: 0.2,
        residualDelta: -0.4,
      }),
    ];

    expect(calculatePortfolioTotals(investments)).toEqual({
      investedTotal: 149,
      depositedTotal: 160,
      commissionsTotal: 1.4,
      residualTotal: -0.4,
      breakEven: 150.4,
    });
  });

  it('rounds totals to two decimals', () => {
    const investments = [
      makeInvestment({ purchaseAmount: 0.1, depositTotal: 0.1 }),
      makeInvestment({ id: 'investment-2', purchaseAmount: 0.2, depositTotal: 0.2 }),
    ];

    expect(calculatePortfolioTotals(investments)).toMatchObject({
      investedTotal: 0.3,
      depositedTotal: 0.3,
      breakEven: 0.3,
    });
  });
});

describe('calculateGlobalTotals', () => {
  it('adds the current balance of every portfolio', () => {
    const portfolios = [
      makePortfolio({ id: 'portfolio-1', currentBalance: 120.5 }),
      makePortfolio({ id: 'portfolio-2', currentBalance: 80.25 }),
    ];
    const investments = [
      makeInvestment({ purchaseAmount: 99, depositTotal: 100, purchaseCommission: 1 }),
    ];

    expect(calculateGlobalTotals(portfolios, investments)).toEqual({
      currentBalance: 200.75,
      investedTotal: 99,
      depositedTotal: 100,
      commissionsTotal: 1,
      residualTotal: 0,
      breakEven: 100,
    });
  });
});
