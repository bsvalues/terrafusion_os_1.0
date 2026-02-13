/**
 * Boundary Intersection Tool - Check if parcel boundaries intersect
 *
 * Checks if two parcels have overlapping boundaries using PostGIS ST_Intersects.
 * Optionally returns the intersection geometry as GeoJSON.
 *
 * Security: County isolation enforced via CountyId filter
 * Output: Intersection status + optional geometry
 *
 * @module tools/boundary-check
 */

import { Pool, PoolClient } from 'pg';

/**
 * Input parameters for checkBoundaryIntersection tool
 */
interface CheckBoundaryIntersectionParams {
  countyId: number;
  parcelId1: string;
  parcelId2: string;
  returnGeometry?: boolean;
}

/**
 * Check if two parcel boundaries intersect
 *
 * @param pool - PostgreSQL connection pool
 * @param params - Tool input parameters
 * @returns MCP tool response with intersection analysis
 */
export async function checkBoundaryIntersectionHandler(
  pool: Pool,
  params: CheckBoundaryIntersectionParams
) {
  const { countyId, parcelId1, parcelId2, returnGeometry = false } = params;

  // Validate parameters
  if (!countyId || countyId <= 0) {
    throw new Error('Invalid countyId - must be positive integer');
  }

  if (!parcelId1 || !parcelId1.trim()) {
    throw new Error('parcelId1 is required');
  }

  if (!parcelId2 || !parcelId2.trim()) {
    throw new Error('parcelId2 is required');
  }

  if (parcelId1 === parcelId2) {
    throw new Error('parcelId1 and parcelId2 must be different');
  }

  let client: PoolClient | null = null;

  try {
    client = await pool.connect();

    // First, verify both parcels exist and belong to the county
    const parcelCheckQuery = `
      SELECT "ParcelId", "Address", ST_AsGeoJSON("Geometry")::json as geometry
      FROM "Properties"
      WHERE "CountyId" = $1 AND "ParcelId" = ANY($2) AND "Geometry" IS NOT NULL
    `;

    const parcelCheckResult = await client.query(parcelCheckQuery, [
      countyId,
      [parcelId1, parcelId2],
    ]);

    if (parcelCheckResult.rows.length !== 2) {
      const foundParcels = parcelCheckResult.rows.map(r => r.ParcelId);
      const missingParcels = [parcelId1, parcelId2].filter(id => !foundParcels.includes(id));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: `Parcels not found or missing geometry: ${missingParcels.join(', ')}`,
                countyId,
                parcelId1,
                parcelId2,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    // Check intersection and optionally get intersection geometry
    const intersectionQuery = returnGeometry
      ? `
        SELECT 
          ST_Intersects(p1."Geometry", p2."Geometry") as intersects,
          ST_Overlaps(p1."Geometry", p2."Geometry") as overlaps,
          ST_Touches(p1."Geometry", p2."Geometry") as touches,
          ST_Area(ST_Intersection(p1."Geometry", p2."Geometry")) as intersection_area_sqm,
          ST_AsGeoJSON(ST_Intersection(p1."Geometry", p2."Geometry"))::json as intersection_geometry
        FROM "Properties" p1, "Properties" p2
        WHERE 
          p1."CountyId" = $1 
          AND p2."CountyId" = $1
          AND p1."ParcelId" = $2 
          AND p2."ParcelId" = $3
          AND p1."Geometry" IS NOT NULL
          AND p2."Geometry" IS NOT NULL
      `
      : `
        SELECT 
          ST_Intersects(p1."Geometry", p2."Geometry") as intersects,
          ST_Overlaps(p1."Geometry", p2."Geometry") as overlaps,
          ST_Touches(p1."Geometry", p2."Geometry") as touches,
          ST_Area(ST_Intersection(p1."Geometry", p2."Geometry")) as intersection_area_sqm
        FROM "Properties" p1, "Properties" p2
        WHERE 
          p1."CountyId" = $1 
          AND p2."CountyId" = $1
          AND p1."ParcelId" = $2 
          AND p2."ParcelId" = $3
          AND p1."Geometry" IS NOT NULL
          AND p2."Geometry" IS NOT NULL
      `;

    const startTime = Date.now();
    const result = await client.query(intersectionQuery, [countyId, parcelId1, parcelId2]);
    const queryTime = Date.now() - startTime;

    if (result.rows.length === 0) {
      throw new Error('Intersection query returned no results');
    }

    const row = result.rows[0];
    const intersects = row.intersects;
    const overlaps = row.overlaps;
    const touches = row.touches;
    const intersectionAreaSqm = parseFloat(row.intersection_area_sqm || 0);

    const response: any = {
      success: true,
      countyId,
      parcelId1,
      parcelId2,
      intersects,
      overlaps,
      touches,
      intersectionAreaSqm,
      queryTimeMs: queryTime,
      analysis: {
        type: intersects
          ? overlaps
            ? 'overlap' // Boundaries overlap (share area)
            : touches
              ? 'touch' // Boundaries touch (share edge/point)
              : 'intersect' // Geometries intersect in some way
          : 'disjoint', // No intersection
        description: intersects
          ? overlaps
            ? 'Parcels have overlapping boundaries (conflict)'
            : touches
              ? 'Parcels share a common boundary (adjacent)'
              : 'Parcels intersect'
          : 'Parcels do not intersect',
      },
    };

    if (returnGeometry && intersects && row.intersection_geometry) {
      response.intersectionGeometry = row.intersection_geometry;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error('[checkBoundaryIntersection] Error:', error);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              countyId,
              parcelId1,
              parcelId2,
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
