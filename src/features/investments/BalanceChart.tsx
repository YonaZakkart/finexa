import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { getLocalDateString } from '@/lib/date';
import { formatCompactNumber, formatCurrency, formatShortDate } from '@/lib/format';
import type { SupportedLanguage } from '@/lib/language';
import type { BalanceSnapshot, Investment } from '@/types';
import { buildBalanceChartData, type ChartRange, DEFAULT_CHART_RANGE } from './balance-chart';
import { listBalanceSnapshots } from './investments.repository';

const RANGE_KEYS: readonly ChartRange[] = ['1m', '3m', '6m', '1y'];

export interface BalanceChartProps {
  portfolioId: string;
  investments: Investment[];
  language: SupportedLanguage;
  balanceUpdatedAt?: string;
}

export function BalanceChart({
  portfolioId,
  investments,
  language,
  balanceUpdatedAt,
}: BalanceChartProps) {
  const { t } = useTranslation('investments');
  const [snapshots, setSnapshots] = useState<BalanceSnapshot[] | null>(null);
  const [range, setRange] = useState<ChartRange>(DEFAULT_CHART_RANGE);
  const today = getLocalDateString();

  // biome-ignore lint/correctness/useExhaustiveDependencies: reload when the balance is updated
  useEffect(() => {
    let active = true;

    setSnapshots(null);
    listBalanceSnapshots(portfolioId)
      .then((rows) => {
        if (active) {
          setSnapshots(rows);
        }
      })
      .catch(() => {
        if (active) {
          setSnapshots([]);
        }
      });

    return () => {
      active = false;
    };
  }, [portfolioId, balanceUpdatedAt]);

  const data = useMemo(
    () => buildBalanceChartData({ snapshots: snapshots ?? [], investments, range, today }),
    [snapshots, investments, range, today]
  );

  if (snapshots === null) {
    return (
      <Card className="space-y-4 p-5" aria-busy="true">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="h-56 w-full rounded-md" />
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5" aria-labelledby="balance-chart-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="balance-chart-title" className="text-sm font-medium text-text-muted">
            {t('chart.title')}
          </h2>
          <p className="mt-1 text-xs text-text-muted">{t('chart.subtitle')}</p>
        </div>
      </div>

      <fieldset className="flex gap-2 border-0 p-0">
        <legend className="sr-only">{t('chart.range')}</legend>
        {RANGE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setRange(key)}
            aria-pressed={range === key}
            className={
              range === key
                ? 'min-h-11 rounded-md bg-accent px-3 text-xs font-semibold text-text-inverse'
                : 'min-h-11 rounded-md border border-border px-3 text-xs font-medium text-text-muted hover:bg-surface hover:text-text'
            }
          >
            {t(`chart.range${key}`)}
          </button>
        ))}
      </fieldset>

      {snapshots.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm font-medium">{t('chart.empty')}</p>
          <p className="mt-1 text-sm text-text-muted">{t('chart.emptyHint')}</p>
        </div>
      ) : (
        <>
          <div className="h-56 w-full" role="img" aria-label={t('chart.title')}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  tickFormatter={(value) => formatShortDate(String(value), language)}
                  minTickGap={24}
                />
                <YAxis
                  width={48}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  tickFormatter={(value) => formatCompactNumber(Number(value), language)}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border-strong)',
                    borderRadius: 8,
                    color: 'var(--color-text)',
                  }}
                  labelStyle={{ color: 'var(--color-text)' }}
                  itemStyle={{ color: 'var(--color-text)' }}
                  labelFormatter={(value) => formatShortDate(String(value), language)}
                  formatter={(value) => formatCurrency(Number(value), language)}
                />
                <Legend
                  wrapperStyle={{ color: 'var(--color-text)' }}
                  formatter={(value) => <span className="text-text">{value}</span>}
                />
                <Line
                  type="stepAfter"
                  dataKey="balance"
                  name={t('chart.balance')}
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="invested"
                  name={t('chart.invested')}
                  stroke="var(--color-positive)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ul className="sr-only">
            <li>
              {t('chart.range')}: {t(`chart.range${range}`)}
            </li>
            <li>
              {t('chart.balance')}:{' '}
              {formatCurrency(snapshots[snapshots.length - 1].balance, language)}
            </li>
            <li>
              {t('chart.invested')}:{' '}
              {formatCurrency(data[data.length - 1]?.invested ?? 0, language)}
            </li>
          </ul>
        </>
      )}
    </Card>
  );
}
