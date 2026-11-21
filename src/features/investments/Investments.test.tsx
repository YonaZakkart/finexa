import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultSettings } from '@/features/settings/settings.service';
import { useAppStore } from '@/stores/app.store';
import type { Investment, Portfolio } from '@/types';
import { Investments } from './Investments';
import { deletePortfolio } from './investments.service';

vi.mock('./investments.service', () => ({
  createPortfolio: vi.fn(),
  updatePortfolio: vi.fn(),
  deletePortfolio: vi.fn(),
}));

const deletePortfolioMock = vi.mocked(deletePortfolio);

function portfolio(overrides: Partial<Portfolio> = {}): Portfolio {
  return {
    id: 'portfolio-1',
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
    id: 'investment-1',
    portfolioId: 'portfolio-1',
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/investments']}>
      <Routes>
        <Route path="/investments" element={<Investments />} />
        <Route path="/investments/:portfolioId" element={<div>Portfolio detail</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function cardForPortfolio(name: string): HTMLElement {
  const link = screen.getByRole('link', { name: new RegExp(`^${name} —`) });
  return link.closest('.glass-card') as HTMLElement;
}

beforeEach(() => {
  useAppStore.getState().reset();
  deletePortfolioMock.mockReset();
  deletePortfolioMock.mockResolvedValue(undefined);
});

afterEach(() => {
  useAppStore.getState().reset();
});

describe('Investments', () => {
  it('opens the new portfolio modal from the empty state', async () => {
    const user = userEvent.setup();
    seed([], []);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Inversiones' })).toBeInTheDocument();
    expect(screen.getByText('Aún no hay portafolios')).toBeInTheDocument();
    expect(screen.queryByText('Totales')).not.toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Nuevo portafolio' });
    expect(button).toBeEnabled();
    await user.click(button);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByRole('heading', { name: 'Nuevo portafolio' })
    ).toBeInTheDocument();
  });

  it('opens the new portfolio modal from the panel header', async () => {
    const user = userEvent.setup();
    seed([portfolio({ id: 'p1', name: 'VOO', currentBalance: 100 })], []);
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Nuevo portafolio' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sums the global totals and renders each portfolio sorted by name', () => {
    seed(
      [
        portfolio({ id: 'p1', name: 'VOO', currentBalance: 102 }),
        portfolio({
          id: 'p2',
          name: 'NVIDIA',
          type: 'stocks',
          broker: 'XTB',
          currentBalance: 30,
        }),
        portfolio({
          id: 'p3',
          name: 'Cash',
          type: 'other',
          broker: 'Hapi',
          currentBalance: 0,
        }),
        portfolio({
          id: 'p4',
          name: 'Bonds',
          type: 'bonds',
          broker: 'XTB',
          currentBalance: 100,
        }),
      ],
      [
        investment({ id: 'i1', portfolioId: 'p1' }),
        investment({
          id: 'i2',
          portfolioId: 'p2',
          depositTotal: 40,
          availableTotal: 40,
          purchaseAmount: 40,
        }),
        investment({ id: 'i3', portfolioId: 'p4' }),
      ]
    );

    renderPage();

    const totalsCard = screen.getByRole('heading', { name: 'Totales' }).closest('.glass-card');
    expect(totalsCard).not.toBeNull();
    expect(within(totalsCard as HTMLElement).getByText(/^232,00\s*US\$$/)).toBeInTheDocument();
    expect(within(totalsCard as HTMLElement).getByText(/^240,00\s*US\$$/)).toBeInTheDocument();
    expect(within(totalsCard as HTMLElement).getByText(/^3,00\s*US\$$/)).toBeInTheDocument();
    expect(within(totalsCard as HTMLElement).getByText(/^0,00\s*US\$$/)).toBeInTheDocument();

    const links = screen.getAllByRole('link', { name: /Ver portafolio/ });
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
      'Bonds — Ver portafolio',
      'Cash — Ver portafolio',
      'NVIDIA — Ver portafolio',
      'VOO — Ver portafolio',
    ]);

    expect(screen.getByRole('link', { name: /^VOO —/ })).toHaveAttribute('href', '/investments/p1');
    expect(screen.getByText(/ETF.*Hapi/)).toBeInTheDocument();
    expect(screen.getByText(/Acciones.*XTB/)).toBeInTheDocument();
    expect(screen.getByText(/Bonos.*XTB/)).toBeInTheDocument();
    expect(screen.getByText(/Otro.*Hapi/)).toBeInTheDocument();
  });

  it('shows the status of each portfolio with a text label', () => {
    seed(
      [
        portfolio({ id: 'p1', name: 'VOO', currentBalance: 102 }),
        portfolio({
          id: 'p2',
          name: 'NVIDIA',
          type: 'stocks',
          broker: 'XTB',
          currentBalance: 30,
        }),
        portfolio({
          id: 'p3',
          name: 'Cash',
          type: 'other',
          broker: 'Hapi',
          currentBalance: 0,
        }),
        portfolio({
          id: 'p4',
          name: 'Bonds',
          type: 'bonds',
          broker: 'XTB',
          currentBalance: 100,
        }),
      ],
      [
        investment({ id: 'i1', portfolioId: 'p1' }),
        investment({
          id: 'i2',
          portfolioId: 'p2',
          depositTotal: 40,
          availableTotal: 40,
          purchaseAmount: 40,
        }),
        investment({ id: 'i3', portfolioId: 'p4' }),
      ]
    );

    renderPage();

    expect(within(cardForPortfolio('VOO')).getByText('En ganancia')).toBeInTheDocument();
    expect(within(cardForPortfolio('NVIDIA')).getByText('En pérdida')).toBeInTheDocument();
    expect(within(cardForPortfolio('Bonds')).getByText('Cerca del equilibrio')).toBeInTheDocument();
    expect(within(cardForPortfolio('Cash')).getByText('Sin datos')).toBeInTheDocument();

    expect(within(cardForPortfolio('VOO')).getByText(/^102,00\s*US\$$/)).toHaveClass(
      'text-positive'
    );
    expect(within(cardForPortfolio('NVIDIA')).getByText(/^30,00\s*US\$$/)).toHaveClass(
      'text-negative'
    );
    expect(within(cardForPortfolio('Bonds')).getAllByText(/^100,00\s*US\$$/)[0]).toHaveClass(
      'text-warning'
    );
  });

  it('keeps the actions menu outside the portfolio link', () => {
    seed([portfolio({ id: 'p1', name: 'VOO' })], []);
    renderPage();

    const link = screen.getByRole('link', { name: /^VOO —/ });

    expect(link.querySelector('button')).toBeNull();
    expect(screen.getByLabelText('Acciones')).toBeInTheDocument();
  });

  it('opens the edit modal from the card menu', async () => {
    const user = userEvent.setup();
    seed([portfolio({ id: 'p1', name: 'VOO' })], []);
    renderPage();

    await user.click(screen.getByLabelText('Acciones'));
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }));

    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByRole('heading', { name: 'Editar portafolio' })).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Nombre')).toHaveValue('VOO');
  });

  it('deletes an empty portfolio after a single confirmation', async () => {
    const user = userEvent.setup();
    seed([portfolio({ id: 'p1', name: 'VOO' })], []);
    renderPage();

    await user.click(screen.getByLabelText('Acciones'));
    await user.click(screen.getByRole('menuitem', { name: 'Eliminar' }));

    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText(/Se eliminará “VOO”/)).toBeInTheDocument();
    expect(within(dialog).queryByText(/inversiones/)).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(deletePortfolioMock).toHaveBeenCalledWith('p1', true));
  });

  it('asks about the balance when the portfolio has investments', async () => {
    const user = userEvent.setup();
    seed([portfolio({ id: 'p1', name: 'VOO' })], [investment({ id: 'i1', portfolioId: 'p1' })]);
    renderPage();

    await user.click(screen.getByLabelText('Acciones'));
    await user.click(screen.getByRole('menuitem', { name: 'Eliminar' }));

    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText(/inversiones de “VOO” \(1\)/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'No, mantener balance' }));

    await waitFor(() => expect(deletePortfolioMock).toHaveBeenCalledWith('p1', false));
  });

  it('keeps the invested, commissions and residual labels on each card', () => {
    seed([portfolio({ id: 'p1', name: 'VOO', currentBalance: 102 })], [investment({ id: 'i1' })]);

    renderPage();

    const card = cardForPortfolio('VOO');
    expect(within(card).getByText('Invertido')).toBeInTheDocument();
    expect(within(card).getByText('Comisiones')).toBeInTheDocument();
    expect(within(card).getByText('Residual')).toBeInTheDocument();
  });
});
