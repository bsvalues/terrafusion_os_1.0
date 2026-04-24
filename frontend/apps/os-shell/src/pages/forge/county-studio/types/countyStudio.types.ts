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
  /** Nullable on server for sparse-sample segments — UI must null-guard. */
  medianRatio: number | null;
  /** Nullable when the sample is below the MinRatiosForStats threshold. */
  cod: number | null;
  /** Nullable when PRD cannot be computed (insufficient paired prices). */
  prd: number | null;
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

// ── Rollups (Task B — drill lattice) ──────────────────────────────────────

export type RollupComplianceStatus = 'IaaoCompliant' | 'MarginalCompliance' | 'NonCompliant';

export interface CityRollupRowDto {
  city: string;
  segmentCount: number;
  parcelCount: number;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  exceptionCount: number;
  exceptionRate: number;
  worstSegmentName: string | null;
  worstSegmentMedianRatio: number | null;
  complianceStatus: RollupComplianceStatus;
}

export interface NeighborhoodRollupRowDto {
  neighborhoodCode: string;
  neighborhoodName: string;
  city: string;
  segmentCount: number;
  parcelCount: number;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  stabilityScore: number;
  riskScore: number;
  exceptionCount: number;
  exceptionRate: number;
  complianceStatus: RollupComplianceStatus;
}

/**
 * Drill level for the County Studio center panel.
 *   'county'       — CityRollupTable visible.
 *   'city'         — NeighborhoodRollupTable filtered to selectedCity.
 *   'neighborhood' — SegmentTable filtered to selectedNeighborhood's GeographyRef.
 * Segment-level detail lives in the RightRail's ObjectInspector, selected via
 * selectedSegmentId; it is not a separate drillLevel because the segment table
 * remains visible beneath it.
 */
export type DrillLevel = 'county' | 'city' | 'neighborhood';

// ── Health Summary (Task C — chief appraiser's Monday-morning screen) ──

/**
 * Composite IAAO compliance status for the county health summary.
 * Unions the Task B rollup tiers with InsufficientData for low-sample counties.
 */
export type CountyHealthComplianceStatus =
  | 'IaaoCompliant'
  | 'MarginalCompliance'
  | 'NonCompliant'
  | 'InsufficientData';

export interface HealthAlertDto {
  segmentId: string;
  segmentName: string;
  neighborhoodCode: string | null;
  city: string | null;
  parcelCount: number;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  exceptionCount: number;
  /** 0-100 composite, higher = more risk. Formula lives server-side — do not re-implement. */
  compositeRisk: number;
  /** Human-readable triggers, ordered by contribution size (largest first). */
  reasons: string[];
}

export interface CountyHealthSummaryDto {
  studyId: string;
  countyId: string;
  taxYear: number;
  parcelCount: number;
  ratioCount: number;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  stabilityScore: number | null;
  riskScore: number | null;
  exceptionCount: number;
  complianceStatus: CountyHealthComplianceStatus;
  topAlerts: HealthAlertDto[];
  criticalCount: number;
  warningCount: number;
  healthyCount: number;
  /** ISO timestamp of the most-recent derivation. null when not yet derived. */
  derivedAt: string | null;
}
