import { Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import type { PortfolioStatus } from '@/features/investments/status';
import { PORTFOLIO_STATUS_TONE } from '@/features/investments/status-tone';
import type { PortfolioTotals } from '@/features/investments/totals';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import type { SupportedLanguage } from '@/lib/language';
import type { Portfolio } from '@/types';

export interface PortfolioSummaryProps {
  portfolio: Portfolio;
  totals: PortfolioTotals;
  status: PortfolioStatus;
  investmentCount: number;
  language: SupportedLanguage;
}

export function PortfolioSummary({
  portfolio,
  totals,
  status,
  investmentCount,
  language,
}: PortfolioSummaryProps) {
  const { t } = useTranslation('investments');
  const tone = PORTFOLIO_STATUS_TONE[status];

  return (
    <Card className="p-5" aria-labelledby="portfolio-summary-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="portfolio-summary-title" className="text-sm font-medium text-text-muted">
            {t('currentBalance')}
          </h2>
          <div aria-live="polite">
            <p className={cn('mt-2 text-4xl font-semibold tracking-tight tabular-nums', tone)}>
              {formatCurrency(portfolio.currentBalance, language)}
            </p>
            <p className={cn('mt-1 text-xs font-medium', tone)}>{t(`status.${status}`)}</p>
          </div>
        </div>
        <Wallet aria-hidden="true" className={cn('size-5 shrink-0', tone)} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <div>
          <dt className="text-[11px] font-medium text-text-muted">{t('invested')}</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-positive">
            {formatCurrency(totals.investedTotal, language)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-text-muted">{t('commissions')}</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-negative">
            {formatCurrency(totals.commissionsTotal, language)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-text-muted">{t('residual')}</dt>
          <dd
            className={cn(
              'mt-1 text-xs font-semibold tabular-nums',
              totals.residualTotal < 0 ? 'text-negative' : 'text-text-muted'
            )}
          >
            {formatCurrency(totals.residualTotal, language)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-text-muted">
        {t('deposited')}: {formatCurrency(totals.depositedTotal, language)}
      </p>

      {investmentCount > 0 && !portfolio.balanceUpdatedAt ? (
        <p className="mt-3 text-xs font-medium text-warning">{t('detail.updateBalanceHint')}</p>
      ) : null}
    </Card>
  );
}
