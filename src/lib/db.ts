import Dexie, { type EntityTable } from 'dexie';
import type { Debt, Investment, Portfolio, Settings, Transaction } from '@/types';

export const DB_NAME = 'finexa';

export const db = new Dexie(DB_NAME) as Dexie & {
  transactions: EntityTable<Transaction, 'id'>;
  debts: EntityTable<Debt, 'id'>;
  settings: EntityTable<Settings, 'id'>;
  portfolios: EntityTable<Portfolio, 'id'>;
  investments: EntityTable<Investment, 'id'>;
};

db.version(1).stores({
  transactions: 'id, date, type, relatedDebtId, [date+type]',
  debts: 'id, status, createdAt',
  settings: 'id',
});

db.version(2).stores({
  transactions: 'id, date, type, relatedDebtId, [date+type]',
  debts: 'id, status, createdAt',
  settings: 'id',
  portfolios: 'id, name, type, createdAt',
  investments: 'id, portfolioId, date, [portfolioId+date]',
});
