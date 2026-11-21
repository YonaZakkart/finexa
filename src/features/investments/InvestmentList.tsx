import { useTranslation } from 'react-i18next';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate } from '@/lib/format';
import type { SupportedLanguage } from '@/lib/language';
import { roundMoney } from '@/lib/money';
import type { Investment } from '@/types';

export interface InvestmentListProps {
  investments: Investment[];
  language: SupportedLanguage;
  onDelete?: (investment: Investment) => void;
  onEdit?: (investment: Investment) => void;
}

export function InvestmentList({ investments, language, onDelete, onEdit }: InvestmentListProps) {
  const { t } = useTranslation('investments');

  return (
    <Card className="p-5" aria-labelledby="investment-list-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="investment-list-title" className="text-sm font-medium text-text-muted">
            {t('detail.investments')}
          </h2>
          <p className="mt-1 text-xs text-text-muted">{t('detail.investmentsHint')}</p>
        </div>
        <span aria-hidden="true" className="text-xs font-medium text-text-muted">
          {investments.length}
        </span>
      </div>

      {investments.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm font-medium">{t('detail.noInvestments')}</p>
          <p className="mt-1 text-sm text-text-muted">{t('detail.noInvestmentsHint')}</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {investments.map((investment) => {
            const commissions = roundMoney(
              investment.bankCommission +
                investment.brokerCommission +
                investment.purchaseCommission
            );

            return (
              <li key={investment.id} className="rounded-md border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{formatDate(investment.date, language)}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {t('detail.mode')}:{' '}
                      {t(
                        investment.commissionFromResidual
                          ? 'detail.modeResidual'
                          : 'detail.modeAvailable'
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-medium text-text-muted">
                      {t('detail.purchase')}
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(investment.purchaseAmount, language)}
                    </p>
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-2">
                  <div>
                    <dt className="text-[11px] font-medium text-text-muted">
                      {t('detail.operationCommissions')}
                    </dt>
                    <dd className="text-xs font-semibold tabular-nums text-negative">
                      {formatCurrency(commissions, language)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium text-text-muted">
                      {t('detail.operationResidual')}
                    </dt>
                    <dd
                      className={cn(
                        'text-xs font-semibold tabular-nums',
                        investment.residualDelta < 0 ? 'text-negative' : 'text-text-muted'
                      )}
                    >
                      {formatCurrency(investment.residualDelta, language)}
                    </dd>
                  </div>
                </dl>
                {investment.transactionId ? (
                  <p className="mt-2 text-xs text-text-muted">
                    {t('detail.balanceOutflow')}:{' '}
                    <span className="font-semibold tabular-nums text-negative">
                      {formatCurrency(investment.depositTotal, language)}
                    </span>
                  </p>
                ) : null}
                <div className="mt-2 flex justify-end">
                  <ActionMenu label={t('detail.actions')}>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => onEdit?.(investment)}
                      className="flex min-h-11 w-full items-center rounded-md px-3 text-sm hover:bg-surface"
                    >
                      {t('detail.edit')}
                    </button>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => onDelete?.(investment)}
                      className="flex min-h-11 w-full items-center rounded-md px-3 text-sm text-negative hover:bg-surface"
                    >
                      {t('detail.delete')}
                    </button>
                  </ActionMenu>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
