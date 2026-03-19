/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 17 ATLAS SPATIAL STORE CONTRACT TESTS
 * Zustand store for parcels, neighborhoods, diagnostics, residual data
 *
 * These tests define the Phase 17 contract for atlasSpatialStore.
 * They codify:
 *   - Store shape: parcels, neighborhoods, diagnostics, residualData,
 *     selectedNeighborhood, loading, error
 *   - fetchSpatialData loads fixture data
 *   - selectNeighborhood sets/clears selection
 *   - getParcelsByNeighborhood returns filtered parcels
 * ======================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

import { useAtlasSpatialStore } from '../../stores/atlasSpatialStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getState() {
  return useAtlasSpatialStore.getState();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 17: atlasSpatialStore Contract', () => {
  beforeEach(() => {
    act(() => {
      useAtlasSpatialStore.setState({
        parcels: [],
        neighborhoods: [],
        diagnostics: null,
        residualData: null,
        equityAreas: [],
        selectedNeighborhood: null,
        loading: false,
        error: null,
      });
    });
  });

  // =========================================================================
  // Initial State
  // =========================================================================
  describe('Initial State', () => {
    it('starts with empty parcels array', () => {
      expect(getState().parcels).toEqual([]);
    });

    it('starts with empty neighborhoods array', () => {
      expect(getState().neighborhoods).toEqual([]);
    });

    it('starts with null diagnostics', () => {
      expect(getState().diagnostics).toBeNull();
    });

    it('starts with null residualData', () => {
      expect(getState().residualData).toBeNull();
    });

    it('starts with empty equityAreas array', () => {
      expect(getState().equityAreas).toEqual([]);
    });

    it('starts with null selectedNeighborhood', () => {
      expect(getState().selectedNeighborhood).toBeNull();
    });

    it('starts with loading false', () => {
      expect(getState().loading).toBe(false);
    });

    it('starts with null error', () => {
      expect(getState().error).toBeNull();
    });
  });

  // =========================================================================
  // fetchSpatialData
  // =========================================================================
  describe('fetchSpatialData', () => {
    it('loads 20 parcels from fixtures', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      expect(getState().parcels).toHaveLength(20);
    });

    it('loads 7 neighborhoods from fixtures', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      expect(getState().neighborhoods).toHaveLength(7);
    });

    it('loads spatial diagnostics', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      const diag = getState().diagnostics;
      expect(diag).not.toBeNull();
      expect(diag!.moransI).toBe(0.42);
      expect(diag!.moransIInterpretation).toBe('clustered');
    });

    it('loads residual map data with 7 neighborhoods', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      const rd = getState().residualData;
      expect(rd).not.toBeNull();
      expect(rd!.neighborhoods).toHaveLength(7);
    });

    it('loads 7 equity areas', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      expect(getState().equityAreas).toHaveLength(7);
    });

    it('includes Richland neighborhood', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      const rich = getState().neighborhoods.find((n) => n.code === 'RICH');
      expect(rich).toBeDefined();
      expect(rich!.name).toBe('Richland');
      expect(rich!.qualified).toBe(true);
    });

    it('sets loading false after fetch', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      expect(getState().loading).toBe(false);
    });
  });

  // =========================================================================
  // selectNeighborhood
  // =========================================================================
  describe('selectNeighborhood', () => {
    it('sets selectedNeighborhood', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      act(() => {
        getState().selectNeighborhood('RICH');
      });
      expect(getState().selectedNeighborhood).toBe('RICH');
    });

    it('can clear selection with null', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      act(() => {
        getState().selectNeighborhood('RICH');
      });
      act(() => {
        getState().selectNeighborhood(null);
      });
      expect(getState().selectedNeighborhood).toBeNull();
    });
  });

  // =========================================================================
  // getParcelsByNeighborhood
  // =========================================================================
  describe('getParcelsByNeighborhood', () => {
    it('returns parcels for Richland', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      const richParcels = getState().getParcelsByNeighborhood('RICH');
      expect(richParcels).toHaveLength(4);
      expect(richParcels.every((p) => p.neighborhood === 'RICH')).toBe(true);
    });

    it('returns parcels for Kennewick', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      const kennParcels = getState().getParcelsByNeighborhood('KENN');
      expect(kennParcels).toHaveLength(4);
    });

    it('returns empty array for unknown neighborhood', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      const unknown = getState().getParcelsByNeighborhood('XXXX');
      expect(unknown).toHaveLength(0);
    });
  });
});
