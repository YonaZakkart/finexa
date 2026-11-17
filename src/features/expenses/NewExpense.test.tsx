import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionError } from '@/features/balance/errors';
import { record } from '@/features/balance/transactions.service';
import { getLocalDateString } from '@/lib/date';
import type { Transaction } from '@/types';
import { NewExpense } from './NewExpense';

vi.mock('@/features/balance/transactions.service', () => ({ record: vi.fn() }));

const recordMock = vi.mocked(record);

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/expenses/new']}>
      <Routes>
        <Route path="/" element={<div>Dashboard page</div>} />
        <Route path="/expenses/new" element={<NewExpense />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  recordMock.mockReset();
  recordMock.mockResolvedValue({} as Transaction);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NewExpense', () => {
  it('renders today by default and exposes the category labels', () => {
    renderForm();

    expect(screen.getByLabelText('Fecha')).toHaveValue(getLocalDateString());
    expect(screen.getByLabelText('Fecha')).toHaveAttribute('max', getLocalDateString());
    expect(screen.getByLabelText('Categoría')).toHaveValue('');
    expect(screen.getByLabelText('Nota')).toHaveAttribute('maxLength', '280');
    expect(
      within(screen.getByLabelText('Categoría')).getByRole('option', { name: 'Movilidad' })
    ).toBeInTheDocument();
  });

  it('registers a valid expense and resets the form', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Monto'), '12.5');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'daily');
    await user.selectOptions(screen.getByLabelText('Subcategoría'), 'daily.food');
    await user.type(screen.getByLabelText('Nota'), 'Lunch');
    await user.click(screen.getByRole('button', { name: 'Guardar gasto' }));

    await waitFor(() =>
      expect(recordMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expense',
          direction: 'debit',
          amount: 12.5,
          date: getLocalDateString(),
          category: 'daily',
          subcategory: 'daily.food',
          note: 'Lunch',
        })
      )
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Gasto guardado. Balance actualizado.'
    );
    expect((screen.getByLabelText('Monto') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Categoría') as HTMLSelectElement).value).toBe('');
    expect((screen.getByLabelText('Nota') as HTMLTextAreaElement).value).toBe('');
  });

  it('clears the subcategory when the category changes', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.selectOptions(screen.getByLabelText('Categoría'), 'daily');
    await user.selectOptions(screen.getByLabelText('Subcategoría'), 'daily.food');
    expect(screen.getByLabelText('Subcategoría')).toHaveValue('daily.food');

    await user.selectOptions(screen.getByLabelText('Categoría'), 'mobility');

    expect(screen.getByLabelText('Subcategoría')).toHaveValue('');
    expect(
      within(screen.getByLabelText('Subcategoría')).getByRole('option', { name: 'Combustible' })
    ).toBeInTheDocument();
  });

  it('rejects an empty amount without calling the service', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Guardar gasto' }));

    expect(screen.getByRole('alert')).toHaveTextContent('El monto debe ser mayor que cero');
    expect(recordMock).not.toHaveBeenCalled();
  });

  it('requires a category', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Monto'), '10');
    await user.click(screen.getByRole('button', { name: 'Guardar gasto' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona una categoría');
    expect(recordMock).not.toHaveBeenCalled();
  });

  it('requires a subcategory when the category has subcategories', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Monto'), '10');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'daily');
    await user.click(screen.getByRole('button', { name: 'Guardar gasto' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona una subcategoría');
    expect(recordMock).not.toHaveBeenCalled();
  });

  it('shows a translated service error', async () => {
    const user = userEvent.setup();
    recordMock.mockRejectedValueOnce(new TransactionError('invalidDate'));
    renderForm();

    await user.type(screen.getByLabelText('Monto'), '10');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'other');
    await user.click(screen.getByRole('button', { name: 'Guardar gasto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La fecha no es válida');
  });

  it('blocks double submit while saving', async () => {
    const user = userEvent.setup();
    let resolveRecord: (value: Transaction) => void = () => undefined;
    recordMock.mockImplementation(
      () =>
        new Promise<Transaction>((resolve) => {
          resolveRecord = resolve;
        })
    );
    renderForm();

    await user.type(screen.getByLabelText('Monto'), '10');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'other');
    await user.click(screen.getByRole('button', { name: 'Guardar gasto' }));

    const save = screen.getByRole('button', { name: 'Guardar gasto' });
    expect(save).toBeDisabled();
    expect(save).toHaveAttribute('aria-busy', 'true');

    await user.click(save);
    expect(recordMock).toHaveBeenCalledTimes(1);

    resolveRecord({} as Transaction);
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
  });

  it('navigates back to the dashboard', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });
});
