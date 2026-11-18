import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUiStore } from '@/stores/ui.store';
import { OfflineIndicator } from './OfflineIndicator';

beforeEach(() => {
  useUiStore.getState().reset();
});

afterEach(() => {
  useUiStore.getState().reset();
  vi.restoreAllMocks();
});

describe('OfflineIndicator', () => {
  it('shows the offline message when navigator is offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(<OfflineIndicator />);

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Sin conexión. Tus datos siguen disponibles.'
    );
  });

  it('reacts to online and offline events', async () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    render(<OfflineIndicator />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    online.mockReturnValue(false);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(await screen.findByRole('status')).toHaveTextContent('Sin conexión');

    online.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event('online')));
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('hides when online', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    render(<OfflineIndicator />);

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });
});
