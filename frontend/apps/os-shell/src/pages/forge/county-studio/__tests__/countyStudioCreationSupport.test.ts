import { describe, expect, it } from 'vitest';
import {
  SUPPORTED_ADJUSTMENT_TYPES,
  SUPPORTED_SELECTION_TYPES,
  SUPPORTED_STUDY_TYPES,
  assertSupportedAdjustmentType,
  assertSupportedSelectionType,
  assertSupportedStudyType,
} from '../countyStudioCreationSupport';

describe('County Studio creation support policy', () => {
  it('keeps unsupported study types out of the creation allowlist', () => {
    expect(SUPPORTED_STUDY_TYPES).toEqual([
      'RatioStudy',
      'MassAppraisal',
      'IncomeApproach',
      'CostApproach',
    ]);
    expect(() => assertSupportedStudyType('EquityStudy')).toThrow(/intentionally hidden/i);
    expect(() => assertSupportedStudyType('CustomStudy')).toThrow(/intentionally hidden/i);
  });

  it('keeps manual parcel-list cohorts out of the creation allowlist', () => {
    expect(SUPPORTED_SELECTION_TYPES).toEqual(['Visual', 'RuleBased', 'Hybrid']);
    expect(() => assertSupportedSelectionType('Manual')).toThrow(/intentionally hidden/i);
  });

  it('keeps custom formula scenarios out of the creation allowlist', () => {
    expect(SUPPORTED_ADJUSTMENT_TYPES).toEqual([
      'PercentageIncrease',
      'PercentageDecrease',
      'FlatDollarIncrease',
      'FlatDollarDecrease',
    ]);
    expect(() => assertSupportedAdjustmentType('CustomFormula')).toThrow(/intentionally hidden/i);
  });
});
