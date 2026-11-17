import { describe, expect, it } from 'vitest';
import { formatCurrency, formatDate } from './format';

describe('formatters', () => {
  it('formats USD according to the locale', () => {
    expect(formatCurrency(1234.5, 'en')).toBe('$1,234.50');
    expect(formatCurrency(1234.5, 'es')).toContain('1234,50');
    expect(formatCurrency(1234.5, 'es')).toContain('US$');
  });

  it('formats local dates according to the locale', () => {
    expect(formatDate('2026-11-16', 'en')).toBe('Nov 16, 2026');
    expect(formatDate('2026-11-16', 'es')).toMatch(/16.*2026/);
  });
});
