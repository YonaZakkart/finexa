import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionError } from '@/features/balance/errors';
import { updateExpense } from '@/features/balance/transactions.service';
import { createDefaultSettings } from '@/features/settings/settings.service';
import { getLocalDateString } from '@/lib/date';
import { useAppStore } from '@/stores/app.store';
import type { Transaction } from '@/types';
import { EditExpense } from './EditExpense';

vi.mock('@/features/balance/transactions.service', () => ({ updateExpense: vi.fn() }));

const updateMock = vi.mocked(updateExpense);
const today = getLocalDateString();

function expense(): Transaction {
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
  };
}

function HistoryMarker() {
  const location = useLocation();
  return <div>History page {location.search}</div>;
}

function renderEdit() {
  return render(
    <MemoryRouter initialEntries={['/expenses/expense-1/edit']}>
      <Routes>
        <Route path="/history" element={<HistoryMarker />} />
        <Route path="/expenses/:id/edit" element={<EditExpense />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAppStore.getState().reset();
  useAppStore.setState({
    hydrated: true,
    settings: { ...createDefaultSettings(), language: 'es' },
    transactions: [expense()],
    debts: [],
  });
  updateMock.mockReset();
  updateMock.mockResolvedValue(undefined);
});

afterEach(() => {
  useAppStore.getState().reset();
  vi.restoreAllMocks();
});

describe('EditExpense', () => {
  it('prefills the expense fields', () => {
    renderEdit();

    expect(screen.getByRole('heading', { name: 'Editar gasto' })).toBeInTheDocument();
    expect(screen.getByLabelText('Monto')).toHaveValue(12.5);
    expect(screen.getByLabelText('Categoría')).toHaveValue('daily');
    expect(screen.getByLabelText('Subcategoría')).toHaveValue('daily.food');
    expect(screen.getByLabelText('Fecha')).toHaveValue(today);
    expect(screen.getByLabelText('Nota')).toHaveValue('Lunch');
  });

  it('saves metadata without touching the balance', async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.clear(screen.getByLabelText('Nota'));
    await user.type(screen.getByLabelText('Nota'), 'Dinner');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith(
        'expense-1',
        expect.objectContaining({ note: 'Dinner', amount: 12.5 }),
        false
      )
    );
    await waitFor(() => expect(screen.getByText(/History page/)).toBeInTheDocument());
    expect(screen.getByText(/date=/)).toBeInTheDocument();
  });

  it('applies the balance impact when accepted', async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.clear(screen.getByLabelText('Monto'));
    await user.type(screen.getByLabelText('Monto'), '15');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/\+2,50/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sí, afectar balance' }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith(
        'expense-1',
        expect.objectContaining({ amount: 15 }),
        true
      )
    );
    await waitFor(() => expect(screen.getByText(/History page/)).toBeInTheDocument());
  });

  it('keeps the balance when the impact is rejected', async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.clear(screen.getByLabelText('Monto'));
    await user.type(screen.getByLabelText('Monto'), '15');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await user.click(screen.getByRole('button', { name: 'No, mantener balance' }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith(
        'expense-1',
        expect.objectContaining({ amount: 15 }),
        false
      )
    );
  });

  it('cancels the impact dialog without saving', async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.clear(screen.getByLabelText('Monto'));
    await user.type(screen.getByLabelText('Monto'), '15');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(updateMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Editar gasto' })).toBeInTheDocument();
  });

  it('rejects an invalid amount', async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.clear(screen.getByLabelText('Monto'));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByRole('alert')).toHaveTextContent('El monto debe ser mayor que cero');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('clears the subcategory when the category changes and requires a new one', async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.selectOptions(screen.getByLabelText('Categoría'), 'mobility');

    expect(screen.getByLabelText('Subcategoría')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona una subcategoría');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('shows a translated service error in the dialog', async () => {
    const user = userEvent.setup();
    updateMock.mockRejectedValueOnce(new TransactionError('invalidDate'));
    renderEdit();

    await user.clear(screen.getByLabelText('Monto'));
    await user.type(screen.getByLabelText('Monto'), '15');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await user.click(screen.getByRole('button', { name: 'Sí, afectar balance' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La fecha no es válida');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('blocks double submit while saving', async () => {
    const user = userEvent.setup();
    let resolveUpdate: () => void = () => undefined;
    updateMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        })
    );
    renderEdit();

    await user.clear(screen.getByLabelText('Nota'));
    await user.type(screen.getByLabelText('Nota'), 'Dinner');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    const save = screen.getByRole('button', { name: 'Guardar cambios' });
    expect(save).toBeDisabled();
    expect(save).toHaveAttribute('aria-busy', 'true');

    await user.click(save);
    expect(updateMock).toHaveBeenCalledTimes(1);

    resolveUpdate();
    await waitFor(() => expect(screen.getByText(/History page/)).toBeInTheDocument());
  });

  it('shows the not-found state for an unknown expense', async () => {
    const user = userEvent.setup();
    useAppStore.setState({ transactions: [] });
    renderEdit();

    expect(screen.getByText('Gasto no encontrado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volver al historial' }));

    expect(screen.getByText(/History page/)).toBeInTheDocument();
  });

  it('navigates back to the history from the form', async () => {
    const user = userEvent.setup();
    renderEdit();

    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByText(/History page/)).toBeInTheDocument();
  });
});
