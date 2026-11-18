import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './ui.store';

beforeEach(() => {
  useUiStore.getState().reset();
});

describe('ui store', () => {
  it('tracks online status', () => {
    useUiStore.getState().setOnline(false);
    expect(useUiStore.getState().isOnline).toBe(false);
    useUiStore.getState().setOnline(true);
    expect(useUiStore.getState().isOnline).toBe(true);
  });

  it('tracks and dismisses update availability', () => {
    useUiStore.getState().setUpdateAvailable(true);
    expect(useUiStore.getState().updateAvailable).toBe(true);
    expect(useUiStore.getState().updateDismissed).toBe(false);

    useUiStore.getState().dismissUpdate();
    expect(useUiStore.getState().updateDismissed).toBe(true);

    useUiStore.getState().setUpdateAvailable(true);
    expect(useUiStore.getState().updateDismissed).toBe(false);
  });
});
