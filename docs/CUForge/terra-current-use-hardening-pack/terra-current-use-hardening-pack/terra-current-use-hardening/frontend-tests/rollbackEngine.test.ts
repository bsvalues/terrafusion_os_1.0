import { mockRollbackInput } from '../src/modules/terra-current-use/data/currentUseMockAdapter';
import { calculateRollback } from '../src/modules/terra-current-use/domain/rollback/rollbackEngine';
import { determineRollbackYearCount } from '../src/modules/terra-current-use/domain/rollback/rollbackRules';

describe('terra-current-use rollback engine', () => {
  it('uses four years for Farm & Ag removals on or after 2025-09-01', () => {
    expect(determineRollbackYearCount('FARM_AND_AGRICULTURAL', '2026-03-15')).toBe(4);
  });

  it('uses seven years for Open Space removals', () => {
    expect(determineRollbackYearCount('OPEN_SPACE', '2026-03-15')).toBe(7);
  });

  it('suppresses penalty for qualifying voluntary withdrawal', () => {
    const result = calculateRollback({
      ...mockRollbackInput,
      removalType: 'OWNER_VOLUNTARY_WITHDRAWAL',
      penaltySuppressionReason: 'QUALIFYING_VOLUNTARY_WITHDRAWAL',
      statutoryExceptionReason: 'NONE',
    });

    expect(result.penaltyApplied).toBe(false);
    expect(result.penaltyAmount).toBe(0);
  });

  it('applies penalty when no suppression is present', () => {
    const result = calculateRollback({
      ...mockRollbackInput,
      penaltySuppressionReason: undefined,
      statutoryExceptionReason: 'NONE',
    });

    expect(result.penaltyApplied).toBe(true);
    expect(result.penaltyAmount).toBeGreaterThan(0);
  });

  it('adds explainability lines', () => {
    const result = calculateRollback(mockRollbackInput);

    expect(result.explanation.length).toBeGreaterThan(0);
    expect(result.calculationVersion).toContain('CU_ROLLBACK_ENGINE');
  });
});
