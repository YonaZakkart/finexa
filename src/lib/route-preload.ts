export const ROUTE_LOADERS = {
  onboarding: () => import('@/features/onboarding/Onboarding'),
  dashboard: () => import('@/features/dashboard/Dashboard'),
  newExpense: () => import('@/features/expenses/NewExpense'),
  editExpense: () => import('@/features/expenses/EditExpense'),
  history: () => import('@/features/expenses/History'),
  summary: () => import('@/features/summary/Summary'),
  debts: () => import('@/features/debts/Debts'),
  money: () => import('@/features/money/Money'),
  investments: () => import('@/features/investments/Investments'),
  portfolioDetail: () => import('@/features/investments/PortfolioDetail'),
  newInvestment: () => import('@/features/investments/NewInvestment'),
  investmentHistory: () => import('@/features/investments/InvestmentHistory'),
} as const;

const PATH_PRELOADERS: readonly {
  match: (pathname: string) => boolean;
  load: () => Promise<unknown>;
}[] = [
  { match: (path) => path === '/', load: ROUTE_LOADERS.dashboard },
  { match: (path) => path === '/expenses/new', load: ROUTE_LOADERS.newExpense },
  { match: (path) => /^\/expenses\/[^/]+\/edit$/.test(path), load: ROUTE_LOADERS.editExpense },
  { match: (path) => path === '/history', load: ROUTE_LOADERS.history },
  { match: (path) => path === '/summary', load: ROUTE_LOADERS.summary },
  { match: (path) => path === '/debts', load: ROUTE_LOADERS.debts },
  { match: (path) => path === '/money', load: ROUTE_LOADERS.money },
  { match: (path) => path === '/investments', load: ROUTE_LOADERS.investments },
  { match: (path) => path === '/investments/history', load: ROUTE_LOADERS.investmentHistory },
  { match: (path) => /^\/investments\/[^/]+\/new$/.test(path), load: ROUTE_LOADERS.newInvestment },
  {
    match: (path) => /^\/investments\/[^/]+\/edit\/[^/]+$/.test(path),
    load: ROUTE_LOADERS.newInvestment,
  },
  {
    match: (path) => /^\/investments\/[^/]+$/.test(path),
    load: ROUTE_LOADERS.portfolioDetail,
  },
];

export function preloadRoute(pathname: string): void {
  const preloader = PATH_PRELOADERS.find((entry) => entry.match(pathname));

  void preloader?.load().catch(() => undefined);
}
