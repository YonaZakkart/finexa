import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionError } from '@/features/balance/errors';
import { record } from '@/features/balance/transactions.service';
import { createDefaultSettings } from '@/features/settings/settings.service';
import { getLocalDateString } from '@/lib/date';
import { useAppStore } from '@/stores/app.store';
import type { Debt, Transaction } from '@/types';
import { Dashboard } from './Dashboard';

vi.mock('@/features/balance/transactions.service', () => ({ record: vi.fn() }));

const recordMock = vi.mocked(record);
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
  recordMock.mockReset();
  recordMock.mockResolvedValue(transaction({ id: 'saved' }));
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

  it('opens the money modal from the quick action', async () => {
    const user = userEvent.setup();
    seed([], []);
    renderDashboard();

    await user.click(screen.getByRole('button', { name: 'Añadir dinero' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Añadir dinero' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo')).toHaveValue('income');
  });

  it('records an income and closes the modal', async () => {
    const user = userEvent.setup();
    seed([], []);
    renderDashboard();

    await user.click(screen.getByRole('button', { name: 'Añadir dinero' }));
    await user.type(screen.getByLabelText('Monto'), '50');
    await user.type(screen.getByLabelText('Origen o nota'), 'Salario');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(recordMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'income',
          direction: 'credit',
          amount: 50,
          date: getLocalDateString(),
          note: 'Salario',
        })
      )
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('records a debit balance adjustment', async () => {
    const user = userEvent.setup();
    seed([], []);
    renderDashboard();

    await user.click(screen.getByRole('button', { name: 'Añadir dinero' }));
    await user.selectOptions(screen.getByLabelText('Tipo'), 'adjustment');
    await user.selectOptions(screen.getByLabelText('Efecto en el balance'), 'debit');
    await user.type(screen.getByLabelText('Monto'), '20');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(recordMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'adjustment',
          direction: 'debit',
          amount: 20,
        })
      )
    );
  });

  it('rejects an empty amount without calling the service', async () => {
    const user = userEvent.setup();
    seed([], []);
    renderDashboard();

    await user.click(screen.getByRole('button', { name: 'Añadir dinero' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Introduce un monto mayor que cero');
    expect(recordMock).not.toHaveBeenCalled();
  });

  it('shows a translated error when the service rejects', async () => {
    const user = userEvent.setup();
    recordMock.mockRejectedValueOnce(new TransactionError('invalidDate'));
    seed([], []);
    renderDashboard();

    await user.click(screen.getByRole('button', { name: 'Añadir dinero' }));
    await user.type(screen.getByLabelText('Monto'), '10');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La fecha no es válida');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('navigates to the debts view from the quick action', async () => {
    const user = userEvent.setup();
    seed([], []);
    renderDashboard();

    await user.click(screen.getByRole('button', { name: 'Gestionar deudas' }));

    expect(screen.getByText('Debts page')).toBeInTheDocument();
  });
});
