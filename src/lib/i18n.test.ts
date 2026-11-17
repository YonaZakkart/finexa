import { describe, expect, it } from 'vitest';
import { en } from '@/locales/en';
import { es } from '@/locales/es';
import { changeLanguage, i18n } from './i18n';
import { detectLanguage } from './language';

function flattenKeys(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    return typeof child === 'object' && child !== null
      ? flattenKeys(child as Record<string, unknown>, path)
      : [path];
  });
}

describe('language detection', () => {
  it('uses the first supported browser language', () => {
    expect(detectLanguage(['fr-FR', 'es-CO'])).toBe('es');
    expect(detectLanguage(['en-GB', 'es-ES'])).toBe('en');
    expect(detectLanguage(['fr-FR'])).toBe('en');
  });
});

describe('translation resources', () => {
  it('keeps the same keys in Spanish and English', () => {
    const spanishKeys = flattenKeys(es).sort();
    const englishKeys = flattenKeys(en).sort();

    expect(spanishKeys).toEqual(englishKeys);
  });

  it('changes language and document lang', async () => {
    await changeLanguage('en');
    expect(document.documentElement.lang).toBe('en');
    expect(i18n.t('language')).toBe('Language');

    await changeLanguage('es');
    expect(document.documentElement.lang).toBe('es');
    expect(i18n.t('language')).toBe('Idioma');
  });
});
