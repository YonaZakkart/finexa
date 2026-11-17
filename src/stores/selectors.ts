import {
  calculateBalance,
  calculateNetBalance,
  calculateTotalDebt,
} from '@/features/balance/balance';
import type { Debt, Transaction } from '@/types';

interface BalanceState {
  transactions: Transaction[];
  debts: Debt[];
}

export function selectBalance(state: BalanceState): number {
  return calculateBalance(state.transactions);
}

export function selectTotalDebt(state: BalanceState): number {
  return calculateTotalDebt(state.debts);
}

export function selectNetBalance(state: BalanceState): number {
  return calculateNetBalance(selectBalance(state), selectTotalDebt(state));
}
