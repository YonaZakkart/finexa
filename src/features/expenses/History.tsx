import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate } from '@/lib/format';

function formatISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function History() {
  const { t: tCommon } = useTranslation('common');
  const { t: tExpenses } = useTranslation('expenses');
  const { i18n } = useTranslation('common');
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => formatISO(new Date()));

  const handleDateChange = (delta: number) => {
    setCurrentDate((prev) => formatISO(addDays(new Date(prev), delta)));
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(e.target.value);
  };

  const isToday = currentDate === formatISO(new Date());
  const isYesterday = currentDate === formatISO(addDays(new Date(), -1));

  const expenses = [
    { id: '1', amount: 12.5, category: 'daily.food', note: 'Almuerzo', time: '13:30' },
    { id: '2', amount: 4.2, category: 'daily.coffee_snacks', note: 'Café', time: '16:45' },
  ];

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-1 rounded-md hover:bg-surface"
          aria-label={tCommon('close')}
        >
          <Calendar aria-hidden="true" className="size-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{tExpenses('history')}</h1>
      </header>

      <div className="flex items-center justify-between gap-2 p-3 rounded-md border border-border bg-surface">
        <button
          type="button"
          onClick={() => handleDateChange(-1)}
          className="p-1 rounded-md hover:bg-surface-strong"
          aria-label={tCommon('previous')}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-sm font-medium">
            {isToday
              ? tExpenses('today')
              : isYesterday
                ? tExpenses('yesterday')
                : formatDate(currentDate, i18n.resolvedLanguage?.startsWith('es') ? 'es' : 'en')}
          </span>
          <input
            type="date"
            value={currentDate}
            onChange={handleDatePickerChange}
            className="w-40 rounded-md border border-border bg-surface px-2 py-1 text-sm text-text"
          />
        </div>
        <button
          type="button"
          onClick={() => handleDateChange(1)}
          disabled={isToday}
          className={cn(
            'p-1 rounded-md transition-colors',
            isToday ? 'opacity-50 cursor-not-allowed' : 'hover:bg-surface-strong'
          )}
          aria-label={tCommon('next')}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>

      <Card className="p-5 space-y-4" aria-labelledby="expenses-title">
        <header className="flex items-center justify-between">
          <h2 id="expenses-title" className="text-sm font-medium text-text-muted">
            {tExpenses('expenses')}
          </h2>
          <span className="font-semibold tabular-nums">{formatCurrency(total, 'es')}</span>
        </header>

        {expenses.length === 0 ? (
          <p className="text-center text-text-muted py-8">{tExpenses('noExpenses')}</p>
        ) : (
          <ul className="space-y-3">
            {expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-3 p-3 rounded-md border border-border bg-surface"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{expense.category}</p>
                  <p className="text-xs text-text-muted truncate">{expense.note}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold text-negative tabular-nums">
                    -{formatCurrency(expense.amount, 'es')}
                  </span>
                  <span className="text-xs text-text-muted">{expense.time}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
