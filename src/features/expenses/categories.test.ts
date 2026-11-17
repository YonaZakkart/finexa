import { describe, expect, it } from 'vitest';
import { en } from '@/locales/en';
import { es } from '@/locales/es';
import type { Transaction } from '@/types';
import {
  categories,
  getCategory,
  getSubcategory,
  groupExpensesByCategory,
  isValidCategory,
  isValidSubcategory,
} from './categories';

const expectedOrder = [
  'mobility',
  'daily',
  'utilities',
  'personal',
  'health',
  'pets',
  'hobby',
  'subscriptions',
  'work',
  'tech',
  'housing',
  'education',
  'other',
];

let sequence = 0;

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  sequence += 1;

  return {
    id: `tx-${sequence}`,
    type: 'expense',
    direction: 'debit',
    amount: 10,
    date: '2026-11-17',
    createdAt: '2026-11-17T10:00:00.000Z',
    category: 'daily',
    subcategory: 'daily.food',
    ...overrides,
  };
}

function resolve(resource: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((value, part) => {
    if (typeof value !== 'object' || value === null) {
      return undefined;
    }

    return (value as Record<string, unknown>)[part];
  }, resource);
}

function label(resource: unknown, key: string): string {
  const value = resolve(resource, key);

  expect(typeof value).toBe('string');
  return value as string;
}

describe('categories catalog', () => {
  it('keeps a stable order and unique IDs', () => {
    expect(categories.map((category) => category.id)).toEqual(expectedOrder);
    expect(new Set(categories.map((category) => category.id)).size).toBe(categories.length);

    const subcategoryIds = categories.flatMap((category) =>
      category.subcategories.map((subcategory) => subcategory.id)
    );

    expect(new Set(subcategoryIds).size).toBe(subcategoryIds.length);
    expect(categories.find((category) => category.id === 'other')?.subcategories).toEqual([]);
  });

  it('nests every subcategory under its category', () => {
    for (const category of categories) {
      for (const subcategory of category.subcategories) {
        expect(subcategory.id.startsWith(`${category.id}.`)).toBe(true);
        expect(subcategory.labelKey.startsWith(`subcategories.${category.id}.`)).toBe(true);
      }
    }
  });

  it('has a non-empty label in both languages for every category and subcategory', () => {
    for (const category of categories) {
      expect(label(es.categories, category.labelKey).length).toBeGreaterThan(0);
      expect(label(en.categories, category.labelKey).length).toBeGreaterThan(0);

      for (const subcategory of category.subcategories) {
        expect(label(es.categories, subcategory.labelKey).length).toBeGreaterThan(0);
        expect(label(en.categories, subcategory.labelKey).length).toBeGreaterThan(0);
      }
    }
  });

  it('uses non-empty unique color tokens', () => {
    const colors = categories.map((category) => category.colorToken);

    expect(colors.every((color) => color.length > 0)).toBe(true);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe('catalog helpers', () => {
  it('finds categories and subcategories', () => {
    expect(getCategory('mobility')?.labelKey).toBe('mobility');
    expect(getCategory('unknown')).toBeUndefined();
    expect(getSubcategory('mobility', 'mobility.fuel')?.labelKey).toBe(
      'subcategories.mobility.fuel'
    );
    expect(getSubcategory('daily', 'mobility.fuel')).toBeUndefined();
    expect(getSubcategory('mobility', 'mobility.unknown')).toBeUndefined();
  });

  it('validates category and subcategory IDs', () => {
    expect(isValidCategory('mobility')).toBe(true);
    expect(isValidCategory('unknown')).toBe(false);
    expect(isValidSubcategory('mobility', 'mobility.fuel')).toBe(true);
    expect(isValidSubcategory('daily', 'mobility.fuel')).toBe(false);
  });
});

describe('groupExpensesByCategory', () => {
  it('groups only expenses by category', () => {
    const groups = groupExpensesByCategory([
      transaction({ category: 'daily', subcategory: 'daily.food' }),
      transaction({ category: 'daily', subcategory: 'daily.coffee_snacks' }),
      transaction({ category: 'mobility', subcategory: 'mobility.fuel' }),
      transaction({
        type: 'income',
        direction: 'credit',
        category: undefined,
        subcategory: undefined,
      }),
      transaction({ type: 'adjustment', category: undefined, subcategory: undefined }),
      transaction({ category: undefined, subcategory: undefined }),
    ]);

    expect(Object.keys(groups).sort()).toEqual(['daily', 'mobility']);
    expect(groups.daily).toHaveLength(2);
    expect(groups.mobility).toHaveLength(1);
  });

  it('returns no groups for an empty ledger', () => {
    expect(groupExpensesByCategory([])).toEqual({});
  });
});
