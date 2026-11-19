export type InvestmentErrorCode =
  | 'portfolioNotFound'
  | 'missingPortfolioId'
  | 'invalidPortfolioName'
  | 'invalidPortfolioBroker'
  | 'invalidPortfolioType'
  | 'invalidInvestmentDate'
  | 'invalidDeposit'
  | 'invalidCommission'
  | 'invalidAvailableTotal'
  | 'invalidPurchase'
  | 'purchaseExceedsAvailable'
  | 'invalidResidual'
  | 'residualNegativeNotAllowed'
  | 'invalidNote'
  | 'balanceRequiresInvestment'
  | 'invalidBalance';

export class InvestmentError extends Error {
  readonly code: InvestmentErrorCode;

  constructor(code: InvestmentErrorCode) {
    super(code);
    this.name = 'InvestmentError';
    this.code = code;
  }
}
