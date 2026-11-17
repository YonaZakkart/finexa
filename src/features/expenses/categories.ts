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
    labelKey: 'categories.mobility',
    colorToken: '#3b82f6',
    subcategories: [
      { id: 'mobility.public_transport', labelKey: 'categories.mobility.public_transport' },
      { id: 'mobility.fuel', labelKey: 'categories.mobility.fuel' },
      { id: 'mobility.taxi_app', labelKey: 'categories.mobility.taxi_app' },
      { id: 'mobility.parking', labelKey: 'categories.mobility.parking' },
    ],
  },
  {
    id: 'daily',
    labelKey: 'categories.daily',
    colorToken: '#10b981',
    subcategories: [
      { id: 'daily.food', labelKey: 'categories.daily.food' },
      { id: 'daily.coffee_snacks', labelKey: 'categories.daily.coffee_snacks' },
      { id: 'daily.other', labelKey: 'categories.daily.other' },
    ],
  },
  {
    id: 'utilities',
    labelKey: 'categories.utilities',
    colorToken: '#f59e0b',
    subcategories: [
      { id: 'utilities.water', labelKey: 'categories.utilities.water' },
      { id: 'utilities.electricity', labelKey: 'categories.utilities.electricity' },
      { id: 'utilities.home_internet', labelKey: 'categories.utilities.home_internet' },
      { id: 'utilities.mobile_internet', labelKey: 'categories.utilities.mobile_internet' },
      { id: 'utilities.gas', labelKey: 'categories.utilities.gas' },
    ],
  },
  {
    id: 'personal',
    labelKey: 'categories.personal',
    colorToken: '#ec4899',
    subcategories: [
      { id: 'personal.clothing', labelKey: 'categories.personal.clothing' },
      { id: 'personal.accessories', labelKey: 'categories.personal.accessories' },
      { id: 'personal.hygiene', labelKey: 'categories.personal.hygiene' },
      { id: 'personal.beauty', labelKey: 'categories.personal.beauty' },
    ],
  },
  {
    id: 'health',
    labelKey: 'categories.health',
    colorToken: '#ef4444',
    subcategories: [
      { id: 'health.medical_consultation', labelKey: 'categories.health.medical_consultation' },
      { id: 'health.medicines', labelKey: 'categories.health.medicines' },
      { id: 'health.treatment', labelKey: 'categories.health.treatment' },
      { id: 'health.insurance', labelKey: 'categories.health.insurance' },
    ],
  },
  {
    id: 'pets',
    labelKey: 'categories.pets',
    colorToken: '#8b5cf6',
    subcategories: [
      { id: 'pets.food', labelKey: 'categories.pets.food' },
      { id: 'pets.medicine', labelKey: 'categories.pets.medicine' },
      { id: 'pets.veterinary', labelKey: 'categories.pets.veterinary' },
      { id: 'pets.other', labelKey: 'categories.pets.other' },
    ],
  },
  {
    id: 'hobby',
    labelKey: 'categories.hobby',
    colorToken: '#06b6d4',
    subcategories: [
      { id: 'hobby.purchases', labelKey: 'categories.hobby.purchases' },
      { id: 'hobby.repairs', labelKey: 'categories.hobby.repairs' },
      { id: 'hobby.tickets', labelKey: 'categories.hobby.tickets' },
      { id: 'hobby.sports', labelKey: 'categories.hobby.sports' },
    ],
  },
  {
    id: 'subscriptions',
    labelKey: 'categories.subscriptions',
    colorToken: '#84cc16',
    subcategories: [
      { id: 'subscriptions.entertainment', labelKey: 'categories.subscriptions.entertainment' },
      { id: 'subscriptions.ai', labelKey: 'categories.subscriptions.ai' },
      { id: 'subscriptions.music', labelKey: 'categories.subscriptions.music' },
      { id: 'subscriptions.software', labelKey: 'categories.subscriptions.software' },
      { id: 'subscriptions.other', labelKey: 'categories.subscriptions.other' },
    ],
  },
  {
    id: 'work',
    labelKey: 'categories.work',
    colorToken: '#6366f1',
    subcategories: [
      { id: 'work.tools', labelKey: 'categories.work.tools' },
      { id: 'work.repairs', labelKey: 'categories.work.repairs' },
      { id: 'work.materials', labelKey: 'categories.work.materials' },
      { id: 'work.transport', labelKey: 'categories.work.transport' },
    ],
  },
  {
    id: 'tech',
    labelKey: 'categories.tech',
    colorToken: '#14b8a6',
    subcategories: [
      { id: 'tech.hardware', labelKey: 'categories.tech.hardware' },
      { id: 'tech.software', labelKey: 'categories.tech.software' },
      { id: 'tech.maintenance', labelKey: 'categories.tech.maintenance' },
      { id: 'tech.repairs', labelKey: 'categories.tech.repairs' },
    ],
  },
  {
    id: 'housing',
    labelKey: 'categories.housing',
    colorToken: '#f97316',
    subcategories: [
      { id: 'housing.rent', labelKey: 'categories.housing.rent' },
      { id: 'housing.maintenance', labelKey: 'categories.housing.maintenance' },
      { id: 'housing.furniture', labelKey: 'categories.housing.furniture' },
    ],
  },
  {
    id: 'education',
    labelKey: 'categories.education',
    colorToken: '#eab308',
    subcategories: [
      { id: 'education.courses', labelKey: 'categories.education.courses' },
      { id: 'education.books', labelKey: 'categories.education.books' },
      { id: 'education.materials', labelKey: 'categories.education.materials' },
    ],
  },
  {
    id: 'other',
    labelKey: 'categories.other',
    colorToken: '#94a3b8',
    subcategories: [],
  },
];
