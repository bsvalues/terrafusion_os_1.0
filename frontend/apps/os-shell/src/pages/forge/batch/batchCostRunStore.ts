/**
 * batchCostRunStore.ts — Zustand store for BatchCostRun module.
 *
 * Owns: batch preview, batch history, cost matrix, depreciation schedule, cost estimate.
 * Pattern: API-first — all data is TerraFusion CostForge truth via .NET API.
 *
 * Endpoints consumed:
 *   GET  /api/forge/cost/batch/preview       → Batch adjustment preview
 *   GET  /api/forge/cost/batch/history       → Completed batch run history
 *   GET  /api/costforge/cost-matrix/benton   → Benton County 2025 cost matrix (42 entries)
 *   GET  /api/costforge/depreciation-schedule → Residential + commercial depreciation brackets
 *   POST /api/costforge/cost-estimate        → Single-property cost estimate calculator
 */
import { create } from 'zustand';
import { apiFetchJson } from '../../../lib/apiBase';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BatchAdjustment {
  factor: string;
  currentValue: number;
  proposedValue: number;
  delta: number;
  parcels: number;
}

export interface BatchPreview {
  neighborhood: string;
  propertyType: string;
  matchCount: number;
  affectedCount: number;
  batchId: string;
  adjustments: BatchAdjustment[];
}

export interface BatchHistoryEntry {
  batchId: string;
  neighborhood: string;
  propertyType: string;
  appliedAt: string;
  affectedCount: number;
  status: string;
}

export interface CostMatrixEntry {
  buildingType: string;
  buildingTypeLabel: string;
  region: string;
  baseCostPerSqft: number;
  matrixYear: number;
  source: string;
}

export interface DepreciationBracket {
  minAge: number;
  maxAge: number;
  factor: number;
}

export interface DepreciationSchedule {
  residential: {
    usefulLifeYears: number;
    annualRate: number;
    brackets: DepreciationBracket[];
  };
  commercial: {
    usefulLifeYears: number;
    annualRate: number;
    brackets: DepreciationBracket[];
  };
}

export interface CostEstimateRequest {
  buildingType: string;
  region: string;
  squareFeet: number;
  yearBuilt?: number;
  qualityGrade?: string;
  conditionGrade?: string;
  complexityGrade?: string;
}

export interface CostEstimateResult {
  buildingType: string;
  region: string;
  squareFeet: number;
  baseCostPerSqft: number;
  replacementCostNew: number;
  effectiveAge: number;
  depreciationFactor: number;
  depreciatedValue: number;
  qualityMultiplier: number;
  conditionMultiplier: number;
  complexityMultiplier: number;
  finalEstimate: number;
  source: string;
}

// ── Store Shape ──────────────────────────────────────────────────────────────

interface BatchCostRunState {
  // Data slices
  preview: BatchPreview | null;
  history: BatchHistoryEntry[];
  costMatrix: CostMatrixEntry[];
  depreciation: DepreciationSchedule | null;
  costEstimate: CostEstimateResult | null;

  // Loading states
  previewLoading: boolean;
  historyLoading: boolean;
  matrixLoading: boolean;
  depreciationLoading: boolean;
  estimateLoading: boolean;

  // Errors
  previewError: string | null;
  historyError: string | null;
  matrixError: string | null;
  depreciationError: string | null;
  estimateError: string | null;

  // Computed stats
  stats: {
    matrixEntries: number;
    buildingTypes: number;
    regions: number;
    completedRuns: number;
    lastPreviewParcels: number;
  };

  // Actions
  fetchPreview: (neighborhood?: string, propertyType?: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchCostMatrix: (buildingType?: string, region?: string) => Promise<void>;
  fetchDepreciation: () => Promise<void>;
  calculateEstimate: (req: CostEstimateRequest) => Promise<void>;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useBatchCostRunStore = create<BatchCostRunState>((set, get) => ({
  // Initial state
  preview: null,
  history: [],
  costMatrix: [],
  depreciation: null,
  costEstimate: null,

  previewLoading: false,
  historyLoading: false,
  matrixLoading: false,
  depreciationLoading: false,
  estimateLoading: false,

  previewError: null,
  historyError: null,
  matrixError: null,
  depreciationError: null,
  estimateError: null,

  stats: {
    matrixEntries: 0,
    buildingTypes: 0,
    regions: 0,
    completedRuns: 0,
    lastPreviewParcels: 0,
  },

  // ── Actions ──────────────────────────────────────────────────────────────

  fetchPreview: async (neighborhood?: string, propertyType?: string) => {
    set({ previewLoading: true, previewError: null });
    try {
      const params = new URLSearchParams();
      if (neighborhood) params.set('neighborhood', neighborhood);
      if (propertyType) params.set('propertyType', propertyType);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetchJson<BatchPreview>(`/forge/cost/batch/preview${qs}`);
      set((s) => ({
        preview: data,
        previewLoading: false,
        stats: { ...s.stats, lastPreviewParcels: data.affectedCount },
      }));
    } catch (e: unknown) {
      set({ previewError: e instanceof Error ? e.message : String(e), previewLoading: false });
    }
  },

  fetchHistory: async () => {
    set({ historyLoading: true, historyError: null });
    try {
      const data = await apiFetchJson<BatchHistoryEntry[]>('/forge/cost/batch/history');
      set((s) => ({
        history: data,
        historyLoading: false,
        stats: { ...s.stats, completedRuns: data.length },
      }));
    } catch (e: unknown) {
      set({ historyError: e instanceof Error ? e.message : String(e), historyLoading: false });
    }
  },

  fetchCostMatrix: async (buildingType?: string, region?: string) => {
    set({ matrixLoading: true, matrixError: null });
    try {
      const params = new URLSearchParams();
      if (buildingType) params.set('buildingType', buildingType);
      if (region) params.set('region', region);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await apiFetchJson<{ count: number; entries: CostMatrixEntry[] }>(
        `/costforge/cost-matrix/benton${qs}`
      );
      const entries = data.entries;
      const types = new Set(entries.map((e) => e.buildingType));
      const regions = new Set(entries.map((e) => e.region));
      set((s) => ({
        costMatrix: entries,
        matrixLoading: false,
        stats: {
          ...s.stats,
          matrixEntries: entries.length,
          buildingTypes: types.size,
          regions: regions.size,
        },
      }));
    } catch (e: unknown) {
      set({ matrixError: e instanceof Error ? e.message : String(e), matrixLoading: false });
    }
  },

  fetchDepreciation: async () => {
    set({ depreciationLoading: true, depreciationError: null });
    try {
      const data = await apiFetchJson<DepreciationSchedule>('/costforge/depreciation-schedule');
      set({ depreciation: data, depreciationLoading: false });
    } catch (e: unknown) {
      set({
        depreciationError: e instanceof Error ? e.message : String(e),
        depreciationLoading: false,
      });
    }
  },

  calculateEstimate: async (req: CostEstimateRequest) => {
    set({ estimateLoading: true, estimateError: null });
    try {
      const data = await apiFetchJson<CostEstimateResult>('/costforge/cost-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BuildingType: req.buildingType,
          Region: req.region,
          SquareFeet: req.squareFeet,
          YearBuilt: req.yearBuilt,
          QualityGrade: req.qualityGrade,
          ConditionGrade: req.conditionGrade,
          ComplexityGrade: req.complexityGrade,
        }),
      });
      set({ costEstimate: data, estimateLoading: false });
    } catch (e: unknown) {
      set({ estimateError: e instanceof Error ? e.message : String(e), estimateLoading: false });
    }
  },
}));
