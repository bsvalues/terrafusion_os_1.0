export interface GeoForgeFilter {
  taxYear: number;
  neighborhoodCode?: string;
  propertyClass?: string;
  saleDateStart?: string;
  saleDateEnd?: string;
  scope: 'county' | 'neighborhood';
}

export interface BentonMethodStats {
  count: number;
  medianRatio: number;
  cod: number;
  prd: number;
  prb: number;
  vei: number;
  mean: number;
  weightedMean: number;
  min: number;
  max: number;
  stdDev: number;
  cv: number;
  q1Ratio: number;
  q2Ratio: number;
  q3Ratio: number;
  q4Ratio: number;
  q5Ratio: number;
}

export interface NeighborhoodStat {
  neighborhoodCode: string;
  neighborhoodName: string;
  stats: BentonMethodStats;
  saleCount: number;
  centroidLat: number;
  centroidLng: number;
  bounds?: [[number, number], [number, number]];
}

export interface SalePoint {
  saleId: string;
  parcelId: string;
  lat: number;
  lng: number;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  saleDate: string;
  neighborhoodCode: string;
  propertyClass: string;
  isOutlier: boolean;
  qualificationDecision: string;
}

export interface DiagnosisCategory {
  category: 'data_quality' | 'stratification' | 'outliers' | 'external';
  severity: 'ok' | 'watch' | 'critical';
  headline: string;
  detail: string;
  affectedCount: number;
  moransI?: number;
}

export interface PeerComparator {
  neighborhoodCode: string;
  neighborhoodName: string;
  medianRatio: number;
  cod: number;
  saleCount: number;
  delta: number;
}

export interface DiagnosisResult {
  neighborhoodCode: string;
  taxYear: number;
  categories: DiagnosisCategory[];
  peers: PeerComparator[];
  dataQualityFlags: string[];
  generatedAt: string;
}

export interface GwrCell {
  lat: number;
  lng: number;
  localMedianRatio: number;
  localCod: number;
  localPrd: number;
}

export interface GwrSurface {
  taxYear: number;
  cells: GwrCell[];
  cachedAt: string;
}

export type MapLayer =
  | 'satellite'
  | 'choropleth'
  | 'sale-scatter'
  | 'parcel-polygons'
  | 'context'
  | 'ai-cluster'
  | 'kde'
  | 'gwr';

export type RightDrawerPanel =
  | 'none'
  | 'neighborhood-detail'
  | 'sales-drilldown'
  | 'diagnosis'
  | 'year-trend';

export interface GeoForgeState {
  filter: GeoForgeFilter;
  activeLayers: Set<MapLayer>;
  selectedNeighborhoodCode: string | null;
  rightDrawerPanel: RightDrawerPanel;
  bloomParcelId: string | null;
  neighborhoodStats: NeighborhoodStat[];
  salePoints: SalePoint[];
  diagnosis: DiagnosisResult | null;
  gwrSurface: GwrSurface | null;
  loadingStats: boolean;
  loadingSales: boolean;
  loadingDiagnosis: boolean;
  loadingGwr: boolean;
  setFilter: (patch: Partial<GeoForgeFilter>) => void;
  toggleLayer: (layer: MapLayer) => void;
  selectNeighborhood: (code: string | null, panel?: RightDrawerPanel) => void;
  openDrawer: (panel: RightDrawerPanel) => void;
  closeDrawer: () => void;
  setNeighborhoodStats: (stats: NeighborhoodStat[]) => void;
  setSalePoints: (sales: SalePoint[]) => void;
  setDiagnosis: (d: DiagnosisResult | null) => void;
  setGwrSurface: (gwr: GwrSurface | null) => void;
  setLoadingStats: (v: boolean) => void;
  setLoadingSales: (v: boolean) => void;
  setLoadingDiagnosis: (v: boolean) => void;
  setLoadingGwr: (v: boolean) => void;
}
