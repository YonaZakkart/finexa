import { describe, expect, it } from 'vitest';
import type { Investment, Portfolio } from '@/types';
import {
  selectGlobalInvestmentTotals,
  selectPortfolioInvestments,
  selectPortfolioStatus,
  selectPortfolioTotals,
} from './selectors';

const portfolios: Portfolio[] = [
  {
    id: 'p1',
    name: 'VOO',
    type: 'etf',
    broker: 'Hapi',
    currentBalance: 91,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
  },
  {
    id: 'p2',
    name: 'NVIDIA',
    type: 'stocks',
    broker: 'XTB',
    currentBalance: 200,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
  },
];

const investments: Investment[] = [
  {
    id: 'i1',
    portfolioId: 'p1',
    date: '2026-11-17',
    depositTotal: 60,
    bankCommission: 0.5,
    brokerCommission: 0.2,
    availableTotal: 59.3,
    purchaseAmount: 50,
    purchaseCommission: 0.3,
    commissionFromResidual: false,
    residualDelta: 0.5,
    createdAt: '2026-11-17T10:00:00.000Z',
  },
  {
    id: 'i2',
    portfolioId: 'p1',
    date: '2026-11-18',
    depositTotal: 45,
    bankCommission: 0.5,
    brokerCommission: 0.2,
    availableTotal: 44.3,
    purchaseAmount: 40,
    purchaseCommission: 0.3,
    commissionFromResidual: true,
    residualDelta: -0.5,
    createdAt: '2026-11-18T10:00:00.000Z',
  },
  {
    id: 'i3',
    portfolioId: 'p2',
    date: '2026-11-18',
    depositTotal: 100,
    bankCommission: 0,
    brokerCommission: 0,
    availableTotal: 100,
    purchaseAmount: 100,
    purchaseCommission: 0,
    commissionFromResidual: false,
    residualDelta: 0,
    createdAt: '2026-11-18T11:00:00.000Z',
  },
];

const state = { portfolios, investments };

describe('investment selectors', () => {
  it('filters investments by portfolio and sorts by date descending', () => {
    expect(selectPortfolioInvestments(state, 'p1').map((investment) => investment.id)).toEqual([
      'i2',
      'i1',
    ]);
    expect(selectPortfolioInvestments(state, 'missing')).toEqual([]);
  });

  it('calculates the totals of a portfolio', () => {
    expect(selectPortfolioTotals(state, 'p1')).toEqual({
      investedTotal: 90,
      depositedTotal: 105,
      commissionsTotal: 2,
      residualTotal: 0,
      breakEven: 92,
    });
  });

  it('calculates the status of a portfolio', () => {
    expect(selectPortfolioStatus(state, 'p1')).toBe('yellow');
    expect(selectPortfolioStatus(state, 'p2')).toBe('green');
    expect(selectPortfolioStatus(state, 'missing')).toBe('neutral');
  });

  it('calculates global totals', () => {
    expect(selectGlobalInvestmentTotals(state)).toEqual({
      currentBalance: 291,
      investedTotal: 190,
      depositedTotal: 205,
      commissionsTotal: 2,
      residualTotal: 0,
      breakEven: 192,
    });
  });
});
