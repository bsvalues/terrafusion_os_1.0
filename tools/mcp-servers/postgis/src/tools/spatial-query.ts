/**
 * Spatial Query Tool - Find parcels within boundary
 *
 * Queries PostGIS to find all parcels that fall within a specified polygon boundary.
 * Uses ST_Within for precise geometric containment checking.
 *
 * Security: County isolation enforced via CountyId filter
 * Output: GeoJSON FeatureCollection with parcel geometries and metadata
 *
 * @module tools/spatial-query
 */

import { Feature, FeatureCollection } from 'geojson';
import { Pool, PoolClient } from 'pg';

/**
 * Input parameters for queryParcelsByBoundary tool
 */
interface QueryParcelsByBoundaryParams {
  countyId: number;
  boundaryWkt: string;
  limit?: number;
}

/**
 * Query parcels within a polygon boundary
 *
 * @param pool - PostgreSQL connection pool
 * @param params - Tool input parameters
 * @returns MCP tool response with GeoJSON FeatureCollection
 */
export async function queryParcelsByBoundaryHandler(
  pool: Pool,
  params: QueryParcelsByBoundaryParams
) {
  const { countyId, boundaryWkt, limit = 100 } = params;

  // Validate parameters
  if (!countyId || countyId <= 0) {
    throw new Error('Invalid countyId - must be positive integer');
  }

  if (!boundaryWkt || !boundaryWkt.trim()) {
    throw new Error('boundaryWkt is required');
  }

  // Enforce maximum result limit
  const maxLimit = parseInt(process.env.MAX_RESULTS_PER_QUERY || '1000', 10);
  const effectiveLimit = Math.min(limit, maxLimit);

  let client: PoolClient | null = null;

  try {
    client = await pool.connect();

    // Query parcels within boundary with county isolation
    // ST_Within checks if parcel geometry is completely within the boundary
    // ST_AsGeoJSON converts PostGIS geometry to GeoJSON format
    const query = `
      SELECT 
        p."Id" as id,
        p."ParcelId" as parcel_id,
        p."Address" as address,
        p."AssessedValue" as assessed_value,
        p."LandValue" as land_value,
        p."ImprovementValue" as improvement_value,
        p."TaxableValue" as taxable_value,
        p."Acreage" as acreage,
        p."CountyId" as county_id,
        ST_AsGeoJSON(p."Geometry")::json as geometry,
        ST_Area(p."Geometry") as area_sqm
      FROM "Properties" p
      WHERE 
        p."CountyId" = $1
        AND p."Geometry" IS NOT NULL
        AND ST_Within(p."Geometry", ST_GeomFromText($2, 4326))
      ORDER BY ST_Area(p."Geometry") DESC
      LIMIT $3
    `;

    const startTime = Date.now();
    const result = await client.query(query, [countyId, boundaryWkt, effectiveLimit]);
    const queryTime = Date.now() - startTime;

    // Log slow queries
    const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '1000', 10);
    if (queryTime > slowQueryThreshold) {
      console.error(`[SLOW QUERY] queryParcelsByBoundary took ${queryTime}ms`);
    }

    // Build GeoJSON FeatureCollection from query results
    const features: Feature[] = result.rows.map(row => ({
      type: 'Feature',
      id: row.parcel_id,
      geometry: row.geometry,
      properties: {
        id: row.id,
        parcelId: row.parcel_id,
        address: row.address,
        assessedValue: parseFloat(row.assessed_value || 0),
        landValue: parseFloat(row.land_value || 0),
        improvementValue: parseFloat(row.improvement_value || 0),
        taxableValue: parseFloat(row.taxable_value || 0),
        acreage: parseFloat(row.acreage || 0),
        countyId: row.county_id,
        areaSqm: parseFloat(row.area_sqm || 0),
      },
    }));

    const featureCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              countyId,
              totalResults: result.rows.length,
              limit: effectiveLimit,
              queryTimeMs: queryTime,
              data: featureCollection,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    console.error('[queryParcelsByBoundary] Error:', error);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              countyId,
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
