/**
 * School District Service (BIV-148)
 * ===================================================================
 * School district boundaries and school location data for the Atlas
 * map layer. Used for geographic context — NOT valuation.
 *
 * @see data/atlas/valuationLayerPolicy.ts — layer visibility rules
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
  /** Longitude (WGS84) */
  lng: number;
  /** Latitude (WGS84) */
  lat: number;
}

/** An individual school within a district */
export interface School {
  /** School name */
  name: string;
  /** School type classification */
  type: 'elementary' | 'middle' | 'high' | 'alternative' | 'charter' | 'private';
  /** Rating (1-10 scale, sourced from state data) */
  rating: number;
  /** Geographic location */
  location: GeoPoint;
}

/** A school district with boundary and contained schools */
export interface SchoolDistrict {
  /** District identifier */
  id: string;
  /** District display name */
  name: string;
  /** GeoJSON boundary polygon */
  boundary: GeoJSON.Polygon;
  /** Schools within this district */
  schools: School[];
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

export const schoolDistrictService = {
  /**
   * Get all school districts for the current county.
   */
  getSchoolDistricts: async (): Promise<SchoolDistrict[]> => {
    return atlasGet<SchoolDistrict[]>('/school-districts');
  },

  /**
   * Get a single school district by ID.
   */
  getSchoolDistrict: async (id: string): Promise<SchoolDistrict> => {
    return atlasGet<SchoolDistrict>(
      `/school-districts/${encodeURIComponent(id)}`,
    );
  },

  /**
   * Get all schools within a specific district.
   */
  getSchoolsInDistrict: async (id: string): Promise<School[]> => {
    return atlasGet<School[]>(
      `/school-districts/${encodeURIComponent(id)}/schools`,
    );
  },
};

export default schoolDistrictService;
