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

// ============================================================================
// DEFAULT DATA (fallback when API is offline)
// ============================================================================

const DEFAULT_LAYERS: MapLayer[] = [
  { id: 'parcels', name: 'Parcel Boundaries', category: 'base', enabled: true, opacity: 100, source: 'Benton County GIS', features: 89_247 },
  { id: 'aerial', name: 'Aerial Imagery (2025)', category: 'base', enabled: true, opacity: 80, source: 'NAIP/County Flight' },
  { id: 'streets', name: 'Street Centerlines', category: 'base', enabled: true, opacity: 100, source: 'Benton County GIS', features: 12_840 },
  { id: 'zoning', name: 'Zoning Districts', category: 'overlay', enabled: false, opacity: 60, source: 'City Planning', features: 156 },
  { id: 'flood', name: 'FEMA Flood Zones', category: 'overlay', enabled: false, opacity: 50, source: 'FEMA NFHL', features: 342 },
  { id: 'wetlands', name: 'Wetland Boundaries', category: 'overlay', enabled: false, opacity: 50, source: 'NWI/USFWS', features: 89 },
  { id: 'slope', name: 'Slope Analysis', category: 'analysis', enabled: false, opacity: 40, source: 'DEM Derived' },
  { id: 'soil', name: 'Soil Classification', category: 'analysis', enabled: false, opacity: 40, source: 'NRCS SSURGO', features: 2_148 },
  { id: 'fire', name: 'Wildfire Risk Zones', category: 'analysis', enabled: false, opacity: 40, source: 'WA DNR', features: 64 },
];

const DEFAULT_PARCELS: ParcelResult[] = [
  { parcelId: '104841000002000', address: '3210 W Clearwater Ave', owner: 'Johnson, Michael R', acreage: 0.195, zoning: 'R-1', landUse: 'SFR', assessedValue: 378_000 },
  { parcelId: '104841000015200', address: '3405 W 19th Ave', owner: 'Garcia, Maria L', acreage: 0.188, zoning: 'R-1', landUse: 'SFR', assessedValue: 385_000 },
  { parcelId: '104841000016300', address: '1208 S Union St', owner: 'Williams, David K', acreage: 0.179, zoning: 'R-2', landUse: 'SFR', assessedValue: 362_000 },
  { parcelId: '104841000017400', address: '5501 W Canal Dr', owner: 'Thompson, Sarah J', acreage: 0.209, zoning: 'R-1', landUse: 'SFR', assessedValue: 405_000 },
  { parcelId: '104841000018500', address: '810 N Morain St', owner: 'Anderson, Robert P', acreage: 0.165, zoning: 'R-2', landUse: 'SFR', assessedValue: 348_000 },
];

// ============================================================================
// ATLAS SERVICE
// ============================================================================

export const atlasService = {
  /**
   * Get map layers configuration
   */
  getLayers: async (): Promise<MapLayer[]> => {
    try {
      return await atlasGet<MapLayer[]>('/layers');
    } catch {
      return DEFAULT_LAYERS;
    }
  },

  /**
   * Search parcels by address, ID, or owner
   */
  searchParcels: async (request: ParcelSearchRequest): Promise<ParcelSearchResponse> => {
    try {
      return await atlasPost<ParcelSearchResponse>('/parcels/search', request);
    } catch {
      const query = request.query.toLowerCase();
      const filtered = DEFAULT_PARCELS.filter(
        (p) =>
          p.parcelId.includes(query) ||
          p.address.toLowerCase().includes(query) ||
          p.owner.toLowerCase().includes(query)
      );
      return { results: filtered, total: filtered.length, hasMore: false };
    }
  },

  /**
   * Get parcel detail by ID
   */
  getParcel: async (parcelId: string): Promise<ParcelResult | null> => {
    try {
      return await atlasGet<ParcelResult>(`/parcels/${parcelId}`);
    } catch {
      return DEFAULT_PARCELS.find((p) => p.parcelId === parcelId) ?? null;
    }
  },

  /**
   * Get zoning districts
   */
  getZoningDistricts: async (): Promise<ZoningDistrict[]> => {
    try {
      return await atlasGet<ZoningDistrict[]>('/zoning');
    } catch {
      return [];
    }
  },

  /**
   * Get flood zones
   */
  getFloodZones: async (): Promise<FloodZone[]> => {
    try {
      return await atlasGet<FloodZone[]>('/flood-zones');
    } catch {
      return [];
    }
  },

  /**
   * Get spatial statistics for the county
   */
  getStats: async (): Promise<SpatialStats> => {
    try {
      return await atlasGet<SpatialStats>('/stats');
    } catch {
      return {
        totalParcels: 89_247,
        totalAcreage: 1_703,
        zoningDistrictCount: 156,
        floodZoneCount: 342,
        lastDataUpdate: '2026-02-15',
      };
    }
  },
};

export default atlasService;
