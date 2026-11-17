import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '@/App';
import { db } from '@/lib/db';
import { useAppStore } from '@/stores/app.store';

beforeEach(() => {
  useAppStore.getState().reset();
});

afterEach(() => {
  vi.restoreAllMocks();
  useAppStore.getState().reset();
});

describe('App', () => {
  it('renders without crashing', async () => {
    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    await waitFor(() => expect(useAppStore.getState().hydrated).toBe(true));
  });

  it('shows a retry screen when hydration fails', async () => {
    vi.spyOn(db, 'open').mockRejectedValueOnce(new Error('open failed'));

    render(<App />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('recovers after retrying hydration', async () => {
    const user = userEvent.setup();
    vi.spyOn(db, 'open').mockRejectedValueOnce(new Error('open failed'));

    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(useAppStore.getState().hydrated).toBe(true));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
