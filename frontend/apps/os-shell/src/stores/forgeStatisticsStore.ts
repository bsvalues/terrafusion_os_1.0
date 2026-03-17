/**
 * Forge Statistics Store (Phase 16 → Wave 3)
 * ===================================================================
 * Zustand store for ratio study state, outlier management, strata
 * results, model comparison, and IAAO qualification metrics.
 *
 * API-first: fetchStudy calls real backend via ratioAnalysisService.
 * Fixture fallback for outliers/strata/comparison (no backend endpoint yet).
 * isFixture flag discloses fixture-only data sections.
 * Separate lifecycle from propertyStore — this is Forge-scoped.
 */

import { create } from 'zustand';
import { computeRatioStudy } from '@/services/forge/ratioAnalysisService';
import type { RatioStudyResult } from '@/services/forge/ratioAnalysisService';
import {
  RATIO_STUDY_RESULT,
  OUTLIER_RECORDS,
  STRATA_RESULTS,
  MODEL_COMPARISON,
  QUALIFICATION_METRICS,
  STUDY_FILTER_DEFAULT,
} from '@/data/forgeStatisticsFixtures';
import type {
  QualificationMetrics,
  StrataResult,
  OutlierRecord,
  ModelComparisonResult,
  StudyFilterState,
} from '@/data/forgeStatisticsFixtures';

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
  /** Discloses which data sections are from fixtures rather than API */
  isFixture: {
    studyResult: boolean;
    outliers: boolean;
    strata: boolean;
    comparison: boolean;
  };

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
  filters: { ...STUDY_FILTER_DEFAULT },
  outliers: [],
  comparison: null,
  strata: [],
  qualification: null,
  loading: false,
  error: null,
  isFixture: { studyResult: false, outliers: true, strata: true, comparison: true },

  fetchStudy: async () => {
    set({ loading: true, error: null });
    try {
      const result = await computeRatioStudy(get().filters);
      const qualification = computeQualification(result);
      set({
        studyResult: result,
        outliers: OUTLIER_RECORDS,
        strata: STRATA_RESULTS,
        qualification,
        loading: false,
        isFixture: { studyResult: false, outliers: true, strata: true, comparison: get().isFixture.comparison },
      });
    } catch {
      // Fixture fallback
      const qualification = computeQualification(RATIO_STUDY_RESULT);
      set({
        studyResult: RATIO_STUDY_RESULT,
        outliers: OUTLIER_RECORDS,
        strata: STRATA_RESULTS,
        qualification,
        loading: false,
        error: 'Using fixture data — API unavailable',
        isFixture: { studyResult: true, outliers: true, strata: true, comparison: get().isFixture.comparison },
      });
    }
  },

  setFilter: (partial) => {
    set((state) => ({
      filters: { ...state.filters, ...partial },
    }));
  },

  reviewOutlier: async (parcelId, status) => {
    // Optimistic update
    set((state) => ({
      outliers: state.outliers.map((o) =>
        o.parcelId === parcelId ? { ...o, reviewStatus: status } : o
      ),
    }));
  },

  loadComparison: async () => {
    // Fixture-only — no dedicated API endpoint yet for model comparison
    set((state) => ({
      comparison: MODEL_COMPARISON,
      isFixture: { ...state.isFixture, comparison: true },
    }));
  },

  refreshQualification: () => {
    const { studyResult } = get();
    if (!studyResult) return;
    set({ qualification: computeQualification(studyResult) });
  },
}));
