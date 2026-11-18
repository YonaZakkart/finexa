import { create } from 'zustand';

interface UiState {
  isOnline: boolean;
  updateAvailable: boolean;
  updateDismissed: boolean;
  setOnline: (value: boolean) => void;
  setUpdateAvailable: (value: boolean) => void;
  dismissUpdate: () => void;
  reset: () => void;
}

const initialOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

export const useUiStore = create<UiState>((set) => ({
  isOnline: initialOnline,
  updateAvailable: false,
  updateDismissed: false,
  setOnline: (isOnline) => set({ isOnline }),
  setUpdateAvailable: (updateAvailable) =>
    set((state) => ({
      updateAvailable,
      updateDismissed: updateAvailable ? false : state.updateDismissed,
    })),
  dismissUpdate: () => set({ updateDismissed: true }),
  reset: () => set({ isOnline: true, updateAvailable: false, updateDismissed: false }),
}));
