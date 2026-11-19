import { roundMoney } from '@/lib/money';

export type ResidualMode = 'available' | 'residual';

export interface ResidualInput {
  availableTotal: number;
  purchaseAmount: number;
  purchaseCommission: number;
}

export interface ResolveResidualInput extends ResidualInput {
  residualBefore: number;
  commissionFromResidual: boolean;
  override?: number;
}

export interface ResidualResult {
  delta: number;
  total: number;
  mode: ResidualMode;
}

export function calculateResidualDelta(input: ResidualInput): number {
  return roundMoney(input.availableTotal - input.purchaseAmount - input.purchaseCommission);
}

export function resolveResidual(input: ResolveResidualInput): ResidualResult {
  const calculated = calculateResidualDelta(input);
  const delta = input.override === undefined ? calculated : roundMoney(input.override);

  return {
    delta,
    total: roundMoney(input.residualBefore + delta),
    mode: input.commissionFromResidual ? 'residual' : 'available',
  };
}
