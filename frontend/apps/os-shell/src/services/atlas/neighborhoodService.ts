/**
 * Neighborhood Service (BIV-143)
 * ===================================================================
 * Core neighborhood CRUD and parcel listing.
 * Neighborhoods are geographic areas defined by code, name, and
 * GeoJSON boundary polygon.
 *
 * @see services/atlas/neighborhoodComparisonService.ts — comparison ops
 * @see services/atlas/neighborhoodSentimentService.ts — sentiment data
 */

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const ATLAS_API = `${API_BASE_URL}/api/atlas`;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** A geographic neighborhood with boundary and metadata */
export interface Neighborhood {
  /** Unique neighborhood code (e.g. "BEN-01") */
  code: string;
  /** Display name */
  name: string;
  /** GeoJSON boundary polygon */
  boundary: GeoJSON.Polygon;
  /** Number of parcels within the boundary */
  parcelCount: number;
  /** Primary zoning designation for the area */
  primaryZoning: string;
}

/** Lightweight parcel summary returned from neighborhood parcel queries */
export interface ParcelSummary {
  /** Parcel identifier */
  parcelId: string;
  /** Street address */
  address: string;
  /** Lot size in square feet */
  lotSizeSqft: number;
  /** Building square footage (0 if vacant) */
  buildingSqft: number;
  /** Year the primary structure was built (null if vacant) */
  yearBuilt: number | null;
  /** Current zoning code */
  zoning: string;
  /** Land use classification */
  landUse: string;
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

// ============================================================================
// SERVICE
// ============================================================================

export const neighborhoodService = {
  /**
   * Get all neighborhoods for the current county.
   */
  getNeighborhoods: async (): Promise<Neighborhood[]> => {
    return atlasGet<Neighborhood[]>('/neighborhoods');
  },

  /**
   * Get a single neighborhood by code.
   */
  getNeighborhood: async (code: string): Promise<Neighborhood> => {
    return atlasGet<Neighborhood>(`/neighborhoods/${encodeURIComponent(code)}`);
  },

  /**
   * Get all parcels within a neighborhood, returned as lightweight summaries.
   */
  getNeighborhoodParcels: async (code: string): Promise<ParcelSummary[]> => {
    return atlasGet<ParcelSummary[]>(
      `/neighborhoods/${encodeURIComponent(code)}/parcels`,
    );
  },
};

export default neighborhoodService;
