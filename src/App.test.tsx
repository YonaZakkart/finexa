import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/App';

describe('App', () => {
  it('renders the application name and version', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Finexa' })).toBeInTheDocument();
    expect(screen.getByText(`v${__APP_VERSION__}`)).toBeInTheDocument();
  });
});
