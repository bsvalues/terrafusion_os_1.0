/**
 * Parcel Geometry Tool - Get GeoJSON for specific parcel
 *
 * Retrieves parcel boundary geometry as GeoJSON FeatureCollection.
 * Supports optional geometry simplification for visualization performance.
 *
 * Security: County isolation enforced via CountyId filter
 * Output: GeoJSON FeatureCollection with parcel boundary and metadata
 *
 * @module tools/parcel-geometry
 */

import { Feature, FeatureCollection } from 'geojson';
import { Pool, PoolClient } from 'pg';

/**
 * Input parameters for getParcelGeometry tool
 */
interface GetParcelGeometryParams {
  countyId: number;
  parcelId: string;
  simplify?: boolean;
  tolerance?: number; // Simplification tolerance in meters
}

/**
 * Get GeoJSON geometry for a specific parcel
 *
 * @param pool - PostgreSQL connection pool
 * @param params - Tool input parameters
 * @returns MCP tool response with GeoJSON FeatureCollection
 */
export async function getParcelGeometryHandler(pool: Pool, params: GetParcelGeometryParams) {
  const { countyId, parcelId, simplify = false, tolerance = 1.0 } = params;

  // Validate parameters
  if (!countyId || countyId <= 0) {
    throw new Error('Invalid countyId - must be positive integer');
  }

  if (!parcelId || !parcelId.trim()) {
    throw new Error('parcelId is required');
  }

  if (simplify && (tolerance <= 0 || tolerance > 100)) {
    throw new Error('tolerance must be between 0 and 100 meters');
  }

  let client: PoolClient | null = null;

  try {
    client = await pool.connect();

    // Build query with optional geometry simplification
    // ST_Simplify reduces polygon complexity for better visualization performance
    // ST_AsGeoJSON converts PostGIS geometry to GeoJSON format
    const geometryExpression = simplify
      ? `ST_AsGeoJSON(ST_Simplify("Geometry", $3))::json`
      : `ST_AsGeoJSON("Geometry")::json`;

    const query = `
      SELECT 
        "Id" as id,
        "ParcelId" as parcel_id,
        "Address" as address,
        "City" as city,
        "State" as state,
        "ZipCode" as zip_code,
        "AssessedValue" as assessed_value,
        "LandValue" as land_value,
        "ImprovementValue" as improvement_value,
        "TaxableValue" as taxable_value,
        "Acreage" as acreage,
        "CountyId" as county_id,
        "ZoningCode" as zoning_code,
        "PropertyType" as property_type,
        "LegalDescription" as legal_description,
        ${geometryExpression} as geometry,
        ST_Area("Geometry") as area_sqm,
        ST_Perimeter("Geometry") as perimeter_m,
        ST_AsText(ST_Centroid("Geometry")) as centroid_wkt,
        ST_XMin("Geometry") as bbox_min_x,
        ST_YMin("Geometry") as bbox_min_y,
        ST_XMax("Geometry") as bbox_max_x,
        ST_YMax("Geometry") as bbox_max_y
      FROM "Properties"
      WHERE 
        "CountyId" = $1 
        AND "ParcelId" = $2
        AND "Geometry" IS NOT NULL
    `;

    const queryParams = simplify ? [countyId, parcelId, tolerance] : [countyId, parcelId];

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
                parcelId,
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

    // Parse centroid WKT to extract coordinates
    const centroidMatch = row.centroid_wkt?.match(/POINT\(([^ ]+) ([^ ]+)\)/);
    const centroid = centroidMatch
      ? { lng: parseFloat(centroidMatch[1]), lat: parseFloat(centroidMatch[2]) }
      : null;

    // Build GeoJSON Feature
    const feature: Feature = {
      type: 'Feature',
      id: row.parcel_id,
      geometry: row.geometry,
      properties: {
        id: row.id,
        parcelId: row.parcel_id,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        assessedValue: parseFloat(row.assessed_value || 0),
        landValue: parseFloat(row.land_value || 0),
        improvementValue: parseFloat(row.improvement_value || 0),
        taxableValue: parseFloat(row.taxable_value || 0),
        acreage: parseFloat(row.acreage || 0),
        countyId: row.county_id,
        zoningCode: row.zoning_code,
        propertyType: row.property_type,
        legalDescription: row.legal_description,
        // Derived geometric properties
        areaSqm: parseFloat(row.area_sqm || 0),
        perimeterM: parseFloat(row.perimeter_m || 0),
        centroid,
        boundingBox: {
          minX: parseFloat(row.bbox_min_x),
          minY: parseFloat(row.bbox_min_y),
          maxX: parseFloat(row.bbox_max_x),
          maxY: parseFloat(row.bbox_max_y),
        },
        simplified: simplify,
        simplificationTolerance: simplify ? tolerance : null,
      },
    };

    const featureCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features: [feature],
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              countyId,
              parcelId,
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
    console.error('[getParcelGeometry] Error:', error);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              countyId,
              parcelId,
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
