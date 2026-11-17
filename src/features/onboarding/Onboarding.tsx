import { ArrowRight, CheckCircle2, PlusCircle, SkipForward } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { updateSettings } from '@/features/settings/settings.service';

type Step = 'welcome' | 'profile' | 'employment' | 'salary' | 'balance' | 'debts' | 'complete';

const STEPS: Step[] = [
  'welcome',
  'profile',
  'employment',
  'salary',
  'balance',
  'debts',
  'complete',
];

export function Onboarding() {
  const { t } = useTranslation('onboarding');
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
  const [debts, setDebts] = useState<Array<{ name: string; amount: string }>>([
    { name: '', amount: '' },
  ]);

  const currentStep = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      await updateSettings({
        onboardingCompleted: true,
        userName: userName || undefined,
        employmentStatus,
        salary: salary ? parseFloat(salary) : undefined,
        salaryFrequency,
        paymentDates: paymentDay ? [paymentDay] : undefined,
      });
      navigate('/');
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleSkip = async () => {
    await updateSettings({ onboardingCompleted: true });
    navigate('/');
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
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
            />
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
                onClick={() => {
                  setDebts([...debts, { name: '', amount: '' }]);
                }}
              >
                <PlusCircle aria-hidden="true" className="size-4" />
                {t('addDebt')}
              </Button>
            </header>
            {debts.map((debt, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  label={t('debtName')}
                  placeholder={t('debtNamePlaceholder')}
                  value={debt.name}
                  onChange={(e) => {
                    const d = [...debts];
                    d[i].name = e.target.value;
                    setDebts(d);
                  }}
                />
                <Input
                  label={t('debtAmount')}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={debt.amount}
                  onChange={(e) => {
                    const d = [...debts];
                    d[i].amount = e.target.value;
                    setDebts(d);
                  }}
                />
              </div>
            ))}
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
        <h1 className="text-xl font-semibold">{useTranslation('common').t('appName')}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          aria-label={useTranslation('common').t('skip')}
        >
          <SkipForward aria-hidden="true" className="size-5" />
          {useTranslation('onboarding').t('skip')}
        </Button>
      </header>

      <div
        className="flex items-center gap-1 mb-4"
        role="progressbar"
        aria-valuenow={stepIndex + 1}
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-label={useTranslation('onboarding').t('progress')}
      >
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: i <= stepIndex ? 'var(--color-accent)' : 'var(--color-border)',
            }}
          />
        ))}
      </div>

      {renderStep()}

      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={handleSkip}>
          {useTranslation('onboarding').t('skip')}
        </Button>
        <Button
          className="flex-1"
          onClick={handleNext}
          disabled={
            (currentStep === 'profile' && !userName) ||
            (currentStep === 'salary' && employmentStatus === 'employed' && !salary)
          }
        >
          {isLastStep
            ? useTranslation('onboarding').t('finish')
            : useTranslation('common').t('confirm')}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </main>
  );
}
