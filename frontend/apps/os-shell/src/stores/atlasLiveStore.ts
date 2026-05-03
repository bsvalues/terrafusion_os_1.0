import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AtlasSyncState, SelectionTool, ActiveOverlay } from '../pages/forge/atlas-live/types/atlasLive.types';

export interface AtlasLiveState {
  studyId: string | null;
  countyId: string | null;
  countyName: string | null;
  countyCode: string | null;
  segmentId: string | null;
  neighborhoodCode: string | null;
  syncState: AtlasSyncState;
  activeTool: SelectionTool;
  lassoActive: boolean;
  activeOverlays: ActiveOverlay[];
  bbox: [number, number, number, number] | null;
  zoom: number;

  setStudyId: (studyId: string | null) => void;
  setCountyScope: (scope: {
    countyId?: string | null;
    countyName?: string | null;
    countyCode?: string | null;
    segmentId?: string | null;
    neighborhoodCode?: string | null;
  }) => void;
  setSyncState: (state: AtlasSyncState) => void;
  setActiveTool: (tool: SelectionTool) => void;
  setLassoActive: (active: boolean) => void;
  addOverlay: (overlay: ActiveOverlay) => void;
  removeOverlay: (id: string) => void;
  clearOverlays: (layerIds?: string[]) => void;
  setViewport: (bbox: [number, number, number, number], zoom: number) => void;
}

export const useAtlasLiveStore = create<AtlasLiveState>()(
  devtools(
    (set) => ({
      studyId: null,
      countyId: null,
      countyName: null,
      countyCode: null,
      segmentId: null,
      neighborhoodCode: null,
      syncState: 'DISCONNECTED',
      activeTool: 'none',
      lassoActive: false,
      activeOverlays: [],
      bbox: null,
      zoom: 10,

      setStudyId: (studyId) => set({ studyId }, false, 'setStudyId'),
      setCountyScope: (scope) =>
        set(
          {
            countyId: scope.countyId ?? null,
            countyName: scope.countyName ?? null,
            countyCode: scope.countyCode ?? null,
            segmentId: scope.segmentId ?? null,
            neighborhoodCode: scope.neighborhoodCode ?? null,
          },
          false,
          'setCountyScope'
        ),
      setSyncState: (syncState) => set({ syncState }, false, 'setSyncState'),
      setActiveTool: (activeTool) => set({ activeTool }, false, 'setActiveTool'),
      setLassoActive: (lassoActive) => set({ lassoActive }, false, 'setLassoActive'),

      addOverlay: (overlay) =>
        set(
          (s) => ({
            activeOverlays: [
              ...s.activeOverlays.filter((o) => o.id !== overlay.id),
              overlay,
            ],
          }),
          false,
          'addOverlay'
        ),

      removeOverlay: (id) =>
        set(
          (s) => ({ activeOverlays: s.activeOverlays.filter((o) => o.id !== id) }),
          false,
          'removeOverlay'
        ),

      clearOverlays: (layerIds) =>
        set(
          (s) => ({
            activeOverlays: layerIds
              ? s.activeOverlays.filter((o) => !layerIds.includes(o.id))
              : [],
          }),
          false,
          'clearOverlays'
        ),

      setViewport: (bbox, zoom) => set({ bbox, zoom }, false, 'setViewport'),
    }),
    { name: 'AtlasLiveStore' }
  )
);
