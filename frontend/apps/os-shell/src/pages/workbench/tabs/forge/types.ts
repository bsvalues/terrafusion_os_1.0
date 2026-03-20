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

/* ── Utilities ──────────────────────────────────────────── */

export const fmtCurrency = (v: number | undefined | null) =>
  v != null ? `$${v.toLocaleString()}` : '—';

export const formatCurrency = (value: number | undefined | null) =>
  value != null ? `$${value.toLocaleString()}` : 'N/A';

export const formatConfidence = (value: number | undefined | null) =>
  value != null ? `${Math.round(value * 100)}%` : 'N/A';
