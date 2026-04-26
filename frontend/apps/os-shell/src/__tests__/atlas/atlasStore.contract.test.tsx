/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 17 ATLAS SPATIAL STORE CONTRACT TESTS
 * Zustand store for parcels, neighborhoods, diagnostics, residual data
 *
 * These tests define the Phase 17 contract for atlasSpatialStore.
 * They codify:
 *   - Store shape: parcels, neighborhoods, diagnostics, residualData,
 *     selectedNeighborhood, loading, error
 *   - fetchSpatialData does not consume the documented dev fixture bundle
 *   - unsupported Atlas spatial surfaces stay empty with explicit unavailable messaging
 *   - selectNeighborhood sets/clears selection
 *   - getParcelsByNeighborhood returns filtered parcels
 * ======================================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    it('does not call fetch for the legacy dev fixture endpoint', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      await act(async () => {
        await getState().fetchSpatialData();
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('keeps parcels empty when no governed spatial bundle exists', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      expect(getState().parcels).toHaveLength(0);
    });

    it('keeps neighborhoods empty when no governed spatial bundle exists', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      expect(getState().neighborhoods).toHaveLength(0);
    });

    it('keeps diagnostics unavailable', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      expect(getState().diagnostics).toBeNull();
    });

    it('keeps residual map data unavailable', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      expect(getState().residualData).toBeNull();
    });

    it('keeps equity areas empty in the shared unsupported bundle', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      expect(getState().equityAreas).toHaveLength(0);
    });

    it('surfaces explicit unavailable messaging', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      expect(getState().error).toBe(
        'Atlas spatial bundle unavailable. Neighborhood delineation, residual map, and spatial diagnostics still depend on a dev fixture endpoint.',
      );
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
    it('returns an empty array for any neighborhood when no governed spatial bundle exists', async () => {
      await act(async () => {
        await getState().fetchSpatialData();
      });
      const richParcels = getState().getParcelsByNeighborhood('RICH');
      expect(richParcels).toHaveLength(0);
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
