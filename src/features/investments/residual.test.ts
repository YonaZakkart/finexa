import { describe, expect, it } from 'vitest';
import { calculateResidualDelta, resolveResidual } from './residual';

describe('calculateResidualDelta', () => {
  it('subtracts the purchase and its commission from the available total', () => {
    expect(
      calculateResidualDelta({
        availableTotal: 100,
        purchaseAmount: 99,
        purchaseCommission: 0.3,
      })
    ).toBe(0.7);
  });

  it('rounds the result to two decimals', () => {
    expect(
      calculateResidualDelta({
        availableTotal: 100,
        purchaseAmount: 99.999,
        purchaseCommission: 0.001,
      })
    ).toBe(0);
  });

  it('returns a negative delta when the commission exceeds the available remainder', () => {
    expect(
      calculateResidualDelta({
        availableTotal: 100,
        purchaseAmount: 99.9,
        purchaseCommission: 0.5,
      })
    ).toBe(-0.4);
  });
});

describe('resolveResidual', () => {
  it('keeps the available mode when the commission is not paid from residual', () => {
    const result = resolveResidual({
      availableTotal: 100,
      purchaseAmount: 99,
      purchaseCommission: 0.3,
      residualBefore: 0.5,
      commissionFromResidual: false,
    });

    expect(result).toEqual({ delta: 0.7, total: 1.2, mode: 'available' });
  });

  it('allows a negative total when the commission is paid from residual', () => {
    const result = resolveResidual({
      availableTotal: 100,
      purchaseAmount: 99.9,
      purchaseCommission: 0.5,
      residualBefore: 0,
      commissionFromResidual: true,
    });

    expect(result).toEqual({ delta: -0.4, total: -0.4, mode: 'residual' });
  });

  it('adds the delta to the previous residual', () => {
    const result = resolveResidual({
      availableTotal: 100,
      purchaseAmount: 99.9,
      purchaseCommission: 0.5,
      residualBefore: 0.5,
      commissionFromResidual: true,
    });

    expect(result).toEqual({ delta: -0.4, total: 0.1, mode: 'residual' });
  });

  it('uses the manual override instead of the calculated delta', () => {
    const result = resolveResidual({
      availableTotal: 100,
      purchaseAmount: 99,
      purchaseCommission: 0.3,
      residualBefore: 0.5,
      commissionFromResidual: false,
      override: 0.25,
    });

    expect(result).toEqual({ delta: 0.25, total: 0.75, mode: 'available' });
  });

  it('keeps a zero residual when the purchase uses the whole available total', () => {
    const result = resolveResidual({
      availableTotal: 100,
      purchaseAmount: 99.7,
      purchaseCommission: 0.3,
      residualBefore: 0,
      commissionFromResidual: false,
    });

    expect(result).toEqual({ delta: 0, total: 0, mode: 'available' });
  });
});
