import { describe, expect, it } from 'vitest';
import { addDaysToDate, getLocalDateString, isValidLocalDate } from './date';

describe('getLocalDateString', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(getLocalDateString(new Date(2026, 10, 7))).toBe('2026-11-07');
    expect(getLocalDateString(new Date(2026, 0, 31))).toBe('2026-01-31');
  });
});

describe('addDaysToDate', () => {
  it('moves within the month and across boundaries', () => {
    expect(addDaysToDate('2026-11-17', -1)).toBe('2026-11-16');
    expect(addDaysToDate('2026-11-17', 1)).toBe('2026-11-18');
    expect(addDaysToDate('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDaysToDate('2024-02-28', 1)).toBe('2024-02-29');
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
