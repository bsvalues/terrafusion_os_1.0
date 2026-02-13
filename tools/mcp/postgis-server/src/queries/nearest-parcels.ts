/**
 * Nearest Parcels Query Module
 *
 * Find parcels within a radius of a point using PostGIS distance functions.
 *
 * @module queries/nearest-parcels
 */

import { Pool } from 'pg';

export interface NearestParcelsInput {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  countyId?: number; // Optional county filter for multi-tenant isolation
}

export interface NearestParcelFeature {
  type: 'Feature';
  id: number;
  properties: {
    parcelId: string;
    address: string;
    countyId: number;
    assessedValue: number;
    taxLevy: number;
    distanceMeters: number;
    bearing?: number; // Compass bearing from query point (0-360)
  };
  geometry: any; // GeoJSON geometry
}

export interface NearestParcelsResult {
  type: 'FeatureCollection';
  features: NearestParcelFeature[];
  count: number;
  queryPoint: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  queryRadius: number;
}

/**
 * Find parcels within a radius, sorted by distance
 *
 * @param pool - PostgreSQL connection pool
 * @param input - Query parameters with point and radius
 * @param maxResults - Maximum number of results (default: 1000)
 * @returns GeoJSON FeatureCollection of nearby parcels, sorted by distance
 */
export async function nearestParcels(
  pool: Pool,
  input: NearestParcelsInput,
  maxResults: number = 1000
): Promise<NearestParcelsResult> {
  // Validate input
  validateCoordinates(input.latitude, input.longitude);
  validateRadius(input.radiusMeters);

  // Create WKT point (longitude first in WKT)
  const point = `POINT(${input.longitude} ${input.latitude})`;

  // Build query with optional county filter
  let query = `
    SELECT 
      p.id,
      p.parcel_id,
      p.address,
      p.county_id,
      p.assessed_value,
      p.tax_levy,
      ST_AsGeoJSON(p.geometry)::json as geometry,
      ST_Distance(
        p.geometry::geography,
        ST_GeomFromText($1, 4326)::geography
      ) as distance_meters,
      DEGREES(
        ST_Azimuth(
          ST_GeomFromText($1, 4326)::geography::geometry,
          ST_Centroid(p.geometry)
        )
      ) as bearing_degrees
    FROM properties p
    WHERE ST_DWithin(
      p.geometry::geography,
      ST_GeomFromText($1, 4326)::geography,
      $2
    )
  `;

  const params: any[] = [point, input.radiusMeters];

  // Add county filter if specified (multi-tenant isolation)
  if (input.countyId) {
    query += ` AND p.county_id = $3`;
    params.push(input.countyId);
  }

  // Order by distance (nearest first) and limit results
  query += `
    ORDER BY distance_meters ASC
    LIMIT $${params.length + 1}
  `;
  params.push(maxResults);

  const result = await pool.query(query, params);

  // Convert to GeoJSON features
  const features: NearestParcelFeature[] = result.rows.map(row => {
    const distanceMeters = Math.round(parseFloat(row.distance_meters) * 100) / 100;
    let bearing = row.bearing_degrees ? parseFloat(row.bearing_degrees) : undefined;

    // Normalize bearing to 0-360 range
    if (bearing !== undefined) {
      bearing = (bearing + 360) % 360;
      bearing = Math.round(bearing * 10) / 10;
    }

    return {
      type: 'Feature',
      id: row.id,
      properties: {
        parcelId: row.parcel_id,
        address: row.address,
        countyId: row.county_id,
        assessedValue: parseFloat(row.assessed_value),
        taxLevy: parseFloat(row.tax_levy),
        distanceMeters,
        bearing,
      },
      geometry: row.geometry,
    };
  });

  return {
    type: 'FeatureCollection',
    features,
    count: features.length,
    queryPoint: {
      type: 'Point',
      coordinates: [input.longitude, input.latitude],
    },
    queryRadius: input.radiusMeters,
  };
}

/**
 * Validate latitude and longitude coordinates
 *
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @throws Error if coordinates are invalid
 */
function validateCoordinates(latitude: number, longitude: number): void {
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    throw new Error('Invalid latitude: must be a number');
  }
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    throw new Error('Invalid longitude: must be a number');
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error('Invalid latitude: must be between -90 and 90');
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude: must be between -180 and 180');
  }
}

/**
 * Validate search radius
 *
 * @param radiusMeters - Radius in meters
 * @throws Error if radius is invalid
 */
function validateRadius(radiusMeters: number): void {
  if (typeof radiusMeters !== 'number' || isNaN(radiusMeters)) {
    throw new Error('Invalid radius: must be a number');
  }
  if (radiusMeters <= 0) {
    throw new Error('Invalid radius: must be positive');
  }
  if (radiusMeters > 100000) {
    throw new Error('Invalid radius: maximum 100km (100,000 meters)');
  }
}

/**
 * Convert bearing to compass direction
 *
 * @param bearing - Bearing in degrees (0-360)
 * @returns Compass direction (N, NE, E, SE, S, SW, W, NW)
 */
export function bearingToCompass(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round((bearing % 360) / 45) % 8;
  return directions[index];
}

/**
 * Format distance for human readability
 *
 * @param meters - Distance in meters
 * @returns Formatted distance string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
