import { ArrowLeft, Briefcase } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getLocalDateString, isValidLocalDate } from '@/lib/date';
import { formatCurrency } from '@/lib/format';
import { roundMoney, toCents } from '@/lib/money';
import { useAppStore } from '@/stores/app.store';
import { selectPortfolioInvestments } from '@/stores/selectors';
import { InvestmentError } from './investments.errors';
import { editInvestment, registerInvestment } from './investments.service';
import { calculatePortfolioTotals } from './totals';
import { type InvestmentInput, MAX_INVESTMENT_NOTE_LENGTH } from './validation';

function toAmount(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function defaultAvailable(deposit: string, bank: string, broker: string): string {
  return roundMoney(toAmount(deposit) - toAmount(bank) - toAmount(broker)).toFixed(2);
}

function calculatedResidual(available: string, purchase: string, commission: string): string {
  return roundMoney(toAmount(available) - toAmount(purchase) - toAmount(commission)).toFixed(2);
}

export function NewInvestment() {
  const { t } = useTranslation('investments');
  const { t: tCommon } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const navigate = useNavigate();
  const { portfolioId, investmentId } = useParams<{
    portfolioId: string;
    investmentId?: string;
  }>();
  const portfolios = useAppStore((state) => state.portfolios);
  const investments = useAppStore((state) => state.investments);
  const language = useAppStore((state) => state.settings?.language ?? 'es');
  const portfolio = portfolios.find((item) => item.id === portfolioId);
  const existing = investments.find((item) => item.id === investmentId);
  const isEditing = Boolean(existing);
  const portfolioInvestments = useMemo(
    () => (portfolioId ? selectPortfolioInvestments({ portfolios, investments }, portfolioId) : []),
    [portfolios, investments, portfolioId]
  );
  const residualBefore = useMemo(
    () => calculatePortfolioTotals(portfolioInvestments).residualTotal,
    [portfolioInvestments]
  );

  const [depositTotal, setDepositTotal] = useState(existing ? String(existing.depositTotal) : '');
  const [bankCommission, setBankCommission] = useState(
    existing ? String(existing.bankCommission) : ''
  );
  const [brokerCommission, setBrokerCommission] = useState(
    existing ? String(existing.brokerCommission) : ''
  );
  const [availableTotal, setAvailableTotal] = useState(
    existing ? String(existing.availableTotal) : ''
  );
  const [availableEdited, setAvailableEdited] = useState(Boolean(existing));
  const [purchaseAmount, setPurchaseAmount] = useState(
    existing ? String(existing.purchaseAmount) : ''
  );
  const [purchaseCommission, setPurchaseCommission] = useState(
    existing ? String(existing.purchaseCommission) : ''
  );
  const [commissionFromResidual, setCommissionFromResidual] = useState(
    existing?.commissionFromResidual ?? false
  );
  const [residualDelta, setResidualDelta] = useState(
    existing ? String(existing.residualDelta) : '0.00'
  );
  const [residualEdited, setResidualEdited] = useState(Boolean(existing));
  const [affectsBalance, setAffectsBalance] = useState(true);
  const [note, setNote] = useState(existing?.note ?? '');
  const [date, setDate] = useState(existing?.date ?? getLocalDateString());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableValue = toAmount(availableTotal);
  const purchaseValue = toAmount(purchaseAmount);
  const purchaseCommissionValue = toAmount(purchaseCommission);
  const residualValue = toAmount(residualDelta);
  const calculatedResidualValue = roundMoney(
    availableValue - purchaseValue - purchaseCommissionValue
  );
  const residualDifference = roundMoney(residualValue - calculatedResidualValue);
  const totalResidualAfter = roundMoney(residualBefore + residualValue);
  const purchaseRemainder = roundMoney(availableValue - purchaseValue);
  const residualAfterCommission = roundMoney(residualBefore - purchaseCommissionValue);
  const hasNegativeAvailableMode = !commissionFromResidual && toCents(residualValue) < 0;

  const updateResidual = (available: string, purchase: string, commission: string) => {
    if (!residualEdited) {
      setResidualDelta(calculatedResidual(available, purchase, commission));
    }
  };

  const handleDeposit = (value: string) => {
    setDepositTotal(value);

    if (!availableEdited) {
      const nextAvailable = defaultAvailable(value, bankCommission, brokerCommission);
      setAvailableTotal(nextAvailable);
      updateResidual(nextAvailable, purchaseAmount, purchaseCommission);
    }
  };

  const handleBankCommission = (value: string) => {
    setBankCommission(value);

    if (!availableEdited) {
      const nextAvailable = defaultAvailable(depositTotal, value, brokerCommission);
      setAvailableTotal(nextAvailable);
      updateResidual(nextAvailable, purchaseAmount, purchaseCommission);
    }
  };

  const handleBrokerCommission = (value: string) => {
    setBrokerCommission(value);

    if (!availableEdited) {
      const nextAvailable = defaultAvailable(depositTotal, bankCommission, value);
      setAvailableTotal(nextAvailable);
      updateResidual(nextAvailable, purchaseAmount, purchaseCommission);
    }
  };

  const handleAvailable = (value: string) => {
    setAvailableTotal(value);
    setAvailableEdited(true);
    updateResidual(value, purchaseAmount, purchaseCommission);
  };

  const handlePurchase = (value: string) => {
    setPurchaseAmount(value);
    updateResidual(availableTotal, value, purchaseCommission);
  };

  const handlePurchaseCommission = (value: string) => {
    setPurchaseCommission(value);
    updateResidual(availableTotal, purchaseAmount, value);
  };

  const resetAvailable = () => {
    const nextAvailable = defaultAvailable(depositTotal, bankCommission, brokerCommission);
    setAvailableTotal(nextAvailable);
    setAvailableEdited(false);
    updateResidual(nextAvailable, purchaseAmount, purchaseCommission);
  };

  const resetResidual = () => {
    setResidualDelta(calculatedResidual(availableTotal, purchaseAmount, purchaseCommission));
    setResidualEdited(false);
  };

  if (!portfolio || (investmentId && !existing)) {
    return (
      <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/investments')}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text"
            aria-label={tCommon('back')}
          >
            <ArrowLeft aria-hidden="true" className="size-5" />
          </button>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t(isEditing ? 'newInvestment.editTitle' : 'newInvestment.title')}
          </h1>
        </header>
        <EmptyState
          icon={<Briefcase aria-hidden="true" className="size-8" />}
          title={t('detail.notFound')}
          description={t('detail.notFoundHint')}
          action={
            <Button variant="secondary" onClick={() => navigate('/investments')}>
              {t('detail.backToPortfolios')}
            </Button>
          }
        />
      </main>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const deposit = roundMoney(toAmount(depositTotal));
    const bank = roundMoney(toAmount(bankCommission));
    const broker = roundMoney(toAmount(brokerCommission));
    const available = roundMoney(toAmount(availableTotal));
    const purchase = roundMoney(toAmount(purchaseAmount));
    const commission = roundMoney(toAmount(purchaseCommission));
    const residual = roundMoney(toAmount(residualDelta));

    if (deposit <= 0) {
      setError(tErrors('invalidDeposit'));
      return;
    }

    if (bank < 0 || broker < 0 || commission < 0) {
      setError(tErrors('invalidCommission'));
      return;
    }

    if (available < 0) {
      setError(tErrors('invalidAvailableTotal'));
      return;
    }

    if (toCents(available) > toCents(deposit)) {
      setError(tErrors('availableExceedsDeposit'));
      return;
    }

    if (purchase < 0) {
      setError(tErrors('invalidPurchase'));
      return;
    }

    if (toCents(purchase) > toCents(available)) {
      setError(tErrors('purchaseExceedsAvailable'));
      return;
    }

    if (!commissionFromResidual && toCents(residual) < 0) {
      setError(tErrors('residualNegativeNotAllowed'));
      return;
    }

    if (!isValidLocalDate(date) || date > getLocalDateString()) {
      setError(tErrors('invalidInvestmentDate'));
      return;
    }

    const input: InvestmentInput = {
      portfolioId: portfolio.id,
      date,
      depositTotal: deposit,
      bankCommission: bank,
      brokerCommission: broker,
      availableTotal: available,
      purchaseAmount: purchase,
      purchaseCommission: commission,
      commissionFromResidual,
      residualDelta: residual,
      note: note.trim() || undefined,
    };

    setIsSubmitting(true);
    setError(null);

    try {
      if (existing) {
        await editInvestment(existing.id, input, affectsBalance);
        navigate(`/investments/${portfolio.id}`, { state: { investmentUpdated: true } });
      } else {
        await registerInvestment(input);
        navigate(`/investments/${portfolio.id}`, { state: { investmentCreated: true } });
      }
    } catch (caught) {
      setError(
        caught instanceof InvestmentError ? tErrors(caught.code) : t('newInvestment.saveError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-5 p-6">
      <header className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate(`/investments/${portfolio.id}`)}
          className="mt-0.5 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text"
          aria-label={tCommon('back')}
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t(isEditing ? 'newInvestment.editTitle' : 'newInvestment.title')}
          </h1>
          <p className="mt-1 text-xs text-text-muted">
            {portfolio.name} · {t(`types.${portfolio.type}`)} · {portfolio.broker}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-medium text-text-muted">
            {t('newInvestment.depositSection')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label={t('newInvestment.depositTotal')}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={depositTotal}
              onChange={(event) => handleDeposit(event.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              label={t('newInvestment.bankCommission')}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={bankCommission}
              onChange={(event) => handleBankCommission(event.target.value)}
              placeholder="0.00"
            />
            <Input
              label={t('newInvestment.brokerCommission')}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={brokerCommission}
              onChange={(event) => handleBrokerCommission(event.target.value)}
              placeholder="0.00"
            />
          </div>
          {toAmount(depositTotal) > 0 ? (
            <p className="text-xs text-text-muted">
              {t(
                isEditing
                  ? 'newInvestment.balanceOutflowEditHint'
                  : 'newInvestment.balanceOutflowHint',
                {
                  amount: formatCurrency(toAmount(depositTotal), language),
                }
              )}
            </p>
          ) : null}
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-medium text-text-muted">
            {t('newInvestment.purchaseSection')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Input
                label={t('newInvestment.availableTotal')}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={availableTotal}
                onChange={(event) => handleAvailable(event.target.value)}
                placeholder="0.00"
                hint={t('newInvestment.availableHint')}
              />
              {availableEdited ? (
                <Button type="button" size="sm" variant="ghost" onClick={resetAvailable}>
                  {t('newInvestment.reset')}
                </Button>
              ) : null}
            </div>
            <Input
              label={t('newInvestment.purchaseAmount')}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={purchaseAmount}
              onChange={(event) => handlePurchase(event.target.value)}
              placeholder="0.00"
            />
            <Input
              label={t('newInvestment.purchaseCommission')}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={purchaseCommission}
              onChange={(event) => handlePurchaseCommission(event.target.value)}
              placeholder="0.00"
            />
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-medium text-text-muted">
            {t('newInvestment.residualSection')}
          </h2>
          <p className="text-xs text-text-muted">
            {t('newInvestment.currentResidual', {
              amount: formatCurrency(residualBefore, language),
            })}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Input
                label={t('newInvestment.transactionResidual')}
                type="number"
                inputMode="decimal"
                step="0.01"
                value={residualDelta}
                onChange={(event) => {
                  setResidualDelta(event.target.value);
                  setResidualEdited(true);
                }}
                hint={t('newInvestment.residualHint')}
              />
              <div className="flex flex-wrap items-center gap-2">
                {residualEdited ? (
                  <Button type="button" size="sm" variant="ghost" onClick={resetResidual}>
                    {t('newInvestment.reset')}
                  </Button>
                ) : null}
                {residualEdited && toCents(residualDifference) !== 0 ? (
                  <span className="text-xs text-warning">
                    {t('newInvestment.residualOverride', {
                      amount: formatCurrency(residualDifference, language),
                    })}
                  </span>
                ) : null}
              </div>
            </div>
            <Select
              label={t('newInvestment.commissionFromResidual')}
              value={commissionFromResidual ? 'yes' : 'no'}
              onChange={(event) => setCommissionFromResidual(event.target.value === 'yes')}
            >
              <option value="no">{t('newInvestment.commissionFromResidualNo')}</option>
              <option value="yes">{t('newInvestment.commissionFromResidualYes')}</option>
            </Select>
          </div>

          {hasNegativeAvailableMode ? (
            <p role="alert" className="text-sm text-negative">
              {tErrors('residualNegativeNotAllowed')} {t('newInvestment.negativeResidualHint')}
            </p>
          ) : null}

          {commissionFromResidual ? (
            <div className="rounded-md border border-border bg-surface p-3">
              <p className="text-xs font-medium">{t('newInvestment.breakdownTitle')}</p>
              <dl className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-text-muted">
                    {t('newInvestment.breakdownPurchaseRemainder')}
                  </dt>
                  <dd className="font-semibold tabular-nums">
                    {formatCurrency(purchaseRemainder, language)}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted">
                    {t('newInvestment.breakdownResidualAfterCommission')}
                  </dt>
                  <dd className="font-semibold tabular-nums">
                    {formatCurrency(residualAfterCommission, language)}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-muted">
                    {t('newInvestment.breakdownOperationResidual')}
                  </dt>
                  <dd
                    className={
                      residualValue < 0
                        ? 'font-semibold tabular-nums text-negative'
                        : 'font-semibold tabular-nums'
                    }
                  >
                    {formatCurrency(residualValue, language)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          {toCents(totalResidualAfter) < 0 ? (
            <p className="text-xs text-negative">
              {t('newInvestment.negativeTotalResidual', {
                amount: formatCurrency(totalResidualAfter, language),
              })}
            </p>
          ) : null}
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-medium text-text-muted">
            {t('newInvestment.detailsSection')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('newInvestment.date')}
              type="date"
              value={date}
              max={getLocalDateString()}
              onChange={(event) => setDate(event.target.value)}
              required
            />
            <Input
              label={t('newInvestment.note')}
              value={note}
              maxLength={MAX_INVESTMENT_NOTE_LENGTH}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t('newInvestment.notePlaceholder')}
            />
          </div>
        </Card>

        {existing?.transactionId ? (
          <Select
            label={t('newInvestment.affectsBalance')}
            value={affectsBalance ? 'yes' : 'no'}
            onChange={(event) => setAffectsBalance(event.target.value === 'yes')}
          >
            <option value="yes">{t('newInvestment.affectsBalanceYes')}</option>
            <option value="no">{t('newInvestment.affectsBalanceNo')}</option>
          </Select>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-negative">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            className="sm:flex-1"
            onClick={() => navigate(`/investments/${portfolio.id}`)}
            disabled={isSubmitting}
          >
            {tCommon('cancel')}
          </Button>
          <Button type="submit" className="sm:flex-1" isLoading={isSubmitting}>
            {t(isEditing ? 'newInvestment.saveChanges' : 'newInvestment.save')}
          </Button>
        </div>
      </form>
    </main>
  );
}
