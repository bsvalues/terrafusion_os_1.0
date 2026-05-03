import type { AdjustmentType, SelectionType, StudyType } from './types/countyStudio.types';

export const SUPPORTED_STUDY_TYPES = [
  'RatioStudy',
  'MassAppraisal',
  'IncomeApproach',
  'CostApproach',
] as const satisfies readonly StudyType[];

export const UNSUPPORTED_STUDY_TYPES = [
  'EquityStudy',
  'CustomStudy',
] as const satisfies readonly StudyType[];

export const SUPPORTED_SELECTION_TYPES = [
  'Visual',
  'RuleBased',
  'Hybrid',
  'Manual',
] as const satisfies readonly SelectionType[];

export const UNSUPPORTED_SELECTION_TYPES = [] as const satisfies readonly SelectionType[];

export const SUPPORTED_ADJUSTMENT_TYPES = [
  'PercentageIncrease',
  'PercentageDecrease',
  'FlatDollarIncrease',
  'FlatDollarDecrease',
] as const satisfies readonly AdjustmentType[];

export const UNSUPPORTED_ADJUSTMENT_TYPES = [
  'CustomFormula',
] as const satisfies readonly AdjustmentType[];

function includes<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

export type SupportedStudyType = (typeof SUPPORTED_STUDY_TYPES)[number];
export type SupportedSelectionType = (typeof SUPPORTED_SELECTION_TYPES)[number];
export type SupportedAdjustmentType = (typeof SUPPORTED_ADJUSTMENT_TYPES)[number];

export function assertSupportedStudyType(studyType: string): SupportedStudyType {
  if (includes(SUPPORTED_STUDY_TYPES, studyType)) return studyType;
  if (includes(UNSUPPORTED_STUDY_TYPES, studyType)) {
    throw new Error(`County Studio study type "${studyType}" is intentionally hidden until the live backend contract exists.`);
  }
  throw new Error(`Unsupported County Studio study type "${studyType}".`);
}

export function assertSupportedSelectionType(selectionType: string): SupportedSelectionType {
  if (includes(SUPPORTED_SELECTION_TYPES, selectionType)) return selectionType;
  throw new Error(`Unsupported County Studio selection type "${selectionType}".`);
}

export function assertSupportedAdjustmentType(adjustmentType: string): SupportedAdjustmentType {
  if (includes(SUPPORTED_ADJUSTMENT_TYPES, adjustmentType)) return adjustmentType;
  if (includes(UNSUPPORTED_ADJUSTMENT_TYPES, adjustmentType)) {
    throw new Error('Custom formula scenarios are intentionally hidden until a governed formula contract exists.');
  }
  throw new Error(`Unsupported County Studio adjustment type "${adjustmentType}".`);
}
