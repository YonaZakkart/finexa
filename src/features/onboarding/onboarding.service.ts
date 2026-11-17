import { TransactionError } from '@/features/balance/errors';
import { insertTransaction } from '@/features/balance/transactions.service';
import { createDebt } from '@/features/debts/debts.repository';
import { putSettings, updateSettings } from '@/features/settings/settings.service';
import { getLocalDateString } from '@/lib/date';
import { db } from '@/lib/db';
import { roundMoney } from '@/lib/money';
import { useAppStore } from '@/stores/app.store';
import type { EmploymentStatus, SalaryFrequency } from '@/types';

export interface OnboardingProfile {
  userName?: string;
  employmentStatus?: EmploymentStatus;
  salary?: number;
  salaryFrequency?: SalaryFrequency;
  paymentDates?: string[];
}

export interface OnboardingDebtInput {
  name: string;
  amount: number;
}

export interface CompleteOnboardingInput {
  profile?: OnboardingProfile;
  initialBalance?: number;
  debts?: OnboardingDebtInput[];
}

const MAX_DEBT_NAME_LENGTH = 80;

function assertValidInitialBalance(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new TransactionError('invalidAmount');
  }
}

function assertValidDebt(debt: OnboardingDebtInput): void {
  if (debt.name.length === 0 || debt.name.length > MAX_DEBT_NAME_LENGTH) {
    throw new TransactionError('invalidDebtName');
  }

  if (!Number.isFinite(debt.amount) || debt.amount <= 0) {
    throw new TransactionError('invalidAmount');
  }
}

function assertValidProfile(profile?: OnboardingProfile): void {
  if (profile?.salary !== undefined && (!Number.isFinite(profile.salary) || profile.salary <= 0)) {
    throw new TransactionError('invalidSalary');
  }
}

export async function completeOnboarding(input: CompleteOnboardingInput = {}): Promise<void> {
  const initialBalance = roundMoney(input.initialBalance ?? 0);
  const debts = (input.debts ?? []).map((debt) => ({
    name: debt.name.trim(),
    amount: roundMoney(debt.amount),
  }));

  assertValidInitialBalance(initialBalance);
  for (const debt of debts) {
    assertValidDebt(debt);
  }
  assertValidProfile(input.profile);

  await db.transaction('rw', db.transactions, db.debts, db.settings, async () => {
    if (initialBalance > 0) {
      await insertTransaction({
        type: 'initial_balance',
        direction: 'credit',
        amount: initialBalance,
        date: getLocalDateString(),
      });
    }

    for (const debt of debts) {
      await createDebt(debt);
    }

    await putSettings({ ...input.profile, onboardingCompleted: true });
  });

  await useAppStore.getState().sync();
}

export async function skipOnboarding(): Promise<void> {
  await updateSettings({ onboardingCompleted: true });
  await useAppStore.getState().sync();
}
