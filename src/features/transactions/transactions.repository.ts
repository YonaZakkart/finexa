import { db } from '@/lib/db';
import type { Transaction } from '@/types';

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;
export type TransactionPatch = Partial<Omit<Transaction, 'id' | 'createdAt'>>;

export async function createTransaction(input: NewTransaction): Promise<Transaction> {
  const transaction: Transaction = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  await db.transactions.add(transaction);
  return transaction;
}

export async function updateTransaction(id: string, patch: TransactionPatch): Promise<void> {
  await db.transactions.update(id, patch);
}

export async function listTransactionsByDate(date: string): Promise<Transaction[]> {
  const rows = await db.transactions.where('date').equals(date).toArray();
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listTransactionsBetween(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  return db.transactions.where('date').between(startDate, endDate, true, true).toArray();
}
