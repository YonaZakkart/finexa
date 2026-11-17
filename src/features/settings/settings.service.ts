import { db } from '@/lib/db';
import { detectLanguage } from '@/lib/language';
import type { Settings } from '@/types';

export const SETTINGS_ID = 'app' as const;

export function createDefaultSettings(): Settings {
  const now = new Date().toISOString();

  return {
    id: SETTINGS_ID,
    language: detectLanguage(),
    theme: 'glass-dark',
    currency: 'USD',
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getSettings(): Promise<Settings> {
  const settings = await db.settings.get(SETTINGS_ID);

  if (settings) {
    return settings;
  }

  const defaults = createDefaultSettings();
  await db.settings.put(defaults);
  return defaults;
}

export type SettingsPatch = Partial<Omit<Settings, 'id' | 'createdAt' | 'updatedAt'>>;

export async function putSettings(patch: SettingsPatch): Promise<Settings> {
  const current = (await db.settings.get(SETTINGS_ID)) ?? createDefaultSettings();
  const updated: Settings = {
    ...current,
    ...patch,
    id: SETTINGS_ID,
    updatedAt: new Date().toISOString(),
  };

  await db.settings.put(updated);
  return updated;
}

export async function updateSettings(patch: SettingsPatch): Promise<Settings> {
  return db.transaction('rw', db.settings, () => putSettings(patch));
}
