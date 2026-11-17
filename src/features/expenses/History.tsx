import { ArrowLeft, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { getCategory, getSubcategory } from '@/features/expenses/categories';
import { listExpensesByDate } from '@/features/transactions/transactions.repository';
import { addDaysToDate, getLocalDateString } from '@/lib/date';
import { formatCurrency, formatDate, formatTime } from '@/lib/format';
import { roundMoney } from '@/lib/money';
import { useAppStore } from '@/stores/app.store';
import type { Transaction } from '@/types';

export function History() {
  const { t } = useTranslation('expenses');
  const { t: tCommon } = useTranslation('common');
  const { t: tCategories } = useTranslation('categories');
  const navigate = useNavigate();
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const [currentDate, setCurrentDate] = useState(getLocalDateString);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const today = getLocalDateString();
  const yesterday = addDaysToDate(today, -1);
  const isToday = currentDate === today;
  const isYesterday = currentDate === yesterday;
  const displayDate = isToday
    ? t('today')
    : isYesterday
      ? t('yesterday')
      : formatDate(currentDate, language);

  const loadExpenses = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    try {
      const rows = await listExpensesByDate(currentDate);

      if (requestId === requestIdRef.current) {
        setExpenses(rows);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError(t('loadError'));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentDate, t]);

  useEffect(() => {
    void loadExpenses();

    const unsubscribe = useAppStore.subscribe((state, previous) => {
      if (state.transactions !== previous.transactions) {
        void loadExpenses();
      }
    });

    return () => {
      requestIdRef.current += 1;
      unsubscribe();
    };
  }, [loadExpenses]);

  const total = roundMoney(expenses.reduce((sum, expense) => sum + expense.amount, 0));

  const handlePrevious = () => {
    setCurrentDate((value) => addDaysToDate(value, -1));
  };

  const handleNext = () => {
    setCurrentDate((value) => {
      const next = addDaysToDate(value, 1);
      return next <= today ? next : value;
    });
  };

  const handleDateInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    if (value && value <= today) {
      setCurrentDate(value);
    }
  };

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
        <h1 className="text-2xl font-semibold tracking-tight">{t('history')}</h1>
      </header>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrevious} aria-label={t('previousDay')}>
            <ChevronLeft aria-hidden="true" className="size-5" />
          </Button>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="text-sm font-medium">{displayDate}</span>
            <input
              type="date"
              value={currentDate}
              max={today}
              onChange={handleDateInput}
              aria-label={t('date')}
              className="min-h-11 w-full max-w-44 rounded-md border border-border bg-surface px-2 py-1 text-sm text-text transition-colors focus:border-accent focus:outline-none"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            aria-label={t('nextDay')}
            disabled={currentDate >= today}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant={isToday ? 'primary' : 'secondary'}
            onClick={() => setCurrentDate(today)}
            aria-pressed={isToday}
          >
            {t('today')}
          </Button>
          <Button
            size="sm"
            variant={isYesterday ? 'primary' : 'secondary'}
            onClick={() => setCurrentDate(yesterday)}
            aria-pressed={isYesterday}
          >
            {t('yesterday')}
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-4" aria-labelledby="expenses-title">
        <header className="flex items-center justify-between gap-3">
          <h2 id="expenses-title" className="text-sm font-medium text-text-muted">
            {t('listTitle')}
          </h2>
          {!isLoading && !error ? (
            <span className="text-sm font-semibold tabular-nums text-negative">
              {formatCurrency(total, language)}
            </span>
          ) : null}
        </header>

        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            <span className="sr-only" role="status">
              {t('loading')}
            </span>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ) : error ? (
          <div className="space-y-3 text-center">
            <p role="alert" className="text-sm text-negative">
              {error}
            </p>
            <Button variant="secondary" size="sm" onClick={() => void loadExpenses()}>
              {tCommon('retry')}
            </Button>
          </div>
        ) : expenses.length === 0 ? (
          <p className="py-8 text-center text-text-muted">{t('noExpenses')}</p>
        ) : (
          <ul className="space-y-3">
            {expenses.map((expense) => {
              const category = expense.category ? getCategory(expense.category) : undefined;
              const subcategory =
                category && expense.subcategory
                  ? getSubcategory(category.id, expense.subcategory)
                  : undefined;
              const categoryLabel = category
                ? tCategories(category.labelKey)
                : t('unknownCategory');
              const subcategoryLabel = subcategory ? tCategories(subcategory.labelKey) : null;

              return (
                <li key={expense.id} className="rounded-md border border-border bg-surface p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{categoryLabel}</p>
                      {subcategoryLabel ? (
                        <p className="truncate text-xs text-text-muted">{subcategoryLabel}</p>
                      ) : null}
                      {expense.note ? (
                        <p className="mt-1 truncate text-xs text-text-muted">{expense.note}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-semibold text-negative tabular-nums">
                        -{formatCurrency(expense.amount, language)}
                      </span>
                      <span className="text-xs text-text-muted">
                        {formatTime(expense.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Link
                      to={`/expenses/${expense.id}/edit`}
                      aria-label={`${t('edit')} ${categoryLabel}`}
                      className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-xs font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
                    >
                      <Edit2 aria-hidden="true" className="size-4" />
                      {t('edit')}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
