import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDefaultSettings } from '@/features/settings/settings.service';
import { useAppStore } from '@/stores/app.store';
import type { Investment, Portfolio } from '@/types';
import { InvestmentHistory } from './InvestmentHistory';

const portfolios: Portfolio[] = [
  {
    id: 'p1',
    name: 'VOO',
    type: 'etf',
    broker: 'Hapi',
    currentBalance: 0,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
  },
  {
    id: 'p2',
    name: 'NVIDIA',
    type: 'stocks',
    broker: 'XTB',
    currentBalance: 0,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-18T10:00:00.000Z',
  },
];

const investments: Investment[] = [
  {
    id: 'i1',
    portfolioId: 'p1',
    date: '2026-11-18',
    depositTotal: 100,
    bankCommission: 0,
    brokerCommission: 0,
    availableTotal: 100,
    purchaseAmount: 99,
    purchaseCommission: 1,
    commissionFromResidual: false,
    residualDelta: 0,
    createdAt: '2026-11-18T10:00:00.000Z',
  },
  {
    id: 'i2',
    portfolioId: 'p2',
    date: '2026-11-17',
    depositTotal: 50,
    bankCommission: 0,
    brokerCommission: 0,
    availableTotal: 50,
    purchaseAmount: 40,
    purchaseCommission: 1,
    commissionFromResidual: false,
    residualDelta: 0,
    createdAt: '2026-11-17T10:00:00.000Z',
  },
];

function seed(rows: Investment[]) {
  useAppStore.setState({
    hydrated: true,
    settings: { ...createDefaultSettings(), language: 'es' },
    portfolios,
    investments: rows,
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/investments/history']}>
      <Routes>
        <Route path="/investments/history" element={<InvestmentHistory />} />
        <Route path="/investments" element={<div>Portfolios page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => useAppStore.getState().reset());
afterEach(() => useAppStore.getState().reset());

describe('InvestmentHistory', () => {
  it('shows all investments with deposit and purchase totals', () => {
    seed(investments);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Historial de inversiones' })).toBeInTheDocument();
    expect(screen.getByText(/150,00\s*US\$/)).toBeInTheDocument();
    expect(screen.getByText(/139,00\s*US\$/)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(within(screen.getAllByRole('listitem')[0]).getByText('VOO')).toBeInTheDocument();
    expect(within(screen.getAllByRole('listitem')[1]).getByText('NVIDIA')).toBeInTheDocument();
  });

  it('filters by portfolio', async () => {
    const user = userEvent.setup();
    seed(investments);
    renderPage();

    await user.selectOptions(screen.getByLabelText('Portafolio'), 'p1');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getAllByText(/^100,00\s*US\$/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^99,00\s*US\$/).length).toBeGreaterThan(0);
  });

  it('shows an empty state when there are no investments', () => {
    seed([]);
    renderPage();

    expect(screen.getByText('No hay inversiones registradas')).toBeInTheDocument();
  });
});
