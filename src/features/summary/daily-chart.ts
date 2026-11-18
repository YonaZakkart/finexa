import { categories } from '@/features/expenses/categories';
import { roundMoney } from '@/lib/money';
import type { Transaction } from '@/types';

export interface DailyChartSlice {
  categoryId: string;
  labelKey: string;
  colorToken: string;
  value: number;
  percentage: number;
}

export interface DailyChartData {
  slices: DailyChartSlice[];
  total: number;
}

export function calculateDailyCategoryData(transactions: Transaction[]): DailyChartData {
  const totals = new Map<string, number>();
  let total = 0;

  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || !transaction.category) {
      continue;
    }

    total += transaction.amount;
    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount);
  }

  const slices = categories
    .filter((category) => (totals.get(category.id) ?? 0) > 0)
    .map((category) => {
      const value = roundMoney(totals.get(category.id) ?? 0);

      return {
        categoryId: category.id,
        labelKey: category.labelKey,
        colorToken: category.colorToken,
        value,
        percentage: total > 0 ? Math.round((value / total) * 10000) / 100 : 0,
      };
    })
    .sort(
      (a, b) =>
        b.value - a.value ||
        categories.findIndex((category) => category.id === a.categoryId) -
          categories.findIndex((category) => category.id === b.categoryId)
    );

  if (slices.length > 0) {
    const sum = slices.reduce((acc, slice) => acc + slice.percentage, 0);
    slices[0] = {
      ...slices[0],
      percentage: Math.round((slices[0].percentage + (100 - sum)) * 100) / 100,
    };
  }

  return { slices, total: roundMoney(total) };
}
