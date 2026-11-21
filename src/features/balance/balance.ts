import { roundMoney } from '@/lib/money';
import type { Debt, Transaction } from '@/types';

export function getTransactionEffect(transaction: Transaction): number {
  if (transaction.affectsBalance === false) {
    return 0;
  }

  return transaction.direction === 'credit' ? transaction.amount : -transaction.amount;
}

export function calculateBalance(transactions: Transaction[]): number {
  return roundMoney(
    transactions.reduce((sum, transaction) => sum + getTransactionEffect(transaction), 0)
  );
}

export function calculateTotalDebt(debts: Debt[]): number {
  return roundMoney(
    debts.filter((debt) => debt.status === 'active').reduce((sum, debt) => sum + debt.amount, 0)
  );
}

export function calculateNetBalance(balance: number, totalDebt: number): number {
  return roundMoney(balance - totalDebt);
}
