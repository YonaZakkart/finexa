import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/lib/db';
import { useAppStore } from './app.store';

beforeEach(async () => {
  useAppStore.getState().reset();
  await db.open();
});

afterEach(async () => {
  vi.restoreAllMocks();
  useAppStore.getState().reset();
  await db.delete();
});

describe('app store hydration', () => {
  it('exposes an error when Dexie cannot open', async () => {
    vi.spyOn(db, 'open').mockRejectedValueOnce(new Error('open failed'));

    await useAppStore.getState().hydrate();

    expect(useAppStore.getState().hydrated).toBe(false);
    expect(useAppStore.getState().error).toBeTruthy();
  });

  it('recovers after a retry', async () => {
    vi.spyOn(db, 'open').mockRejectedValueOnce(new Error('open failed'));

    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().error).toBeTruthy();

    await useAppStore.getState().hydrate();

    expect(useAppStore.getState().error).toBeNull();
    expect(useAppStore.getState().hydrated).toBe(true);
  });
});
