import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UpdatePrompt } from './UpdatePrompt';

describe('UpdatePrompt', () => {
  it('renders the update message and actions', async () => {
    const user = userEvent.setup();
    const onUpdate = vi.fn();
    const onDismiss = vi.fn();

    render(<UpdatePrompt visible isUpdating={false} onUpdate={onUpdate} onDismiss={onDismiss} />);

    expect(screen.getByText('Nueva versión disponible.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Actualizar' }));
    expect(onUpdate).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Ahora no' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when hidden', () => {
    const { container } = render(
      <UpdatePrompt visible={false} isUpdating={false} onUpdate={vi.fn()} onDismiss={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
