import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';
import type { Language, Transaction } from '@/types';
import { calculateWeeklyChartData } from './weekly-chart';

export function WeeklyChart({
  transactions,
  weekStart,
  language,
}: {
  transactions: Transaction[];
  weekStart: string;
  language: Language;
}) {
  const { t } = useTranslation('summary');
  const { t: tCategories } = useTranslation('categories');
  const data = calculateWeeklyChartData(transactions, weekStart, language);
  const compact = new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  if (data.categories.length === 0) {
    return (
      <Card className="p-5 text-center">
        <h2 className="text-sm font-medium text-text-muted">{t('weeklyChart')}</h2>
        <p className="mt-3 text-sm text-text-muted">{t('noWeeklyData')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4" aria-labelledby="weekly-chart-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="weekly-chart-title" className="text-sm font-medium text-text-muted">
          {t('weeklyChart')}
        </h2>
        <span className="text-sm font-semibold tabular-nums text-negative">
          {formatCurrency(data.total, language)}
        </span>
      </div>
      <div className="h-64 w-full" role="img" aria-label={t('weeklyChart')}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
            <YAxis
              width={48}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
              tickFormatter={(value) => compact.format(Number(value))}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 8,
                color: 'var(--color-text)',
              }}
              formatter={(value, name) => [
                formatCurrency(Number(value), language),
                tCategories(String(name)),
              ]}
            />
            <Legend formatter={(value) => tCategories(String(value))} />
            {data.categories.map((category) => (
              <Bar
                key={category.id}
                dataKey={category.id}
                stackId="week"
                fill={category.colorToken}
                name={category.labelKey}
                radius={[2, 2, 0, 0]}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
