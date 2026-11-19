import { Briefcase, ChartPie, PlusCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getPortfolioStatus, type PortfolioStatus } from '@/features/investments/status';
import {
  calculateGlobalTotals,
  calculatePortfolioTotals,
  type GlobalInvestmentTotals,
  type PortfolioTotals,
} from '@/features/investments/totals';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import type { SupportedLanguage } from '@/lib/language';
import { useAppStore } from '@/stores/app.store';
import type { Investment, Portfolio } from '@/types';
import { NewPortfolioModal } from './NewPortfolioModal';
import { PortfolioCard } from './PortfolioCard';

interface PortfolioView {
  portfolio: Portfolio;
  totals: PortfolioTotals;
  status: PortfolioStatus;
}

function buildPortfolioViews(portfolios: Portfolio[], investments: Investment[]): PortfolioView[] {
  const byPortfolio = new Map<string, Investment[]>();

  for (const investment of investments) {
    const list = byPortfolio.get(investment.portfolioId);

    if (list) {
      list.push(investment);
    } else {
      byPortfolio.set(investment.portfolioId, [investment]);
    }
  }

  return portfolios.map((portfolio) => {
    const list = byPortfolio.get(portfolio.id) ?? [];
    const totals = calculatePortfolioTotals(list);

    return {
      portfolio,
      totals,
      status: getPortfolioStatus(portfolio.currentBalance, totals, list.length > 0),
    };
  });
}

function GlobalTotalsCard({
  totals,
  language,
}: {
  totals: GlobalInvestmentTotals;
  language: SupportedLanguage;
}) {
  const { t } = useTranslation('investments');
  const metrics = [
    { key: 'currentBalance', value: totals.currentBalance, tone: 'text-text' },
    { key: 'invested', value: totals.investedTotal, tone: 'text-positive' },
    { key: 'commissions', value: totals.commissionsTotal, tone: 'text-negative' },
    {
      key: 'residual',
      value: totals.residualTotal,
      tone: totals.residualTotal < 0 ? 'text-negative' : 'text-text-muted',
    },
  ] as const;

  return (
    <Card className="p-5" aria-labelledby="investments-totals-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="investments-totals-title" className="text-sm font-medium text-text-muted">
            {t('totals')}
          </h2>
          <p className="mt-1 text-xs text-text-muted">{t('totalsHint')}</p>
        </div>
        <ChartPie aria-hidden="true" className="size-5 text-accent" />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4" aria-live="polite">
        {metrics.map((metric) => (
          <div key={metric.key}>
            <dt className="text-[11px] font-medium text-text-muted">{t(metric.key)}</dt>
            <dd
              className={cn(
                'mt-1 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl',
                metric.tone
              )}
            >
              {formatCurrency(metric.value, language)}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function Investments() {
  const { t } = useTranslation('investments');
  const { t: tCommon } = useTranslation('common');
  const portfolios = useAppStore((state) => state.portfolios);
  const investments = useAppStore((state) => state.investments);
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const [newPortfolioOpen, setNewPortfolioOpen] = useState(false);

  const sortedPortfolios = useMemo(
    () => [...portfolios].sort((a, b) => a.name.localeCompare(b.name, language)),
    [portfolios, language]
  );
  const views = useMemo(
    () => buildPortfolioViews(sortedPortfolios, investments),
    [sortedPortfolios, investments]
  );
  const globalTotals = useMemo(
    () => calculateGlobalTotals(portfolios, investments),
    [portfolios, investments]
  );

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-text-muted uppercase">
            {tCommon('appName')}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('subtitle')}</p>
        </div>
        {portfolios.length > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            className="self-start sm:shrink-0"
            onClick={() => setNewPortfolioOpen(true)}
          >
            <PlusCircle aria-hidden="true" className="size-4" />
            {t('newPortfolio')}
          </Button>
        ) : null}
      </header>

      {portfolios.length === 0 ? (
        <EmptyState
          icon={<Briefcase aria-hidden="true" className="size-8" />}
          title={t('empty.title')}
          description={t('empty.text')}
          action={
            <Button onClick={() => setNewPortfolioOpen(true)}>
              <PlusCircle aria-hidden="true" className="size-4" />
              {t('newPortfolio')}
            </Button>
          }
        />
      ) : (
        <>
          <GlobalTotalsCard totals={globalTotals} language={language} />
          <section aria-labelledby="portfolios-title" className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <h2 id="portfolios-title" className="text-sm font-medium text-text-muted">
                {t('portfolios')}
              </h2>
              <span className="text-xs text-text-muted">{t('portfoliosHint')}</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {views.map(({ portfolio, totals, status }) => (
                <PortfolioCard
                  key={portfolio.id}
                  portfolio={portfolio}
                  totals={totals}
                  status={status}
                  language={language}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {newPortfolioOpen ? <NewPortfolioModal onClose={() => setNewPortfolioOpen(false)} /> : null}
    </main>
  );
}
