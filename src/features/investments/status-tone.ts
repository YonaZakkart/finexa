import type { PortfolioStatus } from './status';

export const PORTFOLIO_STATUS_TONE: Record<PortfolioStatus, string> = {
  neutral: 'text-text-muted',
  red: 'text-negative',
  yellow: 'text-warning',
  green: 'text-positive',
};
