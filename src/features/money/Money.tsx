import { ArrowLeft, PlusCircle, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MoneyModal } from '@/features/dashboard/MoneyModal';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate } from '@/lib/format';
import { useAppStore } from '@/stores/app.store';
import { selectBalance } from '@/stores/selectors';
import type { Transaction } from '@/types';

const MOVEMENT_LABELS = {
  income: 'money.income',
  adjustment: 'money.adjustment',
  investment: 'money.investment',
} as const;

type MoneyMovement = Transaction & { type: keyof typeof MOVEMENT_LABELS };

function isMoneyMovement(transaction: Transaction): transaction is MoneyMovement {
  return (
    transaction.type === 'income' ||
    transaction.type === 'adjustment' ||
    transaction.type === 'investment'
  );
}

export function Money() {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const balance = useAppStore(selectBalance);
  const transactions = useAppStore((state) => state.transactions);
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const [open, setOpen] = useState(false);

  const movements = useMemo(
    () =>
      transactions
        .filter(isMoneyMovement)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [transactions]
  );

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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('moneyPage.title')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('moneyPage.subtitle')}</p>
        </div>
      </header>

      <Card className="p-5" aria-labelledby="money-balance-title">
        <div className="flex items-center justify-between">
          <h2 id="money-balance-title" className="text-sm font-medium text-text-muted">
            {t('balance')}
          </h2>
          <Wallet aria-hidden="true" className="size-5 text-accent" />
        </div>
        <p
          className={cn(
            'mt-3 text-4xl font-semibold tracking-tight tabular-nums',
            balance < 0 ? 'text-negative' : balance > 0 ? 'text-positive' : 'text-text'
          )}
        >
          {formatCurrency(balance, language)}
        </p>
        <Button className="mt-4 w-full sm:w-auto" onClick={() => setOpen(true)}>
          <PlusCircle aria-hidden="true" className="size-4" />
          {t('moneyPage.add')}
        </Button>
      </Card>

      <Card className="p-5" aria-labelledby="money-movements-title">
        <h2 id="money-movements-title" className="text-sm font-medium text-text-muted">
          {t('moneyPage.movements')}
        </h2>
        {movements.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">{t('moneyPage.empty')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {movements.map((transaction) => (
              <li key={transaction.id} className="rounded-md border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t(MOVEMENT_LABELS[transaction.type])}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatDate(transaction.date, language)}
                    </p>
                    {transaction.note ? (
                      <p className="mt-1 truncate text-xs text-text-muted">{transaction.note}</p>
                    ) : null}
                    {transaction.affectsBalance === false ? (
                      <p className="mt-1 text-xs font-medium text-warning">
                        {t('moneyPage.noBalanceImpact')}
                      </p>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      'shrink-0 text-sm font-semibold tabular-nums',
                      transaction.affectsBalance === false
                        ? 'text-text-muted'
                        : transaction.direction === 'credit'
                          ? 'text-positive'
                          : 'text-negative'
                    )}
                  >
                    {formatCurrency(transaction.amount, language)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {open ? <MoneyModal onClose={() => setOpen(false)} /> : null}
    </main>
  );
}
