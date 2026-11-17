import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';

export function Summary() {
  const { t } = useTranslation('summary');
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </header>

      <Card className="p-5 grid grid-cols-2 gap-3" aria-labelledby="summary-title">
        <h2 id="summary-title" className="col-span-2 text-sm font-medium text-text-muted">
          {t('dailySummary')}
        </h2>
        <div className="flex items-center gap-2 text-text-muted">
          <span>
            {t('totalSpent')}: <span className="font-semibold tabular-nums">$42.50</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <span>
            {t('dominantCategory')}: <span className="font-semibold">Food</span>
          </span>
        </div>
      </Card>

      <Card className="p-5 space-y-4" aria-labelledby="charts-title">
        <h3 id="charts-title" className="text-sm font-medium text-text-muted">
          {t('charts')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/summary?view=weekly')}
            className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-6 text-text font-medium hover:bg-surface-strong transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <BarChart3 aria-hidden="true" className="size-8" />
            <span>{t('weeklyChart')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/summary?view=daily')}
            className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-6 text-text font-medium hover:bg-surface-strong transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <BarChart3 aria-hidden="true" className="size-8" />
            <span>{t('dailyChart')}</span>
          </button>
        </div>
      </Card>
    </main>
  );
}
