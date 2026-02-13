#!/usr/bin/env node

/**
 * TerraFusion MCP PostGIS Server
 *
 * Exposes PostGIS spatial queries as MCP tools for Claude integration.
 *
 * @module mcp-postgis-server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import { Pool } from 'pg';
import { z } from 'zod';

// Load environment variables
config();

// Database connection pool
const pool = new Pool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'terrafusion_os',
  user: process.env.DATABASE_USER || 'terrafusion',
  password: process.env.DATABASE_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: parseInt(process.env.QUERY_TIMEOUT_MS || '30000', 10),
});

// Query result limit
const MAX_RESULTS = parseInt(process.env.MAX_QUERY_RESULTS || '1000', 10);

// Tool input schemas
const parcelSearchSchema = z
  .object({
    parcelId: z.string().optional(),
    address: z.string().optional(),
  })
  .refine(data => data.parcelId || data.address, {
    message: 'Either parcelId or address must be provided',
  });

const spatialIntersectionSchema = z.object({
  polygon: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
  }),
});

const nearestParcelsSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().positive().default(1000),
});

/**
 * Execute parcel search query
 */
async function searchParcel(input: z.infer<typeof parcelSearchSchema>) {
  let query: string;
  let params: any[];

  if (input.parcelId) {
    query = `
      SELECT 
        id,
        parcel_id,
        address,
        county_id,
        assessed_value,
        tax_levy,
        ST_AsGeoJSON(geometry)::json as geometry
      FROM properties
      WHERE parcel_id = $1
      LIMIT 1
    `;
    params = [input.parcelId];
  } else if (input.address) {
    query = `
      SELECT 
        id,
        parcel_id,
        address,
        county_id,
        assessed_value,
        tax_levy,
        ST_AsGeoJSON(geometry)::json as geometry
      FROM properties
      WHERE address ILIKE $1
      LIMIT ${MAX_RESULTS}
    `;
    params = [`%${input.address}%`];
  } else {
    throw new Error('Either parcelId or address must be provided');
  }

  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  const features = result.rows.map(row => ({
    type: 'Feature',
    id: row.id,
    properties: {
      parcelId: row.parcel_id,
      address: row.address,
      countyId: row.county_id,
      assessedValue: row.assessed_value,
      taxLevy: row.tax_levy,
    },
    geometry: row.geometry,
  }));

  return {
    type: 'FeatureCollection',
    features: features.length === 1 ? features[0] : features,
  };
}

/**
 * Execute spatial intersection query
 */
async function spatialIntersection(input: z.infer<typeof spatialIntersectionSchema>) {
  const polygonGeoJSON = JSON.stringify(input.polygon);

  const query = `
    SELECT 
      id,
      parcel_id,
      address,
      county_id,
      assessed_value,
      tax_levy,
      ST_AsGeoJSON(geometry)::json as geometry
    FROM properties
    WHERE ST_Intersects(
      geometry,
      ST_GeomFromGeoJSON($1)
    )
    LIMIT ${MAX_RESULTS}
  `;

  const result = await pool.query(query, [polygonGeoJSON]);

  const features = result.rows.map(row => ({
    type: 'Feature',
    id: row.id,
    properties: {
      parcelId: row.parcel_id,
      address: row.address,
      countyId: row.county_id,
      assessedValue: row.assessed_value,
      taxLevy: row.tax_levy,
    },
    geometry: row.geometry,
  }));

  return {
    type: 'FeatureCollection',
    features,
    count: features.length,
  };
}

/**
 * Execute nearest parcels query
 */
async function nearestParcels(input: z.infer<typeof nearestParcelsSchema>) {
  const point = `POINT(${input.longitude} ${input.latitude})`;

  const query = `
    SELECT 
      id,
      parcel_id,
      address,
      county_id,
      assessed_value,
      tax_levy,
      ST_AsGeoJSON(geometry)::json as geometry,
      ST_Distance(
        geometry::geography,
        ST_GeomFromText($1, 4326)::geography
      ) as distance_meters
    FROM properties
    WHERE ST_DWithin(
      geometry::geography,
      ST_GeomFromText($1, 4326)::geography,
      $2
    )
    ORDER BY distance_meters ASC
    LIMIT ${MAX_RESULTS}
  `;

  const result = await pool.query(query, [point, input.radiusMeters]);

  const features = result.rows.map(row => ({
    type: 'Feature',
    id: row.id,
    properties: {
      parcelId: row.parcel_id,
      address: row.address,
      countyId: row.county_id,
      assessedValue: row.assessed_value,
      taxLevy: row.tax_levy,
      distanceMeters: Math.round(parseFloat(row.distance_meters) * 100) / 100,
    },
    geometry: row.geometry,
  }));

  return {
    type: 'FeatureCollection',
    features,
    count: features.length,
    queryRadius: input.radiusMeters,
  };
}

/**
 * Initialize MCP server
 */
async function main() {
  // Test database connection
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT PostGIS_Version() as version');
    console.error(`Connected to PostgreSQL with PostGIS ${result.rows[0].version}`);
    client.release();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }

  const server = new Server(
    {
      name: 'terrafusion-postgis-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'parcel_search',
        description:
          'Search for parcels by ID or address. Returns GeoJSON Feature(s) with parcel geometry and metadata.',
        inputSchema: {
          type: 'object',
          properties: {
            parcelId: {
              type: 'string',
              description: 'Parcel ID to search for (exact match)',
            },
            address: {
              type: 'string',
              description: 'Address to search for (partial match, case-insensitive)',
            },
          },
          oneOf: [{ required: ['parcelId'] }, { required: ['address'] }],
        },
      },
      {
        name: 'spatial_intersection',
        description:
          'Find all parcels intersecting a given polygon. Returns GeoJSON FeatureCollection.',
        inputSchema: {
          type: 'object',
          properties: {
            polygon: {
              type: 'object',
              description: 'GeoJSON Polygon geometry',
              properties: {
                type: { type: 'string', enum: ['Polygon'] },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'array',
                    items: {
                      type: 'array',
                      items: { type: 'number' },
                      minItems: 2,
                      maxItems: 2,
                    },
                  },
                },
              },
              required: ['type', 'coordinates'],
            },
          },
          required: ['polygon'],
        },
      },
      {
        name: 'nearest_parcels',
        description:
          'Find parcels within a radius of a point, sorted by distance. Returns GeoJSON FeatureCollection.',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude coordinate (WGS84)',
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: 'number',
              description: 'Longitude coordinate (WGS84)',
              minimum: -180,
              maximum: 180,
            },
            radiusMeters: {
              type: 'number',
              description: 'Search radius in meters (default: 1000)',
              default: 1000,
              minimum: 1,
            },
          },
          required: ['latitude', 'longitude'],
        },
      },
    ],
  }));

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async request => {
    try {
      if (request.params.name === 'parcel_search') {
        const input = parcelSearchSchema.parse(request.params.arguments);
        const result = await searchParcel(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (request.params.name === 'spatial_intersection') {
        const input = spatialIntersectionSchema.parse(request.params.arguments);
        const result = await spatialIntersection(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      if (request.params.name === 'nearest_parcels') {
        const input = nearestParcelsSchema.parse(request.params.arguments);
        const result = await nearestParcels(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${request.params.name}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('TerraFusion MCP PostGIS Server running');
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.error('Shutting down...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down...');
  await pool.end();
  process.exit(0);
});

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
