import { format as formatDateFns } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import type { SupportedLanguage } from '@/lib/language';

const locales = {
  es: esLocale,
  en: enUS,
} as const;

export function formatCurrency(amount: number, language: SupportedLanguage): string {
  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(value: string | Date, language: SupportedLanguage): string {
  return formatDateFns(toLocalDate(value), 'PP', { locale: locales[language] });
}

function toLocalDate(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}
