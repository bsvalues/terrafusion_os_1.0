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
  | 'year-trend'
  | 'workbench';

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
  /** neighborhoodCode → % adjustment magnitude — drives amber simulation overlay on map */
  simulationDeltaMap: Record<string, number> | null;
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
  setSimulationDeltaMap: (m: Record<string, number> | null) => void;
  setLoadingStats: (v: boolean) => void;
  setLoadingSales: (v: boolean) => void;
  setLoadingDiagnosis: (v: boolean) => void;
  setLoadingGwr: (v: boolean) => void;
}
