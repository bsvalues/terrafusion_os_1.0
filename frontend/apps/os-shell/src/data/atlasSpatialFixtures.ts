/**
 * ======================================================================
 * TERRAFUSION OS — PHASE 17 ATLAS SPATIAL FIXTURES
 * Types + fixture data for Atlas spatial ops surfaces:
 *   Residual Map, Neighborhood Delineation, Spatial Diagnostics
 *
 * Mirrors backend types from:
 *   - SpatialAutocorrelation.cs (MoransIResult)
 *   - SpatialFilter.cs (SpatialParcel)
 *   - OlsSolver.cs (residuals = y[i] - yHat[i])
 *   - ArcGisServiceCatalog.cs (Benton County neighborhoods)
 * ======================================================================
 */

// ---------------------------------------------------------------------------
// Re-export EquityArea (extracted from GeoEquityDashboard inline data)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Spatial Parcel Record — lightweight parcel for map rendering
// ---------------------------------------------------------------------------

export interface SpatialParcelRecord {
  parcelId: string;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  assessedValue: number;
  salePrice: number;
  ratio: number;
  residual: number;        // actual - predicted (OlsSolver convention)
  residualPct: number;     // residual / predicted * 100
}

// ---------------------------------------------------------------------------
// Neighborhood Summary
// ---------------------------------------------------------------------------

export interface NeighborhoodSummary {
  code: string;
  name: string;
  parcelCount: number;
  medianRatio: number;
  cod: number;
  prd: number;
  medianResidual: number;
  qualified: boolean;       // IAAO: COD ≤15, PRD 0.98–1.03, Median Ratio 0.90–1.10
  center: [number, number];
}

// ---------------------------------------------------------------------------
// Spatial Diagnostics — mirrors SpatialAutocorrelation.cs MoransIResult
// ---------------------------------------------------------------------------

export interface SpatialDiagnostics {
  moransI: number;
  moransIPValue: number;
  moransIInterpretation: 'clustered' | 'dispersed' | 'random';
  hotspotCount: number;
  coldspotCount: number;
  totalParcels: number;
  spatiallyAutocorrelated: boolean;
}

// ---------------------------------------------------------------------------
// Residual Map Data — aggregated by neighborhood for choropleth
// ---------------------------------------------------------------------------

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

// =========================================================================
// FIXTURE DATA
// =========================================================================

// ---------------------------------------------------------------------------
// Equity Areas — extracted from GeoEquityDashboard inline data
// ---------------------------------------------------------------------------

export const EQUITY_AREAS: EquityArea[] = [
  { id: 'ea1', name: 'Downtown', equityRatio: 0.96, cod: 12.5, prd: 1.02, parcelCount: 1245, propertyType: 'Commercial', center: [46.23, -119.2] },
  { id: 'ea2', name: 'Riverside', equityRatio: 0.98, cod: 8.2, prd: 1.01, parcelCount: 3420, propertyType: 'Residential', center: [46.24, -119.21] },
  { id: 'ea3', name: 'West Hills', equityRatio: 1.03, cod: 10.1, prd: 1.03, parcelCount: 2180, propertyType: 'Residential', center: [46.25, -119.23] },
  { id: 'ea4', name: 'Eastgate', equityRatio: 0.89, cod: 18.4, prd: 1.08, parcelCount: 890, propertyType: 'Industrial', center: [46.22, -119.18] },
  { id: 'ea5', name: 'Southridge', equityRatio: 1.01, cod: 7.5, prd: 1.0, parcelCount: 4100, propertyType: 'Residential', center: [46.21, -119.22] },
  { id: 'ea6', name: 'Northview', equityRatio: 0.93, cod: 14.2, prd: 1.05, parcelCount: 1560, propertyType: 'Residential', center: [46.26, -119.19] },
  { id: 'ea7', name: 'Farm District', equityRatio: 0.87, cod: 22.0, prd: 1.12, parcelCount: 420, propertyType: 'Agricultural', center: [46.215, -119.25] },
];

// ---------------------------------------------------------------------------
// Spatial Parcels — 20 parcels across 5 Benton County neighborhoods
// ---------------------------------------------------------------------------

export const SPATIAL_PARCELS: SpatialParcelRecord[] = [
  // Richland (4 parcels)
  { parcelId: 'P-10001', address: '1200 Jadwin Ave', neighborhood: 'RICH', lat: 46.2856, lng: -119.2844, assessedValue: 285000, salePrice: 295000, ratio: 0.966, residual: -12400, residualPct: -4.2 },
  { parcelId: 'P-10002', address: '430 Williams Blvd', neighborhood: 'RICH', lat: 46.2790, lng: -119.2760, assessedValue: 320000, salePrice: 310000, ratio: 1.032, residual: 8200, residualPct: 2.6 },
  { parcelId: 'P-10003', address: '805 Stevens Dr', neighborhood: 'RICH', lat: 46.2710, lng: -119.2690, assessedValue: 245000, salePrice: 258000, ratio: 0.950, residual: -18300, residualPct: -7.1 },
  { parcelId: 'P-10004', address: '1550 George Washington Way', neighborhood: 'RICH', lat: 46.2920, lng: -119.2810, assessedValue: 390000, salePrice: 385000, ratio: 1.013, residual: 4100, residualPct: 1.1 },
  // Kennewick (4 parcels)
  { parcelId: 'P-20001', address: '100 N Columbia Center Blvd', neighborhood: 'KENN', lat: 46.2112, lng: -119.2370, assessedValue: 198000, salePrice: 215000, ratio: 0.921, residual: -22500, residualPct: -10.5 },
  { parcelId: 'P-20002', address: '2600 W Clearwater Ave', neighborhood: 'KENN', lat: 46.2200, lng: -119.2580, assessedValue: 275000, salePrice: 268000, ratio: 1.026, residual: 5800, residualPct: 2.2 },
  { parcelId: 'P-20003', address: '810 S Dayton St', neighborhood: 'KENN', lat: 46.2070, lng: -119.2420, assessedValue: 165000, salePrice: 178000, ratio: 0.927, residual: -16200, residualPct: -9.1 },
  { parcelId: 'P-20004', address: '4501 W Canal Dr', neighborhood: 'KENN', lat: 46.2280, lng: -119.2700, assessedValue: 310000, salePrice: 305000, ratio: 1.016, residual: 3200, residualPct: 1.0 },
  // Pasco (4 parcels)
  { parcelId: 'P-30001', address: '525 N 20th Ave', neighborhood: 'PASC', lat: 46.2400, lng: -119.1000, assessedValue: 185000, salePrice: 192000, ratio: 0.964, residual: -9800, residualPct: -5.1 },
  { parcelId: 'P-30002', address: '1320 W Clark St', neighborhood: 'PASC', lat: 46.2350, lng: -119.1150, assessedValue: 210000, salePrice: 205000, ratio: 1.024, residual: 3600, residualPct: 1.8 },
  { parcelId: 'P-30003', address: '4200 Road 68', neighborhood: 'PASC', lat: 46.2520, lng: -119.1300, assessedValue: 335000, salePrice: 342000, ratio: 0.980, residual: -8400, residualPct: -2.5 },
  { parcelId: 'P-30004', address: '915 N Oregon Ave', neighborhood: 'PASC', lat: 46.2450, lng: -119.0950, assessedValue: 155000, salePrice: 162000, ratio: 0.957, residual: -10200, residualPct: -6.3 },
  // Prosser (4 parcels)
  { parcelId: 'P-40001', address: '1100 Wine Country Rd', neighborhood: 'PROS', lat: 46.2060, lng: -119.7650, assessedValue: 425000, salePrice: 398000, ratio: 1.068, residual: 24500, residualPct: 6.2 },
  { parcelId: 'P-40002', address: '820 6th St', neighborhood: 'PROS', lat: 46.2010, lng: -119.7700, assessedValue: 178000, salePrice: 185000, ratio: 0.962, residual: -9200, residualPct: -5.0 },
  { parcelId: 'P-40003', address: '305 Meade Ave', neighborhood: 'PROS', lat: 46.2080, lng: -119.7600, assessedValue: 225000, salePrice: 210000, ratio: 1.071, residual: 13800, residualPct: 6.6 },
  { parcelId: 'P-40004', address: '1500 Bennett Ave', neighborhood: 'PROS', lat: 46.1980, lng: -119.7550, assessedValue: 195000, salePrice: 202000, ratio: 0.965, residual: -8800, residualPct: -4.4 },
  // West Richland (4 parcels)
  { parcelId: 'P-50001', address: '3200 Bombing Range Rd', neighborhood: 'WRIC', lat: 46.3040, lng: -119.3610, assessedValue: 365000, salePrice: 358000, ratio: 1.020, residual: 5400, residualPct: 1.5 },
  { parcelId: 'P-50002', address: '4800 Fallon Dr', neighborhood: 'WRIC', lat: 46.3100, lng: -119.3700, assessedValue: 410000, salePrice: 405000, ratio: 1.012, residual: 3200, residualPct: 0.8 },
  { parcelId: 'P-50003', address: '2100 Keene Rd', neighborhood: 'WRIC', lat: 46.2960, lng: -119.3530, assessedValue: 298000, salePrice: 315000, ratio: 0.946, residual: -19800, residualPct: -6.3 },
  { parcelId: 'P-50004', address: '5500 W Van Giesen St', neighborhood: 'WRIC', lat: 46.2900, lng: -119.3450, assessedValue: 275000, salePrice: 270000, ratio: 1.019, residual: 3600, residualPct: 1.3 },
];

// ---------------------------------------------------------------------------
// Neighborhood Summaries — 7 Benton County neighborhoods
// IAAO qualified: COD ≤15, PRD 0.98–1.03, Median Ratio 0.90–1.10
// ---------------------------------------------------------------------------

export const NEIGHBORHOOD_SUMMARIES: NeighborhoodSummary[] = [
  { code: 'RICH', name: 'Richland', parcelCount: 12840, medianRatio: 0.985, cod: 9.8, prd: 1.01, medianResidual: -4500, qualified: true, center: [46.2856, -119.2844] },
  { code: 'KENN', name: 'Kennewick', parcelCount: 18920, medianRatio: 0.972, cod: 12.4, prd: 1.02, medianResidual: -7300, qualified: true, center: [46.2112, -119.2370] },
  { code: 'PASC', name: 'Pasco', parcelCount: 14650, medianRatio: 0.981, cod: 11.2, prd: 1.01, medianResidual: -6200, qualified: true, center: [46.2400, -119.1000] },
  { code: 'PROS', name: 'Prosser', parcelCount: 4280, medianRatio: 1.016, cod: 14.8, prd: 1.04, medianResidual: 5100, qualified: false, center: [46.2060, -119.7650] },
  { code: 'WRIC', name: 'West Richland', parcelCount: 8340, medianRatio: 0.999, cod: 8.6, prd: 1.00, medianResidual: -1800, qualified: true, center: [46.3040, -119.3610] },
  { code: 'BNCT', name: 'Benton City', parcelCount: 2180, medianRatio: 0.942, cod: 16.3, prd: 1.06, medianResidual: -14200, qualified: false, center: [46.2630, -119.4870] },
  { code: 'FINL', name: 'Finley', parcelCount: 3410, medianRatio: 1.008, cod: 10.5, prd: 1.02, medianResidual: 2100, qualified: true, center: [46.1540, -119.0350] },
];

// ---------------------------------------------------------------------------
// Spatial Diagnostics — Moran's I / Getis-Ord summary
// ---------------------------------------------------------------------------

export const SPATIAL_DIAGNOSTICS: SpatialDiagnostics = {
  moransI: 0.42,
  moransIPValue: 0.001,
  moransIInterpretation: 'clustered',
  hotspotCount: 3,
  coldspotCount: 2,
  totalParcels: 64620,
  spatiallyAutocorrelated: true,
};

// ---------------------------------------------------------------------------
// Residual Map Data — per-neighborhood residual aggregation
// ---------------------------------------------------------------------------

export const RESIDUAL_MAP_DATA: ResidualMapData = {
  neighborhoods: [
    { code: 'RICH', name: 'Richland', medianResidual: -4500, medianResidualPct: -1.5, parcelCount: 12840, center: [46.2856, -119.2844] },
    { code: 'KENN', name: 'Kennewick', medianResidual: -7300, medianResidualPct: -3.4, parcelCount: 18920, center: [46.2112, -119.2370] },
    { code: 'PASC', name: 'Pasco', medianResidual: -6200, medianResidualPct: -2.8, parcelCount: 14650, center: [46.2400, -119.1000] },
    { code: 'PROS', name: 'Prosser', medianResidual: 5100, medianResidualPct: 2.6, parcelCount: 4280, center: [46.2060, -119.7650] },
    { code: 'WRIC', name: 'West Richland', medianResidual: -1800, medianResidualPct: -0.5, parcelCount: 8340, center: [46.3040, -119.3610] },
    { code: 'BNCT', name: 'Benton City', medianResidual: -14200, medianResidualPct: -8.2, parcelCount: 2180, center: [46.2630, -119.4870] },
    { code: 'FINL', name: 'Finley', medianResidual: 2100, medianResidualPct: 1.1, parcelCount: 3410, center: [46.1540, -119.0350] },
  ],
  globalMedianResidual: -3800,
  globalMedianResidualPct: -1.7,
};
