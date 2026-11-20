import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSettings } from '@/features/settings/settings.service';
import { getLocalDateString } from '@/lib/date';
import { useAppStore } from '@/stores/app.store';
import type { Investment, Portfolio } from '@/types';
import { registerInvestment } from './investments.service';
import { NewInvestment } from './NewInvestment';

vi.mock('./investments.service', () => ({
  registerInvestment: vi.fn(),
}));

const registerInvestmentMock = vi.mocked(registerInvestment);

const portfolio: Portfolio = {
  id: 'p1',
  name: 'VOO',
  type: 'etf',
  broker: 'Hapi',
  currentBalance: 0,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-18T10:00:00.000Z',
};

const createdInvestment: Investment = {
  id: 'i-new',
  portfolioId: 'p1',
  date: getLocalDateString(),
  depositTotal: 100,
  bankCommission: 0.5,
  brokerCommission: 0.2,
  availableTotal: 99.3,
  purchaseAmount: 99,
  purchaseCommission: 0.3,
  commissionFromResidual: false,
  residualDelta: 0,
  createdAt: '2026-11-18T10:00:00.000Z',
};

function seed(portfolios: Portfolio[], investments: Investment[]) {
  useAppStore.setState({
    hydrated: true,
    settings: { ...createDefaultSettings(), language: 'es' },
    portfolios,
    investments,
  });
}

function renderForm(path = '/investments/p1/new') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/investments/:portfolioId/new" element={<NewInvestment />} />
        <Route path="/investments/:portfolioId" element={<div>Detail page</div>} />
        <Route path="/investments" element={<div>Portfolios page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

async function fillBasic(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Depósito total'), '100');
  await user.type(screen.getByLabelText('Comisión del banco'), '0.5');
  await user.type(screen.getByLabelText('Comisión del broker'), '0.2');
}

beforeEach(() => {
  useAppStore.getState().reset();
  registerInvestmentMock.mockReset();
  registerInvestmentMock.mockResolvedValue(createdInvestment);
});

afterEach(() => {
  useAppStore.getState().reset();
});

describe('NewInvestment', () => {
  it('registers a valid investment and navigates to the detail', async () => {
    const user = userEvent.setup();
    seed([portfolio], []);
    renderForm();

    await fillBasic(user);
    await user.type(screen.getByLabelText('Compra'), '99');
    await user.type(screen.getByLabelText('Comisión por compra'), '0.3');
    await user.click(screen.getByRole('button', { name: 'Guardar inversión' }));

    await waitFor(() =>
      expect(registerInvestmentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          portfolioId: 'p1',
          date: getLocalDateString(),
          depositTotal: 100,
          bankCommission: 0.5,
          brokerCommission: 0.2,
          availableTotal: 99.3,
          purchaseAmount: 99,
          purchaseCommission: 0.3,
          commissionFromResidual: false,
          residualDelta: 0,
        })
      )
    );
    await waitFor(() => expect(screen.getByText('Detail page')).toBeInTheDocument());
  });

  it('autocompletes the available total and respects a manual edit', async () => {
    const user = userEvent.setup();
    seed([portfolio], []);
    renderForm();

    const deposit = screen.getByLabelText('Depósito total');
    const available = screen.getByLabelText('Total disponible');

    await user.type(deposit, '100');
    expect(available).toHaveValue(100);

    await user.clear(available);
    await user.type(available, '90');
    await user.clear(deposit);
    await user.type(deposit, '200');

    expect(available).toHaveValue(90);
  });

  it('allows a negative residual when the commission comes from residual', async () => {
    const user = userEvent.setup();
    seed([portfolio], []);
    renderForm();

    await user.type(screen.getByLabelText('Depósito total'), '100');
    await user.type(screen.getByLabelText('Compra'), '99.9');
    await user.type(screen.getByLabelText('Comisión por compra'), '0.5');
    await user.selectOptions(
      screen.getByLabelText('¿La comisión de compra se pagó con el residual disponible?'),
      'yes'
    );
    await user.click(screen.getByRole('button', { name: 'Guardar inversión' }));

    await waitFor(() =>
      expect(registerInvestmentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          residualDelta: -0.4,
          commissionFromResidual: true,
        })
      )
    );
  });

  it('blocks a negative residual when the commission comes from available', async () => {
    const user = userEvent.setup();
    seed([portfolio], []);
    renderForm();

    await user.type(screen.getByLabelText('Depósito total'), '100');
    await user.type(screen.getByLabelText('Compra'), '99.9');
    await user.type(screen.getByLabelText('Comisión por compra'), '0.5');

    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Guardar inversión' }));

    expect(registerInvestmentMock).not.toHaveBeenCalled();
  });

  it('shows the current portfolio residual', () => {
    seed(
      [portfolio],
      [
        {
          ...createdInvestment,
          id: 'previous',
          residualDelta: 0.5,
          commissionFromResidual: true,
        },
      ]
    );
    renderForm();

    expect(screen.getByText(/Residual actual del portafolio/)).toHaveTextContent('0,50 US$');
  });

  it('shows a not-found state for an unknown portfolio', () => {
    seed([], []);
    renderForm('/investments/missing/new');

    expect(screen.getByRole('heading', { name: 'Registrar inversión' })).toBeInTheDocument();
    expect(screen.getByText('Portafolio no encontrado')).toBeInTheDocument();
  });
});
