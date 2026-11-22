import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BalanceChart } from './BalanceChart';
import { listBalanceSnapshots } from './investments.repository';

vi.mock('./investments.repository', () => ({
  listBalanceSnapshots: vi.fn(),
}));

const listBalanceSnapshotsMock = vi.mocked(listBalanceSnapshots);

function renderChart() {
  return render(
    <BalanceChart portfolioId="p1" investments={[]} language="es" balanceUpdatedAt="2026-11-21" />
  );
}

beforeEach(() => {
  listBalanceSnapshotsMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('BalanceChart', () => {
  it('shows the empty state without snapshots', async () => {
    listBalanceSnapshotsMock.mockResolvedValue([]);
    renderChart();

    expect(await screen.findByText('Aún no hay historial de saldo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Evolución' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reports a read error instead of pretending there is no history', async () => {
    listBalanceSnapshotsMock.mockRejectedValue(new Error('boom'));
    renderChart();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos cargar el historial de saldo. Inténtalo de nuevo.'
    );
    expect(screen.queryByText('Aún no hay historial de saldo')).not.toBeInTheDocument();
  });

  it('offers the four ranges', async () => {
    listBalanceSnapshotsMock.mockResolvedValue([]);
    renderChart();

    await screen.findByText('Aún no hay historial de saldo');

    expect(screen.getByRole('group', { name: 'Periodo' })).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      '1M',
      '3M',
      '6M',
      '1A',
    ]);
    expect(screen.getByRole('button', { name: '3M' })).toHaveAttribute('aria-pressed', 'true');
  });
});
