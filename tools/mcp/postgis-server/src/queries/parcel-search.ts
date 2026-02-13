/**
 * Parcel Search Query Module
 *
 * Provides parcel lookup by ID or address with GeoJSON geometry conversion.
 *
 * @module queries/parcel-search
 */

import { Pool } from 'pg';

export interface ParcelSearchInput {
  parcelId?: string;
  address?: string;
}

export interface ParcelFeature {
  type: 'Feature';
  id: number;
  properties: {
    parcelId: string;
    address: string;
    countyId: number;
    assessedValue: number;
    taxLevy: number;
  };
  geometry: any; // GeoJSON geometry
}

export interface ParcelSearchResult {
  type: 'FeatureCollection' | 'Feature';
  features?: ParcelFeature | ParcelFeature[];
  feature?: ParcelFeature;
}

/**
 * Search for parcels by ID or address
 *
 * @param pool - PostgreSQL connection pool
 * @param input - Search parameters
 * @param maxResults - Maximum number of results (default: 1000)
 * @returns GeoJSON Feature or FeatureCollection
 */
export async function searchParcel(
  pool: Pool,
  input: ParcelSearchInput,
  maxResults: number = 1000
): Promise<ParcelSearchResult> {
  // Validate input
  if (!input.parcelId && !input.address) {
    throw new Error('Either parcelId or address must be provided');
  }

  let query: string;
  let params: any[];

  if (input.parcelId) {
    // Exact parcel ID match
    query = `
      SELECT 
        id,
        parcel_id,
        address,
        county_id,
        assessed_value,
        tax_levy,
        ST_AsGeoJSON(geometry)::json as geometry,
        ST_Area(geometry::geography) as area_sqm
      FROM properties
      WHERE parcel_id = $1
      LIMIT 1
    `;
    params = [input.parcelId];
  } else {
    // Address pattern match (case-insensitive)
    query = `
      SELECT 
        id,
        parcel_id,
        address,
        county_id,
        assessed_value,
        tax_levy,
        ST_AsGeoJSON(geometry)::json as geometry,
        ST_Area(geometry::geography) as area_sqm
      FROM properties
      WHERE address ILIKE $1
      ORDER BY 
        CASE 
          WHEN address ILIKE $2 THEN 1  -- Exact match first
          WHEN address ILIKE $3 THEN 2  -- Starts with pattern
          ELSE 3                         -- Contains pattern
        END,
        address ASC
      LIMIT $4
    `;
    params = [
      `%${input.address}%`, // Pattern match
      input.address, // Exact match check
      `${input.address}%`, // Starts with check
      maxResults,
    ];
  }

  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }

  // Convert to GeoJSON features
  const features: ParcelFeature[] = result.rows.map(row => ({
    type: 'Feature',
    id: row.id,
    properties: {
      parcelId: row.parcel_id,
      address: row.address,
      countyId: row.county_id,
      assessedValue: parseFloat(row.assessed_value),
      taxLevy: parseFloat(row.tax_levy),
      areaSqm: Math.round(parseFloat(row.area_sqm)),
    },
    geometry: row.geometry,
  }));

  // Return single feature for parcel ID search, collection for address search
  if (input.parcelId) {
    return {
      type: 'Feature',
      ...features[0],
    };
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Validate parcel ID format
 *
 * @param parcelId - Parcel ID to validate
 * @returns True if valid
 */
export function isValidParcelId(parcelId: string): boolean {
  // Basic validation - adjust pattern based on county requirements
  // Example: Benton County format is typically 10-12 digits
  return /^[\dA-Z-]+$/.test(parcelId) && parcelId.length >= 6 && parcelId.length <= 20;
}

/**
 * Sanitize address input for SQL ILIKE query
 *
 * @param address - Address string to sanitize
 * @returns Sanitized address
 */
export function sanitizeAddress(address: string): string {
  // Remove special characters that could interfere with SQL
  // Keep alphanumeric, spaces, hyphens, periods, commas
  return address.replace(/[^\w\s\-.,#]/gi, '').trim();
}
