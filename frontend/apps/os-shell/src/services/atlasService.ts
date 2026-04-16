/**
 * TerraAtlas API Service — GIS & Geospatial Data
 * =================================================================
 * Write-lane owner: Atlas owns parcel geometry, zoning overlays,
 * aerial layers, flood/slope data.
 *
 * @see config/suiteRegistry.ts — Constitutional Suite: atlas
 */

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const ATLAS_API = `${API_BASE_URL}/api/atlas`;
const BENTON_MASS_APPRAISAL_LAYER =
  'https://services7.arcgis.com/NURlY7V8UHl6XumF/arcgis/rest/services/AssessorPropVal/FeatureServer/0';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MapLayer {
  id: string;
  name: string;
  category: 'base' | 'overlay' | 'analysis';
  enabled: boolean;
  opacity: number;
  source: string;
  features?: number;
  type?: 'vector' | 'raster' | 'geojson';
  url?: string;
}

export interface ParcelResult {
  parcelId: string;
  address: string;
  owner: string;
  acreage: number;
  zoning: string;
  landUse: string;
  assessedValue: number;
  latitude?: number;
  longitude?: number;
  geometry?: GeoJSON.Geometry;
}

export interface ParcelSearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  filters?: {
    zoning?: string;
    landUse?: string;
    minValue?: number;
    maxValue?: number;
    minAcreage?: number;
    maxAcreage?: number;
  };
}

export interface ParcelSearchResponse {
  results: ParcelResult[];
  total: number;
  hasMore: boolean;
}

export interface MassAppraisalSearchRequest {
  query?: string;
  propertyType?: string;
  limit?: number;
}

export interface MassAppraisalFeatureProperties {
  Parcel_ID?: string;
  situs_display?: string;
  Property_Type?: string;
  neighborhood?: string;
  zoning?: string | null;
  Current_Ratio?: number | null;
  MV_PPSF?: number | null;
  ASSESSED_VAL?: number | null;
  TotalMarketValue?: number | null;
  Shape__Area?: number | null;
}

export type MassAppraisalGeometry = GeoJSON.Polygon | GeoJSON.MultiPolygon;

export interface MassAppraisalFeature
  extends GeoJSON.Feature<MassAppraisalGeometry, MassAppraisalFeatureProperties> {}

export interface MassAppraisalFeatureCollection extends GeoJSON.FeatureCollection<MassAppraisalGeometry, MassAppraisalFeatureProperties> {
  properties?: {
    exceededTransferLimit?: boolean;
  };
}

export interface ZoningDistrict {
  id: string;
  code: string;
  name: string;
  description: string;
  jurisdiction: string;
  color: string;
  parcelCount: number;
}

export interface FloodZone {
  id: string;
  zone: string;
  name: string;
  riskLevel: 'high' | 'moderate' | 'low' | 'minimal';
  source: string;
}

export interface SpatialStats {
  totalParcels: number;
  totalAcreage: number;
  zoningDistrictCount: number;
  floodZoneCount: number;
  lastDataUpdate: string;
  averageAssessedValue?: number;
  averageMarketValue?: number;
  totalAssessedValue?: number;
  totalMarketValue?: number;
  typeBreakdown?: Array<{
    type: string;
    count: number;
  }>;
  layers?: string[];
}

// ============================================================================
// HELPERS
// ============================================================================

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function atlasGet<T>(path: string): Promise<T> {
  const response = await fetch(`${ATLAS_API}${path}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Atlas API error: ${response.statusText}`);
  return response.json();
}

async function atlasPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${ATLAS_API}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Atlas API error: ${response.statusText}`);
  return response.json();
}

async function fetchArcGisQuery<T>(params: URLSearchParams): Promise<T> {
  const response = await fetch(`${BENTON_MASS_APPRAISAL_LAYER}/query?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`ArcGIS query failed: ${response.statusText}`);
  }
  return response.json();
}

async function getArcGisMassAppraisalStats(): Promise<SpatialStats> {
  const countParams = new URLSearchParams({
    where: '1=1',
    returnGeometry: 'false',
    returnCountOnly: 'true',
    f: 'json',
  });

  const valuationParams = new URLSearchParams({
    where: '1=1',
    returnGeometry: 'false',
    outStatistics: JSON.stringify([
      {
        statisticType: 'sum',
        onStatisticField: 'TotalMarketValue',
        outStatisticFieldName: 'totalMarketValue',
      },
      {
        statisticType: 'avg',
        onStatisticField: 'TotalMarketValue',
        outStatisticFieldName: 'averageMarketValue',
      },
    ]),
    f: 'json',
  });

  const typeBreakdownParams = new URLSearchParams({
    where: '1=1',
    groupByFieldsForStatistics: 'Property_Type',
    outStatistics: JSON.stringify([
      {
        statisticType: 'count',
        onStatisticField: 'OBJECTID',
        outStatisticFieldName: 'parcelCount',
      },
    ]),
    returnGeometry: 'false',
    f: 'json',
  });

  const [countResponse, valuationResponse, typeResponse] = await Promise.all([
    fetchArcGisQuery<{ count?: number }>(countParams),
    fetchArcGisQuery<{ features?: Array<{ attributes?: { totalMarketValue?: number; averageMarketValue?: number } }> }>(valuationParams),
    fetchArcGisQuery<{ features?: Array<{ attributes?: { Property_Type?: string; parcelCount?: number } }> }>(typeBreakdownParams),
  ]);

  const valuationAttributes = valuationResponse.features?.[0]?.attributes;

  return {
    totalParcels: countResponse.count ?? 0,
    totalAcreage: 0,
    zoningDistrictCount: 0,
    floodZoneCount: 0,
    lastDataUpdate: new Date().toISOString(),
    averageAssessedValue: valuationAttributes?.averageMarketValue ?? 0,
    averageMarketValue: valuationAttributes?.averageMarketValue ?? 0,
    totalAssessedValue: valuationAttributes?.totalMarketValue ?? 0,
    totalMarketValue: valuationAttributes?.totalMarketValue ?? 0,
    typeBreakdown:
      typeResponse.features
        ?.map((feature) => ({
          type: feature.attributes?.Property_Type ?? 'Unknown',
          count: feature.attributes?.parcelCount ?? 0,
        }))
        .filter((entry) => entry.count > 0) ?? [],
    layers: ['benton-arcgis-mass-appraisal-fy2025'],
  };
}

async function searchMassAppraisalParcelsFromArcGis(
  request: MassAppraisalSearchRequest,
): Promise<MassAppraisalFeatureCollection> {
  const clauses: string[] = [];

  if (request.query?.trim()) {
    const escaped = request.query.trim().replace(/'/g, "''");
    clauses.push(`(Parcel_ID LIKE '%${escaped}%' OR situs_display LIKE '%${escaped}%')`);
  }

  if (request.propertyType?.trim()) {
    const escaped = request.propertyType.trim().replace(/'/g, "''");
    clauses.push(`Property_Type = '${escaped}'`);
  }

  const params = new URLSearchParams({
    where: clauses.length > 0 ? clauses.join(' AND ') : '1=1',
    outFields:
      'Parcel_ID,situs_display,Property_Type,neighborhood,zoning,Current_Ratio,MV_PPSF,TotalMarketValue,Shape__Area',
    returnGeometry: 'true',
    f: 'geojson',
    outSR: '4326',
    resultRecordCount: String(Math.min(Math.max(request.limit ?? 25, 5), 50)),
  });

  return fetchArcGisQuery<MassAppraisalFeatureCollection>(params);
}

// ============================================================================
// NOTE: DEFAULT fallback data removed in CC-13 (R1 Week 3).
// All service methods now propagate errors from the real backend.
// ============================================================================

// ============================================================================
// ATLAS SERVICE
// ============================================================================

export const atlasService = {
  /**
   * Get map layers configuration
   */
  getLayers: async (): Promise<MapLayer[]> => {
    return atlasGet<MapLayer[]>('/layers');
  },

  /**
   * Search parcels by address, ID, or owner
   */
  searchParcels: async (request: ParcelSearchRequest): Promise<ParcelSearchResponse> => {
    return atlasPost<ParcelSearchResponse>('/parcels/search', request);
  },

  /**
   * Fetch a live Benton County mass-appraisal parcel slice with ArcGIS geometry.
   */
  searchMassAppraisalParcels: async (
    request: MassAppraisalSearchRequest,
  ): Promise<MassAppraisalFeatureCollection> => {
    try {
      return await atlasPost<MassAppraisalFeatureCollection>('/mass-appraisal/parcels', request);
    } catch {
      return searchMassAppraisalParcelsFromArcGis(request);
    }
  },

  /**
   * Get parcel detail by ID
   */
  getParcel: async (parcelId: string): Promise<ParcelResult | null> => {
    try {
      return await atlasGet<ParcelResult>(`/parcels/${encodeURIComponent(parcelId)}`);
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) return null;
      throw err;
    }
  },

  /**
   * Get zoning districts
   */
  getZoningDistricts: async (): Promise<ZoningDistrict[]> => {
    return atlasGet<ZoningDistrict[]>('/zoning');
  },

  /**
   * Get flood zones
   */
  getFloodZones: async (): Promise<FloodZone[]> => {
    return atlasGet<FloodZone[]>('/flood-zones');
  },

  /**
   * Get spatial statistics for the county
   */
  getStats: async (): Promise<SpatialStats> => {
    return atlasGet<SpatialStats>('/stats');
  },

  /**
   * Get county posture for Mass Appraisal GIS, preferring the backend Atlas API
   * and falling back to the live Benton ArcGIS layer when stats are unavailable.
   */
  getMassAppraisalStats: async (): Promise<SpatialStats> => {
    try {
      return await atlasGet<SpatialStats>('/stats');
    } catch {
      return getArcGisMassAppraisalStats();
    }
  },
};

export default atlasService;
