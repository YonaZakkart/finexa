import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentType, lazy } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';

function renderShell(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<div>Content</div>} />
          <Route path="investments" element={<div>Investments content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

const PendingPanel = lazy(() => new Promise<{ default: ComponentType }>(() => undefined));

function renderPendingShell() {
  return render(
    <MemoryRouter initialEntries={['/pending']}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="pending" element={<PendingPanel />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('AppShell', () => {
  it('renders a working skip link and the main content target', () => {
    renderShell();

    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute(
      'href',
      '#main-content'
    );
    expect(document.getElementById('main-content')).not.toBeNull();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('opens and closes the mobile sidebar', async () => {
    const user = userEvent.setup();
    renderShell();

    const menuButton = screen.getByRole('button', { name: 'Abrir menú' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Menú de navegación')).not.toBeInTheDocument();

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Menú de navegación')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }));

    expect(screen.queryByLabelText('Menú de navegación')).not.toBeInTheDocument();
    expect(menuButton).toHaveFocus();
  });

  it('closes the mobile sidebar with Escape', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByLabelText('Menú de navegación')).not.toBeInTheDocument();
  });

  it('collapses the desktop sidebar and persists the preference', async () => {
    const user = userEvent.setup();
    renderShell();

    const collapse = screen.getByRole('button', { name: 'Contraer barra lateral' });
    expect(collapse).toHaveAttribute('aria-expanded', 'true');

    await user.click(collapse);

    expect(screen.getByRole('button', { name: 'Expandir barra lateral' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(localStorage.getItem('finexa:sidebar-collapsed')).toBe('true');
  });

  it('renders the language switcher and translated navigation labels', () => {
    renderShell();

    expect(screen.getByLabelText('Idioma')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Navegación lateral' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegación inferior' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Versión');
    expect(screen.getByRole('contentinfo')).toHaveTextContent(__APP_VERSION__);
  });

  it('links investments and keeps business as coming soon', () => {
    renderShell();

    expect(screen.getByRole('link', { name: 'Inversiones' })).toHaveAttribute(
      'href',
      '/investments'
    );
    expect(screen.getByRole('button', { name: 'Negocio (Próximamente)' })).toBeDisabled();
  });

  it('activates investments, shows its views and hides the expense bottom navigation', () => {
    renderShell(['/investments']);

    expect(screen.getByRole('link', { name: 'Inversiones' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Control de gastos' })).not.toHaveAttribute(
      'aria-current'
    );
    expect(screen.getByRole('link', { name: 'Portafolios' })).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Navegación inferior' })
    ).not.toBeInTheDocument();
  });

  it('keeps the shell mounted while a lazy panel is loading', () => {
    renderPendingShell();

    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('keeps the same shell when navigating between panels', async () => {
    const user = userEvent.setup();
    renderShell();

    const header = document.querySelector('header');

    await user.click(screen.getByRole('link', { name: 'Inversiones' }));

    expect(screen.getByText('Investments content')).toBeInTheDocument();
    expect(document.querySelector('header')).toBe(header);
  });
});
