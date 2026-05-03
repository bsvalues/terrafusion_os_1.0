/**
 * forge/types.ts
 *
 * Shared type definitions for Forge sub-tab components.
 * Extracted from PropertyForge.tsx during Phase 1 restructuring.
 */

import type { InvocationRecord } from '../../../../components/workbench';
import type { ErrorInfo } from '../../../../hooks/useErrorHandler';

/* ── Generic tool state ─────────────────────────────────── */

export type ToolState<T> = {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: T;
  correlationId?: string;
  error?: ErrorInfo;
};

/* ── explain_model_results ──────────────────────────────── */

export interface ValueDriver {
  factor: string;
  impact: string;
}

export interface ExplanationResult {
  parcelId: string;
  taxYear?: number;
  compareToYear?: number;
  assessedValue?: number;
  marketValue?: number;
  explanation?: string;
  drivers?: ValueDriver[];
  confidence?: number;
}

export interface ExplainState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: ExplanationResult;
  correlationId?: string;
  error?: ErrorInfo;
}

/* ── explain_value_change ───────────────────────────────── */

export interface ValueChangeResult {
  parcelId: string;
  previousValue?: number;
  currentValue?: number;
  changeAmount?: number;
  changePercent?: number;
  explanation?: string;
  factors?: Array<{ name: string; contribution: string }>;
}

export interface ValueChangeState {
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: ValueChangeResult;
  correlationId?: string;
  error?: ErrorInfo;
}

/* ── compare_assessed_value_history ─────────────────────── */

export interface ValueHistoryEntry {
  year: number;
  av: number;
  tv?: number;
}

export interface ValueHistoryResult {
  trend: ValueHistoryEntry[];
  narrative?: string;
  flags?: string[];
}

/* ── run_income_valuation (governed tool) ────────────────── */

export interface IncomeResult {
  netOperatingIncome: number;
  capRate: number;
  valuation: number;
  grossIncomeMultiplier: number;
  riskClassification: string;
  source: string;
}

/* ── explain_model_inputs ───────────────────────────────── */

export interface ModelInput {
  name: string;
  source: string;
  pii: boolean;
}

export interface ModelInputsResult {
  inputs: ModelInput[];
  summary: string;
}

/* ── summarize_sales_comps_rationale ─────────────────────── */

export interface CompEntry {
  id: string;
  similarity: number;
  notes: string[];
}

export interface SalesCompsResult {
  rationale: string;
  comps: CompEntry[];
}

/* ── run_valuation_model (write_high) ───────────────────── */

export interface ValuationModelResult {
  parcelId: string;
  taxYear: number;
  modelType: string;
  estimatedValue: number;
  confidence: number;
  components: Record<string, number>;
  correlationId?: string;
}

/* ── assessor superpowers: calibration workbench ───────── */

export type CalibrationScope = 'county' | 'reval_area' | 'neighborhood';

export interface CountyImpactPreview {
  prdBefore: number;
  prdAfter: number;
  codBefore: number;
  codAfter: number;
  avDelta: number;
  fairnessDelta: number;
}

export interface AssessorActionSummary {
  draftVersion: string;
  reasonCode: string;
  confirmation: boolean;
  impactPreview: CountyImpactPreview;
  signoffRequired: boolean;
  traceRef: string;
  targetLane: string;
}

export interface AssessorFindingSummary {
  findingType: string;
  scope: string;
  severity: string;
  confidence: number;
  countyId: string;
  taxYear: number;
  evidenceLineage: string[];
  affectedParcelIds: string[];
  recommendedAction: string;
  assignedRole: string;
  correlationId: string;
}

export interface RateAdjustmentRecommendation {
  scopeId: string;
  factor: number;
  rationale: string;
}

export interface RateAdjustmentProposalResult {
  proposalId: string;
  action: AssessorActionSummary;
  findings: AssessorFindingSummary[];
  recommendedAdjustments: RateAdjustmentRecommendation[];
  narrative: string;
}

export interface ApplyRateAdjustmentResult {
  action: AssessorActionSummary;
  status: 'draft_updated';
  payloadRef: string;
  signoffPacketId: string;
}

export interface RatioStudyResult {
  metrics: CountyImpactPreview;
  readyForSignoff: boolean;
  narrative: string;
}

export interface MatrixComparisonResult {
  baseVersion: string;
  compareVersion: string;
  changedCells: number;
  impactedScopes: string[];
  summary: string;
}

export type ParcelIssueType =
  | 'classification'
  | 'condition'
  | 'geometry'
  | 'sale_linkage'
  | 'permit_gap';

export interface ParcelDataIssueResult {
  queueItemId: string;
  payloadRef: string;
  route: {
    parcelId: string;
    nextTool: 'route_to_parcel';
  };
  action: AssessorActionSummary;
}

export interface CalibrationMemoResult {
  payloadRef: string;
  sections: string[];
  summary: string;
  action: AssessorActionSummary;
}

/* ── Shared sub-tab props ───────────────────────────────── */

export interface ForgeSubTabProps {
  taxYear: number;
  onHistoryRecord: (record: InvocationRecord) => void;
  onValueIndicated?: (approach: string, value: number) => void;
}

/* ── Constants ──────────────────────────────────────────── */

export const CURRENT_YEAR = new Date().getFullYear();

export const TAX_YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export const AUDIENCES = [
  { value: 'internal', label: 'Internal Review', description: 'Detailed technical analysis' },
  { value: 'taxpayer', label: 'Taxpayer-Friendly', description: 'Plain language explanation' },
] as const;

export type AudienceType = (typeof AUDIENCES)[number]['value'];

export const VALUATION_REASON_CODES = [
  { value: 'annual_certification', label: 'Annual Certification' },
  { value: 'market_adjustment', label: 'Market Adjustment' },
  { value: 'new_construction', label: 'New Construction' },
  { value: 'correction', label: 'Correction' },
] as const;

export const CALIBRATION_SCOPES = [
  { value: 'county', label: 'County' },
  { value: 'reval_area', label: 'Reval Area' },
  { value: 'neighborhood', label: 'Neighborhood' },
] as const;

export const CALIBRATION_MEMO_AUDIENCES = [
  { value: 'internal', label: 'Internal Review' },
  { value: 'board', label: 'Board Packet' },
  { value: 'dor', label: 'DOR Packet' },
] as const;

export const PARCEL_ISSUE_TYPES = [
  { value: 'classification', label: 'Classification' },
  { value: 'condition', label: 'Condition' },
  { value: 'geometry', label: 'Geometry' },
  { value: 'sale_linkage', label: 'Sale Linkage' },
  { value: 'permit_gap', label: 'Permit Gap' },
] as const;

/* ── Utilities ──────────────────────────────────────────── */

export const fmtCurrency = (v: number | undefined | null) =>
  v != null ? `$${v.toLocaleString()}` : '—';

export const formatCurrency = (value: number | undefined | null) =>
  value != null ? `$${value.toLocaleString()}` : 'N/A';

export const formatConfidence = (value: number | undefined | null) =>
  value != null ? `${Math.round(value * 100)}%` : 'N/A';
