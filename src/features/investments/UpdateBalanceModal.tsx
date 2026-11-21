import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { Portfolio } from '@/types';
import { InvestmentError } from './investments.errors';
import { updateBalance } from './investments.service';

export function UpdateBalanceModal({
  portfolio,
  onClose,
}: {
  portfolio: Portfolio;
  onClose: () => void;
}) {
  const { t } = useTranslation('investments');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const [balance, setBalance] = useState(String(portfolio.currentBalance));
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

    const parsed = Number.parseFloat(balance);

    if (balance.trim() === '' || !Number.isFinite(parsed)) {
      setError(t('balance.required'));
      return;
    }

    if (parsed < 0) {
      setError(tErrors('invalidBalance'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateBalance(portfolio.id, parsed);
      onClose();
    } catch (caught) {
      setError(caught instanceof InvestmentError ? tErrors(caught.code) : t('balance.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={handleClose}
      title={t('balance.title')}
      description={t('balance.description')}
      closeLabel={tCommon('close')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <p className="text-sm text-text-muted">
          {portfolio.name} · {portfolio.broker}
        </p>

        <Input
          label={t('balance.value')}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={balance}
          onChange={(event) => setBalance(event.target.value)}
          hint={t('balance.hint')}
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
