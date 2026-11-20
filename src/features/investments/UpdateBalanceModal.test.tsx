import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Portfolio } from '@/types';
import { InvestmentError } from './investments.errors';
import { updateBalance } from './investments.service';
import { UpdateBalanceModal } from './UpdateBalanceModal';

vi.mock('./investments.service', () => ({
  updateBalance: vi.fn(),
}));

const updateBalanceMock = vi.mocked(updateBalance);

const portfolio: Portfolio = {
  id: 'p1',
  name: 'VOO',
  type: 'etf',
  broker: 'Hapi',
  currentBalance: 0,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-18T10:00:00.000Z',
};

beforeEach(() => {
  updateBalanceMock.mockReset();
  updateBalanceMock.mockResolvedValue(undefined);
});

describe('UpdateBalanceModal', () => {
  it('updates the balance and closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UpdateBalanceModal portfolio={portfolio} onClose={onClose} />);

    const input = screen.getByLabelText('Saldo actual');
    await user.clear(input);
    await user.type(input, '150.005');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(updateBalanceMock).toHaveBeenCalledWith('p1', 150.005));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('rejects a negative balance without calling the service', async () => {
    const user = userEvent.setup();
    render(<UpdateBalanceModal portfolio={portfolio} onClose={vi.fn()} />);

    const input = screen.getByLabelText('Saldo actual');
    await user.clear(input);
    await user.type(input, '-1');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('El saldo no puede ser negativo');
    expect(updateBalanceMock).not.toHaveBeenCalled();
  });

  it('rejects an empty balance without calling the service', async () => {
    const user = userEvent.setup();
    render(<UpdateBalanceModal portfolio={portfolio} onClose={vi.fn()} />);

    await user.clear(screen.getByLabelText('Saldo actual'));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Introduce un saldo válido');
    expect(updateBalanceMock).not.toHaveBeenCalled();
  });

  it('shows a translated service error and stays open', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    updateBalanceMock.mockRejectedValueOnce(new InvestmentError('balanceRequiresInvestment'));
    render(<UpdateBalanceModal portfolio={portfolio} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Registra al menos una inversión antes de actualizar el saldo'
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes from the cancel button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<UpdateBalanceModal portfolio={portfolio} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
  });
});
