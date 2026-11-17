import { categories } from '@/features/expenses/categories';
import { roundMoney, toCents } from '@/lib/money';
import type { Transaction } from '@/types';

export interface DailySummary {
  total: number;
  count: number;
  dominantCategoryId: string | null;
}

const CATEGORY_ORDER = new Map(categories.map((category, index) => [category.id, index]));

export function calculateDailySummary(transactions: Transaction[]): DailySummary {
  const totals = new Map<string, number>();
  let total = 0;
  let count = 0;

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') {
      continue;
    }

    total += transaction.amount;
    count += 1;

    if (transaction.category) {
      totals.set(
        transaction.category,
        (totals.get(transaction.category) ?? 0) + transaction.amount
      );
    }
  }

  let dominantCategoryId: string | null = null;
  let dominantCents = -1;

  for (const [categoryId, categoryTotal] of totals) {
    const cents = toCents(categoryTotal);
    const order = CATEGORY_ORDER.get(categoryId) ?? Number.MAX_SAFE_INTEGER;
    const dominantOrder = dominantCategoryId
      ? (CATEGORY_ORDER.get(dominantCategoryId) ?? Number.MAX_SAFE_INTEGER)
      : Number.MAX_SAFE_INTEGER;

    if (cents > dominantCents || (cents === dominantCents && order < dominantOrder)) {
      dominantCategoryId = categoryId;
      dominantCents = cents;
    }
  }

  return { total: roundMoney(total), count, dominantCategoryId };
}
