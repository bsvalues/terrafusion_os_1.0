import type { ClassificationType } from '../../types/currentUseTypes';
import type { RollbackCalculationInput } from './rollbackTypes';

export const CURRENT_USE_ROLLBACK_ENGINE_VERSION = 'CU_ROLLBACK_ENGINE_v2026_03_01';

const FARM_AG_FOUR_YEAR_EFFECTIVE_DATE = new Date('2025-09-01T00:00:00.000Z');

export function determineRollbackYearCount(
  classificationType: ClassificationType,
  removalDateIso: string,
): number {
  const removalDate = new Date(removalDateIso);

  if (
    classificationType === 'FARM_AND_AGRICULTURAL' &&
    removalDate >= FARM_AG_FOUR_YEAR_EFFECTIVE_DATE
  ) {
    return 4;
  }

  if (classificationType === 'OPEN_SPACE' || classificationType === 'TIMBER_LAND') {
    return 7;
  }

  if (classificationType === 'FARM_AND_AGRICULTURAL') {
    return 7;
  }

  if (classificationType === 'DESIGNATED_FORESTLAND') {
    return 7;
  }

  return 7;
}

export function buildRollbackYears(taxYearOfRemoval: number, rollbackYearCount: number): number[] {
  return Array.from({ length: rollbackYearCount }, (_, index) => taxYearOfRemoval - 1 - index).sort();
}

export function shouldSuppressPenalty(input: RollbackCalculationInput): boolean {
  if (input.statutoryExceptionReason && input.statutoryExceptionReason !== 'NONE') return true;
  if (input.penaltySuppressionReason === 'QUALIFYING_VOLUNTARY_WITHDRAWAL') return true;
  if (input.penaltySuppressionReason === 'STATUTORY_EXCEPTION') return true;
  return false;
}
