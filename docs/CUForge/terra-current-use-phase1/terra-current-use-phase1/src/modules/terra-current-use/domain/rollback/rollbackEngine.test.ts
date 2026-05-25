import { mockRollbackInput } from '../../data/currentUseMockAdapter';
import { calculateRollback } from './rollbackEngine';
import { determineRollbackYearCount } from './rollbackRules';

describe('Current Use rollback rules', () => {
  it('uses 4 years for Farm & Ag removals on or after 2025-09-01', () => {
    expect(determineRollbackYearCount('FARM_AND_AGRICULTURAL', '2026-03-15')).toBe(4);
  });

  it('uses 7 years for Open Space removals', () => {
    expect(determineRollbackYearCount('OPEN_SPACE', '2026-03-15')).toBe(7);
  });

  it('uses 7 years for Timber Land removals', () => {
    expect(determineRollbackYearCount('TIMBER_LAND', '2026-03-15')).toBe(7);
  });

  it('suppresses 20% penalty for qualifying voluntary withdrawal', () => {
    const result = calculateRollback({
      ...mockRollbackInput,
      removalType: 'OWNER_VOLUNTARY_WITHDRAWAL',
      penaltySuppressionReason: 'QUALIFYING_VOLUNTARY_WITHDRAWAL',
      statutoryExceptionReason: 'NONE',
    });

    expect(result.penaltyApplied).toBe(false);
    expect(result.penaltyAmount).toBe(0);
  });

  it('applies 20% penalty when no suppression applies', () => {
    const result = calculateRollback({
      ...mockRollbackInput,
      penaltySuppressionReason: undefined,
      statutoryExceptionReason: 'NONE',
    });

    expect(result.penaltyApplied).toBe(true);
    expect(result.penaltyAmount).toBeGreaterThan(0);
  });

  it('zeros total due when statutory exception applies', () => {
    const result = calculateRollback({
      ...mockRollbackInput,
      statutoryExceptionReason: 'NATURAL_DISASTER',
    });

    expect(result.statutoryExceptionApplied).toBe(true);
    expect(result.totalDue).toBe(0);
  });

  it('does not crash when a rollback year is missing required data', () => {
    const result = calculateRollback({
      ...mockRollbackInput,
      currentUseAssessedValuesByYear: mockRollbackInput.currentUseAssessedValuesByYear.filter(
        (row) => row.taxYear !== 2023,
      ),
    });

    expect(result.explanation.some((line) => line.label.includes('Skipped year'))).toBe(true);
  });
});
