/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 16 FORGE STATISTICS STORE CONTRACT TESTS
 * Zustand store for ratio study state, outlier management, model comparison
 *
 * These tests define the Phase 16 contract for the forgeStatisticsStore.
 * They codify:
 *   - Store shape: studyResult, filters, outliers, comparison, strata, qualification
 *   - Actions: fetchStudy, setFilter, reviewOutlier, loadComparison
 *   - Fixture-driven initialization
 *   - Optimistic outlier review mutations
 * ======================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock the service layer — hoisted so store can import it
// ---------------------------------------------------------------------------

const { mockService } = vi.hoisted(() => ({
  mockService: {
    computeRatioStudy: vi.fn(),
    emitModelReceipt: vi.fn(),
  },
}));

vi.mock('@/services/forge/ratioAnalysisService', () => ({
  computeRatioStudy: mockService.computeRatioStudy,
  emitModelReceipt: mockService.emitModelReceipt,
}));

// ---------------------------------------------------------------------------
// Import under test + fixtures
// ---------------------------------------------------------------------------

import { useForgeStatisticsStore } from '../../stores/forgeStatisticsStore';
import {
  RATIO_STUDY_RESULT,
  OUTLIER_RECORDS,
  STRATA_RESULTS,
  MODEL_COMPARISON,
  QUALIFICATION_METRICS,
  STUDY_FILTER_DEFAULT,
} from '@/data/forgeStatisticsFixtures';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 16: forgeStatisticsStore Contract', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    const store = useForgeStatisticsStore.getState();
    useForgeStatisticsStore.setState({
      studyResult: null,
      filters: { ...STUDY_FILTER_DEFAULT },
      outliers: [],
      comparison: null,
      strata: [],
      qualification: null,
      loading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  // =========================================================================
  // Store Shape
  // =========================================================================
  describe('Store Shape', () => {
    it('has all required state fields', () => {
      const state = useForgeStatisticsStore.getState();
      expect(state).toHaveProperty('studyResult');
      expect(state).toHaveProperty('filters');
      expect(state).toHaveProperty('outliers');
      expect(state).toHaveProperty('comparison');
      expect(state).toHaveProperty('strata');
      expect(state).toHaveProperty('qualification');
      expect(state).toHaveProperty('loading');
      expect(state).toHaveProperty('error');
    });

    it('has all required action methods', () => {
      const state = useForgeStatisticsStore.getState();
      expect(typeof state.fetchStudy).toBe('function');
      expect(typeof state.setFilter).toBe('function');
      expect(typeof state.reviewOutlier).toBe('function');
      expect(typeof state.loadComparison).toBe('function');
      expect(typeof state.refreshQualification).toBe('function');
    });

    it('initializes with default filter state', () => {
      const { filters } = useForgeStatisticsStore.getState();
      expect(filters.taxYear).toBe(2026);
      expect(filters.salesWindowMonths).toBe(12);
      expect(filters.outlierMethod).toBe('iqr');
      expect(filters.neighborhood).toBeNull();
      expect(filters.propertyType).toBeNull();
    });
  });

  // =========================================================================
  // fetchStudy
  // =========================================================================
  describe('fetchStudy', () => {
    it('sets loading=true then loading=false after fetch', async () => {
      mockService.computeRatioStudy.mockResolvedValue(RATIO_STUDY_RESULT);

      const { fetchStudy } = useForgeStatisticsStore.getState();
      const promise = fetchStudy();

      // Should be loading
      expect(useForgeStatisticsStore.getState().loading).toBe(true);

      await promise;

      expect(useForgeStatisticsStore.getState().loading).toBe(false);
      expect(useForgeStatisticsStore.getState().studyResult).toEqual(RATIO_STUDY_RESULT);
    });

    it('populates outliers, strata, and qualification on fetch', async () => {
      mockService.computeRatioStudy.mockResolvedValue(RATIO_STUDY_RESULT);

      await useForgeStatisticsStore.getState().fetchStudy();

      const state = useForgeStatisticsStore.getState();
      expect(state.outliers.length).toBeGreaterThan(0);
      expect(state.strata.length).toBeGreaterThan(0);
      expect(state.qualification).not.toBeNull();
      expect(state.qualification?.qualified).toBeDefined();
    });

    it('sets error on fetch failure', async () => {
      mockService.computeRatioStudy.mockRejectedValue(new Error('Network error'));

      await useForgeStatisticsStore.getState().fetchStudy();

      const state = useForgeStatisticsStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });
  });

  // =========================================================================
  // setFilter
  // =========================================================================
  describe('setFilter', () => {
    it('updates a single filter field', () => {
      const { setFilter } = useForgeStatisticsStore.getState();
      setFilter({ taxYear: 2025 });

      expect(useForgeStatisticsStore.getState().filters.taxYear).toBe(2025);
      // Other fields unchanged
      expect(useForgeStatisticsStore.getState().filters.salesWindowMonths).toBe(12);
    });

    it('updates multiple filter fields at once', () => {
      const { setFilter } = useForgeStatisticsStore.getState();
      setFilter({ neighborhood: 'Richland', outlierMethod: 'trim' });

      const { filters } = useForgeStatisticsStore.getState();
      expect(filters.neighborhood).toBe('Richland');
      expect(filters.outlierMethod).toBe('trim');
    });
  });

  // =========================================================================
  // reviewOutlier
  // =========================================================================
  describe('reviewOutlier', () => {
    it('updates outlier reviewStatus to confirmed', async () => {
      // Pre-populate outliers
      useForgeStatisticsStore.setState({ outliers: [...OUTLIER_RECORDS] });

      const targetId = OUTLIER_RECORDS[0].parcelId;
      await useForgeStatisticsStore.getState().reviewOutlier(targetId, 'confirmed');

      const updated = useForgeStatisticsStore.getState().outliers.find(
        (o) => o.parcelId === targetId
      );
      expect(updated?.reviewStatus).toBe('confirmed');
    });

    it('updates outlier reviewStatus to dismissed', async () => {
      useForgeStatisticsStore.setState({ outliers: [...OUTLIER_RECORDS] });

      const targetId = OUTLIER_RECORDS[1].parcelId;
      await useForgeStatisticsStore.getState().reviewOutlier(targetId, 'dismissed');

      const updated = useForgeStatisticsStore.getState().outliers.find(
        (o) => o.parcelId === targetId
      );
      expect(updated?.reviewStatus).toBe('dismissed');
    });

    it('does not modify other outliers', async () => {
      useForgeStatisticsStore.setState({ outliers: [...OUTLIER_RECORDS] });

      const targetId = OUTLIER_RECORDS[0].parcelId;
      await useForgeStatisticsStore.getState().reviewOutlier(targetId, 'confirmed');

      const others = useForgeStatisticsStore.getState().outliers.filter(
        (o) => o.parcelId !== targetId
      );
      // All others should retain original status
      others.forEach((o, i) => {
        const original = OUTLIER_RECORDS.find((r) => r.parcelId === o.parcelId);
        expect(o.reviewStatus).toBe(original?.reviewStatus);
      });
    });
  });

  // =========================================================================
  // loadComparison
  // =========================================================================
  describe('loadComparison', () => {
    it('populates comparison state', async () => {
      await useForgeStatisticsStore.getState().loadComparison();

      const { comparison } = useForgeStatisticsStore.getState();
      expect(comparison).not.toBeNull();
      expect(comparison?.modelA.label).toBeTruthy();
      expect(comparison?.modelB.label).toBeTruthy();
      expect(comparison?.deltas).toBeDefined();
      expect(comparison?.improvedMetrics).toBeDefined();
      expect(comparison?.degradedMetrics).toBeDefined();
    });
  });

  // =========================================================================
  // refreshQualification
  // =========================================================================
  describe('refreshQualification', () => {
    it('recalculates qualification from current studyResult', () => {
      useForgeStatisticsStore.setState({ studyResult: RATIO_STUDY_RESULT });

      useForgeStatisticsStore.getState().refreshQualification();

      const { qualification } = useForgeStatisticsStore.getState();
      expect(qualification).not.toBeNull();
      expect(qualification?.cod).toBe(RATIO_STUDY_RESULT.cod);
      expect(qualification?.prd).toBe(RATIO_STUDY_RESULT.prd);
      expect(typeof qualification?.qualified).toBe('boolean');
      expect(typeof qualification?.passCount).toBe('number');
    });
  });
});
