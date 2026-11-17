import type { Transaction } from '@/types';

export interface Subcategory {
  id: string;
  labelKey: string;
}

export interface Category {
  id: string;
  labelKey: string;
  colorToken: string;
  subcategories: Subcategory[];
}

export const categories: Category[] = [
  {
    id: 'mobility',
    labelKey: 'mobility',
    colorToken: '#3b82f6',
    subcategories: [
      { id: 'mobility.public_transport', labelKey: 'subcategories.mobility.public_transport' },
      { id: 'mobility.fuel', labelKey: 'subcategories.mobility.fuel' },
      { id: 'mobility.taxi_app', labelKey: 'subcategories.mobility.taxi_app' },
      { id: 'mobility.parking', labelKey: 'subcategories.mobility.parking' },
    ],
  },
  {
    id: 'daily',
    labelKey: 'daily',
    colorToken: '#10b981',
    subcategories: [
      { id: 'daily.food', labelKey: 'subcategories.daily.food' },
      { id: 'daily.coffee_snacks', labelKey: 'subcategories.daily.coffee_snacks' },
      { id: 'daily.other', labelKey: 'subcategories.daily.other' },
    ],
  },
  {
    id: 'utilities',
    labelKey: 'utilities',
    colorToken: '#f59e0b',
    subcategories: [
      { id: 'utilities.water', labelKey: 'subcategories.utilities.water' },
      { id: 'utilities.electricity', labelKey: 'subcategories.utilities.electricity' },
      { id: 'utilities.home_internet', labelKey: 'subcategories.utilities.home_internet' },
      { id: 'utilities.mobile_internet', labelKey: 'subcategories.utilities.mobile_internet' },
      { id: 'utilities.gas', labelKey: 'subcategories.utilities.gas' },
    ],
  },
  {
    id: 'personal',
    labelKey: 'personal',
    colorToken: '#ec4899',
    subcategories: [
      { id: 'personal.clothing', labelKey: 'subcategories.personal.clothing' },
      { id: 'personal.accessories', labelKey: 'subcategories.personal.accessories' },
      { id: 'personal.hygiene', labelKey: 'subcategories.personal.hygiene' },
      { id: 'personal.beauty', labelKey: 'subcategories.personal.beauty' },
    ],
  },
  {
    id: 'health',
    labelKey: 'health',
    colorToken: '#ef4444',
    subcategories: [
      {
        id: 'health.medical_consultation',
        labelKey: 'subcategories.health.medical_consultation',
      },
      { id: 'health.medicines', labelKey: 'subcategories.health.medicines' },
      { id: 'health.treatment', labelKey: 'subcategories.health.treatment' },
      { id: 'health.insurance', labelKey: 'subcategories.health.insurance' },
    ],
  },
  {
    id: 'pets',
    labelKey: 'pets',
    colorToken: '#8b5cf6',
    subcategories: [
      { id: 'pets.food', labelKey: 'subcategories.pets.food' },
      { id: 'pets.medicine', labelKey: 'subcategories.pets.medicine' },
      { id: 'pets.veterinary', labelKey: 'subcategories.pets.veterinary' },
      { id: 'pets.other', labelKey: 'subcategories.pets.other' },
    ],
  },
  {
    id: 'hobby',
    labelKey: 'hobby',
    colorToken: '#06b6d4',
    subcategories: [
      { id: 'hobby.purchases', labelKey: 'subcategories.hobby.purchases' },
      { id: 'hobby.repairs', labelKey: 'subcategories.hobby.repairs' },
      { id: 'hobby.tickets', labelKey: 'subcategories.hobby.tickets' },
      { id: 'hobby.sports', labelKey: 'subcategories.hobby.sports' },
    ],
  },
  {
    id: 'subscriptions',
    labelKey: 'subscriptions',
    colorToken: '#84cc16',
    subcategories: [
      {
        id: 'subscriptions.entertainment',
        labelKey: 'subcategories.subscriptions.entertainment',
      },
      { id: 'subscriptions.ai', labelKey: 'subcategories.subscriptions.ai' },
      { id: 'subscriptions.music', labelKey: 'subcategories.subscriptions.music' },
      { id: 'subscriptions.software', labelKey: 'subcategories.subscriptions.software' },
      { id: 'subscriptions.other', labelKey: 'subcategories.subscriptions.other' },
    ],
  },
  {
    id: 'work',
    labelKey: 'work',
    colorToken: '#6366f1',
    subcategories: [
      { id: 'work.tools', labelKey: 'subcategories.work.tools' },
      { id: 'work.repairs', labelKey: 'subcategories.work.repairs' },
      { id: 'work.materials', labelKey: 'subcategories.work.materials' },
      { id: 'work.transport', labelKey: 'subcategories.work.transport' },
    ],
  },
  {
    id: 'tech',
    labelKey: 'tech',
    colorToken: '#14b8a6',
    subcategories: [
      { id: 'tech.hardware', labelKey: 'subcategories.tech.hardware' },
      { id: 'tech.software', labelKey: 'subcategories.tech.software' },
      { id: 'tech.maintenance', labelKey: 'subcategories.tech.maintenance' },
      { id: 'tech.repairs', labelKey: 'subcategories.tech.repairs' },
    ],
  },
  {
    id: 'housing',
    labelKey: 'housing',
    colorToken: '#f97316',
    subcategories: [
      { id: 'housing.rent', labelKey: 'subcategories.housing.rent' },
      { id: 'housing.maintenance', labelKey: 'subcategories.housing.maintenance' },
      { id: 'housing.furniture', labelKey: 'subcategories.housing.furniture' },
    ],
  },
  {
    id: 'education',
    labelKey: 'education',
    colorToken: '#eab308',
    subcategories: [
      { id: 'education.courses', labelKey: 'subcategories.education.courses' },
      { id: 'education.books', labelKey: 'subcategories.education.books' },
      { id: 'education.materials', labelKey: 'subcategories.education.materials' },
    ],
  },
  {
    id: 'other',
    labelKey: 'other',
    colorToken: '#94a3b8',
    subcategories: [],
  },
];

export function getCategory(id: string): Category | undefined {
  return categories.find((category) => category.id === id);
}

export function getSubcategory(categoryId: string, subcategoryId: string): Subcategory | undefined {
  return getCategory(categoryId)?.subcategories.find(
    (subcategory) => subcategory.id === subcategoryId
  );
}

export function isValidCategory(id: string): boolean {
  return getCategory(id) !== undefined;
}

export function isValidSubcategory(categoryId: string, subcategoryId: string): boolean {
  return getSubcategory(categoryId, subcategoryId) !== undefined;
}

export function groupExpensesByCategory(
  transactions: Transaction[]
): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};

  for (const transaction of transactions) {
    if (transaction.type !== 'expense' || !transaction.category) {
      continue;
    }

    groups[transaction.category] = [...(groups[transaction.category] ?? []), transaction];
  }

  return groups;
}
