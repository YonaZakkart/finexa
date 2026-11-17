import { ArrowLeft, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { categories } from '@/features/expenses/categories';

export function NewExpense() {
  const { t } = useTranslation('expenses');
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const subcategories = category
    ? (categories.find((c) => c.id === category)?.subcategories ?? [])
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || (subcategories.length > 0 && !subcategory)) return;
    // TODO: call expense service
    navigate('/history');
  };

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="p-1 rounded-md hover:bg-surface"
          aria-label={useTranslation('common').t('close')}
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{t('register')}</h1>
      </header>

      <Card className="p-5 space-y-5" aria-labelledby="form-title">
        <h2 id="form-title" className="text-sm font-medium text-text-muted">
          {t('register')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div>
            <Select
              label={t('category')}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory('');
              }}
              className="w-full"
              id="category-select"
            >
              <option value="">{t('selectCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(c.labelKey)}
                </option>
              ))}
            </Select>
          </div>

          {subcategories.length > 0 && (
            <Select
              label={t('subcategory')}
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
            >
              <option value="">{t('selectSubcategory')}</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {t(s.labelKey)}
                </option>
              ))}
            </Select>
          )}

          <Input
            label={t('date')}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label htmlFor="note-input" className="block text-sm font-medium">
              {t('note')}
            </label>
            <textarea
              id="note-input"
              rows={3}
              className="min-h-24 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-text placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none"
              placeholder={t('notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full">
            <PlusCircle aria-hidden="true" className="size-4" />
            {t('save')}
          </Button>
        </form>
      </Card>
    </main>
  );
}
