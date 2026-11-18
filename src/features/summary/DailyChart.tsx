import { useTranslation } from 'react-i18next';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';
import type { Language, Transaction } from '@/types';
import { calculateDailyCategoryData } from './daily-chart';

export function DailyChart({
  expenses,
  language,
}: {
  expenses: Transaction[];
  language: Language;
}) {
  const { t } = useTranslation('summary');
  const { t: tCategories } = useTranslation('categories');
  const data = calculateDailyCategoryData(expenses);
  const chartData = data.slices.map((slice) => ({
    name: slice.labelKey,
    value: slice.value,
    fill: slice.colorToken,
    percentage: slice.percentage,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="p-5 text-center">
        <h2 className="text-sm font-medium text-text-muted">{t('dailyChart')}</h2>
        <p className="mt-3 text-sm text-text-muted">{t('noDailyData')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-5 space-y-4" aria-labelledby="daily-chart-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="daily-chart-title" className="text-sm font-medium text-text-muted">
          {t('dailyChart')}
        </h2>
        <span className="text-sm font-semibold tabular-nums text-negative">
          {formatCurrency(data.total, language)}
        </span>
      </div>
      <div className="h-64 w-full" role="img" aria-label={t('dailyChart')}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              isAnimationActive={false}
            >
              {chartData.map((slice) => (
                <Cell key={slice.name} fill={slice.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 8,
                color: 'var(--color-text)',
              }}
              formatter={(value, name) => {
                const slice = chartData.find((item) => item.name === name);

                return [
                  `${formatCurrency(Number(value), language)} (${slice?.percentage ?? 0}%)`,
                  tCategories(String(name)),
                ];
              }}
            />
            <Legend formatter={(value) => tCategories(String(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
