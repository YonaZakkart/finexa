import { categories } from '@/features/expenses/categories';
import { addDaysToDate } from '@/lib/date';
import { formatWeekday } from '@/lib/format';
import { roundMoney } from '@/lib/money';
import type { Language, Transaction } from '@/types';

export interface WeeklyChartCategory {
  id: string;
  labelKey: string;
  colorToken: string;
}

export interface WeeklyChartData {
  rows: Array<Record<string, string | number>>;
  categories: WeeklyChartCategory[];
  total: number;
}

export function calculateWeeklyChartData(
  transactions: Transaction[],
  weekStart: string,
  language: Language
): WeeklyChartData {
  const dates = Array.from({ length: 7 }, (_, index) => addDaysToDate(weekStart, index));
  const rows: Array<Record<string, string | number>> = dates.map((date) => ({
    date,
    label: formatWeekday(date, language),
    total: 0,
    ...Object.fromEntries(categories.map((category) => [category.id, 0])),
  }));
  const rowsByDate = new Map(rows.map((row) => [row.date, row]));
  const categoryTotals = new Map<string, number>();
  let total = 0;

  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || !transaction.category) {
      continue;
    }

    const row = rowsByDate.get(transaction.date);

    if (!row) {
      continue;
    }

    row[transaction.category] = roundMoney(
      Number(row[transaction.category] ?? 0) + transaction.amount
    );
    row.total = roundMoney(Number(row.total) + transaction.amount);
    categoryTotals.set(
      transaction.category,
      roundMoney((categoryTotals.get(transaction.category) ?? 0) + transaction.amount)
    );
    total += transaction.amount;
  }

  return {
    rows,
    categories: categories
      .filter((category) => (categoryTotals.get(category.id) ?? 0) > 0)
      .map(({ id, labelKey, colorToken }) => ({ id, labelKey, colorToken })),
    total: roundMoney(total),
  };
}
