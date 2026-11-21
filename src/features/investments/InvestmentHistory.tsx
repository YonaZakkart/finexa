import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate } from '@/lib/format';
import { roundMoney } from '@/lib/money';
import { useAppStore } from '@/stores/app.store';

export function InvestmentHistory() {
  const { t } = useTranslation('investments');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const portfolios = useAppStore((state) => state.portfolios);
  const investments = useAppStore((state) => state.investments);
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const [portfolioId, setPortfolioId] = useState('all');
  const [date, setDate] = useState('');

  const rows = useMemo(
    () =>
      investments
        .filter(
          (investment) =>
            (portfolioId === 'all' || investment.portfolioId === portfolioId) &&
            (!date || investment.date === date)
        )
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [investments, portfolioId, date]
  );

  const totals = useMemo(
    () => ({
      deposit: roundMoney(rows.reduce((sum, row) => sum + row.depositTotal, 0)),
      purchase: roundMoney(rows.reduce((sum, row) => sum + row.purchaseAmount, 0)),
    }),
    [rows]
  );

  const portfolioName = (id: string) =>
    portfolios.find((portfolio) => portfolio.id === id)?.name ?? t('detail.notFound');

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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('history.title')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('history.subtitle')}</p>
        </div>
      </header>

      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('history.portfolioFilter')}
            value={portfolioId}
            onChange={(event) => setPortfolioId(event.target.value)}
          >
            <option value="all">{t('history.allPortfolios')}</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.name}
              </option>
            ))}
          </Select>
          <Input
            label={t('history.dateFilter')}
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <dl className="grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <dt className="text-[11px] font-medium text-text-muted">{t('history.totalDeposit')}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-negative">
              {formatCurrency(totals.deposit, language)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-text-muted">
              {t('history.totalPurchase')}
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-positive">
              {formatCurrency(totals.purchase, language)}
            </dd>
          </div>
        </dl>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title={t('history.empty')} description={t('history.emptyHint')} />
      ) : (
        <Card className="p-5">
          <ul className="space-y-3">
            {rows.map((investment) => (
              <li key={investment.id} className="rounded-md border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{portfolioName(investment.portfolioId)}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatDate(investment.date, language)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(investment.purchaseAmount, language)}
                  </p>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-2">
                  <div>
                    <dt className="text-[11px] font-medium text-text-muted">
                      {t('history.deposit')}
                    </dt>
                    <dd className="text-xs font-semibold tabular-nums text-negative">
                      {formatCurrency(investment.depositTotal, language)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-text-muted">
                      {t('history.purchase')}
                    </dt>
                    <dd className="text-xs font-semibold tabular-nums text-positive">
                      {formatCurrency(investment.purchaseAmount, language)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
