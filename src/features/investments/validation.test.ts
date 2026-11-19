import { describe, expect, it } from 'vitest';
import type { PortfolioType } from '@/types';
import { InvestmentError, type InvestmentErrorCode } from './investments.errors';
import {
  assertCanUpdateBalance,
  assertValidBalance,
  assertValidInvestment,
  assertValidPortfolio,
  type InvestmentInput,
  type PortfolioInput,
} from './validation';

const TODAY = '2026-11-18';

const portfolio: PortfolioInput = {
  name: 'VOO',
  type: 'etf',
  broker: 'Hapi',
};

const investment: InvestmentInput = {
  portfolioId: 'portfolio-1',
  date: TODAY,
  depositTotal: 100,
  bankCommission: 0.5,
  brokerCommission: 0.2,
  availableTotal: 99.3,
  purchaseAmount: 99,
  purchaseCommission: 0.3,
  commissionFromResidual: false,
  residualDelta: 0,
  note: 'Compra mensual',
};

function expectCode(fn: () => void, code: InvestmentErrorCode): void {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(InvestmentError);
    expect((error as InvestmentError).code).toBe(code);
    return;
  }

  throw new Error(`Expected InvestmentError with code ${code}`);
}

describe('assertValidPortfolio', () => {
  it('accepts a valid portfolio', () => {
    expect(() => assertValidPortfolio(portfolio)).not.toThrow();
  });

  it('rejects an empty or too long name', () => {
    expectCode(() => assertValidPortfolio({ ...portfolio, name: '   ' }), 'invalidPortfolioName');
    expectCode(
      () => assertValidPortfolio({ ...portfolio, name: 'a'.repeat(61) }),
      'invalidPortfolioName'
    );
  });

  it('rejects an empty or too long broker', () => {
    expectCode(() => assertValidPortfolio({ ...portfolio, broker: ' ' }), 'invalidPortfolioBroker');
    expectCode(
      () => assertValidPortfolio({ ...portfolio, broker: 'a'.repeat(41) }),
      'invalidPortfolioBroker'
    );
  });

  it('rejects an unknown type', () => {
    expectCode(
      () => assertValidPortfolio({ ...portfolio, type: 'invalid' as PortfolioType }),
      'invalidPortfolioType'
    );
  });
});

describe('assertValidInvestment', () => {
  it('accepts a valid investment', () => {
    expect(() => assertValidInvestment(investment, TODAY)).not.toThrow();
  });

  it('rejects a missing portfolio id', () => {
    expectCode(
      () => assertValidInvestment({ ...investment, portfolioId: '  ' }, TODAY),
      'missingPortfolioId'
    );
  });

  it('rejects invalid and future dates', () => {
    expectCode(
      () => assertValidInvestment({ ...investment, date: '2026-02-30' }, TODAY),
      'invalidInvestmentDate'
    );
    expectCode(
      () => assertValidInvestment({ ...investment, date: '2026-11-19' }, TODAY),
      'invalidInvestmentDate'
    );
  });

  it('rejects a zero or negative deposit', () => {
    expectCode(
      () => assertValidInvestment({ ...investment, depositTotal: 0 }, TODAY),
      'invalidDeposit'
    );
    expectCode(
      () => assertValidInvestment({ ...investment, depositTotal: -1 }, TODAY),
      'invalidDeposit'
    );
  });

  it('rejects negative commissions', () => {
    expectCode(
      () => assertValidInvestment({ ...investment, bankCommission: -0.01 }, TODAY),
      'invalidCommission'
    );
    expectCode(
      () => assertValidInvestment({ ...investment, brokerCommission: -0.01 }, TODAY),
      'invalidCommission'
    );
    expectCode(
      () => assertValidInvestment({ ...investment, purchaseCommission: -0.01 }, TODAY),
      'invalidCommission'
    );
  });

  it('rejects a negative available total', () => {
    expectCode(
      () => assertValidInvestment({ ...investment, availableTotal: -0.01 }, TODAY),
      'invalidAvailableTotal'
    );
  });

  it('rejects a negative purchase and a purchase above the available total', () => {
    expectCode(
      () => assertValidInvestment({ ...investment, purchaseAmount: -0.01 }, TODAY),
      'invalidPurchase'
    );
    expectCode(
      () => assertValidInvestment({ ...investment, purchaseAmount: 100 }, TODAY),
      'purchaseExceedsAvailable'
    );
  });

  it('rejects a non-finite residual', () => {
    expectCode(
      () => assertValidInvestment({ ...investment, residualDelta: Number.NaN }, TODAY),
      'invalidResidual'
    );
  });

  it('rejects a negative residual when the commission is not paid from residual', () => {
    expectCode(
      () =>
        assertValidInvestment(
          { ...investment, residualDelta: -0.01, commissionFromResidual: false },
          TODAY
        ),
      'residualNegativeNotAllowed'
    );
  });

  it('allows a negative residual when the commission is paid from residual', () => {
    expect(() =>
      assertValidInvestment(
        { ...investment, residualDelta: -0.01, commissionFromResidual: true },
        TODAY
      )
    ).not.toThrow();
  });

  it('rejects a note longer than 280 characters', () => {
    expectCode(
      () => assertValidInvestment({ ...investment, note: 'a'.repeat(281) }, TODAY),
      'invalidNote'
    );
  });

  it('accepts amounts that round to zero decimals', () => {
    expect(() =>
      assertValidInvestment({ ...investment, depositTotal: 0.005 }, TODAY)
    ).not.toThrow();
    expectCode(
      () => assertValidInvestment({ ...investment, depositTotal: 0.004 }, TODAY),
      'invalidDeposit'
    );
  });
});

describe('balance validation', () => {
  it('accepts zero and positive balances', () => {
    expect(() => assertValidBalance(0)).not.toThrow();
    expect(() => assertValidBalance(100)).not.toThrow();
  });

  it('rejects negative and non-finite balances', () => {
    expectCode(() => assertValidBalance(-0.01), 'invalidBalance');
    expectCode(() => assertValidBalance(Number.NaN), 'invalidBalance');
  });

  it('requires at least one investment before updating the balance', () => {
    expectCode(() => assertCanUpdateBalance(false), 'balanceRequiresInvestment');
    expect(() => assertCanUpdateBalance(true)).not.toThrow();
  });
});
