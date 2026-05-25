import { describe, it, expect } from 'vitest';
import {
  determineRollbackYears,
  calculateRollback,
} from '../modules/terra-current-use/domain/rollback/rollbackEngine';
import type { RollbackInput } from '../modules/terra-current-use/domain/rollback/rollbackTypes';

function makeInput(
  classificationType: RollbackInput['classificationType'],
  removalDate: string,
  taxYearOfRemoval = 2026,
): RollbackInput {
  return { parcelId: 'test-parcel-1', classificationType, removalDate, taxYearOfRemoval };
}

describe('determineRollbackYears', () => {
  it('FARM_AND_AGRICULTURAL on 2025-09-01 (cutover) → 4 years', () => {
    const years = determineRollbackYears(makeInput('FARM_AND_AGRICULTURAL', '2025-09-01'));
    expect(years).toHaveLength(4);
  });

  it('FARM_AND_AGRICULTURAL after cutover → 4 years', () => {
    const years = determineRollbackYears(makeInput('FARM_AND_AGRICULTURAL', '2026-01-15'));
    expect(years).toHaveLength(4);
  });

  it('FARM_AND_AGRICULTURAL before cutover → 7 years', () => {
    const years = determineRollbackYears(makeInput('FARM_AND_AGRICULTURAL', '2025-08-31'));
    expect(years).toHaveLength(7);
  });

  it('OPEN_SPACE → 7 years regardless of date', () => {
    const years = determineRollbackYears(makeInput('OPEN_SPACE', '2026-01-01'));
    expect(years).toHaveLength(7);
  });

  it('TIMBER_LAND → 7 years', () => {
    const years = determineRollbackYears(makeInput('TIMBER_LAND', '2026-03-01'));
    expect(years).toHaveLength(7);
  });

  it('DESIGNATED_FORESTLAND → 7 years', () => {
    const years = determineRollbackYears(makeInput('DESIGNATED_FORESTLAND', '2025-09-15'));
    expect(years).toHaveLength(7);
  });

  it('rollback years are contiguous ascending integers ending at taxYearOfRemoval - 1', () => {
    const years = determineRollbackYears(makeInput('FARM_AND_AGRICULTURAL', '2026-01-01', 2026));
    for (let i = 1; i < years.length; i++) {
      expect(years[i]).toBe(years[i - 1] + 1);
    }
    expect(years[years.length - 1]).toBe(2026 - 1);
  });
});

describe('calculateRollback', () => {
  it('returns CU_ROLLBACK_ENGINE_v2026_03_01 version', () => {
    const result = calculateRollback(makeInput('FARM_AND_AGRICULTURAL', '2026-01-01'));
    expect(result.calculationVersion).toBe('CU_ROLLBACK_ENGINE_v2026_03_01');
  });

  it('returns policy version 2025.09.01', () => {
    const result = calculateRollback(makeInput('OPEN_SPACE', '2025-10-01'));
    expect(result.policyVersion).toBe('2025.09.01');
  });

  it('totalDue equals additionalTaxSubtotal + interestSubtotal + penaltyAmount', () => {
    const result = calculateRollback(makeInput('FARM_AND_AGRICULTURAL', '2026-01-01'));
    expect(result.totalDue).toBeCloseTo(
      result.additionalTaxSubtotal + result.interestSubtotal + result.penaltyAmount,
      2,
    );
  });

  it('explanation is non-empty array', () => {
    const result = calculateRollback(makeInput('TIMBER_LAND', '2026-02-15'));
    expect(result.explanation.length).toBeGreaterThan(0);
  });
});
