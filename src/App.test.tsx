import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '@/App';

describe('App', () => {
  it('renders the design foundation preview', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Control de gastos' })).toBeInTheDocument();
    expect(screen.getByText('Balance actual')).toBeInTheDocument();
    expect(screen.getByLabelText('Monto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar gasto/i })).toBeInTheDocument();
    expect(screen.getByText(`v${__APP_VERSION__}`)).toBeInTheDocument();
    expect(document.querySelector('.glass-card')).toBeInTheDocument();
  });
});
