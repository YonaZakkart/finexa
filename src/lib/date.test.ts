import { describe, expect, it } from 'vitest';
import { getLocalDateString, isValidLocalDate } from './date';

describe('getLocalDateString', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(getLocalDateString(new Date(2026, 10, 7))).toBe('2026-11-07');
    expect(getLocalDateString(new Date(2026, 0, 31))).toBe('2026-01-31');
  });
});

describe('isValidLocalDate', () => {
  it('accepts real calendar dates', () => {
    expect(isValidLocalDate('2026-11-17')).toBe(true);
    expect(isValidLocalDate('2024-02-29')).toBe(true);
  });

  it('rejects malformed and impossible dates', () => {
    expect(isValidLocalDate('17-11-2026')).toBe(false);
    expect(isValidLocalDate('2026-1-7')).toBe(false);
    expect(isValidLocalDate('2026-02-31')).toBe(false);
    expect(isValidLocalDate('2026-13-01')).toBe(false);
    expect(isValidLocalDate('')).toBe(false);
  });
});
