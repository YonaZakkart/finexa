import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { getLocalDateString, getWeekStart } from '@/lib/date';
import { useAppStore } from '@/stores/app.store';
import { DailySummaryCard } from './DailySummaryCard';

const WeeklyChart = lazy(() =>
  import('./WeeklyChart').then((module) => ({ default: module.WeeklyChart }))
);
const DailyChart = lazy(() =>
  import('./DailyChart').then((module) => ({ default: module.DailyChart }))
);

function ChartFallback() {
  return (
    <Card className="space-y-4 p-5" aria-busy="true">
      <Skeleton className="h-4 w-32 rounded-md" />
      <Skeleton className="h-64 w-full rounded-md" />
    </Card>
  );
}

export function Summary() {
  const { t } = useTranslation('summary');
  const [searchParams, setSearchParams] = useSearchParams();
  const transactions = useAppStore((state) => state.transactions);
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const today = getLocalDateString();
  const view = searchParams.get('view') === 'daily' ? 'daily' : 'weekly';
  const todayExpenses = transactions.filter(
    (transaction) => transaction.type === 'expense' && transaction.date === today
  );

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </header>

      <DailySummaryCard expenses={todayExpenses} language={language} />

      <Card className="p-4 space-y-3" aria-labelledby="charts-title">
        <h2 id="charts-title" className="text-sm font-medium text-text-muted">
          {t('charts')}
        </h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={view === 'weekly' ? 'primary' : 'secondary'}
            onClick={() => setSearchParams({ view: 'weekly' })}
          >
            {t('weeklyChart')}
          </Button>
          <Button
            size="sm"
            variant={view === 'daily' ? 'primary' : 'secondary'}
            onClick={() => setSearchParams({ view: 'daily' })}
          >
            {t('dailyChart')}
          </Button>
        </div>
      </Card>

      <Suspense fallback={<ChartFallback />}>
        {view === 'weekly' ? (
          <WeeklyChart
            transactions={transactions}
            weekStart={getWeekStart(today)}
            language={language}
          />
        ) : (
          <DailyChart expenses={todayExpenses} language={language} />
        )}
      </Suspense>
    </main>
  );
}
