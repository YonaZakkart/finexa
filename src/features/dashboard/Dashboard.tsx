import { MinusCircle, PlusCircle, TrendingDown, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/format';
import { useAppStore } from '@/stores/app.store';

function BalanceCard() {
  const { t } = useTranslation('dashboard');
  const { transactions, debts, settings } = useAppStore();
  const balance = transactions
    .filter((t) => t.direction === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.direction === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = balance - expenses;
  const totalDebt = debts
    .filter((d) => d.status === 'active')
    .reduce((sum, d) => sum + d.amount, 0);
  const netBalance = currentBalance - totalDebt;

  return (
    <Card className="p-5" aria-labelledby="balance-title">
      <div className="flex items-center justify-between">
        <h2 id="balance-title" className="text-sm font-medium text-text-muted">
          {t('balance')}
        </h2>
        <Wallet aria-hidden="true" className="size-5 text-accent" />
      </div>
      <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">
        {formatCurrency(currentBalance, settings?.language ?? 'es')}
      </p>
      <div className="mt-4 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2 text-text-muted">
          <TrendingDown aria-hidden="true" className="size-4 text-negative" />
          <span>
            {t('debt')}: {formatCurrency(-totalDebt, settings?.language ?? 'es')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          <MinusCircle aria-hidden="true" className="size-4 text-text-muted" />
          <span>
            {t('net')}: {formatCurrency(netBalance, settings?.language ?? 'es')}
          </span>
        </div>
      </div>
    </Card>
  );
}

function QuickActions() {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  return (
    <Card className="p-5 grid grid-cols-2 gap-3" aria-labelledby="actions-title">
      <h3 id="actions-title" className="col-span-2 text-sm font-medium text-text-muted">
        {t('quickActions')}
      </h3>
      <button
        type="button"
        onClick={() => navigate('/expenses/new')}
        className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-text font-medium hover:bg-surface-strong transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <PlusCircle aria-hidden="true" className="size-5 text-accent" />
        <span>{t('addMoney')}</span>
      </button>
      <button
        type="button"
        onClick={() => navigate('/debts')}
        className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-text font-medium hover:bg-surface-strong transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <TrendingDown aria-hidden="true" className="size-5 text-negative" />
        <span>{t('manageDebts')}</span>
      </button>
    </Card>
  );
}

export function Dashboard() {
  const { t } = useTranslation('dashboard');

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 p-6 pb-24">
      <header>
        <p className="text-xs font-medium tracking-[0.2em] text-text-muted uppercase">
          {useTranslation('common').t('appName')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t('title')}</h1>
      </header>
      <BalanceCard />
      <QuickActions />
    </main>
  );
}
