import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSettings } from '@/features/settings/settings.service';
import { db } from '@/lib/db';
import { changeLanguage } from '@/lib/i18n';
import { useAppStore } from '@/stores/app.store';
import { LanguageSwitcher } from './LanguageSwitcher';

beforeEach(async () => {
  useAppStore.getState().reset();
  await db.open();
  await db.settings.clear();
});

afterEach(async () => {
  await changeLanguage('es');
  useAppStore.getState().reset();
  await db.settings.clear();
});

describe('LanguageSwitcher', () => {
  it('persists the language and updates the store', async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);

    await user.selectOptions(screen.getByLabelText('Idioma'), 'en');

    await waitFor(() => expect(useAppStore.getState().settings?.language).toBe('en'));
    expect((await getSettings()).language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
