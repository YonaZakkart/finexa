export type TransactionErrorCode =
  | 'invalidAmount'
  | 'invalidDate'
  | 'invalidNote'
  | 'invalidDirection'
  | 'missingCategory'
  | 'unknownCategory'
  | 'missingSubcategory'
  | 'unknownSubcategory'
  | 'missingDebtId'
  | 'debtNotFound'
  | 'debtAlreadyPaid'
  | 'transactionNotFound'
  | 'notAnExpense'
  | 'initialBalanceExists';

export class TransactionError extends Error {
  readonly code: TransactionErrorCode;

  constructor(code: TransactionErrorCode) {
    super(code);
    this.name = 'TransactionError';
    this.code = code;
  }
}
