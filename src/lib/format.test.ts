import { describe, expect, it } from 'vitest';
import {
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatTime,
  getCompactFormatter,
  getCurrencyFormatter,
} from './format';

describe('formatters', () => {
  it('formats USD according to the locale', () => {
    expect(formatCurrency(1234.5, 'en')).toBe('$1,234.50');
    expect(formatCurrency(1234.5, 'es')).toContain('1234,50');
    expect(formatCurrency(1234.5, 'es')).toContain('US$');
  });

  it('formats compact numbers for chart axes', () => {
    expect(formatCompactNumber(1200, 'en')).toBe('1.2K');
    expect(formatCompactNumber(1200, 'es')).toContain('1,2');
  });

  it('formats local dates according to the locale', () => {
    expect(formatDate('2026-11-16', 'en')).toBe('Nov 16, 2026');
    expect(formatDate('2026-11-16', 'es')).toMatch(/16.*2026/);
  });

  it('formats local times with two digits', () => {
    expect(formatTime(new Date(2026, 10, 17, 13, 30))).toBe('13:30');
    expect(formatTime(new Date(2026, 10, 17, 9, 5))).toBe('09:05');
  });

  it('reuses one Intl.NumberFormat per language', () => {
    expect(getCurrencyFormatter('es')).toBe(getCurrencyFormatter('es'));
    expect(getCurrencyFormatter('en')).toBe(getCurrencyFormatter('en'));
    expect(getCurrencyFormatter('es')).not.toBe(getCurrencyFormatter('en'));

    expect(getCompactFormatter('es')).toBe(getCompactFormatter('es'));
    expect(getCompactFormatter('es')).not.toBe(getCompactFormatter('en'));
  });
});
