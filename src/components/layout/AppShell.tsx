import {
  ChartPie,
  ChevronLeft,
  LayoutDashboard,
  List,
  type LucideIcon,
  PlusCircle,
  Settings,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';

interface MainNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface ModuleNavItem {
  id: string;
  label: string;
  active?: boolean;
  placeholder?: boolean;
}

const MAIN_NAV: readonly MainNavItem[] = [
  { path: '/', label: 'dashboard:home', icon: LayoutDashboard, exact: true },
  { path: '/expenses/new', label: 'expenses:register', icon: PlusCircle },
  { path: '/history', label: 'dashboard:history', icon: List },
  { path: '/summary', label: 'dashboard:summary', icon: ChartPie },
] as const;

const MODULE_NAV: readonly ModuleNavItem[] = [
  { id: 'expenses', label: 'dashboard:moduleExpenses', active: true },
  { id: 'investments', label: 'dashboard:moduleInvestments', placeholder: true },
  { id: 'business', label: 'dashboard:moduleBusiness', placeholder: true },
] as const;

function TopNav() {
  const { t } = useTranslation('dashboard');

  return (
    <header className="sticky top-0 z-40 glass-card glass-card--strong border-b border-border px-4 sm:px-6 py-2">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between gap-4"
        aria-label="Navegación principal"
      >
        <div className="flex items-center gap-2">
          {MODULE_NAV.map((module) => (
            <button
              key={module.id}
              type="button"
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                module.active
                  ? 'text-accent bg-surface'
                  : 'text-text-muted hover:text-text hover:bg-surface',
                module.placeholder && 'opacity-50 cursor-not-allowed'
              )}
              disabled={module.placeholder}
              aria-current={module.active ? 'page' : undefined}
            >
              {t(module.label)}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}

function BottomNav() {
  const { t } = useTranslation('dashboard');
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 glass-card glass-card--strong border-t border-border pb-safe"
      aria-label="Navegación inferior"
    >
      <div className="flex items-center justify-around h-14 md:hidden">
        {MAIN_NAV.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive: active }) =>
                cn(
                  'flex flex-col items-center gap-1 px-2 py-1.5 min-w-[72px] min-h-[44px] transition-colors',
                  active ? 'text-accent' : 'text-text-muted'
                )
              }
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon aria-hidden="true" className="size-5" />
              <span className="text-xs font-medium">{t(item.label)}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation('dashboard');
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full glass-card glass-card--strong border-r border-border transition-transform duration-200 ease-out md:translate-x-0 md:static md:h-auto',
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0'
        )}
        aria-label="Navegación lateral"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-semibold">{t('common:appName')}</span>
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1 rounded-md hover:bg-surface"
              aria-label={t('common:close')}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3" aria-label="Vistas principales">
            {MAIN_NAV.map((item) => {
              const isActive = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive: active }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      active
                        ? 'text-accent bg-surface'
                        : 'text-text-muted hover:text-text hover:bg-surface'
                    )
                  }
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon aria-hidden="true" className="size-5" />
                  {t(item.label)}
                </NavLink>
              );
            })}
          </nav>
          <div className="border-t border-border p-3">
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-text-muted hover:text-text hover:bg-surface transition-colors'
              )}
            >
              <Settings aria-hidden="true" className="size-5" />
              {t('common:settings')}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="glass-card border-t border-border px-4 py-3 md:hidden" role="contentinfo">
      <p className="text-center text-xs text-text-muted">
        {t('version')} {__APP_VERSION__}
      </p>
    </footer>
  );
}

function DesktopFooter() {
  const { t } = useTranslation('common');

  return (
    <footer
      className="hidden md:block glass-card border-t border-border px-4 py-3"
      role="contentinfo"
    >
      <p className="text-center text-xs text-text-muted">
        {t('version')} {__APP_VERSION__}
      </p>
    </footer>
  );
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 flex flex-col overflow-y-auto md:ml-0">
          <Outlet />
          <DesktopFooter />
        </main>
      </div>
      <BottomNav />
      <Footer />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-accent text-text-inverse rounded-md"
      >
        {useTranslation('common').t('skipToContent') ?? 'Saltar al contenido'}
      </a>
    </div>
  );
}
