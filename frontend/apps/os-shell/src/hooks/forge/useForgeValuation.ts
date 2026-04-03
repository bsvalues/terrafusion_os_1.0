/**
 * hooks/forge/useForgeValuation.ts
 *
 * TanStack Query hooks that wire Forge sub-tabs to the backend
 * GET /api/forge/{parcelId}/{approach}?taxYear= endpoints.
 *
 * Each hook returns { data, loading, error, source } where
 *   source = "live"     when the API responds successfully
 *   source = "fallback" when the API call fails (component should use its own fallback data)
 */

import { useQuery } from '@tanstack/react-query';

/* ── Response shapes (mirror backend ForgeValuationDtos.cs) ── */

export interface CostApproachData {
  parcelId: string;
  taxYear: number;
  replacementCostNew: number;
  physicalDepreciation: number;
  functionalObsolescence: number;
  externalObsolescence: number;
  depreciatedCost: number;
  landValue: number;
  indicatedValue: number;
  improvementValue: number;
  source: string;
  confidence: number;
  inputs: Array<{ name: string; sourceLabel: string; pii: boolean }>;
  // CP-4: depreciation percentages + building/land details
  physicalDepreciationPct: number;
  functionalObsolescencePct: number;
  externalObsolescencePct: number;
  yearBuilt: number | null;
  effectiveAge: number | null;
  qualityGrade: string | null;
  conditionGrade: string | null;
  buildingSqFt: number | null;
  landAreaSqFt: number | null;
  landAreaAcres: number | null;
  isAgriculturalOrTimber: boolean;
  waClassificationNote: string | null;
}

export interface ComparableSaleEntry {
  parcelId: string;
  saleDate: string | null;
  salePrice: number;
  adjustedPrice: number;
  similarity: number;
  notes: string[];
}

export interface SalesComparisonData {
  parcelId: string;
  taxYear: number;
  indicatedValue: number;
  comparableCount: number;
  medianAdjustedPrice: number;
  adjustmentRange: number;
  comparables: ComparableSaleEntry[];
  rationale: string;
  source: string;
  confidence: number;
}

export interface IncomeApproachData {
  parcelId: string;
  taxYear: number;
  netOperatingIncome: number;
  capRate: number;
  valuation: number;
  grossIncomeMultiplier: number;
  riskClassification: string;
  incomeIndicatedValue: number;
  source: string;
  confidence: number;
}

export interface ApproachSummary {
  approach: string;
  indicatedValue: number;
  weight: number;
  confidence: number;
  note: string;
}

export interface ReconciliationData {
  parcelId: string;
  taxYear: number;
  costApproach: ApproachSummary;
  salesApproach: ApproachSummary;
  incomeApproach: ApproachSummary;
  reconciledValue: number;
  method: string;
  assessedValue: number | null;
  marketValue: number | null;
  source: string;
  confidence: number;
}

/* ── Hook result shape ─────────────────────────────────────── */

export interface ForgeHookResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  source: 'live' | 'fallback';
  refetch: () => void;
}

/* ── Internal fetcher ──────────────────────────────────────── */

async function fetchForge<T>(parcelId: string, approach: string, taxYear: number): Promise<T> {
  const res = await fetch(`/api/forge/${encodeURIComponent(parcelId)}/${approach}?taxYear=${taxYear}`);
  if (!res.ok) {
    throw new Error(`Forge ${approach} fetch failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/* ── Shared wrapper to produce ForgeHookResult ─────────────── */

function useForgeQuery<T>(
  key: string,
  parcelId: string | undefined,
  approach: string,
  taxYear: number,
): ForgeHookResult<T> {
  const query = useQuery<T>({
    queryKey: ['forge', key, parcelId, taxYear],
    queryFn: () => fetchForge<T>(parcelId!, approach, taxYear),
    enabled: !!parcelId,
    retry: 1,
    staleTime: 60_000,
  });

  return {
    data: query.data,
    loading: query.isLoading || query.isFetching,
    error: query.error as Error | null,
    source: query.data ? 'live' : 'fallback',
    refetch: query.refetch,
  };
}

/* ── Public hooks ──────────────────────────────────────────── */

export function useCostApproach(parcelId: string | undefined, taxYear: number): ForgeHookResult<CostApproachData> {
  return useForgeQuery<CostApproachData>('cost', parcelId, 'cost', taxYear);
}

export function useSalesComparison(parcelId: string | undefined, taxYear: number): ForgeHookResult<SalesComparisonData> {
  return useForgeQuery<SalesComparisonData>('sales', parcelId, 'sales', taxYear);
}

export function useIncomeApproach(parcelId: string | undefined, taxYear: number): ForgeHookResult<IncomeApproachData> {
  return useForgeQuery<IncomeApproachData>('income', parcelId, 'income', taxYear);
}

export function useReconciliation(parcelId: string | undefined, taxYear: number): ForgeHookResult<ReconciliationData> {
  return useForgeQuery<ReconciliationData>('reconciliation', parcelId, 'reconciliation', taxYear);
}

/* ── /years endpoint types ─────────────────────────────────── */

export interface ProgramEnrollment {
  currentUseAg: boolean;
  agLossDeferred: number;
  agLateLossDeferred: number;
  currentUseTimber: boolean;
  timberLossDeferred: number;
  exemptionCodes: string[];
}

export interface ParcelYearLayer {
  year: number;
  supNum: number;
  layerType: 'base' | 'supplemental';
  propState: string | null;
  isLocked: boolean;
  isEarliestKnownLayer: boolean;
  revaluationCycle: number | null;
  lastAppraisalDate: string | null;
  assessedValue: number | null;
  marketValue: number | null;
  programs: ProgramEnrollment;
}

export interface ParcelYearLayersResult {
  parcelId: string;
  layers: ParcelYearLayer[];
  defaultYear: number | null;
}

/* ── useParcelYears ─────────────────────────────────────────── */

/* ── Year-layer types (mirror backend ParcelYearLayersResult) ── */

export interface ProgramEnrollment {
  currentUseAg: boolean;
  agLossDeferred: number | null;
  agLateLossDeferred: number | null;
  currentUseTimber: boolean;
  timberLossDeferred: number | null;
  exemptionCodes: string[];
}

export interface ParcelYearLayer {
  year: number;
  supNum: number;
  layerType: 'base' | 'supplemental';
  propState: string | null;
  isLocked: boolean;
  isEarliestKnownLayer: boolean;
  revaluationCycle: number | null;
  lastAppraisalDate: string | null;
  assessedValue: number | null;
  marketValue: number | null;
  programs: ProgramEnrollment;
}

export interface ParcelYearLayersResult {
  parcelId: string;
  layers: ParcelYearLayer[];
  defaultYear: number | null;
}

export interface ParcelYearsHookResult {
  data: ParcelYearLayersResult | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/* ── useParcelYears ─────────────────────────────────────── */

export function useParcelYears(parcelId: string | undefined): ParcelYearsHookResult {
  const query = useQuery<ParcelYearLayersResult>({
    queryKey: ['forge', 'years', parcelId],
    queryFn: async () => {
      const res = await fetch(`/api/forge/${encodeURIComponent(parcelId!)}/years`);
      if (!res.ok) {
        throw new Error(`Forge /years fetch failed: ${res.status} ${res.statusText}`);
      }
      return res.json();
    },
    enabled: !!parcelId,
    retry: 1,
    staleTime: 300_000,
  });

  return {
    data: query.data,
    loading: query.isLoading || query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
