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
}

// R2.10: GIS geometry types

export interface ParcelCentroid {
  parcelId: string;
  lat: number;
  lng: number;
}

export interface NearbyParcel {
  parcelId: string;
  address: string;
  propertyType: string;
  assessedValue: number;
  yearBuilt: number | null;
  distanceMiles?: number;
}

export interface NearbyParcelsResponse {
  subjectParcelId: string;
  propertyTypeFilter: string | null;
  total: number;
  gisProximity: boolean;
  radiusMiles?: number;
  parcels: NearbyParcel[];
}

export interface UpsertGeometryRequest {
  geoJson?: string;
  centroidLat?: number;
  centroidLng?: number;
  areaSqft?: number;
  areaAcres?: number;
  zoningCode?: string;
  zoningDescription?: string;
  srid?: number;
  source?: string;
  sourceDate?: string;
}

export interface UpsertGeometryResponse {
  parcelId: string;
  status: 'created' | 'updated';
  geometryAvailable: boolean;
}

export interface GeometryStats {
  countyId: string;
  totalParcels: number;
  withGeometry: number;
  withCentroid: number;
  withZoning: number;
  coveragePercent: number;
  centroidCoveragePercent: number;
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

async function atlasPut<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${ATLAS_API}${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Atlas API error: ${response.statusText}`);
  return response.json();
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

  // R2 Wave 2 endpoints

  /**
   * Get nearby parcels by parcel ID.
   * R2.10: Uses Haversine spatial proximity when centroids available;
   * falls back to prefix heuristic otherwise.
   */
  getNearbyParcels: async (
    parcelId: string,
    options?: { radiusMiles?: number; limit?: number; propertyType?: string }
  ): Promise<NearbyParcelsResponse> => {
    const params = new URLSearchParams();
    if (options?.radiusMiles) params.set('radiusMiles', String(options.radiusMiles));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.propertyType) params.set('propertyType', options.propertyType);
    const qs = params.toString();
    return atlasGet<NearbyParcelsResponse>(
      `/parcels/${encodeURIComponent(parcelId)}/nearby${qs ? `?${qs}` : ''}`
    );
  },

  /**
   * Get layer metadata detail by layer ID
   */
  getLayerDetail: async (layerId: string): Promise<MapLayer> => {
    return atlasGet<MapLayer>(`/layers/${encodeURIComponent(layerId)}`);
  },

  /**
   * Get parcel layers (R1 Week 3 — query_parcel_layers tool)
   */
  getParcelLayers: async (parcelId: string): Promise<MapLayer[]> => {
    return atlasGet<MapLayer[]>(`/parcels/${encodeURIComponent(parcelId)}/layers`);
  },

  // R2.10 endpoints — GIS geometry storage

  /**
   * Get parcel centroid coordinates for map pin placement
   */
  getParcelCentroid: async (parcelId: string): Promise<ParcelCentroid> => {
    return atlasGet<ParcelCentroid>(
      `/parcels/${encodeURIComponent(parcelId)}/centroid`
    );
  },

  /**
   * Upsert GeoJSON geometry for a parcel (county data import)
   */
  upsertParcelGeometry: async (
    parcelId: string,
    geometry: UpsertGeometryRequest
  ): Promise<UpsertGeometryResponse> => {
    return atlasPut<UpsertGeometryResponse>(
      `/parcels/${encodeURIComponent(parcelId)}/geometry`,
      geometry
    );
  },

  /**
   * Get geometry coverage statistics for the county
   */
  getGeometryStats: async (): Promise<GeometryStats> => {
    return atlasGet<GeometryStats>('/geometry/stats');
  },
};

export default atlasService;
