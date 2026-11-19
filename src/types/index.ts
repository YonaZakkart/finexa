export type TransactionType =
  | 'income'
  | 'expense'
  | 'debt_payment'
  | 'adjustment'
  | 'initial_balance';

export type TransactionDirection = 'credit' | 'debit';
export type DebtStatus = 'active' | 'paid';
export type Language = 'es' | 'en';
export type Theme = 'glass-dark';
export type Currency = 'USD';
export type EmploymentStatus = 'employed' | 'unemployed' | 'freelancer' | 'trader' | 'other';
export type SalaryFrequency = 'monthly' | 'biweekly';
export type TransactionSource = 'user' | 'edit_compensation' | 'system';
export type PortfolioType = 'stocks' | 'etf' | 'crypto' | 'funds' | 'bonds' | 'other';

export interface Portfolio {
  id: string;
  name: string;
  type: PortfolioType;
  broker: string;
  currentBalance: number;
  balanceUpdatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  portfolioId: string;
  date: string;
  depositTotal: number;
  bankCommission: number;
  brokerCommission: number;
  availableTotal: number;
  purchaseAmount: number;
  purchaseCommission: number;
  commissionFromResidual: boolean;
  residualDelta: number;
  note?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  amount: number;
  status: DebtStatus;
  createdAt: string;
  paidAt?: string;
  affectsBalance?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  category?: string;
  subcategory?: string;
  note?: string;
  date: string;
  createdAt: string;
  relatedDebtId?: string;
  source?: TransactionSource;
}

export interface Settings {
  id: 'app';
  language: Language;
  theme: Theme;
  currency: Currency;
  onboardingCompleted: boolean;
  userName?: string;
  employmentStatus?: EmploymentStatus;
  salary?: number;
  salaryFrequency?: SalaryFrequency;
  paymentDates?: string[];
  createdAt: string;
  updatedAt: string;
}
