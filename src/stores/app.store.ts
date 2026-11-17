import { create } from 'zustand';
import { getSettings } from '@/features/settings/settings.service';
import { db } from '@/lib/db';
import type { Debt, Settings, Transaction } from '@/types';

interface AppStore {
  hydrated: boolean;
  isLoading: boolean;
  error: string | null;
  settings: Settings | null;
  transactions: Transaction[];
  debts: Debt[];
  hydrate: () => Promise<void>;
  setSettings: (settings: Settings) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setDebts: (debts: Debt[]) => void;
  reset: () => void;
}

const initialState = {
  hydrated: false,
  isLoading: false,
  error: null,
  settings: null,
  transactions: [],
  debts: [],
} satisfies Pick<
  AppStore,
  'hydrated' | 'isLoading' | 'error' | 'settings' | 'transactions' | 'debts'
>;

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,

  hydrate: async () => {
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      await db.open();
      const [settings, transactions, debts] = await Promise.all([
        getSettings(),
        db.transactions.toArray(),
        db.debts.toArray(),
      ]);

      set({ settings, transactions, debts, hydrated: true, isLoading: false });
    } catch (error) {
      console.error('Failed to hydrate the app store', error);
      set({ isLoading: false, error: 'Unable to load local data' });
    }
  },

  setSettings: (settings) => set({ settings }),
  setTransactions: (transactions) => set({ transactions }),
  setDebts: (debts) => set({ debts }),
  reset: () => set(initialState),
}));
