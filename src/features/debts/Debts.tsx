import { ArrowLeft, CheckCircle2, PlusCircle, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAppStore } from '@/stores/app.store';
import { selectTotalDebt } from '@/stores/selectors';
import type { Debt } from '@/types';
import { AddDebtModal } from './AddDebtModal';
import { PayDebtDialog } from './PayDebtDialog';

function sortByCreatedAt(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function Debts() {
  const { t } = useTranslation('debts');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const debts = useAppStore((state) => state.debts);
  const totalDebt = useAppStore(selectTotalDebt);
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const [addOpen, setAddOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);

  const activeDebts = sortByCreatedAt(debts.filter((debt) => debt.status === 'active'));
  const paidDebts = sortByCreatedAt(debts.filter((debt) => debt.status === 'paid'));

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text"
          aria-label={tCommon('back')}
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
      </header>

      <Card className="p-5" aria-labelledby="total-title">
        <div className="flex items-center justify-between">
          <h2 id="total-title" className="text-sm font-medium text-text-muted">
            {t('totalDebt')}
          </h2>
          <TrendingDown aria-hidden="true" className="size-5 text-negative" />
        </div>
        <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-negative">
          {formatCurrency(totalDebt, language)}
        </p>
        <p className="mt-2 text-xs text-text-muted">{t('totalHint')}</p>
      </Card>

      <Card className="p-5 space-y-4" aria-labelledby="debts-title">
        <header className="flex items-center justify-between gap-3">
          <h2 id="debts-title" className="text-sm font-medium text-text-muted">
            {t('yourDebts')}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setAddOpen(true)}>
            <PlusCircle aria-hidden="true" className="size-4" />
            {t('addDebt')}
          </Button>
        </header>

        {debts.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm font-medium">{t('noDebts')}</p>
            <p className="mt-1 text-sm text-text-muted">{t('noDebtsHint')}</p>
          </div>
        ) : (
          <>
            {activeDebts.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t('active')}
                </h3>
                <ul className="space-y-2">
                  {activeDebts.map((debt) => (
                    <li key={debt.id} className="rounded-md border border-border bg-surface p-3">
                      <p className="truncate font-medium">{debt.name}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {formatCurrency(debt.amount, language)}
                      </p>
                      <Button
                        size="sm"
                        className="mt-3 w-full sm:w-auto"
                        onClick={() => setPayingDebt(debt)}
                      >
                        <CheckCircle2 aria-hidden="true" className="size-4" />
                        {t('markPaid')}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {paidDebts.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-medium uppercase tracking-wide text-text-muted">
                  {t('paid')}
                </h3>
                <ul className="space-y-2">
                  {paidDebts.map((debt) => {
                    const paidDate = debt.paidAt ? new Date(debt.paidAt) : null;
                    const hasPaidDate = paidDate !== null && !Number.isNaN(paidDate.getTime());

                    return (
                      <li
                        key={debt.id}
                        className="rounded-md border border-border bg-surface p-3 opacity-70"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{debt.name}</p>
                            <p className="mt-1 text-xs text-text-muted">
                              {formatCurrency(debt.amount, language)}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-positive">
                            {t('paidBadge')}
                          </span>
                        </div>
                        {hasPaidDate ? (
                          <p className="mt-2 text-xs text-text-muted">
                            {t('paidOn', { date: formatDate(paidDate, language) })}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </Card>

      {addOpen ? <AddDebtModal onClose={() => setAddOpen(false)} /> : null}
      {payingDebt ? <PayDebtDialog debt={payingDebt} onClose={() => setPayingDebt(null)} /> : null}
    </main>
  );
}
