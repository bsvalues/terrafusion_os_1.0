/**
 * Control Center store — manages open/close state and toggle selections.
 *
 * @module stores/controlCenterStore
 */

import { create } from 'zustand';

export interface ControlCenterState {
  /** Whether the Control Center drawer is open */
  isOpen: boolean;
  /** Currently selected map layers */
  mapLayers: Record<string, boolean>;
  /** Active model version identifier */
  modelVersion: string;

  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleMapLayer: (layerId: string) => void;
  setModelVersion: (version: string) => void;
}

/** Default map layer visibility */
const DEFAULT_MAP_LAYERS: Record<string, boolean> = {
  parcels: true,
  zoning: false,
  flood: false,
  aerial: true,
  contours: false,
};

export const useControlCenterStore = create<ControlCenterState>((set) => ({
  isOpen: false,
  mapLayers: { ...DEFAULT_MAP_LAYERS },
  modelVersion: 'v2026.1',

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  toggleMapLayer: (layerId: string) =>
    set((s) => ({
      mapLayers: {
        ...s.mapLayers,
        [layerId]: !s.mapLayers[layerId],
      },
    })),

  setModelVersion: (version: string) => set({ modelVersion: version }),
}));
