export interface EquityArea {
  id: string;
  name: string;
  equityRatio: number;
  cod: number;
  prd: number;
  parcelCount: number;
  propertyType: string;
  center: [number, number];
}

export interface SpatialParcelRecord {
  parcelId: string;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  assessedValue: number;
  salePrice: number;
  ratio: number;
  residual: number;
  residualPct: number;
}

export interface NeighborhoodSummary {
  code: string;
  name: string;
  parcelCount: number;
  medianRatio: number;
  cod: number;
  prd: number;
  medianResidual: number;
  qualified: boolean;
  center: [number, number];
}

export interface SpatialDiagnostics {
  moransI: number;
  moransIPValue: number;
  moransIInterpretation: 'clustered' | 'dispersed' | 'random';
  hotspotCount: number;
  coldspotCount: number;
  totalParcels: number;
  spatiallyAutocorrelated: boolean;
}

export interface ResidualMapData {
  neighborhoods: Array<{
    code: string;
    name: string;
    medianResidual: number;
    medianResidualPct: number;
    parcelCount: number;
    center: [number, number];
  }>;
  globalMedianResidual: number;
  globalMedianResidualPct: number;
}
