import { ArrowRight, CheckCircle2, PlusCircle, SkipForward, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { roundMoney } from '@/lib/money';
import { completeOnboarding, type OnboardingProfile, skipOnboarding } from './onboarding.service';

type Step = 'welcome' | 'profile' | 'employment' | 'salary' | 'balance' | 'debts' | 'complete';
type PendingAction = 'finish' | 'skip';

const BASE_STEPS: Step[] = ['welcome', 'profile', 'employment', 'balance', 'debts', 'complete'];

function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) && parsed > 0 ? roundMoney(parsed) : 0;
}

export function Onboarding() {
  const { t } = useTranslation('onboarding');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState<
    'employed' | 'unemployed' | 'freelancer' | 'trader' | 'other'
  >('employed');
  const [salary, setSalary] = useState('');
  const [salaryFrequency, setSalaryFrequency] = useState<'monthly' | 'biweekly'>('monthly');
  const [paymentDay, setPaymentDay] = useState('');
  const [balance, setBalance] = useState('');
  const [bank, setBank] = useState('');
  const [cash, setCash] = useState('');
  const [showBankCash, setShowBankCash] = useState(false);
  const [debts, setDebts] = useState<Array<{ id: string; name: string; amount: string }>>([
    { id: crypto.randomUUID(), name: '', amount: '' },
  ]);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo<Step[]>(
    () =>
      employmentStatus === 'employed'
        ? ['welcome', 'profile', 'employment', 'salary', 'balance', 'debts', 'complete']
        : BASE_STEPS,
    [employmentStatus]
  );

  const safeStepIndex = Math.min(stepIndex, steps.length - 1);
  const currentStep = steps[safeStepIndex];
  const isLastStep = safeStepIndex === steps.length - 1;
  const isSubmitting = pendingAction !== null;

  const hasIncompleteDebt = debts.some((debt) => {
    const hasName = debt.name.trim().length > 0;
    const hasAmount = parseAmount(debt.amount) > 0;

    return hasName !== hasAmount;
  });

  const buildProfile = (): OnboardingProfile => {
    const profile: OnboardingProfile = { employmentStatus };
    const name = userName.trim();

    if (name) {
      profile.userName = name;
    }

    if (employmentStatus === 'employed') {
      const salaryValue = parseAmount(salary);

      if (salaryValue > 0) {
        profile.salary = salaryValue;
      }

      profile.salaryFrequency = salaryFrequency;

      const day = Number.parseInt(paymentDay, 10);

      if (Number.isInteger(day) && day >= 1 && day <= 31) {
        profile.paymentDates = [String(day)];
      }
    }

    return profile;
  };

  const handleFinish = async () => {
    if (isSubmitting) return;

    setPendingAction('finish');
    setError(null);

    try {
      await completeOnboarding({
        profile: buildProfile(),
        initialBalance: parseAmount(balance),
        debts: debts
          .map((debt) => ({ name: debt.name.trim(), amount: parseAmount(debt.amount) }))
          .filter((debt) => debt.name.length > 0 || debt.amount > 0),
      });
      navigate('/', { replace: true });
    } catch {
      setError(t('saveError'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleSkip = async () => {
    if (isSubmitting) return;

    setPendingAction('skip');
    setError(null);

    try {
      await skipOnboarding();
      navigate('/', { replace: true });
    } catch {
      setError(t('saveError'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      void handleFinish();
      return;
    }

    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
  };

  const handleBankCashChange = (nextBank: string, nextCash: string) => {
    setBank(nextBank);
    setCash(nextCash);

    const total = roundMoney(parseAmount(nextBank) + parseAmount(nextCash));
    setBalance(total > 0 ? String(total) : '');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <Card className="p-8 text-center space-y-6" aria-labelledby="welcome-title">
            <h2 id="welcome-title" className="text-2xl font-semibold">
              {t('welcomeTitle')}
            </h2>
            <p className="text-text-muted">{t('welcomeText')}</p>
          </Card>
        );
      case 'profile':
        return (
          <Card className="p-5 space-y-4" aria-labelledby="profile-title">
            <h2 id="profile-title" className="text-lg font-semibold">
              {t('yourName')}
            </h2>
            <Input
              label={t('name')}
              placeholder={t('namePlaceholder')}
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </Card>
        );
      case 'employment':
        return (
          <Card className="p-5 space-y-4" aria-labelledby="employment-title">
            <h2 id="employment-title" className="text-lg font-semibold">
              {t('employmentStatus')}
            </h2>
            <Select
              label={t('selectStatus')}
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value as typeof employmentStatus)}
            >
              <option value="employed">{t('employed')}</option>
              <option value="unemployed">{t('unemployed')}</option>
              <option value="freelancer">{t('freelancer')}</option>
              <option value="trader">{t('trader')}</option>
              <option value="other">{t('other')}</option>
            </Select>
          </Card>
        );
      case 'salary':
        return (
          <Card className="p-5 space-y-4" aria-labelledby="salary-title">
            <h2 id="salary-title" className="text-lg font-semibold">
              {t('salary')}
            </h2>
            <Input
              label={t('monthlySalary')}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="0.00"
            />
            <Select
              label={t('frequency')}
              value={salaryFrequency}
              onChange={(e) => setSalaryFrequency(e.target.value as typeof salaryFrequency)}
            >
              <option value="monthly">{t('monthly')}</option>
              <option value="biweekly">{t('biweekly')}</option>
            </Select>
            <Input
              label={t('paymentDay')}
              type="number"
              min="1"
              max="31"
              value={paymentDay}
              onChange={(e) => setPaymentDay(e.target.value)}
              placeholder="1-31"
            />
          </Card>
        );
      case 'balance':
        return (
          <Card className="p-5 space-y-4" aria-labelledby="balance-title">
            <h2 id="balance-title" className="text-lg font-semibold">
              {t('initialBalance')}
            </h2>
            <Input
              label={t('totalAmount')}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={balance}
              onChange={(e) => {
                setBalance(e.target.value);
                setBank('');
                setCash('');
              }}
              placeholder="0.00"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBankCash((value) => !value)}
              aria-expanded={showBankCash}
              aria-controls="bank-cash-fields"
            >
              {showBankCash ? t('hideBankCash') : t('addBankCash')}
            </Button>
            {showBankCash ? (
              <div id="bank-cash-fields" className="space-y-3">
                <Input
                  label={t('bank')}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={bank}
                  onChange={(e) => handleBankCashChange(e.target.value, cash)}
                  placeholder="0.00"
                />
                <Input
                  label={t('cash')}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={cash}
                  onChange={(e) => handleBankCashChange(bank, e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-text-muted">{t('bankCashHint')}</p>
              </div>
            ) : null}
            <p className="text-xs text-text-muted">{t('balanceHint')}</p>
          </Card>
        );
      case 'debts':
        return (
          <Card className="p-5 space-y-4" aria-labelledby="debts-title">
            <header className="flex items-center justify-between">
              <h2 id="debts-title" className="text-lg font-semibold">
                {t('yourDebts')}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setDebts((current) => [
                    ...current,
                    { id: crypto.randomUUID(), name: '', amount: '' },
                  ])
                }
              >
                <PlusCircle aria-hidden="true" className="size-4" />
                {t('addDebt')}
              </Button>
            </header>
            {debts.map((debt) => (
              <div key={debt.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label={t('debtName')}
                    placeholder={t('debtNamePlaceholder')}
                    value={debt.name}
                    onChange={(e) =>
                      setDebts((current) =>
                        current.map((item) =>
                          item.id === debt.id ? { ...item, name: e.target.value } : item
                        )
                      )
                    }
                  />
                </div>
                <div className="flex-1">
                  <Input
                    label={t('debtAmount')}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={debt.amount}
                    onChange={(e) =>
                      setDebts((current) =>
                        current.map((item) =>
                          item.id === debt.id ? { ...item, amount: e.target.value } : item
                        )
                      )
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDebts((current) => current.filter((item) => item.id !== debt.id))
                  }
                  aria-label={t('removeDebt')}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            ))}
            {hasIncompleteDebt ? (
              <p className="text-xs text-negative">{t('debtIncomplete')}</p>
            ) : null}
            <p className="text-xs text-text-muted">{t('debtsOptional')}</p>
          </Card>
        );
      case 'complete':
        return (
          <Card className="p-8 text-center space-y-4" aria-labelledby="complete-title">
            <CheckCircle2 className="mx-auto size-12 text-positive" />
            <h2 id="complete-title" className="text-2xl font-semibold">
              {t('allSet')}
            </h2>
            <p className="text-text-muted">{t('completeText')}</p>
          </Card>
        );
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 p-6 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{tCommon('appName')}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleSkip()}
          aria-label={t('skip')}
          isLoading={pendingAction === 'skip'}
        >
          <SkipForward aria-hidden="true" className="size-5" />
          {t('skip')}
        </Button>
      </header>

      <div
        className="flex items-center gap-1 mb-4"
        role="progressbar"
        aria-valuenow={safeStepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-label={t('progress')}
      >
        {steps.map((step, index) => (
          <div
            key={step}
            className="flex-1 h-1.5 rounded-full transition-colors"
            style={{
              backgroundColor:
                index <= safeStepIndex ? 'var(--color-accent)' : 'var(--color-border)',
            }}
          />
        ))}
      </div>

      {renderStep()}

      {error ? (
        <p role="alert" className="text-sm text-negative">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => void handleSkip()}
          isLoading={pendingAction === 'skip'}
        >
          {t('skip')}
        </Button>
        <Button
          className="flex-1"
          onClick={handleNext}
          disabled={isSubmitting || (currentStep === 'debts' && hasIncompleteDebt)}
          isLoading={pendingAction === 'finish'}
        >
          {isLastStep ? t('finish') : t('next')}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </main>
  );
}
