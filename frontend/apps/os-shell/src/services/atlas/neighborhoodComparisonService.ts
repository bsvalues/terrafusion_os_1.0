/**
 * Neighborhood Comparison Service (BIV-141)
 * ===================================================================
 * Compares physical property characteristics across neighborhoods.
 * Stats are structural/geographic (sqft, year built, lot size, zoning)
 * — NO valuation math.
 *
 * @see services/atlas/neighborhoodService.ts — canonical neighborhood list
 */

import { getToken } from '@/auth/authStorage';
import { getViteEnv } from '@/env/getViteEnv';

const API_BASE_URL = getViteEnv().VITE_API_URL || '';
const ATLAS_API = `${API_BASE_URL}/api/atlas`;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Physical property statistics for a neighborhood (no valuation data) */
export interface NeighborhoodStats {
  /** Neighborhood code identifier */
  code: string;
  /** Total parcel count in the neighborhood */
  parcelCount: number;
  /** Average building square footage */
  avgSqft: number;
  /** Average year built */
  avgYearBuilt: number;
  /** Average lot size in square feet */
  avgLotSize: number;
  /** Predominant zoning designation */
  predominantZoning: string;
}

/** Side-by-side comparison result for two or more neighborhoods */
export interface NeighborhoodComparison {
  /** Neighborhood code */
  code: string;
  /** Neighborhood display name */
  name: string;
  /** Physical property stats */
  stats: NeighborhoodStats;
  /** GeoJSON boundary polygon */
  boundary: GeoJSON.Polygon;
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
// SERVICE
// ============================================================================

export const neighborhoodComparisonService = {
  /**
   * Compare two or more neighborhoods side-by-side.
   * Returns physical stats and boundary geometry for each.
   */
  compareNeighborhoods: async (codes: string[]): Promise<NeighborhoodComparison[]> => {
    return atlasPost<NeighborhoodComparison[]>('/neighborhoods/compare', { codes });
  },

  /**
   * Get physical property statistics for a single neighborhood.
   * Stats cover structure size, age, lot size, and zoning — no values.
   */
  getNeighborhoodStats: async (code: string): Promise<NeighborhoodStats> => {
    return atlasGet<NeighborhoodStats>(
      `/neighborhoods/${encodeURIComponent(code)}/stats`,
    );
  },

  /**
   * Get the GeoJSON boundary polygon for a neighborhood.
   */
  getNeighborhoodBoundary: async (code: string): Promise<GeoJSON.Polygon> => {
    return atlasGet<GeoJSON.Polygon>(
      `/neighborhoods/${encodeURIComponent(code)}/boundary`,
    );
  },
};

export default neighborhoodComparisonService;
