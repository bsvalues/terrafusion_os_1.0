// frontend/apps/os-shell/src/pages/forge/county-studio/types/countyStudio.types.ts

export type SyncState = 'LIVE' | 'STAGED' | 'SNAPSHOT' | 'DISCONNECTED';
export type MetricKey = 'ratio' | 'cod' | 'prd' | 'stability' | 'exceptions' | 'risk';
export type StudyType = 'RatioStudy' | 'MassAppraisal' | 'EquityStudy' | 'CustomStudy';
export type StudyStatus = 'Draft' | 'Active' | 'Reviewing' | 'Approved' | 'Archived';
export type ScenarioStatus = 'Draft' | 'Saved' | 'Reviewed' | 'Approved' | 'Promoted' | 'Rejected' | 'Archived';
export type AdjustmentType = 'PercentageIncrease' | 'PercentageDecrease' | 'FlatDollarIncrease' | 'FlatDollarDecrease' | 'CustomFormula';
export type SelectionType = 'Visual' | 'RuleBased' | 'Hybrid' | 'Manual';

export interface CountyStudySessionDto {
  studyId: string;
  countyId: string;
  taxYear: number;
  studyType: StudyType;
  status: StudyStatus;
  baselineVersion: string | null;
  activeSegmentSetId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface CountySegmentSetDto {
  segmentSetId: string;
  studyId: string;
  name: string;
  sourceType: string;
  version: string;
  isBaseline: boolean;
  segmentCount: number;
  createdAt: string;
}

export interface CountySegmentDto {
  segmentId: string;
  segmentSetId: string;
  name: string;
  segmentType: string;
  parcelCount: number;
  medianRatio: number;
  cod: number;
  prd: number;
  stabilityScore: number;
  riskScore: number;
  exceptionCount: number;
  geographyRef: string | null;
}

export interface CountyCohortDto {
  cohortId: string;
  studyId: string;
  name: string;
  selectionType: SelectionType;
  parcelCount: number;
  isHybrid: boolean;
  createdAt: string;
}

export interface CountyScenarioDto {
  scenarioId: string;
  studyId: string;
  cohortId: string;
  adjustmentType: AdjustmentType;
  parameters: Record<string, unknown>;
  rationale: string;
  status: ScenarioStatus;
  createdAt: string;
}

export interface ScenarioDeltaItem {
  segmentId: string;
  segmentName: string;
  beforeRatio: number;
  afterRatio: number;
  beforeCod: number;
  afterCod: number;
  deltaPercent: number;
}

export interface ScenarioImpactPreviewDto {
  scenarioId: string;
  totalParcelsAffected: number;
  estimatedMedianRatioDelta: number;
  estimatedCodDelta: number;
  estimatedPrdDelta: number;
  deltas: ScenarioDeltaItem[];
}

export type SelectionSource = 'click' | 'lasso' | 'box';

export interface PendingSelection {
  parcelIds: string[];
  source: SelectionSource;
  parcelCount: number;
  geometry?: unknown;
  areaEstimate?: number;
}
