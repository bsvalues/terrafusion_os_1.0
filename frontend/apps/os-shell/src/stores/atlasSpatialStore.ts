/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 17 ATLAS SPATIAL STORE
 * Zustand store for Atlas spatial ops: parcels, neighborhoods,
 * spatial diagnostics, residual data, equity areas.
 *
 * Fixture-driven with API fallback pattern (same as forgeStatisticsStore).
 * Separate lifecycle from Forge stores.
 * ======================================================================
 */

import { create } from 'zustand';
import type {
  SpatialParcelRecord,
  NeighborhoodSummary,
  SpatialDiagnostics,
  ResidualMapData,
  EquityArea,
} from '@/data/atlasSpatialFixtures';
import {
  SPATIAL_PARCELS,
  NEIGHBORHOOD_SUMMARIES,
  SPATIAL_DIAGNOSTICS,
  RESIDUAL_MAP_DATA,
  EQUITY_AREAS,
} from '@/data/atlasSpatialFixtures';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface AtlasSpatialState {
  parcels: SpatialParcelRecord[];
  neighborhoods: NeighborhoodSummary[];
  diagnostics: SpatialDiagnostics | null;
  residualData: ResidualMapData | null;
  equityAreas: EquityArea[];
  selectedNeighborhood: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchSpatialData: () => Promise<void>;
  selectNeighborhood: (code: string | null) => void;
  getParcelsByNeighborhood: (code: string) => SpatialParcelRecord[];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAtlasSpatialStore = create<AtlasSpatialState>((set, get) => ({
  parcels: [],
  neighborhoods: [],
  diagnostics: null,
  residualData: null,
  equityAreas: [],
  selectedNeighborhood: null,
  loading: false,
  error: null,

  fetchSpatialData: async () => {
    set({ loading: true, error: null });
    try {
      // API fallback: try backend first, fall back to fixtures
      const res = await fetch('/api/atlas/spatial').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        set({
          parcels: data.parcels ?? SPATIAL_PARCELS,
          neighborhoods: data.neighborhoods ?? NEIGHBORHOOD_SUMMARIES,
          diagnostics: data.diagnostics ?? SPATIAL_DIAGNOSTICS,
          residualData: data.residualData ?? RESIDUAL_MAP_DATA,
          equityAreas: data.equityAreas ?? EQUITY_AREAS,
          loading: false,
        });
      } else {
        // Fixture fallback
        set({
          parcels: SPATIAL_PARCELS,
          neighborhoods: NEIGHBORHOOD_SUMMARIES,
          diagnostics: SPATIAL_DIAGNOSTICS,
          residualData: RESIDUAL_MAP_DATA,
          equityAreas: EQUITY_AREAS,
          loading: false,
        });
      }
    } catch (err: any) {
      set({
        parcels: SPATIAL_PARCELS,
        neighborhoods: NEIGHBORHOOD_SUMMARIES,
        diagnostics: SPATIAL_DIAGNOSTICS,
        residualData: RESIDUAL_MAP_DATA,
        equityAreas: EQUITY_AREAS,
        loading: false,
        error: err?.message ?? 'Failed to fetch spatial data',
      });
    }
  },

  selectNeighborhood: (code) => {
    set({ selectedNeighborhood: code });
  },

  getParcelsByNeighborhood: (code) => {
    return get().parcels.filter((p) => p.neighborhood === code);
  },
}));
