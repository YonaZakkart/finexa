import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import type { PortfolioType } from '@/types';
import { InvestmentError } from './investments.errors';
import { createPortfolio } from './investments.service';
import { MAX_BROKER_LENGTH, MAX_PORTFOLIO_NAME_LENGTH, PORTFOLIO_TYPES } from './validation';

export function NewPortfolioModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('investments');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const [name, setName] = useState('');
  const [type, setType] = useState<PortfolioType>('stocks');
  const [broker, setBroker] = useState('');
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
    const trimmedBroker = broker.trim();

    if (trimmedName.length === 0 || trimmedName.length > MAX_PORTFOLIO_NAME_LENGTH) {
      setError(tErrors('invalidPortfolioName'));
      return;
    }

    if (trimmedBroker.length === 0 || trimmedBroker.length > MAX_BROKER_LENGTH) {
      setError(tErrors('invalidPortfolioBroker'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createPortfolio({ name: trimmedName, type, broker: trimmedBroker });
      onClose();
    } catch (caught) {
      setError(caught instanceof InvestmentError ? tErrors(caught.code) : t('form.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={handleClose}
      title={t('newPortfolio')}
      description={t('form.description')}
      closeLabel={tCommon('close')}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label={t('form.name')}
          value={name}
          maxLength={MAX_PORTFOLIO_NAME_LENGTH}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('form.namePlaceholder')}
          required
        />

        <Select
          label={t('form.type')}
          value={type}
          onChange={(event) => setType(event.target.value as PortfolioType)}
        >
          {PORTFOLIO_TYPES.map((portfolioType) => (
            <option key={portfolioType} value={portfolioType}>
              {t(`types.${portfolioType}`)}
            </option>
          ))}
        </Select>

        <Input
          label={t('form.broker')}
          value={broker}
          maxLength={MAX_BROKER_LENGTH}
          onChange={(event) => setBroker(event.target.value)}
          placeholder={t('form.brokerPlaceholder')}
          hint={t('form.brokerHint')}
          list="broker-suggestions"
          required
        />
        <datalist id="broker-suggestions">
          <option value="Hapi" />
          <option value="XTB" />
          <option value="Interactive Brokers" />
          <option value="Binance" />
          <option value="Coinbase" />
        </datalist>

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
