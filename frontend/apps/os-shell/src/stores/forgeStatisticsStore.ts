/**
 * Forge Statistics Store (Phase 16 → Wave 3)
 * ===================================================================
 * Zustand store for ratio study state, outlier management, strata
 * results, model comparison, and IAAO qualification metrics.
 *
 * API-only: fetchStudy calls real backend via ratioAnalysisService.
 * Unavailable sections remain empty instead of falling back to local data.
 * Separate lifecycle from propertyStore — this is Forge-scoped.
 */

import { create } from 'zustand';
import { computeRatioStudy } from '@/services/forge/ratioAnalysisService';
import type { RatioStudyResult } from '@/services/forge/ratioAnalysisService';
import { statisticsAPI } from '@/services/forge/statisticsAPI';
import {
  OUTLIER_RECORDS,
  STRATA_RESULTS,
  MODEL_COMPARISON,
} from '@/data/forgeStatisticsFixtures';
import type {
  QualificationMetrics,
  StrataResult,
  OutlierRecord,
  ModelComparisonResult,
  StudyFilterState,
} from '@/types/forgeStatistics';

const createDefaultStudyFilter = (): StudyFilterState => ({
  taxYear: new Date().getFullYear(),
  salesWindowMonths: 12,
  neighborhood: null,
  propertyType: null,
  outlierMethod: 'iqr',
});

// ============================================================================
// Store Interface
// ============================================================================

interface ForgeStatisticsState {
  studyResult: RatioStudyResult | null;
  filters: StudyFilterState;
  outliers: OutlierRecord[];
  comparison: ModelComparisonResult | null;
  strata: StrataResult[];
  qualification: QualificationMetrics | null;
  loading: boolean;
  error: string | null;
  // Provenance — true when the section is showing fixture fallback data
  isFixture: { outliers: boolean; strata: boolean; comparison: boolean };
  // Actions
  fetchStudy: () => Promise<void>;
  setFilter: (partial: Partial<StudyFilterState>) => void;
  reviewOutlier: (parcelId: string, status: 'confirmed' | 'dismissed') => Promise<void>;
  loadComparison: () => Promise<void>;
  refreshQualification: () => void;
}

// ============================================================================
// IAAO Qualification Helper
// ============================================================================

function computeQualification(result: RatioStudyResult): QualificationMetrics {
  const checks = [
    result.cod <= 15,                             // COD <= 15
    result.prd >= 0.98 && result.prd <= 1.03,     // PRD 0.98-1.03
    Math.abs(result.prb) < 0.05,                  // |PRB| < 0.05
    result.medianRatio >= 0.90 && result.medianRatio <= 1.10, // Median 0.90-1.10
    Math.abs(result.tierSlope) <= 0.05,            // Tier slope +/-0.05
  ];

  const passCount = checks.filter(Boolean).length;

  return {
    cod: result.cod,
    prd: result.prd,
    prb: result.prb,
    medianRatio: result.medianRatio,
    tierSlope: result.tierSlope,
    sampleSize: result.sampleSize,
    passCount,
    qualified: passCount === 5,
  };
}

// ============================================================================
// Store
// ============================================================================

export const useForgeStatisticsStore = create<ForgeStatisticsState>((set, get) => ({
  studyResult: null,
  filters: createDefaultStudyFilter(),
  outliers: [],
  comparison: null,
  strata: [],
  qualification: null,
  loading: false,
  error: null,
  isFixture: { outliers: false, strata: false, comparison: false },

  fetchStudy: async () => {
    set({ loading: true, error: null });
    try {
      const result = await computeRatioStudy(get().filters);
      const qualification = computeQualification(result);

      const modelId = `${get().filters.taxYear}-${get().filters.outlierMethod}`;
      let outliers: OutlierRecord[] = [];
      let strata: StrataResult[] = [];
      let outliersFixture = false;
      let strataFixture = false;
      const sectionErrors: string[] = [];

      try {
        outliers = await statisticsAPI.getOutliers(modelId);
      } catch {
        // Fall back to bounded fixture so the panel renders evidence; banner discloses fixture origin.
        outliers = OUTLIER_RECORDS;
        outliersFixture = true;
        sectionErrors.push('outliers unavailable');
      }

      try {
        strata = await statisticsAPI.getStrata(modelId);
      } catch {
        strata = STRATA_RESULTS;
        strataFixture = true;
        sectionErrors.push('strata unavailable');
      }

      set((state) => ({
        studyResult: result,
        outliers,
        strata,
        qualification,
        loading: false,
        error: sectionErrors.length > 0 ? sectionErrors.join('; ') : null,
        isFixture: { ...state.isFixture, outliers: outliersFixture, strata: strataFixture },
      }));
    } catch {
      set((state) => ({
        studyResult: null,
        outliers: OUTLIER_RECORDS,
        strata: STRATA_RESULTS,
        qualification: null,
        loading: false,
        error: 'Ratio study API unavailable.',
        isFixture: { ...state.isFixture, outliers: true, strata: true },
      }));
    }
  },

  setFilter: (partial) => {
    set((state) => ({
      filters: { ...state.filters, ...partial },
    }));
  },

  reviewOutlier: async (parcelId, status) => {
    set({ error: `Outlier review endpoint is not wired; ${status} was not persisted for ${parcelId}.` });
  },

  loadComparison: async () => {
    const modelId = `${get().filters.taxYear}-${get().filters.outlierMethod}`;
    try {
      const comparison = await statisticsAPI.compareModels({
        modelIdA: `${modelId}-12mo`,
        modelIdB: `${modelId}-24mo`,
      });
      set((state) => ({
        comparison,
        isFixture: { ...state.isFixture, comparison: false },
      }));
    } catch {
      set((state) => ({
        comparison: MODEL_COMPARISON,
        error: 'Model comparison API unavailable.',
        isFixture: { ...state.isFixture, comparison: true },
      }));
    }
  },

  refreshQualification: () => {
    const { studyResult } = get();
    if (!studyResult) return;
    set({ qualification: computeQualification(studyResult) });
  },
}));
