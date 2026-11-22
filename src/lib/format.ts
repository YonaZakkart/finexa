import { format as formatDateFns } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import type { SupportedLanguage } from '@/lib/language';

const locales = {
  es: esLocale,
  en: enUS,
} as const;

const currencyFormatters = new Map<SupportedLanguage, Intl.NumberFormat>();
const compactFormatters = new Map<SupportedLanguage, Intl.NumberFormat>();

function localeOf(language: SupportedLanguage): string {
  return language === 'es' ? 'es-ES' : 'en-US';
}

export function getCurrencyFormatter(language: SupportedLanguage): Intl.NumberFormat {
  const cached = currencyFormatters.get(language);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat(localeOf(language), {
    style: 'currency',
    currency: 'USD',
  });
  currencyFormatters.set(language, formatter);

  return formatter;
}

export function getCompactFormatter(language: SupportedLanguage): Intl.NumberFormat {
  const cached = compactFormatters.get(language);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat(localeOf(language), {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  compactFormatters.set(language, formatter);

  return formatter;
}

export function formatCurrency(amount: number, language: SupportedLanguage): string {
  return getCurrencyFormatter(language).format(amount);
}

export function formatCompactNumber(amount: number, language: SupportedLanguage): string {
  return getCompactFormatter(language).format(amount);
}

export function formatDate(value: string | Date, language: SupportedLanguage): string {
  return formatDateFns(toLocalDate(value), 'PP', { locale: locales[language] });
}

export function formatTime(value: string | Date): string {
  return formatDateFns(value instanceof Date ? value : new Date(value), 'HH:mm');
}

export function formatWeekday(value: string, language: SupportedLanguage): string {
  return formatDateFns(toLocalDate(value), 'EEE', { locale: locales[language] });
}

export function formatShortDate(value: string, language: SupportedLanguage): string {
  return formatDateFns(toLocalDate(value), 'd MMM', { locale: locales[language] });
}

function toLocalDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
