import { getLocalDateString, isValidLocalDate } from '@/lib/date';
import { toCents } from '@/lib/money';
import type { Investment, Portfolio, PortfolioType } from '@/types';
import { InvestmentError, type InvestmentErrorCode } from './investments.errors';

export const PORTFOLIO_TYPES: readonly PortfolioType[] = [
  'stocks',
  'etf',
  'crypto',
  'funds',
  'bonds',
  'other',
];

export const MAX_PORTFOLIO_NAME_LENGTH = 60;
export const MAX_BROKER_LENGTH = 40;
export const MAX_INVESTMENT_NOTE_LENGTH = 280;

export type PortfolioInput = Pick<Portfolio, 'name' | 'type' | 'broker'>;

export type InvestmentInput = Pick<
  Investment,
  | 'portfolioId'
  | 'date'
  | 'depositTotal'
  | 'bankCommission'
  | 'brokerCommission'
  | 'availableTotal'
  | 'purchaseAmount'
  | 'purchaseCommission'
  | 'commissionFromResidual'
  | 'residualDelta'
  | 'note'
>;

function assertNonNegativeMoney(value: number, code: InvestmentErrorCode): void {
  if (!Number.isFinite(value) || toCents(value) < 0) {
    throw new InvestmentError(code);
  }
}

export function assertValidPortfolio(input: PortfolioInput): void {
  const name = input.name.trim();

  if (name.length === 0 || name.length > MAX_PORTFOLIO_NAME_LENGTH) {
    throw new InvestmentError('invalidPortfolioName');
  }

  if (!PORTFOLIO_TYPES.includes(input.type)) {
    throw new InvestmentError('invalidPortfolioType');
  }

  const broker = input.broker.trim();

  if (broker.length === 0 || broker.length > MAX_BROKER_LENGTH) {
    throw new InvestmentError('invalidPortfolioBroker');
  }
}

export function assertValidInvestment(input: InvestmentInput, today = getLocalDateString()): void {
  if (input.portfolioId.trim().length === 0) {
    throw new InvestmentError('missingPortfolioId');
  }

  if (!isValidLocalDate(input.date) || input.date > today) {
    throw new InvestmentError('invalidInvestmentDate');
  }

  if (!Number.isFinite(input.depositTotal) || toCents(input.depositTotal) <= 0) {
    throw new InvestmentError('invalidDeposit');
  }

  assertNonNegativeMoney(input.bankCommission, 'invalidCommission');
  assertNonNegativeMoney(input.brokerCommission, 'invalidCommission');
  assertNonNegativeMoney(input.purchaseCommission, 'invalidCommission');
  assertNonNegativeMoney(input.availableTotal, 'invalidAvailableTotal');
  assertNonNegativeMoney(input.purchaseAmount, 'invalidPurchase');

  if (toCents(input.purchaseAmount) > toCents(input.availableTotal)) {
    throw new InvestmentError('purchaseExceedsAvailable');
  }

  if (!Number.isFinite(input.residualDelta)) {
    throw new InvestmentError('invalidResidual');
  }

  if (!input.commissionFromResidual && toCents(input.residualDelta) < 0) {
    throw new InvestmentError('residualNegativeNotAllowed');
  }

  if (input.note && input.note.length > MAX_INVESTMENT_NOTE_LENGTH) {
    throw new InvestmentError('invalidNote');
  }
}

export function assertValidBalance(balance: number): void {
  if (!Number.isFinite(balance) || toCents(balance) < 0) {
    throw new InvestmentError('invalidBalance');
  }
}

export function assertCanUpdateBalance(hasInvestments: boolean): void {
  if (!hasInvestments) {
    throw new InvestmentError('balanceRequiresInvestment');
  }
}
