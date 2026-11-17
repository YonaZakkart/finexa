import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { TransactionError } from '@/features/balance/errors';
import { record } from '@/features/balance/transactions.service';
import { getLocalDateString } from '@/lib/date';
import { roundMoney } from '@/lib/money';

type MoneyType = 'income' | 'adjustment';
type MoneyDirection = 'credit' | 'debit';

export function MoneyModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const [type, setType] = useState<MoneyType>('income');
  const [direction, setDirection] = useState<MoneyDirection>('credit');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getLocalDateString);
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const parsedAmount = Number.parseFloat(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t('money.invalidAmount'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await record({
        type,
        direction: type === 'income' ? 'credit' : direction,
        amount: roundMoney(parsedAmount),
        date,
        note: source.trim() || undefined,
      });
      onClose();
    } catch (caught) {
      setError(caught instanceof TransactionError ? tErrors(caught.code) : t('money.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={handleClose}
      title={t('money.title')}
      description={t('money.description')}
      closeLabel={tCommon('close')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Select
          label={t('money.type')}
          value={type}
          onChange={(event) => setType(event.target.value as MoneyType)}
        >
          <option value="income">{t('money.income')}</option>
          <option value="adjustment">{t('money.adjustment')}</option>
        </Select>

        {type === 'adjustment' ? (
          <Select
            label={t('money.direction')}
            value={direction}
            onChange={(event) => setDirection(event.target.value as MoneyDirection)}
          >
            <option value="credit">{t('money.add')}</option>
            <option value="debit">{t('money.subtract')}</option>
          </Select>
        ) : null}

        <Input
          label={t('money.amount')}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
          required
        />

        <Input
          label={t('money.date')}
          type="date"
          value={date}
          max={getLocalDateString()}
          onChange={(event) => setDate(event.target.value)}
          required
        />

        <Input
          label={t('money.source')}
          value={source}
          maxLength={280}
          onChange={(event) => setSource(event.target.value)}
          placeholder={t('money.sourcePlaceholder')}
        />

        {error ? (
          <p role="alert" className="text-sm text-negative">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {tCommon('cancel')}
          </Button>
          <Button type="submit" className="flex-1" isLoading={isSubmitting}>
            {t('money.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
