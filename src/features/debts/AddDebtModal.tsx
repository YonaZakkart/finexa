import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TransactionError } from '@/features/balance/errors';
import { roundMoney } from '@/lib/money';
import type { Debt } from '@/types';
import { MAX_DEBT_NAME_LENGTH } from './constants';
import { createDebt, editDebt } from './debts.service';

export function AddDebtModal({ debt, onClose }: { debt?: Debt; onClose: () => void }) {
  const { t } = useTranslation('debts');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const [name, setName] = useState(debt?.name ?? '');
  const [amount, setAmount] = useState(debt ? String(debt.amount) : '');
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

    const trimmedName = name.trim();
    const parsedAmount = Number.parseFloat(amount);

    if (trimmedName.length === 0 || trimmedName.length > MAX_DEBT_NAME_LENGTH) {
      setError(tErrors('invalidDebtName'));
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(tErrors('invalidAmount'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (debt) {
        await editDebt(debt.id, { name: trimmedName, amount: roundMoney(parsedAmount) });
      } else {
        await createDebt({ name: trimmedName, amount: roundMoney(parsedAmount) });
      }
      onClose();
    } catch (caught) {
      setError(caught instanceof TransactionError ? tErrors(caught.code) : t('form.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={handleClose}
      title={debt ? t('editDebt') : t('addDebt')}
      description={t('form.description')}
      closeLabel={tCommon('close')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label={t('name')}
          value={name}
          maxLength={MAX_DEBT_NAME_LENGTH}
          onChange={(event) => setName(event.target.value)}
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
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.00"
          required
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
            {tCommon('save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
