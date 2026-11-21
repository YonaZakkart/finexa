import { Scale, Sparkles, TrendingDown, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { useAppStore } from '@/stores/app.store';
import { selectBalance, selectNetBalance, selectTotalDebt } from '@/stores/selectors';

function BalanceCard() {
  const { t } = useTranslation('dashboard');
  const currentBalance = useAppStore(selectBalance);
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const tone =
    currentBalance < 0 ? 'text-negative' : currentBalance > 0 ? 'text-positive' : 'text-text';

  return (
    <Card className="p-5" aria-labelledby="balance-title">
      <div className="flex items-center justify-between">
        <h2 id="balance-title" className="text-sm font-medium text-text-muted">
          {t('balance')}
        </h2>
        <Wallet aria-hidden="true" className="size-5 text-accent" />
      </div>
      <p
        aria-live="polite"
        className={cn('mt-3 text-4xl font-semibold tracking-tight tabular-nums', tone)}
      >
        {formatCurrency(currentBalance, language)}
      </p>
      {currentBalance < 0 ? (
        <p className="mt-2 text-xs font-medium text-negative">{t('negativeBalance')}</p>
      ) : null}
    </Card>
  );
}

function DebtCard() {
  const { t } = useTranslation('dashboard');
  const totalDebt = useAppStore(selectTotalDebt);
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const tone = totalDebt > 0 ? 'text-negative' : 'text-text-muted';

  return (
    <Card className="p-5" aria-labelledby="debt-title">
      <div className="flex items-center justify-between">
        <h2 id="debt-title" className="text-sm font-medium text-text-muted">
          {t('debt')}
        </h2>
        <TrendingDown aria-hidden="true" className={cn('size-5', tone)} />
      </div>
      <p
        aria-live="polite"
        className={cn('mt-3 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl', tone)}
      >
        {formatCurrency(totalDebt, language)}
      </p>
    </Card>
  );
}

function NetCard() {
  const { t } = useTranslation('dashboard');
  const netBalance = useAppStore(selectNetBalance);
  const language = useAppStore((state) => state.settings?.language ?? 'es');

  return (
    <Card className="p-5" aria-labelledby="net-title">
      <div className="flex items-center justify-between">
        <h2 id="net-title" className="text-sm font-medium text-text-muted">
          {t('net')}
        </h2>
        <Scale aria-hidden="true" className="size-5 text-text-muted" />
      </div>
      <p
        aria-live="polite"
        className={cn(
          'mt-3 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl',
          netBalance < 0 ? 'text-negative' : 'text-text'
        )}
      >
        {formatCurrency(netBalance, language)}
      </p>
    </Card>
  );
}

function EmptyState() {
  const { t } = useTranslation('dashboard');
  const isEmpty = useAppStore(
    (state) => state.transactions.length === 0 && state.debts.length === 0
  );

  if (!isEmpty) {
    return null;
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <Sparkles aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="text-sm font-medium">{t('empty.title')}</p>
          <p className="mt-1 text-sm text-text-muted">{t('empty.text')}</p>
        </div>
      </div>
    </Card>
  );
}

function QuickActions() {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  return (
    <Card className="p-5" aria-labelledby="actions-title">
      <h3 id="actions-title" className="text-sm font-medium text-text-muted">
        {t('quickActions')}
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={() => navigate('/money')}>
          <Wallet aria-hidden="true" className="size-5 text-accent" />
          {t('manageMoney')}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/debts')}>
          <TrendingDown aria-hidden="true" className="size-5 text-negative" />
          {t('manageDebts')}
        </Button>
      </div>
    </Card>
  );
}

export function Dashboard() {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header>
        <p className="text-xs font-medium tracking-[0.2em] text-text-muted uppercase">
          {tCommon('appName')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t('title')}</h1>
      </header>
      <BalanceCard />
      <div className="grid grid-cols-2 gap-4">
        <DebtCard />
        <NetCard />
      </div>
      <EmptyState />
      <QuickActions />
    </main>
  );
}
