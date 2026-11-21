import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Portfolio } from '@/types';
import { InvestmentError } from './investments.errors';
import { createPortfolio, updatePortfolio } from './investments.service';
import { NewPortfolioModal } from './NewPortfolioModal';

vi.mock('./investments.service', () => ({
  createPortfolio: vi.fn(),
  updatePortfolio: vi.fn(),
}));

const createPortfolioMock = vi.mocked(createPortfolio);
const updatePortfolioMock = vi.mocked(updatePortfolio);

const createdPortfolio: Portfolio = {
  id: 'portfolio-1',
  name: 'VOO',
  type: 'etf',
  broker: 'Hapi',
  currentBalance: 0,
  createdAt: '2026-11-18T10:00:00.000Z',
  updatedAt: '2026-11-18T10:00:00.000Z',
};

beforeEach(() => {
  createPortfolioMock.mockReset();
  createPortfolioMock.mockResolvedValue(createdPortfolio);
  updatePortfolioMock.mockReset();
  updatePortfolioMock.mockResolvedValue(undefined);
});

describe('NewPortfolioModal', () => {
  it('creates a portfolio with trimmed values and closes', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NewPortfolioModal onClose={onClose} />);

    await user.type(screen.getByLabelText('Nombre'), '  VOO  ');
    await user.selectOptions(screen.getByLabelText('Tipo'), 'etf');
    await user.type(screen.getByLabelText('Broker'), '  Hapi  ');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(createPortfolioMock).toHaveBeenCalledWith({
        name: 'VOO',
        type: 'etf',
        broker: 'Hapi',
      })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('offers the six portfolio types', () => {
    render(<NewPortfolioModal onClose={vi.fn()} />);

    expect(within(screen.getByLabelText('Tipo')).getAllByRole('option')).toHaveLength(6);
  });

  it('rejects an empty name without calling the service', async () => {
    const user = userEvent.setup();
    render(<NewPortfolioModal onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El nombre del portafolio debe tener entre 1 y 60 caracteres'
    );
    expect(createPortfolioMock).not.toHaveBeenCalled();
  });

  it('rejects an empty broker without calling the service', async () => {
    const user = userEvent.setup();
    render(<NewPortfolioModal onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('Nombre'), 'VOO');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El broker debe tener entre 1 y 40 caracteres'
    );
    expect(createPortfolioMock).not.toHaveBeenCalled();
  });

  it('shows a translated service error and stays open', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    createPortfolioMock.mockRejectedValueOnce(new InvestmentError('invalidPortfolioType'));
    render(<NewPortfolioModal onClose={onClose} />);

    await user.type(screen.getByLabelText('Nombre'), 'VOO');
    await user.type(screen.getByLabelText('Broker'), 'Hapi');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El tipo de portafolio no es válido'
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('prefills and updates an existing portfolio', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSaved = vi.fn();
    render(<NewPortfolioModal portfolio={createdPortfolio} onClose={onClose} onSaved={onSaved} />);

    expect(screen.getByLabelText('Nombre')).toHaveValue('VOO');
    expect(screen.getByLabelText('Broker')).toHaveValue('Hapi');
    expect(screen.getByLabelText('Tipo')).toHaveValue('etf');

    await user.clear(screen.getByLabelText('Nombre'));
    await user.type(screen.getByLabelText('Nombre'), 'NVIDIA');
    await user.selectOptions(screen.getByLabelText('Tipo'), 'stocks');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(updatePortfolioMock).toHaveBeenCalledWith('portfolio-1', {
        name: 'NVIDIA',
        type: 'stocks',
        broker: 'Hapi',
      })
    );
    expect(createPortfolioMock).not.toHaveBeenCalled();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the edit title for an existing portfolio', () => {
    render(<NewPortfolioModal portfolio={createdPortfolio} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Editar portafolio' })).toBeInTheDocument();
  });

  it('closes from the cancel button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NewPortfolioModal onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
  });
});
