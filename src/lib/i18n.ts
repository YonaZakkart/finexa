import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/language';
import { resources } from '@/locales/resources';

export async function initI18n(language: SupportedLanguage): Promise<void> {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'en',
      supportedLngs: [...SUPPORTED_LANGUAGES],
      defaultNS: 'common',
      ns: ['common', 'dashboard', 'expenses', 'categories', 'summary', 'errors'],
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
    });
  } else if (i18n.resolvedLanguage !== language) {
    await i18n.changeLanguage(language);
  }

  document.documentElement.lang = language;
}

export async function changeLanguage(language: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  document.documentElement.lang = language;
}

export { i18n };
