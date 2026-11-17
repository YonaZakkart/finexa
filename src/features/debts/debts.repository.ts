import { db } from '@/lib/db';
import type { Debt, DebtStatus } from '@/types';

export type NewDebt = Pick<Debt, 'name' | 'amount'>;
export type DebtPatch = Partial<Omit<Debt, 'id' | 'createdAt'>>;

export async function createDebt(input: NewDebt): Promise<Debt> {
  const debt: Debt = {
    id: crypto.randomUUID(),
    name: input.name,
    amount: input.amount,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  await db.debts.add(debt);
  return debt;
}

export async function updateDebt(id: string, patch: DebtPatch): Promise<void> {
  await db.debts.update(id, patch);
}

export async function listDebts(status?: DebtStatus): Promise<Debt[]> {
  const rows = status
    ? await db.debts.where('status').equals(status).toArray()
    : await db.debts.toArray();

  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
