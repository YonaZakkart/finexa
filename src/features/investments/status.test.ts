import { describe, expect, it } from 'vitest';
import { getPortfolioStatus } from './status';
import type { PortfolioTotals } from './totals';

function totals(investedTotal: number, commissionsTotal: number): PortfolioTotals {
  return {
    investedTotal,
    depositedTotal: investedTotal,
    commissionsTotal,
    residualTotal: 0,
    breakEven: investedTotal + commissionsTotal,
  };
}

describe('getPortfolioStatus', () => {
  it('returns neutral when the portfolio has no investments', () => {
    expect(getPortfolioStatus(500, totals(0, 0), false)).toBe('neutral');
  });

  it('returns red below the invested total', () => {
    expect(getPortfolioStatus(99.99, totals(100, 2), true)).toBe('red');
  });

  it('returns yellow at the invested total', () => {
    expect(getPortfolioStatus(100, totals(100, 2), true)).toBe('yellow');
  });

  it('returns yellow between the invested total and the break-even point', () => {
    expect(getPortfolioStatus(101, totals(100, 2), true)).toBe('yellow');
  });

  it('returns yellow at the break-even point', () => {
    expect(getPortfolioStatus(102, totals(100, 2), true)).toBe('yellow');
  });

  it('returns green above the break-even point', () => {
    expect(getPortfolioStatus(102.01, totals(100, 2), true)).toBe('green');
  });

  it('compares boundaries in cents', () => {
    expect(getPortfolioStatus(0.3, totals(0.1 + 0.2, 0), true)).toBe('yellow');
    expect(getPortfolioStatus(0.31, totals(0.1 + 0.2, 0), true)).toBe('green');
    expect(getPortfolioStatus(0.29, totals(0.1 + 0.2, 0), true)).toBe('red');
  });

  it('handles portfolios without commissions', () => {
    expect(getPortfolioStatus(100, totals(100, 0), true)).toBe('yellow');
    expect(getPortfolioStatus(100.01, totals(100, 0), true)).toBe('green');
    expect(getPortfolioStatus(99.99, totals(100, 0), true)).toBe('red');
  });
});
