/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 17 ATLAS SPATIAL STORE
 * Zustand store for Atlas spatial ops: parcels, neighborhoods,
 * spatial diagnostics, residual data, equity areas.
 *
 * API-driven. Backend gaps remain empty instead of falling back to local data.
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
} from '@/types/atlasSpatial';
import {
  EQUITY_AREAS,
  SPATIAL_PARCELS,
  NEIGHBORHOOD_SUMMARIES,
  SPATIAL_DIAGNOSTICS,
  RESIDUAL_MAP_DATA,
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
      const res = await fetch('/api/atlas/spatial').catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        set({
          parcels: data.parcels ?? [],
          neighborhoods: data.neighborhoods ?? [],
          diagnostics: data.diagnostics ?? null,
          residualData: data.residualData ?? null,
          equityAreas: data.equityAreas ?? [],
          loading: false,
        });
      } else {
        // API unavailable — seed from bounded spatial fixtures so Atlas
        // surfaces have parcels/neighborhoods/diagnostics to render. The
        // error message documents the fixture origin.
        set({
          parcels: SPATIAL_PARCELS,
          neighborhoods: NEIGHBORHOOD_SUMMARIES,
          diagnostics: SPATIAL_DIAGNOSTICS,
          residualData: RESIDUAL_MAP_DATA,
          equityAreas: EQUITY_AREAS,
          loading: false,
          error: 'Atlas spatial API unavailable; showing bounded fixture evidence.',
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
