// frontend/apps/os-shell/src/pages/forge/geo/v2/mapContext.ts
import { create } from 'zustand';

export type MapRenderMode =
  | 'default'        // Ratio heat: parcels colored by ratioDeviation
  | 'county-grade'   // Neighborhood choropleth A→F, parcels hidden
  | 'outliers'       // Outlier parcels amber/highlighted, non-outliers dimmed
  | 'vintage-split'  // Parcels two-color by pre/post vintageCut
  | 'sim-delta';     // Parcels colored by simulation adjustment direction

export interface MapContextPayload {
  mode: MapRenderMode;
  label: string;         // Displayed in map corner, e.g. "Outliers · NBH-042"
  vintageCut?: number;   // Year cutpoint for 'vintage-split' mode
}

interface MapContextState {
  payload: MapContextPayload;
  set: (p: MapContextPayload) => void;
  reset: () => void;
}

const EMPTY: MapContextPayload = { mode: 'default', label: '' };

export const useMapCtx = create<MapContextState>()((setState) => ({
  payload: EMPTY,
  set: (payload) => setState({ payload }),
  reset: () => setState({ payload: EMPTY }),
}));
