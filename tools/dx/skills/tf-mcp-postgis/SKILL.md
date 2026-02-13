---
id: tf-mcp-postgis
name: PostGIS MCP Server
version: 1.0.0
ownerLane: data
riskLevel: write-remote
triggers:
  - manual
  - mcp-activation
inputs:
  - connection-string
  - county-schema
  - spatial-query
outputs:
  - geojson
  - spatial-analysis
  - parcel-boundaries
dependencies: []
tags: [mcp, postgis, gis, spatial, parcel, mapping, data, government]
---

# PostGIS MCP Server

MCP (Model Context Protocol) server for spatial queries against the TerraFusion PostGIS database. Enables AI agents and developer tools to perform geospatial operations on county property data.

## Capabilities

- **Parcel Boundary Queries** - Retrieve parcel polygons by ID, address, or bounding box
- **Spatial Analysis** - Buffer, intersection, union, centroid operations
- **Proximity Search** - Find parcels within radius of a point
- **Assessment Overlays** - Join assessment data with parcel geometry
- **GeoJSON Export** - Standard GeoJSON output for all spatial queries
- **County Schema Isolation** - Each county has its own schema per Sovereign County model

## MCP Server Configuration

```json
{
  "mcpServers": {
    "terrafusion-postgis": {
      "command": "node",
      "args": ["tools/mcp/postgis-server.mjs"],
      "env": {
        "PGHOST": "localhost",
        "PGPORT": "5432",
        "PGDATABASE": "terrafusion",
        "PGUSER": "terrafusion_app",
        "TF_COUNTY_SCHEMA": "benton"
      }
    }
  }
}
```

## Available Tools

### parcel_query
Query parcels by various criteria.

```json
{
  "name": "parcel_query",
  "description": "Query property parcels from PostGIS",
  "inputSchema": {
    "type": "object",
    "properties": {
      "parcelId": { "type": "string", "description": "Parcel ID (e.g., 10-0505-001)" },
      "address": { "type": "string", "description": "Street address search" },
      "bbox": {
        "type": "object",
        "properties": {
          "minLon": { "type": "number" },
          "minLat": { "type": "number" },
          "maxLon": { "type": "number" },
          "maxLat": { "type": "number" }
        },
        "description": "Bounding box for spatial query"
      },
      "limit": { "type": "integer", "default": 100 },
      "includeGeometry": { "type": "boolean", "default": true }
    }
  }
}
```

### spatial_analysis
Perform spatial analysis operations.

```json
{
  "name": "spatial_analysis",
  "description": "Run spatial analysis on parcel data",
  "inputSchema": {
    "type": "object",
    "required": ["operation"],
    "properties": {
      "operation": {
        "type": "string",
        "enum": ["buffer", "intersection", "union", "centroid", "area", "distance"]
      },
      "parcelId": { "type": "string" },
      "radius": { "type": "number", "description": "Buffer radius in meters" },
      "targetParcelId": { "type": "string", "description": "Second parcel for binary operations" }
    }
  }
}
```

### proximity_search
Find parcels near a geographic point.

```json
{
  "name": "proximity_search",
  "description": "Find parcels within radius of a point",
  "inputSchema": {
    "type": "object",
    "required": ["latitude", "longitude", "radiusMeters"],
    "properties": {
      "latitude": { "type": "number" },
      "longitude": { "type": "number" },
      "radiusMeters": { "type": "number", "default": 500 },
      "limit": { "type": "integer", "default": 50 },
      "includeAssessment": { "type": "boolean", "default": false }
    }
  }
}
```

## Data Model

```sql
-- County-specific schema (Sovereign County isolation)
CREATE SCHEMA IF NOT EXISTS benton;

-- Parcel boundaries with PostGIS geometry
CREATE TABLE benton.parcels (
  id SERIAL PRIMARY KEY,
  parcel_id VARCHAR(20) UNIQUE NOT NULL,
  owner_name VARCHAR(200),
  address VARCHAR(300),
  legal_description TEXT,
  land_value DECIMAL(12,2),
  improvement_value DECIMAL(12,2),
  total_value DECIMAL(12,2),
  geometry GEOMETRY(MultiPolygon, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for fast queries
CREATE INDEX idx_parcels_geometry ON benton.parcels USING GIST (geometry);
CREATE INDEX idx_parcels_parcel_id ON benton.parcels (parcel_id);
```

## Security

- **County Schema Isolation**: Each county can only access its own schema
- **Read-Only by Default**: MCP server provides read-only access unless explicitly approved
- **Audit Logging**: All spatial queries logged to audit trail
- **Rate Limiting**: Maximum 100 queries per hour per session
- **Approval Required**: Write operations require MCP approval artifact
