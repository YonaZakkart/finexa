import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TransactionError } from '@/features/balance/errors';
import { payDebt } from '@/features/balance/transactions.service';
import { formatCurrency } from '@/lib/format';
import { useAppStore } from '@/stores/app.store';
import type { Debt } from '@/types';

type PendingChoice = 'yes' | 'no';

export function PayDebtDialog({ debt, onClose }: { debt: Debt; onClose: () => void }) {
  const { t } = useTranslation('debts');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const [pending, setPending] = useState<PendingChoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!pending) {
      onClose();
    }
  };

  const handlePay = async (affectsBalance: boolean) => {
    if (pending) {
      return;
    }

    setPending(affectsBalance ? 'yes' : 'no');
    setError(null);

    try {
      await payDebt(debt.id, affectsBalance);
      onClose();
    } catch (caught) {
      setError(caught instanceof TransactionError ? tErrors(caught.code) : t('payment.error'));
    } finally {
      setPending(null);
    }
  };

  return (
    <Modal
      open
      onClose={handleClose}
      title={t('payment.title', { name: debt.name })}
      description={t('payment.description', {
        amount: formatCurrency(debt.amount, language),
      })}
      closeLabel={tCommon('close')}
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={handleClose} disabled={pending !== null}>
            {tCommon('cancel')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handlePay(false)}
            isLoading={pending === 'no'}
            disabled={pending !== null}
          >
            {t('payment.no')}
          </Button>
          <Button
            onClick={() => void handlePay(true)}
            isLoading={pending === 'yes'}
            disabled={pending !== null}
          >
            {t('payment.yes')}
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
