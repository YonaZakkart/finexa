import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDefaultSettings } from '@/features/settings/settings.service';
import { formatDate } from '@/lib/format';
import { useAppStore } from '@/stores/app.store';
import type { Investment, Portfolio } from '@/types';
import { PortfolioDetail } from './PortfolioDetail';

function portfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    id: 'p1',
    name: 'VOO',
    type: 'etf',
    broker: 'Hapi',
    currentBalance: 0,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
    ...overrides,
  };
}

function investment(overrides: Partial<Investment> = {}): Investment {
  return {
    id: 'i1',
    portfolioId: 'p1',
    date: '2026-11-18',
    depositTotal: 100,
    bankCommission: 0,
    brokerCommission: 0,
    availableTotal: 100,
    purchaseAmount: 100,
    purchaseCommission: 1,
    commissionFromResidual: false,
    residualDelta: 0,
    createdAt: '2026-11-18T10:00:00.000Z',
    ...overrides,
  };
}

function seed(portfolios: Portfolio[], investments: Investment[]) {
  useAppStore.setState({
    hydrated: true,
    settings: { ...createDefaultSettings(), language: 'es' },
    portfolios,
    investments,
  });
}

function renderDetail(path = '/investments/p1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/investments" element={<div>Portfolios page</div>} />
        <Route path="/investments/:portfolioId" element={<PortfolioDetail />} />
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

describe('PortfolioDetail', () => {
  it('shows the summary, status and investment list', () => {
    seed(
      [portfolio({ currentBalance: 151, balanceUpdatedAt: '2026-11-18T12:00:00.000Z' })],
      [
        investment({ id: 'i1', date: '2026-11-18' }),
        investment({
          id: 'i2',
          date: '2026-11-17',
          depositTotal: 50,
          availableTotal: 50,
          purchaseAmount: 50,
          purchaseCommission: 0.5,
          commissionFromResidual: true,
          residualDelta: -0.5,
        }),
      ]
    );

    renderDetail();

    const summary = cardFor('Saldo actual');
    expect(within(summary).getByText(/^151,00\s*US\$$/)).toHaveClass('text-warning');
    expect(within(summary).getByText('Cerca del equilibrio')).toBeInTheDocument();
    expect(within(summary).getByText(/^150,00\s*US\$$/)).toHaveClass('text-positive');
    expect(within(summary).getByText(/^1,50\s*US\$$/)).toHaveClass('text-negative');
    expect(within(summary).getByText(/^-0,50\s*US\$$/)).toHaveClass('text-negative');
    expect(within(summary).getByText(/Depositado/)).toHaveTextContent(/150,00\s*US\$/);

    const list = cardFor('Inversiones');
    expect(within(list).getByText(formatDate('2026-11-18', 'es'))).toBeInTheDocument();
    expect(within(list).getByText(formatDate('2026-11-17', 'es'))).toBeInTheDocument();
    expect(within(list).getByText(/Comisión desde el disponible/)).toBeInTheDocument();
    expect(within(list).getByText(/Comisión desde el residual/)).toBeInTheDocument();
    expect(within(list).getByText(/^100,00\s*US\$$/)).toBeInTheDocument();
    expect(within(list).getByText(/^50,00\s*US\$$/)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Actualizar saldo' })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Agregar inversión/ })).toBeDisabled();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
  });

  it('shows the balance hint when it has not been registered', () => {
    seed([portfolio({ currentBalance: 0 })], [investment({ id: 'i1' })]);

    renderDetail();

    expect(screen.getByText('En pérdida')).toBeInTheDocument();
    expect(screen.getByText(/El saldo actual aún no está registrado/)).toBeInTheDocument();
  });

  it('shows a neutral status and an empty list without investments', () => {
    seed([portfolio({ currentBalance: 0 })], []);

    renderDetail();

    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actualizar saldo' })).toBeDisabled();
    expect(
      screen.getByText('Registra al menos una inversión para actualizar el saldo.')
    ).toBeInTheDocument();
    expect(screen.getByText('Aún no hay inversiones')).toBeInTheDocument();
    expect(
      screen.getByText('Registra tu primera inversión para ver el detalle.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/El saldo actual aún no está registrado/)).not.toBeInTheDocument();
  });

  it('shows a not-found state and returns to the list', async () => {
    const user = userEvent.setup();
    seed([], []);
    renderDetail('/investments/missing');

    expect(screen.getByRole('heading', { name: 'Portafolio no encontrado' })).toBeInTheDocument();
    expect(
      screen.getByText('El portafolio no existe o ya no está disponible.')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Volver a portafolios' }));

    expect(screen.getByText('Portfolios page')).toBeInTheDocument();
  });

  it('opens the update balance modal', async () => {
    const user = userEvent.setup();
    seed([portfolio({ currentBalance: 100 })], [investment({ id: 'i1' })]);
    renderDetail();

    await user.click(screen.getByRole('button', { name: 'Actualizar saldo' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByRole('heading', { name: 'Actualizar saldo actual' })
    ).toBeInTheDocument();
  });

  it('navigates back to the list from the header', async () => {
    const user = userEvent.setup();
    seed([portfolio()], []);
    renderDetail();

    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.getByText('Portfolios page')).toBeInTheDocument();
  });
});
