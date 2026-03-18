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

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

import { useForgeRegressionStore } from '../../stores/forgeRegressionStore';

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
    // Reset store between tests
    const { fetchModels } = getState();
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
    it('loads 3 models from fixtures', async () => {
      await act(async () => {
        await getState().fetchModels();
      });
      expect(getState().models).toHaveLength(3);
    });

    it('loads 5 run records from fixtures', async () => {
      await act(async () => {
        await getState().fetchModels();
      });
      expect(getState().runs).toHaveLength(5);
    });

    it('includes SFR Base Model', async () => {
      await act(async () => {
        await getState().fetchModels();
      });
      const sfr = getState().models.find((m) => m.name === 'SFR Base Model');
      expect(sfr).toBeDefined();
      expect(sfr!.modelType).toBe('OLS');
      expect(sfr!.status).toBe('production');
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
      await act(async () => {
        await getState().fetchModels();
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
      await act(async () => {
        await getState().fetchModels();
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
      await act(async () => {
        await getState().fetchModels();
      });
      act(() => {
        getState().compareVersions('m1-v2', 'm2');
      });
      const deltas = getState().comparison!.metricDeltas;
      expect(deltas.rSquared).toBeCloseTo(0.9103 - 0.8742, 4);
    });

    it('identifies improved and degraded metrics', async () => {
      await act(async () => {
        await getState().fetchModels();
      });
      act(() => {
        getState().compareVersions('m1-v2', 'm2');
      });
      const comparison = getState().comparison!;
      expect(comparison.improved.length + comparison.degraded.length).toBeGreaterThan(0);
    });
  });
});
