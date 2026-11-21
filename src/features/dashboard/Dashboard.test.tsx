import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDefaultSettings } from '@/features/settings/settings.service';
import { useAppStore } from '@/stores/app.store';
import type { Debt, Transaction } from '@/types';
import { Dashboard } from './Dashboard';

let sequence = 0;

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  sequence += 1;

  return {
    id: `tx-${sequence}`,
    type: 'income',
    direction: 'credit',
    amount: 0,
    date: '2026-11-17',
    createdAt: '2026-11-17T10:00:00.000Z',
    ...overrides,
  };
}

function debt(overrides: Partial<Debt> = {}): Debt {
  sequence += 1;

  return {
    id: `debt-${sequence}`,
    name: 'Credit card',
    amount: 0,
    status: 'active',
    createdAt: '2026-11-17T10:00:00.000Z',
    ...overrides,
  };
}

function seed(transactions: Transaction[], debts: Debt[]) {
  useAppStore.setState({
    hydrated: true,
    settings: { ...createDefaultSettings(), language: 'es' },
    transactions,
    debts,
  });
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/debts" element={<div>Debts page</div>} />
        <Route path="/money" element={<div>Money page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function cardFor(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { name: title });
  return heading.closest('.glass-card') as HTMLElement;
}

beforeEach(() => {
  useAppStore.getState().reset();
});

afterEach(() => {
  useAppStore.getState().reset();
});

describe('Dashboard', () => {
  it('derives balance, debt and net from the store', () => {
    seed(
      [
        transaction({ type: 'initial_balance', direction: 'credit', amount: 100 }),
        transaction({ type: 'expense', direction: 'debit', amount: 20 }),
      ],
      [debt({ amount: 30 })]
    );

    renderDashboard();

    expect(within(cardFor('Balance actual')).getByText(/80,00\s*US\$/)).toBeInTheDocument();
    expect(within(cardFor('Deuda')).getByText(/30,00\s*US\$/)).toHaveClass('text-negative');
    expect(within(cardFor('Neto')).getByText(/50,00\s*US\$/)).toBeInTheDocument();
    expect(screen.queryByText('Aún no hay movimientos')).not.toBeInTheDocument();
  });

  it('shows a negative balance in red with an explicit label', () => {
    seed([transaction({ type: 'expense', direction: 'debit', amount: 15.5 })], []);

    renderDashboard();

    const amount = within(cardFor('Balance actual')).getByText(/-15,50\s*US\$/);

    expect(amount).toHaveClass('text-negative');
    expect(screen.getByText('Balance negativo')).toBeInTheDocument();
  });

  it('shows an empty state when there are no movements', () => {
    seed([], []);

    renderDashboard();

    expect(screen.getByText('Aún no hay movimientos')).toBeInTheDocument();
    expect(
      screen.getByText('Añade dinero o registra un gasto para ver tu balance en movimiento.')
    ).toBeInTheDocument();
    expect(within(cardFor('Deuda')).getByText(/0,00\s*US\$/)).toHaveClass('text-text-muted');
  });

  it('navigates to the money page from the quick action', async () => {
    const user = userEvent.setup();
    seed([], []);
    renderDashboard();

    await user.click(screen.getByRole('button', { name: 'Gestionar dinero' }));

    expect(screen.getByText('Money page')).toBeInTheDocument();
  });

  it('navigates to the debts view from the quick action', async () => {
    const user = userEvent.setup();
    seed([], []);
    renderDashboard();

    await user.click(screen.getByRole('button', { name: 'Gestionar deudas' }));

    expect(screen.getByText('Debts page')).toBeInTheDocument();
  });
});
