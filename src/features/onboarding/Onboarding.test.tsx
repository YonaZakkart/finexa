import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Onboarding } from './Onboarding';
import { completeOnboarding, skipOnboarding } from './onboarding.service';

vi.mock('./onboarding.service', () => ({
  completeOnboarding: vi.fn(),
  skipOnboarding: vi.fn(),
}));

const completeMock = vi.mocked(completeOnboarding);
const skipMock = vi.mocked(skipOnboarding);

function renderOnboarding() {
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Onboarding />
    </MemoryRouter>
  );
}

async function clickNext(user: UserEvent) {
  await user.click(screen.getByRole('button', { name: 'Siguiente' }));
}

async function advance(user: UserEvent, times: number) {
  for (let index = 0; index < times; index += 1) {
    await clickNext(user);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  completeMock.mockResolvedValue(undefined);
  skipMock.mockResolvedValue(undefined);
});

describe('Onboarding', () => {
  it('keeps the name optional', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await clickNext(user);

    expect(screen.getByLabelText('Nombre')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();

    await clickNext(user);

    expect(screen.getByRole('heading', { name: 'Situación laboral' })).toBeInTheDocument();
  });

  it('shows the salary step only for employed users', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await advance(user, 2);
    await clickNext(user);

    expect(screen.getByRole('heading', { name: 'Salario' })).toBeInTheDocument();
  });

  it('skips the salary step for unemployed users', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await advance(user, 2);
    await user.selectOptions(screen.getByLabelText('Selecciona tu situación'), 'unemployed');
    await clickNext(user);

    expect(screen.getByRole('heading', { name: 'Balance inicial' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Salario' })).not.toBeInTheDocument();
  });

  it('computes the total from the optional bank and cash fields', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await advance(user, 4);
    await user.click(screen.getByRole('button', { name: 'Añadir banco y efectivo' }));
    await user.type(screen.getByLabelText('Banco'), '100');
    await user.type(screen.getByLabelText('Efectivo'), '25');

    expect(screen.getByLabelText('Monto total')).toHaveValue(125);
  });

  it('submits once and blocks the button while saving', async () => {
    const user = userEvent.setup();
    let resolveFinish: () => void = () => undefined;
    completeMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveFinish = resolve;
        })
    );
    renderOnboarding();

    await advance(user, 6);
    await user.click(screen.getByRole('button', { name: 'Finalizar' }));

    const finishButton = screen.getByRole('button', { name: 'Finalizar' });
    expect(finishButton).toBeDisabled();
    expect(finishButton).toHaveAttribute('aria-busy', 'true');
    expect(completeMock).toHaveBeenCalledTimes(1);
    expect(completeMock).toHaveBeenCalledWith({
      profile: { employmentStatus: 'employed', salaryFrequency: 'monthly' },
      initialBalance: 0,
      debts: [],
    });

    await user.click(finishButton);
    expect(completeMock).toHaveBeenCalledTimes(1);

    resolveFinish();
    await waitFor(() => expect(finishButton).toBeEnabled());
  });

  it('skips without submitting the form', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await user.click(screen.getAllByRole('button', { name: 'Saltar' })[0]);

    await waitFor(() => expect(skipMock).toHaveBeenCalledTimes(1));
    expect(completeMock).not.toHaveBeenCalled();
  });

  it('blocks the next step when a debt row is incomplete', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await advance(user, 5);
    await user.type(screen.getByLabelText('Nombre'), 'Card');

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(
      screen.getByText('Completa el nombre y el monto, o deja la fila vacía.')
    ).toBeInTheDocument();
  });

  it('removes a debt row', async () => {
    const user = userEvent.setup();
    renderOnboarding();

    await advance(user, 5);
    await user.click(screen.getByRole('button', { name: 'Quitar deuda' }));

    expect(screen.queryByLabelText('Nombre de la deuda')).not.toBeInTheDocument();
  });
});
