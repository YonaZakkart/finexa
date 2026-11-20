import { ArrowLeft, Briefcase, PlusCircle, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getPortfolioStatus } from '@/features/investments/status';
import { calculatePortfolioTotals } from '@/features/investments/totals';
import { useAppStore } from '@/stores/app.store';
import { selectPortfolioInvestments } from '@/stores/selectors';
import { InvestmentList } from './InvestmentList';
import { PortfolioSummary } from './PortfolioSummary';
import { UpdateBalanceModal } from './UpdateBalanceModal';

export function PortfolioDetail() {
  const { t } = useTranslation('investments');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const portfolios = useAppStore((state) => state.portfolios);
  const investments = useAppStore((state) => state.investments);
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const [balanceOpen, setBalanceOpen] = useState(false);
  const investmentCreated = (location.state as { investmentCreated?: boolean } | null)
    ?.investmentCreated;

  const portfolio = portfolios.find((item) => item.id === portfolioId);
  const portfolioInvestments = useMemo(
    () => (portfolioId ? selectPortfolioInvestments({ portfolios, investments }, portfolioId) : []),
    [portfolios, investments, portfolioId]
  );
  const totals = useMemo(
    () => calculatePortfolioTotals(portfolioInvestments),
    [portfolioInvestments]
  );

  if (!portfolio) {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/investments')}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text"
            aria-label={tCommon('back')}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">{t('detail.notFound')}</h1>
        </header>
        <EmptyState
          icon={<Briefcase aria-hidden="true" className="size-8" />}
          title={t('detail.notFound')}
          description={t('detail.notFoundHint')}
          action={
            <Button variant="secondary" onClick={() => navigate('/investments')}>
              {t('detail.backToPortfolios')}
            </Button>
          }
        />
      </main>
    );
  }

  const status = getPortfolioStatus(
    portfolio.currentBalance,
    totals,
    portfolioInvestments.length > 0
  );

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate('/investments')}
          className="mt-0.5 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text"
          aria-label={tCommon('back')}
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">{portfolio.name}</h1>
          <p className="mt-1 text-xs text-text-muted">
            {t(`types.${portfolio.type}`)} · {portfolio.broker}
          </p>
        </div>
      </header>

      {investmentCreated ? (
        <p role="status" className="text-sm font-medium text-positive">
          {t('detail.investmentCreated')}
        </p>
      ) : null}

      <PortfolioSummary
        portfolio={portfolio}
        totals={totals}
        status={status}
        investmentCount={portfolioInvestments.length}
        language={language}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-col gap-1">
          <Button
            variant="secondary"
            onClick={() => setBalanceOpen(true)}
            disabled={portfolioInvestments.length === 0}
            className="w-full sm:w-auto"
          >
            <Wallet aria-hidden="true" className="size-4" />
            {t('detail.updateBalance')}
          </Button>
          {portfolioInvestments.length === 0 ? (
            <span className="text-xs text-text-muted">{t('detail.balanceRequiresInvestment')}</span>
          ) : null}
        </div>
        <Button
          onClick={() => navigate(`/investments/${portfolio.id}/new`)}
          className="w-full sm:w-auto"
        >
          <PlusCircle aria-hidden="true" className="size-4" />
          {t('detail.addInvestment')}
        </Button>
      </div>

      <InvestmentList investments={portfolioInvestments} language={language} />

      {balanceOpen ? (
        <UpdateBalanceModal portfolio={portfolio} onClose={() => setBalanceOpen(false)} />
      ) : null}
    </main>
  );
}
