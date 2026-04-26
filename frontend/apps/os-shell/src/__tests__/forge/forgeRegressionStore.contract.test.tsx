/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 16B REGRESSION STORE CONTRACT TESTS
 * Zustand store for regression models, runs, version comparison
 *
 * These tests define the Phase 16B contract for forgeRegressionStore.
 * They codify:
 *   - Store shape: models, runs, selectedModelId, comparison, loading, error
 *   - fetchModels loads fixture data
 *   - selectModel sets selectedModelId
 *   - promoteModel changes model status
 *   - compareVersions computes coefficient deltas
 *   - runRegression appends to runs
 * ======================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

const { mockRegressionApi } = vi.hoisted(() => ({
  mockRegressionApi: {
    getHistory: vi.fn(),
    runRegression: vi.fn(),
  },
}));

vi.mock('@/services/forge/regressionAPI', () => ({
  regressionAPI: {
    getHistory: mockRegressionApi.getHistory,
    runRegression: mockRegressionApi.runRegression,
  },
}));

import { useForgeRegressionStore } from '../../stores/forgeRegressionStore';
import { REGRESSION_MODELS } from '../../data/forgeRegressionFixtures';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getState() {
  return useForgeRegressionStore.getState();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 16B: forgeRegressionStore Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegressionApi.getHistory.mockResolvedValue({
      count: 2,
      results: [
        {
          id: 'run-1',
          dependentVariable: 'sale_price',
          rSquared: 0.8742,
          adjustedRSquared: 0.8611,
          fStatistic: 42.5,
          sampleSize: 315,
          createdAt: '2026-04-25T08:00:00Z',
          createdBy: 'analyst',
        },
        {
          id: 'run-2',
          dependentVariable: 'market_value',
          rSquared: 0.9103,
          adjustedRSquared: 0.9022,
          fStatistic: 51.7,
          sampleSize: 412,
          createdAt: '2026-04-25T09:15:00Z',
          createdBy: 'analyst',
        },
      ],
    });
    // Reset store between tests
    act(() => {
      useForgeRegressionStore.setState({
        models: [],
        runs: [],
        selectedModelId: null,
        comparison: null,
        loading: false,
        error: null,
      });
    });
  });

  // =========================================================================
  // Initial State
  // =========================================================================
  describe('Initial State', () => {
    it('starts with empty models array', () => {
      expect(getState().models).toEqual([]);
    });

    it('starts with empty runs array', () => {
      expect(getState().runs).toEqual([]);
    });

    it('starts with null selectedModelId', () => {
      expect(getState().selectedModelId).toBeNull();
    });

    it('starts with null comparison', () => {
      expect(getState().comparison).toBeNull();
    });

    it('starts with loading false', () => {
      expect(getState().loading).toBe(false);
    });

    it('starts with null error', () => {
      expect(getState().error).toBeNull();
    });
  });

  // =========================================================================
  // fetchModels
  // =========================================================================
  describe('fetchModels', () => {
    it('does not invent saved models when no governed registry exists', async () => {
      await act(async () => {
        await getState().fetchModels();
      });
      expect(getState().models).toHaveLength(0);
    });

    it('loads run records from regression history API', async () => {
      await act(async () => {
        await getState().fetchModels();
      });
      expect(getState().runs).toHaveLength(2);
    });

    it('surfaces explicit registry-unavailable messaging when history is present', async () => {
      await act(async () => {
        await getState().fetchModels();
      });
      expect(getState().error).toBe('Saved regression model registry unavailable; run history only.');
    });

    it('sets loading false after fetch', async () => {
      await act(async () => {
        await getState().fetchModels();
      });
      expect(getState().loading).toBe(false);
    });
  });

  // =========================================================================
  // selectModel
  // =========================================================================
  describe('selectModel', () => {
    it('sets selectedModelId', async () => {
      await act(async () => {
        await getState().fetchModels();
      });
      act(() => {
        getState().selectModel('m1-v2');
      });
      expect(getState().selectedModelId).toBe('m1-v2');
    });

    it('can clear selection with null', async () => {
      await act(async () => {
        await getState().fetchModels();
      });
      act(() => {
        getState().selectModel('m1-v2');
      });
      act(() => {
        getState().selectModel(null);
      });
      expect(getState().selectedModelId).toBeNull();
    });
  });

  // =========================================================================
  // promoteModel
  // =========================================================================
  describe('promoteModel', () => {
    it('changes model status from draft to validated', async () => {
      act(() => {
        useForgeRegressionStore.setState({ models: REGRESSION_MODELS });
      });
      act(() => {
        getState().promoteModel('m3', 'validated');
      });
      const model = getState().models.find((m) => m.id === 'm3');
      expect(model!.status).toBe('validated');
    });
  });

  // =========================================================================
  // compareVersions
  // =========================================================================
  describe('compareVersions', () => {
    it('computes comparison between two models', async () => {
      act(() => {
        useForgeRegressionStore.setState({ models: REGRESSION_MODELS });
      });
      act(() => {
        getState().compareVersions('m1-v2', 'm2');
      });
      const comparison = getState().comparison;
      expect(comparison).not.toBeNull();
      expect(comparison!.modelA.id).toBe('m1-v2');
      expect(comparison!.modelB.id).toBe('m2');
    });

    it('computes metric deltas', async () => {
      act(() => {
        useForgeRegressionStore.setState({ models: REGRESSION_MODELS });
      });
      act(() => {
        getState().compareVersions('m1-v2', 'm2');
      });
      const deltas = getState().comparison!.metricDeltas;
      expect(deltas.rSquared).toBeCloseTo(0.9103 - 0.8742, 4);
    });

    it('identifies improved and degraded metrics', async () => {
      act(() => {
        useForgeRegressionStore.setState({ models: REGRESSION_MODELS });
      });
      act(() => {
        getState().compareVersions('m1-v2', 'm2');
      });
      const comparison = getState().comparison!;
      expect(comparison.improved.length + comparison.degraded.length).toBeGreaterThan(0);
    });
  });
});
