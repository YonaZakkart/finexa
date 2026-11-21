import { Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { Card } from '@/components/ui/Card';
import type { PortfolioStatus } from '@/features/investments/status';
import { PORTFOLIO_STATUS_TONE } from '@/features/investments/status-tone';
import type { PortfolioTotals } from '@/features/investments/totals';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import type { SupportedLanguage } from '@/lib/language';
import type { Portfolio } from '@/types';

export interface PortfolioCardProps {
  portfolio: Portfolio;
  totals: PortfolioTotals;
  status: PortfolioStatus;
  language: SupportedLanguage;
  onEdit?: (portfolio: Portfolio) => void;
  onDelete?: (portfolio: Portfolio) => void;
}

export function PortfolioCard({
  portfolio,
  totals,
  status,
  language,
  onEdit,
  onDelete,
}: PortfolioCardProps) {
  const { t } = useTranslation('investments');
  const hasActions = Boolean(onEdit || onDelete);

  return (
    <Card className="relative p-0 transition-colors hover:bg-surface">
      <Link
        to={`/investments/${portfolio.id}`}
        aria-label={`${portfolio.name} — ${t('viewPortfolio')}`}
        className="block rounded-lg p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div className={cn('flex items-start justify-between gap-3', hasActions && 'pr-12')}>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold tracking-tight">{portfolio.name}</h3>
            <p className="mt-1 text-xs text-text-muted">
              {t(`types.${portfolio.type}`)} · {portfolio.broker}
            </p>
          </div>
          <Briefcase aria-hidden="true" className="size-5 shrink-0 text-accent" />
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-text-muted">{t('currentBalance')}</p>
          <p
            className={cn(
              'mt-1 text-2xl font-semibold tracking-tight tabular-nums',
              PORTFOLIO_STATUS_TONE[status]
            )}
          >
            {formatCurrency(portfolio.currentBalance, language)}
          </p>
          <p className={cn('mt-1 text-xs font-medium', PORTFOLIO_STATUS_TONE[status])}>
            {t(`status.${status}`)}
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
          <div>
            <dt className="text-[11px] font-medium text-text-muted">{t('invested')}</dt>
            <dd className="mt-0.5 text-xs font-semibold tabular-nums text-positive">
              {formatCurrency(totals.investedTotal, language)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-text-muted">{t('commissions')}</dt>
            <dd className="mt-0.5 text-xs font-semibold tabular-nums text-negative">
              {formatCurrency(totals.commissionsTotal, language)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-text-muted">{t('residual')}</dt>
            <dd
              className={cn(
                'mt-0.5 text-xs font-semibold tabular-nums',
                totals.residualTotal < 0 ? 'text-negative' : 'text-text-muted'
              )}
            >
              {formatCurrency(totals.residualTotal, language)}
            </dd>
          </div>
        </dl>
      </Link>

      {hasActions ? (
        <div className="absolute right-1 top-1">
          <ActionMenu label={t('actions')}>
            {onEdit ? (
              <button
                role="menuitem"
                type="button"
                onClick={() => onEdit(portfolio)}
                className="flex min-h-11 w-full items-center rounded-md px-3 text-sm hover:bg-surface"
              >
                {t('edit')}
              </button>
            ) : null}
            {onDelete ? (
              <button
                role="menuitem"
                type="button"
                onClick={() => onDelete(portfolio)}
                className="flex min-h-11 w-full items-center rounded-md px-3 text-sm text-negative hover:bg-surface"
              >
                {t('delete')}
              </button>
            ) : null}
          </ActionMenu>
        </div>
      ) : null}
    </Card>
  );
}
