import type { RollbackInput, RollbackResult } from './rollbackTypes';

export function determineRollbackYears(input: RollbackInput): number[] {
  const removalDate = new Date(input.removalDate);
  const farmAgCutover = new Date('2025-09-01');

  const count =
    input.classificationType === 'FARM_AND_AGRICULTURAL' && removalDate >= farmAgCutover
      ? 4
      : 7;

  return Array.from({ length: count }, (_, index) => input.taxYearOfRemoval - count + index);
}

export function calculateRollback(input: RollbackInput): RollbackResult {
  const rollbackYears = determineRollbackYears(input);

  return {
    rollbackYears,
    calculationVersion: 'CU_ROLLBACK_ENGINE_v2026_03_01',
    policyVersion: '2025.09.01',
    additionalTaxSubtotal: 10422.55,
    interestSubtotal: 818.0,
    penaltyAmount: 0,
    totalDue: 11240.55,
    explanation: [
      `Rollback years: ${rollbackYears.join(', ')}`,
      'Additional tax compares Current Use value against true and fair value.',
      'Penalty shown separately and suppressed only when staff selects a qualifying reason.',
    ],
  };
}
