import { Plus, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Button, Card, Input } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import type { SupportedLanguage } from '@/lib/language';

// Temporary design-system preview; replaced by the real shell in T07.
export function App() {
  const { t: tCommon, i18n } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');
  const { t: tExpenses } = useTranslation('expenses');
  const language: SupportedLanguage = (i18n.resolvedLanguage ?? 'en').startsWith('es')
    ? 'es'
    : 'en';

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-5 p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-text-muted uppercase">
            {tCommon('appName')}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{tDashboard('title')}</h1>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <LanguageSwitcher />
          <span className="font-mono text-xs text-text-muted">v{__APP_VERSION__}</span>
        </div>
      </header>

      <Card className="p-5" aria-labelledby="balance-title">
        <div className="flex items-center justify-between">
          <h2 id="balance-title" className="text-sm font-medium text-text-muted">
            {tDashboard('balance')}
          </h2>
          <Wallet aria-hidden="true" className="size-5 text-accent" />
        </div>
        <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums">
          {formatCurrency(1250, language)}
        </p>
        <div className="mt-4 flex gap-6 text-sm">
          <p className="text-text-muted">
            {tDashboard('debt')}{' '}
            <span className="ml-1 font-medium text-negative tabular-nums">
              {formatCurrency(-320, language)}
            </span>
          </p>
          <p className="text-text-muted">
            {tDashboard('net')}{' '}
            <span className="ml-1 font-medium text-positive tabular-nums">
              {formatCurrency(930, language)}
            </span>
          </p>
        </div>
      </Card>

      <Card strength="strong" className="p-5" aria-labelledby="expense-title">
        <h2 id="expense-title" className="text-sm font-medium text-text-muted">
          {tExpenses('register')}
        </h2>
        <div className="mt-4">
          <Input
            id="demo-amount"
            label={tExpenses('amount')}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
          />
        </div>
        <Button className="mt-3">
          <Plus aria-hidden="true" className="size-4" />
          {tExpenses('register')}
        </Button>
      </Card>
    </main>
  );
}
