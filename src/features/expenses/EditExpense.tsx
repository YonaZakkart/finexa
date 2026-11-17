import { ArrowLeft } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { TransactionError } from '@/features/balance/errors';
import { type ExpensePatch, updateExpense } from '@/features/balance/transactions.service';
import { MAX_NOTE_LENGTH } from '@/features/balance/validation';
import { categories, getCategory } from '@/features/expenses/categories';
import { getLocalDateString } from '@/lib/date';
import { formatCurrency } from '@/lib/format';
import { roundMoney } from '@/lib/money';
import { useAppStore } from '@/stores/app.store';
import type { Transaction } from '@/types';

type PendingChoice = 'save' | 'yes' | 'no';

interface ImpactState {
  patch: ExpensePatch;
  delta: number;
  newAmount: number;
}

function ExpenseNotFound() {
  const { t } = useTranslation('expenses');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/history')}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text"
          aria-label={tCommon('back')}
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t('editTitle')}</h1>
      </header>
      <Card className="p-5 text-center">
        <p className="text-sm font-medium">{t('notFound')}</p>
        <p className="mt-1 text-sm text-text-muted">{t('notFoundHint')}</p>
        <Button className="mt-4" onClick={() => navigate('/history')}>
          {t('backToHistory')}
        </Button>
      </Card>
    </main>
  );
}

function ImpactDialog({
  impact,
  expense,
  language,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  impact: ImpactState;
  expense: Transaction;
  language: 'es' | 'en';
  pending: PendingChoice | null;
  error: string | null;
  onCancel: () => void;
  onConfirm: (affectsBalance: boolean) => void;
}) {
  const { t } = useTranslation('expenses');
  const { t: tCommon } = useTranslation('common');
  const deltaLabel = `${impact.delta > 0 ? '+' : ''}${formatCurrency(impact.delta, language)}`;

  return (
    <Modal
      open
      onClose={onCancel}
      title={t('impact.title')}
      description={t('impact.description', {
        oldAmount: formatCurrency(expense.amount, language),
        newAmount: formatCurrency(impact.newAmount, language),
        delta: deltaLabel,
      })}
      closeLabel={tCommon('close')}
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={pending !== null}>
            {tCommon('cancel')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => onConfirm(false)}
            isLoading={pending === 'no'}
            disabled={pending !== null}
          >
            {t('impact.no')}
          </Button>
          <Button
            onClick={() => onConfirm(true)}
            isLoading={pending === 'yes'}
            disabled={pending !== null}
          >
            {t('impact.yes')}
          </Button>
        </div>
      }
    >
      {error ? (
        <p role="alert" className="text-sm text-negative">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}

function EditExpenseForm({ expense }: { expense: Transaction }) {
  const { t } = useTranslation('expenses');
  const { t: tCommon } = useTranslation('common');
  const { t: tCategories } = useTranslation('categories');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const [amount, setAmount] = useState(() => String(expense.amount));
  const [category, setCategory] = useState(expense.category ?? '');
  const [subcategory, setSubcategory] = useState(expense.subcategory ?? '');
  const [note, setNote] = useState(expense.note ?? '');
  const [date, setDate] = useState(expense.date);
  const [error, setError] = useState<string | null>(null);
  const [impact, setImpact] = useState<ImpactState | null>(null);
  const [pending, setPending] = useState<PendingChoice | null>(null);

  const subcategories = category ? (getCategory(category)?.subcategories ?? []) : [];
  const isSubmitting = pending !== null;

  const save = async (patch: ExpensePatch, affectsBalance: boolean, choice: PendingChoice) => {
    setPending(choice);
    setError(null);

    try {
      await updateExpense(expense.id, patch, affectsBalance);
      navigate(`/history?date=${patch.date ?? expense.date}`);
    } catch (caught) {
      setError(caught instanceof TransactionError ? tErrors(caught.code) : t('editError'));
    } finally {
      setPending(null);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const parsedAmount = Number.parseFloat(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(tErrors('invalidAmount'));
      return;
    }

    if (!category) {
      setError(tErrors('missingCategory'));
      return;
    }

    if (subcategories.length > 0 && !subcategory) {
      setError(tErrors('missingSubcategory'));
      return;
    }

    const nextAmount = roundMoney(parsedAmount);
    const patch: ExpensePatch = {
      amount: nextAmount,
      category,
      subcategory: subcategory || undefined,
      note: note.trim() || undefined,
      date,
    };
    const delta = roundMoney(nextAmount - expense.amount);

    if (delta === 0) {
      void save(patch, false, 'save');
      return;
    }

    setError(null);
    setImpact({ patch, delta, newAmount: nextAmount });
  };

  const handleImpactCancel = () => {
    if (!isSubmitting) {
      setImpact(null);
      setError(null);
    }
  };

  const handleImpactConfirm = (affectsBalance: boolean) => {
    if (!impact || isSubmitting) {
      return;
    }

    void save(impact.patch, affectsBalance, affectsBalance ? 'yes' : 'no');
  };

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/history')}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text"
          aria-label={tCommon('back')}
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t('editTitle')}</h1>
      </header>

      <Card className="p-5">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Input
            label={t('amount')}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            required
          />

          <Select
            label={t('category')}
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setSubcategory('');
            }}
          >
            <option value="">{t('selectCategory')}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {tCategories(item.labelKey)}
              </option>
            ))}
          </Select>

          {subcategories.length > 0 ? (
            <Select
              label={t('subcategory')}
              value={subcategory}
              onChange={(event) => setSubcategory(event.target.value)}
            >
              <option value="">{t('selectSubcategory')}</option>
              {subcategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {tCategories(item.labelKey)}
                </option>
              ))}
            </Select>
          ) : null}

          <Input
            label={t('date')}
            type="date"
            value={date}
            max={getLocalDateString()}
            onChange={(event) => setDate(event.target.value)}
            required
          />

          <Textarea
            label={t('note')}
            placeholder={t('notePlaceholder')}
            maxLength={MAX_NOTE_LENGTH}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />

          {error && !impact ? (
            <p role="alert" className="text-sm text-negative">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            isLoading={pending === 'save'}
            disabled={isSubmitting}
          >
            {t('saveChanges')}
          </Button>
        </form>
      </Card>

      {impact ? (
        <ImpactDialog
          impact={impact}
          expense={expense}
          language={language}
          pending={pending}
          error={error}
          onCancel={handleImpactCancel}
          onConfirm={handleImpactConfirm}
        />
      ) : null}
    </main>
  );
}

export function EditExpense() {
  const { id } = useParams<{ id: string }>();
  const expense = useAppStore((state) =>
    state.transactions.find(
      (transaction) => transaction.id === id && transaction.type === 'expense'
    )
  );

  if (!expense) {
    return <ExpenseNotFound />;
  }

  return <EditExpenseForm expense={expense} />;
}
