/**
 * Spatial Intersection Query Module
 *
 * Find parcels intersecting a given polygon using PostGIS ST_Intersects.
 *
 * @module queries/spatial-intersection
 */

import { Pool } from 'pg';

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface IntersectionInput {
  polygon: GeoJSONPolygon;
  countyId?: number; // Optional county filter for multi-tenant isolation
}

export interface IntersectionFeature {
  type: 'Feature';
  id: number;
  properties: {
    parcelId: string;
    address: string;
    countyId: number;
    assessedValue: number;
    taxLevy: number;
    intersectionPct?: number; // Percentage of parcel within polygon
  };
  geometry: any; // GeoJSON geometry
}

export interface IntersectionResult {
  type: 'FeatureCollection';
  features: IntersectionFeature[];
  count: number;
  queryPolygon: GeoJSONPolygon;
}

/**
 * Find all parcels intersecting a polygon
 *
 * @param pool - PostgreSQL connection pool
 * @param input - Query parameters with polygon geometry
 * @param maxResults - Maximum number of results (default: 1000)
 * @returns GeoJSON FeatureCollection of intersecting parcels
 */
export async function spatialIntersection(
  pool: Pool,
  input: IntersectionInput,
  maxResults: number = 1000
): Promise<IntersectionResult> {
  // Validate polygon
  validatePolygon(input.polygon);

  const polygonGeoJSON = JSON.stringify(input.polygon);

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
      ST_Area(p.geometry::geography) as parcel_area,
      ST_Area(
        ST_Intersection(
          p.geometry,
          ST_GeomFromGeoJSON($1)
        )::geography
      ) as intersection_area
    FROM properties p
    WHERE ST_Intersects(
      p.geometry,
      ST_GeomFromGeoJSON($1)
    )
  `;

  const params: any[] = [polygonGeoJSON];

  // Add county filter if specified (multi-tenant isolation)
  if (input.countyId) {
    query += ` AND p.county_id = $2`;
    params.push(input.countyId);
  }

  // Order by intersection area (largest first) and limit results
  query += `
    ORDER BY intersection_area DESC
    LIMIT $${params.length + 1}
  `;
  params.push(maxResults);

  const result = await pool.query(query, params);

  // Convert to GeoJSON features with intersection percentage
  const features: IntersectionFeature[] = result.rows.map(row => {
    const parcelArea = parseFloat(row.parcel_area);
    const intersectionArea = parseFloat(row.intersection_area);
    const intersectionPct =
      parcelArea > 0 ? Math.round((intersectionArea / parcelArea) * 100 * 10) / 10 : 0;

    return {
      type: 'Feature',
      id: row.id,
      properties: {
        parcelId: row.parcel_id,
        address: row.address,
        countyId: row.county_id,
        assessedValue: parseFloat(row.assessed_value),
        taxLevy: parseFloat(row.tax_levy),
        intersectionPct,
      },
      geometry: row.geometry,
    };
  });

  return {
    type: 'FeatureCollection',
    features,
    count: features.length,
    queryPolygon: input.polygon,
  };
}

/**
 * Validate GeoJSON polygon structure
 *
 * @param polygon - Polygon to validate
 * @throws Error if polygon is invalid
 */
function validatePolygon(polygon: GeoJSONPolygon): void {
  if (!polygon || polygon.type !== 'Polygon') {
    throw new Error('Invalid polygon: must have type "Polygon"');
  }

  if (!Array.isArray(polygon.coordinates) || polygon.coordinates.length === 0) {
    throw new Error('Invalid polygon: coordinates array is empty');
  }

  // Validate outer ring (first array)
  const outerRing = polygon.coordinates[0];
  if (!Array.isArray(outerRing) || outerRing.length < 4) {
    throw new Error('Invalid polygon: outer ring must have at least 4 points');
  }

  // Validate that first and last points are the same (closed ring)
  const first = outerRing[0];
  const last = outerRing[outerRing.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    throw new Error(
      'Invalid polygon: outer ring must be closed (first and last points must match)'
    );
  }

  // Validate coordinate structure
  for (const ring of polygon.coordinates) {
    for (const point of ring) {
      if (!Array.isArray(point) || point.length < 2) {
        throw new Error('Invalid polygon: each coordinate must be [longitude, latitude]');
      }
      const [lon, lat] = point;
      if (typeof lon !== 'number' || typeof lat !== 'number') {
        throw new Error('Invalid polygon: coordinates must be numbers');
      }
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        throw new Error('Invalid polygon: coordinates out of valid range');
      }
    }
  }
}

/**
 * Calculate polygon area in square meters
 *
 * @param pool - PostgreSQL connection pool
 * @param polygon - GeoJSON polygon
 * @returns Area in square meters
 */
export async function calculatePolygonArea(pool: Pool, polygon: GeoJSONPolygon): Promise<number> {
  validatePolygon(polygon);
  const polygonGeoJSON = JSON.stringify(polygon);

  const result = await pool.query(`SELECT ST_Area(ST_GeomFromGeoJSON($1)::geography) as area`, [
    polygonGeoJSON,
  ]);

  return parseFloat(result.rows[0].area);
}
