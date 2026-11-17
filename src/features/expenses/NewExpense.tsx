import { ArrowLeft, PlusCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { TransactionError } from '@/features/balance/errors';
import { record } from '@/features/balance/transactions.service';
import { MAX_NOTE_LENGTH } from '@/features/balance/validation';
import { categories, getCategory } from '@/features/expenses/categories';
import { getLocalDateString } from '@/lib/date';
import { roundMoney } from '@/lib/money';

export function NewExpense() {
  const { t } = useTranslation('expenses');
  const { t: tCommon } = useTranslation('common');
  const { t: tCategories } = useTranslation('categories');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getLocalDateString);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subcategories = category ? (getCategory(category)?.subcategories ?? []) : [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const parsedAmount = Number.parseFloat(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSaved(false);
      setError(tErrors('invalidAmount'));
      return;
    }

    if (!category) {
      setSaved(false);
      setError(tErrors('missingCategory'));
      return;
    }

    if (subcategories.length > 0 && !subcategory) {
      setSaved(false);
      setError(tErrors('missingSubcategory'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSaved(false);

    try {
      await record({
        type: 'expense',
        direction: 'debit',
        amount: roundMoney(parsedAmount),
        date,
        category,
        subcategory: subcategory || undefined,
        note: note.trim() || undefined,
      });

      setAmount('');
      setCategory('');
      setSubcategory('');
      setNote('');
      setDate(getLocalDateString());
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof TransactionError ? tErrors(caught.code) : t('saveError'));
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-2xl font-semibold tracking-tight">{t('register')}</h1>
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

          {error ? (
            <p role="alert" className="text-sm text-negative">
              {error}
            </p>
          ) : null}

          {saved ? (
            <p role="status" className="text-sm text-positive">
              {t('saved')}
            </p>
          ) : null}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            <PlusCircle aria-hidden="true" className="size-4" />
            {t('save')}
          </Button>
        </form>
      </Card>
    </main>
  );
}
