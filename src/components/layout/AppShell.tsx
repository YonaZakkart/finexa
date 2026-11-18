import {
  ChartPie,
  ChevronLeft,
  LayoutDashboard,
  List,
  type LucideIcon,
  Menu,
  PanelLeftClose,
  PlusCircle,
} from 'lucide-react';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Brand } from './Brand';
import { LanguageSwitcher } from './LanguageSwitcher';
import { OfflineIndicator } from './OfflineIndicator';
import { PwaUpdatePrompt } from './PwaUpdatePrompt';

const SIDEBAR_COLLAPSED_KEY = 'finexa:sidebar-collapsed';

interface MainNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface ModuleNavItem {
  id: string;
  label: string;
  path?: string;
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
  { id: 'expenses', label: 'dashboard:moduleExpenses', path: '/', active: true },
  { id: 'investments', label: 'dashboard:moduleInvestments', placeholder: true },
  { id: 'business', label: 'dashboard:moduleBusiness', placeholder: true },
] as const;

function readSidebarPreference(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeSidebarPreference(collapsed: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  } catch {
    return;
  }
}

function TopNav({
  onOpenSidebar,
  sidebarOpen,
  menuButtonRef,
}: {
  onOpenSidebar: () => void;
  sidebarOpen: boolean;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');

  return (
    <header className="z-40 glass-card glass-card--strong border-b border-border px-3 py-2 sm:px-6">
      <nav
        className="mx-auto flex max-w-5xl items-center gap-2"
        aria-label={tCommon('mainNavigation')}
      >
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text lg:hidden"
          aria-label={tCommon('openMenu')}
          aria-expanded={sidebarOpen}
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <div className="flex min-w-0 items-center gap-1">
          {MODULE_NAV.map((module) => {
            const className = cn(
              'shrink-0 min-h-11 items-center justify-center whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
              module.active
                ? 'inline-flex text-accent bg-surface'
                : 'hidden text-text-muted hover:text-text hover:bg-surface lg:inline-flex',
              module.placeholder && 'opacity-50 cursor-not-allowed'
            );

            if (module.active && module.path) {
              return (
                <NavLink key={module.id} to={module.path} aria-current="page" className={className}>
                  {t(module.label)}
                </NavLink>
              );
            }

            return (
              <button
                key={module.id}
                type="button"
                className={className}
                disabled={module.placeholder}
                aria-label={
                  module.placeholder ? `${t(module.label)} (${tCommon('comingSoon')})` : undefined
                }
              >
                {t(module.label)}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  showModules?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}

function SidebarContent({
  collapsed,
  showModules = false,
  onNavigate,
  onClose,
  onToggleCollapse,
}: SidebarContentProps) {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const location = useLocation();

  return (
    <>
      <div
        className={cn(
          'flex items-center border-b border-border',
          collapsed ? 'p-2 lg:justify-center' : 'justify-between p-4'
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-surface lg:inline-flex"
            aria-label={tCommon('expandSidebar')}
            aria-expanded={false}
          >
            <Brand collapsed />
          </button>
        ) : (
          <Brand />
        )}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-surface lg:hidden"
            aria-label={tCommon('closeMenu')}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
        ) : null}
        {onToggleCollapse && !collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-md text-text-muted hover:bg-surface hover:text-text lg:inline-flex"
            aria-label={tCommon('collapseSidebar')}
            aria-expanded
          >
            <PanelLeftClose aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </div>
      {showModules ? (
        <div className="border-b border-border p-3">
          <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            {tCommon('modules')}
          </p>
          <div className="space-y-1">
            {MODULE_NAV.map((module) => {
              const className = cn(
                'flex min-h-11 w-full items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                module.active
                  ? 'text-accent bg-surface'
                  : 'text-text-muted hover:text-text hover:bg-surface',
                module.placeholder && 'opacity-50 cursor-not-allowed'
              );

              if (module.active && module.path) {
                return (
                  <NavLink
                    key={module.id}
                    to={module.path}
                    onClick={onNavigate}
                    aria-current="page"
                    className={className}
                  >
                    {t(module.label)}
                  </NavLink>
                );
              }

              return (
                <button
                  key={module.id}
                  type="button"
                  className={className}
                  disabled={module.placeholder}
                  aria-label={
                    module.placeholder ? `${t(module.label)} (${tCommon('comingSoon')})` : undefined
                  }
                >
                  {t(module.label)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <nav className="flex-1 overflow-y-auto p-3" aria-label={tCommon('viewsNavigation')}>
        {MAIN_NAV.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              aria-label={t(item.label)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'lg:justify-center lg:px-2',
                isActive
                  ? 'text-accent bg-surface'
                  : 'text-text-muted hover:text-text hover:bg-surface'
              )}
            >
              <item.icon aria-hidden="true" className="size-5 shrink-0" />
              <span className={cn(collapsed && 'lg:hidden')}>{t(item.label)}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className={cn('border-t border-border p-3', collapsed && 'lg:hidden')}>
        <LanguageSwitcher />
      </div>
    </>
  );
}

function DesktopSidebar({
  collapsed,
  onToggleCollapse,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { t } = useTranslation('common');

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col overflow-hidden border-r border-border glass-card glass-card--strong transition-[width] duration-200 ease-out lg:flex',
        collapsed ? 'w-16' : 'w-64'
      )}
      aria-label={t('sideNavigation')}
    >
      <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
    </aside>
  );
}

function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('common');
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (open) {
      asideRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        ref={asideRef}
        id="mobile-navigation"
        tabIndex={-1}
        className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col overflow-y-auto border-r border-border bg-bg-elevated lg:hidden"
        aria-label={t('mobileNavigation')}
      >
        <SidebarContent collapsed={false} showModules onClose={onClose} onNavigate={onClose} />
      </aside>
    </>
  );
}

function BottomNav() {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 glass-card glass-card--strong border-t border-border bg-bg-elevated pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label={tCommon('bottomNavigation')}
    >
      <div className="flex items-center justify-around h-14">
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

function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="glass-card border-t border-border px-4 py-3" role="contentinfo">
      <p className="text-center text-xs text-text-muted">
        {t('version')} {__APP_VERSION__}
      </p>
    </footer>
  );
}

export function AppShell() {
  const { t } = useTranslation('common');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarPreference);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    writeSidebarPreference(sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!sidebarOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 inline-flex min-h-11 items-center px-4 py-2 bg-accent text-text-inverse rounded-md"
      >
        {t('skipToContent')}
      </a>
      <TopNav
        onOpenSidebar={() => setSidebarOpen(true)}
        sidebarOpen={sidebarOpen}
        menuButtonRef={menuButtonRef}
      />
      <OfflineIndicator />
      <PwaUpdatePrompt />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <DesktopSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        />
        <div
          id="main-content"
          tabIndex={-1}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"
        >
          <div className="flex-1">
            <Outlet />
          </div>
          <Footer />
        </div>
      </div>
      <BottomNav />
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => {
          setSidebarOpen(false);
          menuButtonRef.current?.focus();
        }}
      />
    </div>
  );
}
