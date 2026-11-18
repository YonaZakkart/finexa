import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { updateSettings } from '@/features/settings/settings.service';
import { changeLanguage } from '@/lib/i18n';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/language';
import { useAppStore } from '@/stores/app.store';

const labels = {
  es: 'spanish',
  en: 'english',
} as const;

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common');
  const current: SupportedLanguage = (i18n.resolvedLanguage ?? 'en').startsWith('es') ? 'es' : 'en';

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const language = event.target.value as SupportedLanguage;

    void updateSettings({ language })
      .then((settings) => {
        useAppStore.getState().setSettings(settings);
        return changeLanguage(language);
      })
      .catch((error) => console.error('Failed to persist the language', error));
  };

  return (
    <label className="flex items-center gap-2 text-xs text-text-muted">
      <span className="sr-only">{t('language')}</span>
      <select
        value={current}
        onChange={handleChange}
        className="min-h-11 cursor-pointer rounded-md border border-border bg-surface px-2 text-xs text-text transition-colors focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {t(labels[language])}
          </option>
        ))}
      </select>
    </label>
  );
}
