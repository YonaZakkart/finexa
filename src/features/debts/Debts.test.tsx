import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionError } from '@/features/balance/errors';
import { payDebt } from '@/features/balance/transactions.service';
import { createDefaultSettings } from '@/features/settings/settings.service';
import { useAppStore } from '@/stores/app.store';
import type { Debt } from '@/types';
import { Debts } from './Debts';
import { createDebt } from './debts.service';

vi.mock('./debts.service', () => ({ createDebt: vi.fn() }));
vi.mock('@/features/balance/transactions.service', () => ({ payDebt: vi.fn() }));

const createDebtMock = vi.mocked(createDebt);
const payDebtMock = vi.mocked(payDebt);
let sequence = 0;

function debt(overrides: Partial<Debt> = {}): Debt {
  sequence += 1;

  return {
    id: `debt-${sequence}`,
    name: 'Tarjeta',
    amount: 30,
    status: 'active',
    createdAt: '2026-11-17T10:00:00.000Z',
    ...overrides,
  };
}

function seed(debts: Debt[]) {
  useAppStore.setState({
    hydrated: true,
    settings: { ...createDefaultSettings(), language: 'es' },
    transactions: [],
    debts,
  });
}

function renderDebts() {
  return render(
    <MemoryRouter initialEntries={['/debts']}>
      <Routes>
        <Route path="/" element={<div>Dashboard page</div>} />
        <Route path="/debts" element={<Debts />} />
      </Routes>
    </MemoryRouter>
  );
}

function cardFor(title: string): HTMLElement {
  return screen.getByRole('heading', { name: title }).closest('.glass-card') as HTMLElement;
}

beforeEach(() => {
  useAppStore.getState().reset();
  createDebtMock.mockReset();
  payDebtMock.mockReset();
  createDebtMock.mockResolvedValue(debt());
  payDebtMock.mockResolvedValue(undefined);
});

afterEach(() => {
  useAppStore.getState().reset();
});

describe('Debts', () => {
  it('renders active and paid debts with the active total', () => {
    seed([
      debt({
        name: 'Tarjeta',
        amount: 30,
        status: 'active',
        createdAt: '2026-11-17T10:00:00.000Z',
      }),
      debt({
        name: 'Préstamo',
        amount: 20,
        status: 'paid',
        paidAt: '2026-11-17T10:00:00.000Z',
        createdAt: '2026-11-16T10:00:00.000Z',
      }),
    ]);

    renderDebts();

    expect(screen.getByRole('heading', { name: 'Deudas' })).toBeInTheDocument();
    expect(within(cardFor('Deuda total')).getByText(/30,00\s*US\$/)).toHaveClass('text-negative');
    expect(screen.getByText('Tarjeta')).toBeInTheDocument();
    expect(screen.getByText('Préstamo')).toBeInTheDocument();
    expect(screen.getByText(/Pagada el/)).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    seed([]);

    renderDebts();

    expect(within(cardFor('Deuda total')).getByText(/0,00\s*US\$/)).toHaveClass('text-text-muted');
    expect(screen.getByText('No tienes deudas registradas')).toBeInTheDocument();
    expect(screen.getByText('Añade tu primera deuda para llevar el control.')).toBeInTheDocument();
  });

  it('creates a debt from the modal', async () => {
    const user = userEvent.setup();
    seed([]);
    renderDebts();

    await user.click(screen.getByRole('button', { name: 'Añadir deuda' }));
    await user.type(screen.getByLabelText('Nombre'), '  Tarjeta  ');
    await user.type(screen.getByLabelText('Monto'), '30');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(createDebtMock).toHaveBeenCalledWith({ name: 'Tarjeta', amount: 30 })
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('validates the add form', async () => {
    const user = userEvent.setup();
    seed([]);
    renderDebts();

    await user.click(screen.getByRole('button', { name: 'Añadir deuda' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El nombre de la deuda debe tener entre 1 y 80 caracteres'
    );
    expect(createDebtMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Nombre'), 'Tarjeta');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('El monto debe ser mayor que cero');
    expect(createDebtMock).not.toHaveBeenCalled();
  });

  it('shows a translated error when creating a debt fails', async () => {
    const user = userEvent.setup();
    createDebtMock.mockRejectedValueOnce(new TransactionError('invalidAmount'));
    seed([]);
    renderDebts();

    await user.click(screen.getByRole('button', { name: 'Añadir deuda' }));
    await user.type(screen.getByLabelText('Nombre'), 'Tarjeta');
    await user.type(screen.getByLabelText('Monto'), '30');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El monto debe ser mayor que cero');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('pays a debt with balance impact', async () => {
    const user = userEvent.setup();
    const active = debt({ name: 'Tarjeta', amount: 30 });
    seed([active]);
    renderDebts();

    await user.click(screen.getByRole('button', { name: 'Marcar como pagada' }));

    expect(
      screen.getByRole('heading', { name: 'Marcar “Tarjeta” como pagada' })
    ).toBeInTheDocument();
    expect(screen.getByText(/La deuda es 30,00/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sí, reducir balance' }));

    await waitFor(() => expect(payDebtMock).toHaveBeenCalledWith(active.id, true));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('pays a debt without balance impact', async () => {
    const user = userEvent.setup();
    const active = debt({ name: 'Tarjeta', amount: 30 });
    seed([active]);
    renderDebts();

    await user.click(screen.getByRole('button', { name: 'Marcar como pagada' }));
    await user.click(screen.getByRole('button', { name: 'No, solo marcar pagada' }));

    await waitFor(() => expect(payDebtMock).toHaveBeenCalledWith(active.id, false));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows a translated error when paying fails', async () => {
    const user = userEvent.setup();
    payDebtMock.mockRejectedValueOnce(new TransactionError('debtAlreadyPaid'));
    seed([debt({ name: 'Tarjeta', amount: 30 })]);
    renderDebts();

    await user.click(screen.getByRole('button', { name: 'Marcar como pagada' }));
    await user.click(screen.getByRole('button', { name: 'Sí, reducir balance' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('La deuda ya está pagada');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('blocks double submit while paying', async () => {
    const user = userEvent.setup();
    let resolvePay: () => void = () => undefined;
    payDebtMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePay = resolve;
        })
    );
    seed([debt({ name: 'Tarjeta', amount: 30 })]);
    renderDebts();

    await user.click(screen.getByRole('button', { name: 'Marcar como pagada' }));
    await user.click(screen.getByRole('button', { name: 'Sí, reducir balance' }));

    const confirm = screen.getByRole('button', { name: 'Sí, reducir balance' });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-busy', 'true');

    await user.click(confirm);
    expect(payDebtMock).toHaveBeenCalledTimes(1);

    resolvePay();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('navigates back to the dashboard', async () => {
    const user = userEvent.setup();
    seed([]);
    renderDebts();

    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });
});
