import { create } from 'zustand';
import { getSettings } from '@/features/settings/settings.service';
import { db } from '@/lib/db';
import type { Debt, Investment, Portfolio, Settings, Transaction } from '@/types';

export interface AppStore {
  hydrated: boolean;
  isLoading: boolean;
  error: string | null;
  settings: Settings | null;
  transactions: Transaction[];
  debts: Debt[];
  portfolios: Portfolio[];
  investments: Investment[];
  hydrate: () => Promise<void>;
  sync: () => Promise<void>;
  setSettings: (settings: Settings) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setDebts: (debts: Debt[]) => void;
  setPortfolios: (portfolios: Portfolio[]) => void;
  setInvestments: (investments: Investment[]) => void;
  reset: () => void;
}

const initialState = {
  hydrated: false,
  isLoading: false,
  error: null,
  settings: null,
  transactions: [],
  debts: [],
  portfolios: [],
  investments: [],
} satisfies Pick<
  AppStore,
  | 'hydrated'
  | 'isLoading'
  | 'error'
  | 'settings'
  | 'transactions'
  | 'debts'
  | 'portfolios'
  | 'investments'
>;

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,

  hydrate: async () => {
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      await db.open();
      await get().sync();
      set({ hydrated: true, isLoading: false });
    } catch (error) {
      console.error('Failed to hydrate the app store', error);
      set({ isLoading: false, error: 'Unable to load local data' });
    }
  },

  sync: async () => {
    const [settings, transactions, debts, portfolios, investments] = await Promise.all([
      getSettings(),
      db.transactions.toArray(),
      db.debts.toArray(),
      db.portfolios.toArray(),
      db.investments.toArray(),
    ]);

    set({ settings, transactions, debts, portfolios, investments });
  },

  setSettings: (settings) => set({ settings }),
  setTransactions: (transactions) => set({ transactions }),
  setDebts: (debts) => set({ debts }),
  setPortfolios: (portfolios) => set({ portfolios }),
  setInvestments: (investments) => set({ investments }),
  reset: () => set(initialState),
}));
