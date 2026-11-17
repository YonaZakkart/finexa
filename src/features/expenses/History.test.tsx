import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSettings } from '@/features/settings/settings.service';
import { listExpensesByDate } from '@/features/transactions/transactions.repository';
import { addDaysToDate, getLocalDateString } from '@/lib/date';
import { useAppStore } from '@/stores/app.store';
import type { Transaction } from '@/types';
import { History } from './History';

vi.mock('@/features/transactions/transactions.repository', () => ({
  listExpensesByDate: vi.fn(),
}));

const listMock = vi.mocked(listExpensesByDate);
const today = getLocalDateString();
const yesterday = addDaysToDate(today, -1);

function expense(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'expense-1',
    type: 'expense',
    direction: 'debit',
    amount: 12.5,
    category: 'daily',
    subcategory: 'daily.food',
    note: 'Lunch',
    date: today,
    createdAt: new Date(2026, 10, 17, 13, 30).toISOString(),
    ...overrides,
  };
}

function renderHistory(initialEntry = '/history') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<div>Dashboard page</div>} />
        <Route path="/history" element={<History />} />
        <Route path="/expenses/:id/edit" element={<div>Edit page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAppStore.getState().reset();
  useAppStore.setState({
    hydrated: true,
    settings: { ...createDefaultSettings(), language: 'es' },
    transactions: [],
    debts: [],
  });
  listMock.mockReset();
  listMock.mockResolvedValue([expense()]);
});

afterEach(() => {
  useAppStore.getState().reset();
  vi.restoreAllMocks();
});

describe('History', () => {
  it('loads and renders the expenses of today', async () => {
    renderHistory();

    await waitFor(() => expect(listMock).toHaveBeenCalledWith(today));

    expect((await screen.findAllByText('Gastos diarios')).length).toBeGreaterThan(0);
    expect(screen.getByText('Resumen del día')).toBeInTheDocument();
    expect(screen.getByText('1 gasto')).toBeInTheDocument();
    expect(screen.getByText('Comida')).toBeInTheDocument();
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('-12,50 US$')).toBeInTheDocument();
    expect(screen.getAllByText('12,50 US$').length).toBeGreaterThan(0);
    expect(screen.getByText('13:30')).toBeInTheDocument();
    expect(screen.getAllByText('Hoy').length).toBeGreaterThan(0);
  });

  it('opens the date from the query string', async () => {
    renderHistory('/history?date=2026-11-10');

    await waitFor(() => expect(listMock).toHaveBeenCalledWith('2026-11-10'));
  });

  it('switches to yesterday and back to today', async () => {
    const user = userEvent.setup();
    renderHistory();

    await waitFor(() => expect(listMock).toHaveBeenCalledWith(today));

    await user.click(screen.getByRole('button', { name: 'Ayer' }));

    await waitFor(() => expect(listMock).toHaveBeenCalledWith(yesterday));
    expect(screen.getAllByText('Ayer').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Hoy' }));

    await waitFor(() => expect(listMock).toHaveBeenCalledWith(today));
  });

  it('loads a date picked from the calendar input', async () => {
    renderHistory();

    await waitFor(() => expect(listMock).toHaveBeenCalledWith(today));

    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-11-10' } });

    await waitFor(() => expect(listMock).toHaveBeenCalledWith('2026-11-10'));
  });

  it('disables the next day on today and enables it after going back', async () => {
    const user = userEvent.setup();
    renderHistory();

    const next = screen.getByRole('button', { name: 'Día siguiente' });
    expect(next).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Ayer' }));

    await waitFor(() => expect(next).toBeEnabled());
    await user.click(next);
    await waitFor(() => expect(listMock).toHaveBeenCalledWith(today));
  });

  it('shows the empty state', async () => {
    listMock.mockResolvedValueOnce([]);
    renderHistory();

    expect(await screen.findByText('No hay gastos registrados')).toBeInTheDocument();
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('0 gastos')).toBeInTheDocument();
  });

  it('shows a loading state while the query is pending', async () => {
    let resolveRows: (rows: Transaction[]) => void = () => undefined;
    listMock.mockImplementation(
      () =>
        new Promise<Transaction[]>((resolve) => {
          resolveRows = resolve;
        })
    );
    renderHistory();

    expect(screen.getByRole('status')).toHaveTextContent('Cargando gastos…');

    await act(async () => {
      resolveRows([]);
    });

    expect(await screen.findByText('No hay gastos registrados')).toBeInTheDocument();
  });

  it('shows an error and retries the query', async () => {
    const user = userEvent.setup();
    listMock.mockRejectedValueOnce(new Error('boom'));
    renderHistory();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar los gastos. Inténtalo de nuevo.'
    );

    listMock.mockResolvedValueOnce([]);
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('No hay gastos registrados')).toBeInTheDocument();
    expect(listMock).toHaveBeenCalledTimes(2);
  });

  it('navigates to the edit placeholder', async () => {
    const user = userEvent.setup();
    renderHistory();

    expect((await screen.findAllByText('Gastos diarios')).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('link', { name: /Editar/ }));

    expect(screen.getByText('Edit page')).toBeInTheDocument();
  });

  it('navigates back to the dashboard', async () => {
    const user = userEvent.setup();
    renderHistory();

    await waitFor(() => expect(listMock).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });
});
