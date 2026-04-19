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
  | 'gwr'
  | 'neighborhood-poly'
  | 'yoy-change'
  | 'market-trend';

export interface MarketTrendPoint {
  neighborhoodCode: string;
  centroidLat: number;
  centroidLng: number;
  currMedianPrice: number;
  prevMedianPrice: number;
  pctChange: number;
  saleCount: number;
}

export interface YoyChangePoint {
  neighborhoodCode: string;
  centroidLat: number;
  centroidLng: number;
  currAvgAv: number;
  prevAvgAv: number;
  pctChange: number;
  parcelCount: number;
}

export type RightDrawerPanel =
  | 'none'
  | 'neighborhood-detail'
  | 'sales-drilldown'
  | 'diagnosis'
  | 'year-trend'
  | 'workbench'
  | 'certification'
  | 'outlier-review'
  | 'stratification'
  | 'comps'
  | 'ranking'
  | 'county-health';

export interface CompSale {
  parcelId: string;
  address: string;
  neighborhoodCode: string;
  saleDate: string;
  salePrice: number;
  assessedValue: number;
  ratio: number | null;
  score: number;
  distanceMi: number;
  lat: number;
  lng: number;
}

export interface StrataRow {
  code: string;
  label: string;
  n: number;
  medianRatio: number;
  cod: number;
  prd: number;
  iaaoOk: boolean;
}

export interface StratificationResult {
  taxYear: number;
  strata: StrataRow[];
  overall: StrataRow;
}

export interface FlaggedSale {
  saleId: string;
  parcelId: string;
  address: string;
  neighborhoodCode: string;
  saleDate: string;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  hoodMedianRatio: number;
  ratioDeviation: number;
  isOutlier: boolean;
  currentDecision: string;
  propertyType: string;
}

// ─── Adjustment Workbench types ────────────────────────────────────────────

export type AdjustmentScope =
  | 'Neighborhood'
  | 'NeighborhoodQuintile'
  | 'CityRollup'
  | 'FeatureCode'
  | 'ParcelList';

export type AdjustmentKind =
  | 'PercentOfAV'
  | 'FlatDelta'
  | 'FeatureUnitRate'
  | 'TimeAdjustment'
  | 'RemoveSale'
  | 'ReassignNeighborhood'
  | 'SplitNeighborhood';

export type ProposalStatus = 'Draft' | 'UnderReview' | 'Approved' | 'Rejected' | 'Applied' | 'Reverted';
export type SetStatus = 'Draft' | 'Simulating' | 'PendingApproval' | 'Approved' | 'Applied' | 'Reverted' | 'Discarded';

export interface AdjustmentProposal {
  id: string;
  taxYear: number;
  scope: AdjustmentScope;
  kind: AdjustmentKind;
  magnitude: number;
  targetNeighborhoodCode?: string;
  targetFeatureCode?: string;
  targetCityCode?: string;
  targetQuintile?: number;
  rationale: string;
  status: ProposalStatus;
  adjustmentSetId?: string;
  simulatedParcelsAffected?: number;
  simulatedTotalDeltaAV?: number;
  proposedAt: string;
}

export interface AdjustmentSet {
  id: string;
  taxYear: number;
  name: string;
  description?: string;
  status: SetStatus;
  ownerUserId: string;
  approvedByUserId?: string;
  approvedAt?: string;
  proposals: AdjustmentProposal[];
  createdAt: string;
}

export interface RecommendResult {
  neighborhoodCode: string;
  taxYear: number;
  medianRatio: number;
  recommendedAdjustmentPct: number;
  direction: 'increase' | 'decrease' | 'none';
  sampleSize: number;
}

export interface MonthlyTrendPoint {
  yearMonth: string;
  medianRatio: number;
  cod: number | null;
  prd: number | null;
  n: number;
}

export interface StratumResult {
  stratum: string;
  n: number;
  medianRatio: number | null;
  cod: number | null;
  prd: number | null;
  prb: number | null;
  iaaoPass: boolean;
  rcwPass: boolean;
}

export interface BloomAvYear {
  taxYear: number;
  assessedValue: number;
  landValue: number;
  improvementValue: number;
}

export interface BloomSale {
  saleId: string;
  saleDate: string;
  salePrice: number;
  qualificationDecision: string;
  ratio: number | null;
}

export interface BloomParcel {
  parcelNumber: string;
  address: string;
  ownerName: string;
  propertyType: string;
  neighborhood: string;
  situsCity: string;
  yearBuilt: number | null;
  currentAv: number;
  landValue: number;
  improvValue: number;
  avHistory: BloomAvYear[];
  salesHistory: BloomSale[];
  centroidLat: number;
  centroidLng: number;
}

export interface ParcelSearchResult {
  parcelNumber: string;
  address: string;
  neighborhood: string;
  assessedValue: number;
  lat: number;
  lng: number;
}

export interface CertificationSummary {
  taxYear: number;
  generatedAt: string;
  totalQualifiedSales: number;
  strata: StratumResult[];
  countywide: StratumResult;
  certificationNote: string;
}

export type PriceBand = '0-200' | '200-400' | '400-700' | '700+' | null;

export interface GeoForgeState {
  filter: GeoForgeFilter;
  activeLayers: Set<MapLayer>;
  selectedNeighborhoodCode: string | null;
  rightDrawerPanel: RightDrawerPanel;
  bloomParcelId: string | null;
  bloomLatlng: { lat: number; lng: number } | null;
  selectedRadiusMi: 0.25 | 0.5 | 1.0 | null;
  comparableSalePoints: { lat: number; lng: number; score: number }[] | null;
  flyTarget: { lat: number; lng: number } | null;
  neighborhoodStats: NeighborhoodStat[];
  salePoints: SalePoint[];
  diagnosis: DiagnosisResult | null;
  gwrSurface: GwrSurface | null;
  simulationDeltaMap: Record<string, number> | null;
  selectedMonth: string | null;
  priceBand: PriceBand;
  loadingStats: boolean;
  loadingSales: boolean;
  loadingDiagnosis: boolean;
  loadingGwr: boolean;
  setFilter: (patch: Partial<GeoForgeFilter>) => void;
  toggleLayer: (layer: MapLayer) => void;
  selectNeighborhood: (code: string | null, panel?: RightDrawerPanel) => void;
  openDrawer: (panel: RightDrawerPanel) => void;
  closeDrawer: () => void;
  setBloomParcelId: (id: string | null) => void;
  setBloomLatlng: (latlng: { lat: number; lng: number } | null) => void;
  setSelectedRadiusMi: (radius: 0.25 | 0.5 | 1.0 | null) => void;
  setComparableSalePoints: (pts: { lat: number; lng: number; score: number }[] | null) => void;
  setFlyTarget: (target: { lat: number; lng: number } | null) => void;
  setNeighborhoodStats: (stats: NeighborhoodStat[]) => void;
  setSalePoints: (sales: SalePoint[]) => void;
  setDiagnosis: (d: DiagnosisResult | null) => void;
  setGwrSurface: (gwr: GwrSurface | null) => void;
  setSimulationDeltaMap: (m: Record<string, number> | null) => void;
  setSelectedMonth: (month: string | null) => void;
  setPriceBand: (band: PriceBand) => void;
  setLoadingStats: (v: boolean) => void;
  setLoadingSales: (v: boolean) => void;
  setLoadingDiagnosis: (v: boolean) => void;
  setLoadingGwr: (v: boolean) => void;
}
