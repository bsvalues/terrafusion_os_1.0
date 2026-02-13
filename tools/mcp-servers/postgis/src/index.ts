#!/usr/bin/env node

/**
 * TerraFusion PostGIS MCP Server
 *
 * Model Context Protocol server exposing PostGIS geospatial capabilities
 * for property boundary queries, spatial analysis, and distance calculations.
 *
 * Architecture:
 * - MCP SDK handles protocol layer and tool registration
 * - PostgreSQL/PostGIS for spatial data storage and queries
 * - County isolation enforced on ALL queries (multi-tenant security)
 * - Tools return GeoJSON for client-side visualization
 *
 * @module @terrafusion/mcp-postgis-server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { Pool, PoolClient } from 'pg';

// Import tool handlers
import { checkBoundaryIntersectionHandler } from './tools/boundary-check.js';
import { calculateDistanceHandler } from './tools/distance-calc.js';
import { getParcelGeometryHandler } from './tools/parcel-geometry.js';
import { queryParcelsByBoundaryHandler } from './tools/spatial-query.js';

// Load environment configuration
dotenv.config();

/**
 * Database connection pool (shared across all tool handlers)
 */
let dbPool: Pool | null = null;

/**
 * Initialize PostgreSQL connection pool with PostGIS extension
 */
function initializeDatabase(): Pool {
  const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'terrafusion',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    max: 20, // Maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  // Use connection string if provided (overrides individual params)
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    return new Pool({ connectionString, max: 20 });
  }

  return new Pool(config);
}

/**
 * Validate PostGIS extension is available
 */
async function validatePostGIS(pool: Pool): Promise<void> {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT PostGIS_Version() as version');

    if (!result.rows[0]?.version) {
      throw new Error('PostGIS extension not found - ensure PostGIS is installed');
    }

    console.error(`[PostGIS MCP] Connected to PostGIS ${result.rows[0].version}`);
  } catch (error) {
    console.error('[PostGIS MCP] PostGIS validation failed:', error);
    throw new Error('PostGIS extension validation failed');
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Tool configuration metadata
 */
const TOOLS = [
  {
    name: 'queryParcelsByBoundary',
    description:
      'Find parcels within a specified polygon boundary. Returns GeoJSON FeatureCollection with parcel geometries and metadata. Enforces county isolation.',
    inputSchema: {
      type: 'object',
      properties: {
        countyId: {
          type: 'number',
          description: 'County ID for tenant isolation (REQUIRED)',
        },
        boundaryWkt: {
          type: 'string',
          description: 'Polygon boundary in WKT format (e.g., POLYGON((x1 y1, x2 y2, ...)))',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 100, max: 1000)',
          default: 100,
        },
      },
      required: ['countyId', 'boundaryWkt'],
    },
  },
  {
    name: 'checkBoundaryIntersection',
    description:
      'Check if two parcel boundaries intersect. Returns intersection details and optional intersection geometry as GeoJSON.',
    inputSchema: {
      type: 'object',
      properties: {
        countyId: {
          type: 'number',
          description: 'County ID for tenant isolation (REQUIRED)',
        },
        parcelId1: {
          type: 'string',
          description: 'First parcel ID to check',
        },
        parcelId2: {
          type: 'string',
          description: 'Second parcel ID to check',
        },
        returnGeometry: {
          type: 'boolean',
          description: 'Return intersection geometry as GeoJSON (default: false)',
          default: false,
        },
      },
      required: ['countyId', 'parcelId1', 'parcelId2'],
    },
  },
  {
    name: 'calculateDistance',
    description:
      'Calculate distance between two points or parcels. Returns distance in meters and optional path geometry.',
    inputSchema: {
      type: 'object',
      properties: {
        countyId: {
          type: 'number',
          description: 'County ID for tenant isolation (REQUIRED)',
        },
        fromType: {
          type: 'string',
          enum: ['point', 'parcel'],
          description: 'Source type: point (lat/lng) or parcel (ID)',
        },
        fromValue: {
          type: 'string',
          description: 'Source value: "lat,lng" for point or parcelId for parcel',
        },
        toType: {
          type: 'string',
          enum: ['point', 'parcel'],
          description: 'Target type: point (lat/lng) or parcel (ID)',
        },
        toValue: {
          type: 'string',
          description: 'Target value: "lat,lng" for point or parcelId for parcel',
        },
        unit: {
          type: 'string',
          enum: ['meters', 'kilometers', 'miles', 'feet'],
          description: 'Distance unit (default: meters)',
          default: 'meters',
        },
      },
      required: ['countyId', 'fromType', 'fromValue', 'toType', 'toValue'],
    },
  },
  {
    name: 'getParcelGeometry',
    description:
      'Get GeoJSON geometry for a specific parcel. Returns FeatureCollection with parcel boundary and metadata.',
    inputSchema: {
      type: 'object',
      properties: {
        countyId: {
          type: 'number',
          description: 'County ID for tenant isolation (REQUIRED)',
        },
        parcelId: {
          type: 'string',
          description: 'Parcel ID to retrieve geometry for',
        },
        simplify: {
          type: 'boolean',
          description: 'Simplify geometry for visualization (default: false)',
          default: false,
        },
        tolerance: {
          type: 'number',
          description: 'Simplification tolerance in meters (default: 1.0)',
          default: 1.0,
        },
      },
      required: ['countyId', 'parcelId'],
    },
  },
];

/**
 * Main MCP server initialization
 */
async function main() {
  console.error('[PostGIS MCP] Starting TerraFusion PostGIS MCP Server...');

  // Initialize database connection
  dbPool = initializeDatabase();
  await validatePostGIS(dbPool);

  // Create MCP server instance
  const server = new Server(
    {
      name: process.env.MCP_SERVER_NAME || 'terrafusion-postgis',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async request => {
    const { name, arguments: args } = request.params;

    if (!dbPool) {
      throw new Error('Database pool not initialized');
    }

    try {
      console.error(`[PostGIS MCP] Executing tool: ${name}`);

      switch (name) {
        case 'queryParcelsByBoundary':
          return await queryParcelsByBoundaryHandler(dbPool, args as any);

        case 'checkBoundaryIntersection':
          return await checkBoundaryIntersectionHandler(dbPool, args as any);

        case 'calculateDistance':
          return await calculateDistanceHandler(dbPool, args as any);

        case 'getParcelGeometry':
          return await getParcelGeometryHandler(dbPool, args as any);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error(`[PostGIS MCP] Tool execution error:`, error);
      throw error;
    }
  });

  // Setup transport and start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[PostGIS MCP] Server running on stdio transport');
  console.error('[PostGIS MCP] Registered tools:', TOOLS.map(t => t.name).join(', '));
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('[PostGIS MCP] Shutting down...');
  if (dbPool) {
    await dbPool.end();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('[PostGIS MCP] Shutting down...');
  if (dbPool) {
    await dbPool.end();
  }
  process.exit(0);
});

// Start server
main().catch(error => {
  console.error('[PostGIS MCP] Fatal error:', error);
  process.exit(1);
});
