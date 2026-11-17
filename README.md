# Finexa

Personal finance PWA focused on daily expenses, balance and debt control. Mobile-first,
offline-first and installable.

> Status: Phase 1 — Foundation.

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
