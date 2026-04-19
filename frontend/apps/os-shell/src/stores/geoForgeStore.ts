import { create } from 'zustand';
import type {
  GeoForgeState,
  GeoForgeFilter,
  MapLayer,
  RightDrawerPanel,
  NeighborhoodStat,
  SalePoint,
  DiagnosisResult,
  GwrSurface,
} from '../pages/forge/geo/types/geoforge.types';

const DEFAULT_FILTER: GeoForgeFilter = {
  taxYear: new Date().getFullYear(),
  scope: 'county',
};

const DEFAULT_LAYERS: Set<MapLayer> = new Set<MapLayer>(['satellite', 'choropleth', 'sale-scatter']);

export const useGeoForgeStore = create<GeoForgeState>((set) => ({
  filter: DEFAULT_FILTER,
  activeLayers: DEFAULT_LAYERS,
  selectedNeighborhoodCode: null,
  rightDrawerPanel: 'none',
  bloomParcelId: null,
  bloomLatlng: null,
  selectedRadiusMi: null,
  comparableSalePoints: null,
  flyTarget: null,
  neighborhoodStats: [],
  salePoints: [],
  diagnosis: null,
  gwrSurface: null,
  simulationDeltaMap: null,
  selectedMonth: null,
  loadingStats: false,
  loadingSales: false,
  loadingDiagnosis: false,
  loadingGwr: false,

  setBloomParcelId: (bloomParcelId) => set({ bloomParcelId }),
  setBloomLatlng: (bloomLatlng) => set({ bloomLatlng }),
  setSelectedRadiusMi: (selectedRadiusMi) => set({ selectedRadiusMi }),
  setComparableSalePoints: (comparableSalePoints) => set({ comparableSalePoints }),
  setFlyTarget: (flyTarget) => set({ flyTarget }),
  setFilter: (patch) => set((s) => ({ filter: { ...s.filter, ...patch } })),

  toggleLayer: (layer) =>
    set((s) => {
      const next = new Set(s.activeLayers);
      next.has(layer) ? next.delete(layer) : next.add(layer);
      return { activeLayers: next };
    }),

  selectNeighborhood: (code, panel = 'neighborhood-detail') =>
    set({ selectedNeighborhoodCode: code, rightDrawerPanel: code ? panel : 'none' }),

  openDrawer: (panel) => set({ rightDrawerPanel: panel }),
  closeDrawer: () => set({ rightDrawerPanel: 'none', selectedNeighborhoodCode: null }),

  setNeighborhoodStats: (neighborhoodStats) => set({ neighborhoodStats }),
  setSalePoints: (salePoints) => set({ salePoints }),
  setDiagnosis: (diagnosis) => set({ diagnosis }),
  setGwrSurface: (gwrSurface) => set({ gwrSurface }),
  setSimulationDeltaMap: (simulationDeltaMap) => set({ simulationDeltaMap }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setLoadingStats: (loadingStats) => set({ loadingStats }),
  setLoadingSales: (loadingSales) => set({ loadingSales }),
  setLoadingDiagnosis: (loadingDiagnosis) => set({ loadingDiagnosis }),
  setLoadingGwr: (loadingGwr) => set({ loadingGwr }),
}));
