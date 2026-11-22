import { addDaysToDate } from '@/lib/date';
import { roundMoney } from '@/lib/money';
import type { BalanceSnapshot, Investment } from '@/types';

export type ChartRange = '1m' | '3m' | '6m' | '1y';

interface RangeConfig {
  days: number;
  stepDays: number;
}

export const CHART_RANGES: Record<ChartRange, RangeConfig> = {
  '1m': { days: 30, stepDays: 1 },
  '3m': { days: 90, stepDays: 1 },
  '6m': { days: 180, stepDays: 7 },
  '1y': { days: 365, stepDays: 7 },
};

export const DEFAULT_CHART_RANGE: ChartRange = '3m';

export interface BalanceChartPoint {
  date: string;
  balance: number | null;
  invested: number;
}

export function buildBalanceChartData({
  snapshots,
  investments,
  range,
  today,
}: {
  snapshots: BalanceSnapshot[];
  investments: Investment[];
  range: ChartRange;
  today: string;
}): BalanceChartPoint[] {
  const { days, stepDays } = CHART_RANGES[range];
  const start = addDaysToDate(today, -(days - 1));
  const dates: string[] = [];

  for (let offset = 0; offset < days; offset += stepDays) {
    dates.push(addDaysToDate(start, offset));
  }

  if (dates[dates.length - 1] !== today) {
    dates.push(today);
  }

  const orderedSnapshots = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const orderedInvestments = [...investments].sort((a, b) => a.date.localeCompare(b.date));

  let investmentIndex = 0;
  let invested = 0;
  while (
    investmentIndex < orderedInvestments.length &&
    orderedInvestments[investmentIndex].date < start
  ) {
    invested += orderedInvestments[investmentIndex].purchaseAmount;
    investmentIndex += 1;
  }

  let snapshotIndex = 0;
  let balance: number | null = null;
  while (snapshotIndex < orderedSnapshots.length && orderedSnapshots[snapshotIndex].date < start) {
    balance = orderedSnapshots[snapshotIndex].balance;
    snapshotIndex += 1;
  }

  return dates.map((date) => {
    while (
      investmentIndex < orderedInvestments.length &&
      orderedInvestments[investmentIndex].date <= date
    ) {
      invested += orderedInvestments[investmentIndex].purchaseAmount;
      investmentIndex += 1;
    }

    while (
      snapshotIndex < orderedSnapshots.length &&
      orderedSnapshots[snapshotIndex].date <= date
    ) {
      balance = orderedSnapshots[snapshotIndex].balance;
      snapshotIndex += 1;
    }

    return {
      date,
      balance: balance === null ? null : roundMoney(balance),
      invested: roundMoney(invested),
    };
  });
}
