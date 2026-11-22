import { describe, expect, it } from 'vitest';
import type { BalanceSnapshot, Investment } from '@/types';
import { buildBalanceChartData } from './balance-chart';

const TODAY = '2026-11-21';

let sequence = 0;

function snapshot(date: string, balance: number, portfolioId = 'p1'): BalanceSnapshot {
  sequence += 1;

  return {
    id: `snapshot-${sequence}`,
    portfolioId,
    date,
    balance,
    createdAt: `${date}T10:00:00.000Z`,
    updatedAt: `${date}T10:00:00.000Z`,
  };
}

function investment(date: string, purchaseAmount: number, portfolioId = 'p1'): Investment {
  sequence += 1;

  return {
    id: `investment-${sequence}`,
    portfolioId,
    date,
    depositTotal: purchaseAmount,
    bankCommission: 0,
    brokerCommission: 0,
    availableTotal: purchaseAmount,
    purchaseAmount,
    purchaseCommission: 0,
    commissionFromResidual: false,
    residualDelta: 0,
    createdAt: `${date}T10:00:00.000Z`,
  };
}

describe('buildBalanceChartData', () => {
  it('builds one point per day for the month range', () => {
    const data = buildBalanceChartData({
      snapshots: [],
      investments: [],
      range: '1m',
      today: TODAY,
    });

    expect(data).toHaveLength(30);
    expect(data[0].date).toBe('2026-10-23');
    expect(data[29].date).toBe(TODAY);
    expect(data.every((point) => point.balance === null)).toBe(true);
  });

  it('keeps the balance flat between updates', () => {
    const data = buildBalanceChartData({
      snapshots: [snapshot('2026-11-19', 100), snapshot('2026-11-21', 150)],
      investments: [],
      range: '1m',
      today: TODAY,
    });

    const byDate = new Map(data.map((point) => [point.date, point]));

    expect(byDate.get('2026-11-18')?.balance).toBeNull();
    expect(byDate.get('2026-11-19')?.balance).toBe(100);
    expect(byDate.get('2026-11-20')?.balance).toBe(100);
    expect(byDate.get('2026-11-21')?.balance).toBe(150);
  });

  it('carries the last snapshot before the range into the first point', () => {
    const data = buildBalanceChartData({
      snapshots: [snapshot('2026-09-01', 80)],
      investments: [],
      range: '1m',
      today: TODAY,
    });

    expect(data[0].balance).toBe(80);
    expect(data[data.length - 1].balance).toBe(80);
  });

  it('accumulates the invested amount over time', () => {
    const data = buildBalanceChartData({
      snapshots: [],
      investments: [investment('2026-10-01', 100), investment('2026-11-20', 50)],
      range: '1m',
      today: TODAY,
    });

    const byDate = new Map(data.map((point) => [point.date, point]));

    expect(byDate.get('2026-10-23')?.invested).toBe(100);
    expect(byDate.get('2026-11-19')?.invested).toBe(100);
    expect(byDate.get('2026-11-20')?.invested).toBe(150);
    expect(byDate.get(TODAY)?.invested).toBe(150);
  });

  it('samples the longer ranges weekly and always includes today', () => {
    const data = buildBalanceChartData({
      snapshots: [],
      investments: [],
      range: '6m',
      today: TODAY,
    });

    expect(data).toHaveLength(27);
    expect(data[1].date).toBe('2026-06-02');
    expect(data[data.length - 1].date).toBe(TODAY);
  });

  it('rounds the derived values', () => {
    const data = buildBalanceChartData({
      snapshots: [snapshot('2026-11-20', 0.1)],
      investments: [investment('2026-11-20', 0.2)],
      range: '1m',
      today: TODAY,
    });

    const point = data.find((row) => row.date === '2026-11-20');

    expect(point?.balance).toBe(0.1);
    expect(point?.invested).toBe(0.2);
  });
});
