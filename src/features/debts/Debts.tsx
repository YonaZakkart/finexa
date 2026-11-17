import { CheckCircle2, Edit2, PlusCircle, Trash2, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';

export function Debts() {
  const { t } = useTranslation('debts');
  const tCommon = useTranslation('common').t;
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [debts] = useState<
    Array<{ id: string; name: string; amount: number; status: 'active' | 'paid' }>
  >([
    { id: '1', name: 'Tarjeta crédito', amount: 320, status: 'active' as const },
    { id: '2', name: 'Préstamo personal', amount: 1500, status: 'active' as const },
  ]);

  const activeDebts = debts.filter((d) => d.status === 'active');
  const paidDebts = debts.filter((d) => d.status === 'paid');
  const totalActive = activeDebts.reduce((s, d) => s + d.amount, 0);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 p-6 pb-24">
      <header className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-1 rounded-md hover:bg-surface"
          aria-label={tCommon('close')}
        >
          <TrendingDown aria-hidden="true" className="size-5" />
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
          {formatCurrency(totalActive, 'es')}
        </p>
      </Card>

      <Card className="p-5 space-y-4" aria-labelledby="debts-title">
        <header className="flex items-center justify-between">
          <h2 id="debts-title" className="text-sm font-medium text-text-muted">
            {t('yourDebts')}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            <PlusCircle aria-hidden="true" className="size-4" />
            {t('addDebt')}
          </Button>
        </header>

        {activeDebts.length === 0 && paidDebts.length === 0 ? (
          <p className="text-center text-text-muted py-8">{t('noDebts')}</p>
        ) : (
          <>
            {activeDebts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  {t('active')}
                </h3>
                <ul className="space-y-2" role="list">
                  {activeDebts.map((debt) => (
                    <li
                      key={debt.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-md border border-border bg-surface"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{debt.name}</p>
                        <p className="text-xs text-text-muted">
                          {t('amount')}: {formatCurrency(debt.amount, 'es')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            /* mark paid */
                          }}
                        >
                          <CheckCircle2 aria-hidden="true" className="size-4" />
                          {t('markPaid')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            /* edit */
                          }}
                        >
                          <Edit2 aria-hidden="true" className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {paidDebts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide">
                  {t('paid')}
                </h3>
                <ul className="space-y-2" role="list">
                  {paidDebts.map((debt) => (
                    <li
                      key={debt.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-md border border-border bg-surface opacity-60"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{debt.name}</p>
                        <p className="text-xs text-text-muted">
                          {t('amount')}: {formatCurrency(debt.amount, 'es')}
                        </p>
                      </div>
                      <span className="text-xs text-positive font-medium">{t('paid')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Card>

      {showForm && (
        <Card
          className={cn(
            'p-5 space-y-4 fixed inset-0 z-50 m-auto max-w-md max-h-[90vh] overflow-y-auto glass-card glass-card--strong',
            'fixed inset-0 z-50 m-auto max-w-md max-h-[90vh] overflow-y-auto'
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-debt-title"
        >
          <header className="flex items-center justify-between">
            <h3 id="add-debt-title" className="text-lg font-semibold">
              {t('addDebt')}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="p-1 rounded-md hover:bg-surface"
              aria-label={tCommon('close')}
            >
              <Trash2 aria-hidden="true" className="size-5" />
            </button>
          </header>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name && amount) {
                setShowForm(false);
                setName('');
                setAmount('');
              }
            }}
            className="space-y-4"
          >
            <Input
              label={t('name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('debtNamePlaceholder')}
              required
            />
            <Input
              label={t('amount')}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {t('save')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setName('');
                  setAmount('');
                }}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </main>
  );
}
