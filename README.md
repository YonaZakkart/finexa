# Finexa

Personal finance PWA focused on daily expenses, balance, debt control and investment
portfolio monitoring. Mobile-first, offline-first and installable.

> Status: 0.4.0 — PWA performance, investment movements, portfolio CRUD and balance chart.

## Features

- Daily expenses with categories, history, editing and daily/weekly charts.
- Balance, debts and optional onboarding.
- Investment portfolio monitoring: portfolios, deposits, purchases, commissions,
  residual money, manual balance, history, editing and a balance evolution chart.
- CRUD for portfolios, expenses, investments and debts with balance-impact confirmation.
- Money management panel for income, adjustments and investment movements.
- Fast panel switching: lazy routes with skeletons, prefetched panels, cached
  formatters and no per-card backdrop blur.
- Offline-first PWA, Spanish/English and the glass-dark theme.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS + CSS variables
- Zustand
- Dexie (IndexedDB)
- Recharts
- i18next + react-i18next
- React Router
- vite-plugin-pwa
- Vitest + Testing Library

## Getting started

Requires Node.js 22+ and pnpm 12+.

```bash
pnpm install
pnpm dev
```

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

## Project structure

```text
src/
├── assets/
├── components/
│   ├── layout/
│   └── ui/
├── features/
├── lib/
├── stores/
├── styles/
├── test/
└── types/
```
