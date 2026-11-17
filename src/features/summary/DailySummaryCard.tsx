import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { getCategory } from '@/features/expenses/categories';
import { formatCurrency } from '@/lib/format';
import type { Language, Transaction } from '@/types';
import { calculateDailySummary } from './daily-summary';

export function DailySummaryCard({
  expenses,
  language,
}: {
  expenses: Transaction[];
  language: Language;
}) {
  const { t } = useTranslation('summary');
  const { t: tCategories } = useTranslation('categories');
  const summary = calculateDailySummary(expenses);
  const category = summary.dominantCategoryId ? getCategory(summary.dominantCategoryId) : undefined;
  const dominantLabel = category ? tCategories(category.labelKey) : t('noData');

  return (
    <Card className="p-5" aria-labelledby="daily-summary-title">
      <h2 id="daily-summary-title" className="text-sm font-medium text-text-muted">
        {t('dailySummary')}
      </h2>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-text-muted">{t('totalSpent')}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums text-negative">
            {formatCurrency(summary.total, language)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">{t('dominantCategory')}</p>
          <p className="text-sm font-semibold">{dominantLabel}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-text-muted">{t('expenseCount', { count: summary.count })}</p>
    </Card>
  );
}
