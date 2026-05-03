/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 17 ATLAS SPATIAL STORE
 * Zustand store for Atlas spatial ops: parcels, neighborhoods,
 * spatial diagnostics, residual data, equity areas.
 *
 * Honest-state only. The legacy /api/atlas/spatial bundle is a documented
 * dev fixture endpoint and is not consumed here.
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

const ATLAS_SPATIAL_UNAVAILABLE_MESSAGE =
  'Atlas spatial bundle unavailable. Neighborhood delineation, residual map, and spatial diagnostics still depend on a dev fixture endpoint.';

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
    set({
      parcels: [],
      neighborhoods: [],
      diagnostics: null,
      residualData: null,
      equityAreas: [],
      selectedNeighborhood: null,
      loading: false,
      error: ATLAS_SPATIAL_UNAVAILABLE_MESSAGE,
    });
  },

  selectNeighborhood: (code) => {
    set({ selectedNeighborhood: code });
  },

  getParcelsByNeighborhood: (code) => {
    return get().parcels.filter((p) => p.neighborhood === code);
  },
}));
