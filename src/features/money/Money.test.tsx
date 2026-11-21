import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { record } from '@/features/balance/transactions.service';
import { createDefaultSettings } from '@/features/settings/settings.service';
import { useAppStore } from '@/stores/app.store';
import type { Transaction } from '@/types';
import { Money } from './Money';

vi.mock('@/features/balance/transactions.service', () => ({ record: vi.fn() }));
const recordMock = vi.mocked(record);

const transactions: Transaction[] = [
  {
    id: 't1',
    type: 'income',
    direction: 'credit',
    amount: 100,
    date: '2026-11-18',
    createdAt: '2026-11-18T10:00:00.000Z',
  },
  {
    id: 't2',
    type: 'adjustment',
    direction: 'debit',
    amount: 20,
    date: '2026-11-17',
    createdAt: '2026-11-17T10:00:00.000Z',
  },
  {
    id: 't3',
    type: 'expense',
    direction: 'debit',
    amount: 30,
    date: '2026-11-16',
    createdAt: '2026-11-16T10:00:00.000Z',
  },
];

function seed(rows: Transaction[]) {
  useAppStore.setState({
    hydrated: true,
    settings: { ...createDefaultSettings(), language: 'es' },
    transactions: rows,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/money']}>
      <Routes>
        <Route path="/money" element={<Money />} />
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAppStore.getState().reset();
  recordMock.mockReset();
  recordMock.mockResolvedValue(transactions[0]);
});
afterEach(() => useAppStore.getState().reset());

describe('Money', () => {
  it('shows the balance and only income/adjustment movements', () => {
    seed(transactions);
    renderPage();

    expect(screen.getByText(/50,00\s*US\$/)).toBeInTheDocument();
    expect(screen.getByText('Ingreso')).toBeInTheDocument();
    expect(screen.getByText('Ajuste de balance')).toBeInTheDocument();
    expect(screen.queryByText('Gasto')).not.toBeInTheDocument();
  });

  it('records a movement from the modal', async () => {
    const user = userEvent.setup();
    seed([]);
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Registrar movimiento' }));
    await user.type(screen.getByLabelText('Monto'), '50');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(recordMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'income', amount: 50 })
      )
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows the empty state without movements', () => {
    seed([]);
    renderPage();

    expect(screen.getByText('Aún no hay ingresos ni ajustes.')).toBeInTheDocument();
  });
});
