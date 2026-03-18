/**
 * TerraAtlas Suite Service (TFR-033)
 * ===================================================================
 * Main entry point for the Atlas suite. Provides map layer management,
 * feature queries by bounding box, geocoding, and parcel boundary lookup.
 *
 * This is the suite-level orchestrator; specialized services live under
 * services/atlas/ (neighborhoods, school districts, sentiment, etc.).
 *
 * @see services/atlasService.ts — lower-level Atlas API (parcels, zoning, flood)
 * @see config/suiteRegistry.ts — Constitutional Suite: atlas
 */

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const ATLAS_API = `${API_BASE_URL}/api/atlas`;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** A geographic point (longitude, latitude) */
export interface GeoPoint {
  lng: number;
  lat: number;
}

/** A parsed address returned from reverse geocoding */
export interface Address {
  /** Full formatted address string */
  formatted: string;
  /** Street number and name */
  street: string;
  /** City name */
  city: string;
  /** State abbreviation */
  state: string;
  /** ZIP code */
  zip: string;
  /** County name */
  county: string;
}

/** A map layer available in the Atlas suite */
export interface MapLayer {
  /** Layer identifier */
  id: string;
  /** Human-readable layer name */
  name: string;
  /** Layer category */
  category: 'base' | 'overlay' | 'analysis';
  /** Whether the layer is currently enabled */
  enabled: boolean;
  /** Layer opacity (0-1) */
  opacity: number;
  /** Data source identifier */
  source: string;
  /** Render type */
  type: 'vector' | 'raster' | 'geojson';
}

/** A GeoJSON Feature with typed properties */
export interface Feature {
  /** GeoJSON type, always "Feature" */
  type: 'Feature';
  /** Feature identifier */
  id: string;
  /** GeoJSON geometry */
  geometry: GeoJSON.Geometry;
  /** Feature properties (layer-specific) */
  properties: Record<string, unknown>;
}

/** Axis-aligned bounding box: [west, south, east, north] */
export type BBox = [number, number, number, number];

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
// ATLAS SUITE SERVICE
// ============================================================================

export const atlasSuiteService = {
  /**
   * Get all available map layers.
   */
  getLayers: async (): Promise<MapLayer[]> => {
    return atlasGet<MapLayer[]>('/layers');
  },

  /**
   * Get features for a named layer within a bounding box.
   * @param layerName - Layer to query (e.g. "parcels", "zoning")
   * @param bbox - [west, south, east, north] bounding box
   */
  getFeatures: async (layerName: string, bbox: BBox): Promise<Feature[]> => {
    const [west, south, east, north] = bbox;
    return atlasGet<Feature[]>(
      `/layers/${encodeURIComponent(layerName)}/features?west=${west}&south=${south}&east=${east}&north=${north}`,
    );
  },

  /**
   * Create or update a feature on a named layer.
   * @param layerName - Target layer
   * @param feature - The feature to upsert (include id for update)
   */
  upsertFeature: async (layerName: string, feature: Feature): Promise<Feature> => {
    if (feature.id) {
      return atlasPut<Feature>(
        `/layers/${encodeURIComponent(layerName)}/features/${encodeURIComponent(feature.id)}`,
        feature,
      );
    }
    return atlasPost<Feature>(
      `/layers/${encodeURIComponent(layerName)}/features`,
      feature,
    );
  },

  /**
   * Forward geocode an address string to a geographic point.
   */
  geocode: async (address: string): Promise<GeoPoint> => {
    return atlasGet<GeoPoint>(
      `/geocode?address=${encodeURIComponent(address)}`,
    );
  },

  /**
   * Reverse geocode a lat/lng coordinate to a parsed address.
   */
  reverseGeocode: async (lat: number, lng: number): Promise<Address> => {
    return atlasGet<Address>(`/geocode/reverse?lat=${lat}&lng=${lng}`);
  },

  /**
   * Get the GeoJSON boundary polygon for a specific parcel.
   */
  getParcelBoundary: async (parcelId: string): Promise<GeoJSON.Polygon> => {
    return atlasGet<GeoJSON.Polygon>(
      `/parcels/${encodeURIComponent(parcelId)}/boundary`,
    );
  },
};

export default atlasSuiteService;
