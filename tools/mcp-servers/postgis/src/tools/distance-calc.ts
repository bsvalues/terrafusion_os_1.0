/**
 * Distance Calculation Tool - Calculate distance between points/parcels
 *
 * Calculates distance between two geographic locations using PostGIS ST_Distance.
 * Supports point-to-point, point-to-parcel, and parcel-to-parcel calculations.
 *
 * Security: County isolation enforced via CountyId filter for parcel queries
 * Output: Distance with unit conversion (meters, kilometers, miles, feet)
 *
 * @module tools/distance-calc
 */

import { Pool, PoolClient } from 'pg';

/**
 * Input parameters for calculateDistance tool
 */
interface CalculateDistanceParams {
  countyId: number;
  fromType: 'point' | 'parcel';
  fromValue: string; // "lat,lng" for point or parcelId for parcel
  toType: 'point' | 'parcel';
  toValue: string; // "lat,lng" for point or parcelId for parcel
  unit?: 'meters' | 'kilometers' | 'miles' | 'feet';
}

/**
 * Parse point coordinate string to lat/lng
 */
function parsePoint(pointStr: string): { lat: number; lng: number } {
  const parts = pointStr.split(',').map(s => s.trim());
  if (parts.length !== 2) {
    throw new Error('Point must be in format "lat,lng"');
  }

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('Invalid point coordinates');
  }

  if (lat < -90 || lat > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }

  if (lng < -180 || lng > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }

  return { lat, lng };
}

/**
 * Convert distance from meters to target unit
 */
function convertDistance(meters: number, unit: string): number {
  switch (unit) {
    case 'kilometers':
      return meters / 1000;
    case 'miles':
      return meters * 0.000621371;
    case 'feet':
      return meters * 3.28084;
    case 'meters':
    default:
      return meters;
  }
}

/**
 * Calculate distance between two points or parcels
 *
 * @param pool - PostgreSQL connection pool
 * @param params - Tool input parameters
 * @returns MCP tool response with distance calculation
 */
export async function calculateDistanceHandler(pool: Pool, params: CalculateDistanceParams) {
  const { countyId, fromType, fromValue, toType, toValue, unit = 'meters' } = params;

  // Validate parameters
  if (!countyId || countyId <= 0) {
    throw new Error('Invalid countyId - must be positive integer');
  }

  if (!fromType || !['point', 'parcel'].includes(fromType)) {
    throw new Error('fromType must be "point" or "parcel"');
  }

  if (!toType || !['point', 'parcel'].includes(toType)) {
    throw new Error('toType must be "point" or "parcel"');
  }

  if (!fromValue || !fromValue.trim()) {
    throw new Error('fromValue is required');
  }

  if (!toValue || !toValue.trim()) {
    throw new Error('toValue is required');
  }

  let client: PoolClient | null = null;

  try {
    client = await pool.connect();

    // Build query based on source and target types
    let query = '';
    let queryParams: any[] = [];

    if (fromType === 'point' && toType === 'point') {
      // Point-to-point distance
      const fromPoint = parsePoint(fromValue);
      const toPoint = parsePoint(toValue);

      query = `
        SELECT ST_Distance(
          ST_GeographyFromText('POINT(' || $1 || ' ' || $2 || ')'),
          ST_GeographyFromText('POINT(' || $3 || ' ' || $4 || ')')
        ) as distance_meters
      `;
      queryParams = [fromPoint.lng, fromPoint.lat, toPoint.lng, toPoint.lat];
    } else if (fromType === 'point' && toType === 'parcel') {
      // Point-to-parcel distance
      const fromPoint = parsePoint(fromValue);

      query = `
        SELECT 
          ST_Distance(
            ST_GeographyFromText('POINT(' || $2 || ' ' || $3 || ')'),
            "Geometry"::geography
          ) as distance_meters,
          "ParcelId" as to_parcel_id,
          "Address" as to_address
        FROM "Properties"
        WHERE "CountyId" = $1 AND "ParcelId" = $4 AND "Geometry" IS NOT NULL
      `;
      queryParams = [countyId, fromPoint.lng, fromPoint.lat, toValue];
    } else if (fromType === 'parcel' && toType === 'point') {
      // Parcel-to-point distance
      const toPoint = parsePoint(toValue);

      query = `
        SELECT 
          ST_Distance(
            "Geometry"::geography,
            ST_GeographyFromText('POINT(' || $2 || ' ' || $3 || ')')
          ) as distance_meters,
          "ParcelId" as from_parcel_id,
          "Address" as from_address
        FROM "Properties"
        WHERE "CountyId" = $1 AND "ParcelId" = $4 AND "Geometry" IS NOT NULL
      `;
      queryParams = [countyId, toPoint.lng, toPoint.lat, fromValue];
    } else {
      // Parcel-to-parcel distance
      query = `
        SELECT 
          ST_Distance(
            p1."Geometry"::geography,
            p2."Geometry"::geography
          ) as distance_meters,
          p1."ParcelId" as from_parcel_id,
          p1."Address" as from_address,
          p2."ParcelId" as to_parcel_id,
          p2."Address" as to_address
        FROM "Properties" p1, "Properties" p2
        WHERE 
          p1."CountyId" = $1 
          AND p2."CountyId" = $1
          AND p1."ParcelId" = $2 
          AND p2."ParcelId" = $3
          AND p1."Geometry" IS NOT NULL
          AND p2."Geometry" IS NOT NULL
      `;
      queryParams = [countyId, fromValue, toValue];
    }

    const startTime = Date.now();
    const result = await client.query(query, queryParams);
    const queryTime = Date.now() - startTime;

    if (result.rows.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: 'Parcel not found or missing geometry',
                countyId,
                fromType,
                fromValue,
                toType,
                toValue,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    const row = result.rows[0];
    const distanceMeters = parseFloat(row.distance_meters || 0);
    const distanceConverted = convertDistance(distanceMeters, unit);

    const response: any = {
      success: true,
      countyId,
      from: {
        type: fromType,
        value: fromValue,
        parcelId: row.from_parcel_id || null,
        address: row.from_address || null,
      },
      to: {
        type: toType,
        value: toValue,
        parcelId: row.to_parcel_id || null,
        address: row.to_address || null,
      },
      distance: {
        value: distanceConverted,
        unit,
        meters: distanceMeters,
      },
      queryTimeMs: queryTime,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error('[calculateDistance] Error:', error);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              countyId,
              fromType,
              fromValue,
              toType,
              toValue,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}
