# TerraFusion PostGIS MCP Server

Model Context Protocol server exposing PostGIS geospatial capabilities for TerraFusion OS property boundary queries, spatial analysis, and distance calculations.

## Overview

The PostGIS MCP Server provides AI agents (Claude, etc.) with structured tool calling access to TerraFusion's geospatial property data stored in PostGIS. All queries enforce county isolation for multi-tenant security.

**Architecture:**
- **MCP SDK**: Protocol layer for AI agent communication
- **PostgreSQL/PostGIS**: Spatial database with property geometries
- **County Isolation**: All queries filter by CountyId (REQUIRED)
- **GeoJSON Output**: Standard format for geospatial data exchange

## Features

### 4 Core Tools

1. **queryParcelsByBoundary** - Find parcels within polygon
2. **checkBoundaryIntersection** - Check if boundaries intersect
3. **calculateDistance** - Distance between points/parcels
4. **getParcelGeometry** - Get GeoJSON for parcel

### Security

- **County Isolation**: Every query requires `countyId` parameter
- **Geometry Validation**: Invalid geometries rejected with errors
- **Query Limits**: Configurable max results (default: 1000)
- **Timeout Protection**: Query timeout prevents resource exhaustion

### Performance

- **Connection Pooling**: Shared PostgreSQL pool (max 20 connections)
- **Query Optimization**: PostGIS spatial indexes used automatically
- **Slow Query Logging**: Queries >1s logged for monitoring
- **Geometry Simplification**: Optional simplification for large polygons

## Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+ with PostGIS 3.3+
- TerraFusion database with `Properties` table containing `Geometry` column

### Setup

```bash
# Navigate to MCP server directory
cd tools/mcp-servers/postgis

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Build TypeScript
npm run build

# Test connection
npm start
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# PostgreSQL Connection
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=terrafusion
POSTGRES_USER=terrafusion_user
POSTGRES_PASSWORD=your_secure_password

# Or use connection string
DATABASE_URL=postgresql://user:password@localhost:5432/terrafusion

# County Isolation (leave empty for all counties)
ALLOWED_COUNTY_IDS=

# Query Limits
MAX_RESULTS_PER_QUERY=1000
QUERY_TIMEOUT_MS=30000
```

## Usage

### Tool 1: queryParcelsByBoundary

Find all parcels within a polygon boundary.

**Input Schema:**
```json
{
  "countyId": 1,
  "boundaryWkt": "POLYGON((-119.5 46.2, -119.4 46.2, -119.4 46.3, -119.5 46.3, -119.5 46.2))",
  "limit": 100
}
```

**Output:**
```json
{
  "success": true,
  "countyId": 1,
  "totalResults": 42,
  "limit": 100,
  "queryTimeMs": 145,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "id": "1-0001-001",
        "geometry": {
          "type": "Polygon",
          "coordinates": [...]
        },
        "properties": {
          "parcelId": "1-0001-001",
          "address": "123 Main St, Kennewick WA",
          "assessedValue": 325000,
          "acreage": 0.25,
          "areaSqm": 1012.5
        }
      }
    ]
  }
}
```

### Tool 2: checkBoundaryIntersection

Check if two parcels have intersecting boundaries.

**Input Schema:**
```json
{
  "countyId": 1,
  "parcelId1": "1-0001-001",
  "parcelId2": "1-0001-002",
  "returnGeometry": false
}
```

**Output:**
```json
{
  "success": true,
  "countyId": 1,
  "parcelId1": "1-0001-001",
  "parcelId2": "1-0001-002",
  "intersects": true,
  "overlaps": false,
  "touches": true,
  "intersectionAreaSqm": 0,
  "queryTimeMs": 87,
  "analysis": {
    "type": "touch",
    "description": "Parcels share a common boundary (adjacent)"
  }
}
```

### Tool 3: calculateDistance

Calculate distance between two points or parcels.

**Input Schema (Parcel-to-Parcel):**
```json
{
  "countyId": 1,
  "fromType": "parcel",
  "fromValue": "1-0001-001",
  "toType": "parcel",
  "toValue": "1-0002-005",
  "unit": "meters"
}
```

**Input Schema (Point-to-Parcel):**
```json
{
  "countyId": 1,
  "fromType": "point",
  "fromValue": "46.2084,-119.1367",
  "toType": "parcel",
  "toValue": "1-0001-001",
  "unit": "kilometers"
}
```

**Output:**
```json
{
  "success": true,
  "countyId": 1,
  "from": {
    "type": "parcel",
    "value": "1-0001-001",
    "parcelId": "1-0001-001",
    "address": "123 Main St"
  },
  "to": {
    "type": "parcel",
    "value": "1-0002-005",
    "parcelId": "1-0002-005",
    "address": "456 Oak Ave"
  },
  "distance": {
    "value": 1250.5,
    "unit": "meters",
    "meters": 1250.5
  },
  "queryTimeMs": 92
}
```

### Tool 4: getParcelGeometry

Get GeoJSON geometry for a specific parcel.

**Input Schema:**
```json
{
  "countyId": 1,
  "parcelId": "1-0001-001",
  "simplify": false,
  "tolerance": 1.0
}
```

**Output:**
```json
{
  "success": true,
  "countyId": 1,
  "parcelId": "1-0001-001",
  "queryTimeMs": 65,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "id": "1-0001-001",
        "geometry": {
          "type": "Polygon",
          "coordinates": [...]
        },
        "properties": {
          "parcelId": "1-0001-001",
          "address": "123 Main St",
          "assessedValue": 325000,
          "acreage": 0.25,
          "areaSqm": 1012.5,
          "perimeterM": 127.3,
          "centroid": {
            "lng": -119.1367,
            "lat": 46.2084
          },
          "boundingBox": {
            "minX": -119.138,
            "minY": 46.207,
            "maxX": -119.135,
            "maxY": 46.209
          }
        }
      }
    ]
  }
}
```

## Integration with Claude

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "terrafusion-postgis": {
      "command": "node",
      "args": [
        "C:\\path\\to\\terrafusion_os_1.0\\tools\\mcp-servers\\postgis\\dist\\index.js"
      ],
      "env": {
        "POSTGRES_HOST": "localhost",
        "POSTGRES_PORT": "5432",
        "POSTGRES_DB": "terrafusion",
        "POSTGRES_USER": "terrafusion_user",
        "POSTGRES_PASSWORD": "your_password"
      }
    }
  }
}
```

## Testing

### Manual Testing (Benton County Example)

```bash
# Start MCP server
npm start

# Send test tool call (via MCP protocol in stdio)
# Example: Find parcels near Benton County Courthouse
{
  "method": "tools/call",
  "params": {
    "name": "queryParcelsByBoundary",
    "arguments": {
      "countyId": 1,
      "boundaryWkt": "POLYGON((-119.139 46.208, -119.136 46.208, -119.136 46.210, -119.139 46.210, -119.139 46.208))",
      "limit": 10
    }
  }
}
```

### Unit Tests

```bash
# Run test suite
npm test

# Run with coverage
npm test -- --coverage
```

## Development

```bash
# Watch mode (auto-rebuild on changes)
npm run dev

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

## Deployment

### Docker Container

See [MCP_POSTGIS_INTEGRATION.md](../../../docs/dev/MCP_POSTGIS_INTEGRATION.md) for Docker and Kubernetes deployment instructions.

### Production Configuration

- Enable connection pooling (default: 20 connections)
- Set `QUERY_TIMEOUT_MS=30000` to prevent long-running queries
- Configure `ALLOWED_COUNTY_IDS` for county restriction
- Enable `LOG_LEVEL=info` for production logging

## Error Handling

All tools return structured error responses:

```json
{
  "success": false,
  "error": "Parcel not found or missing geometry",
  "countyId": 1,
  "parcelId": "INVALID-ID"
}
```

Common error scenarios:
- **Invalid countyId**: Must be positive integer
- **Missing geometry**: Parcel exists but has no geometry data
- **Invalid WKT**: Malformed polygon boundary string
- **Query timeout**: Query exceeded `QUERY_TIMEOUT_MS`
- **Connection failure**: PostgreSQL connection error

## Performance Considerations

- **Spatial Indexes**: Ensure PostGIS spatial indexes exist on `Geometry` column
- **Simplification**: Use `simplify: true` for large polygons (visualization only)
- **Query Limits**: Set reasonable `limit` values (default: 100, max: 1000)
- **Connection Pooling**: Default 20 connections should handle most workloads

## Security

- **County Isolation**: ALL queries require `countyId` parameter
- **Input Validation**: All parameters validated before query execution
- **SQL Injection Protection**: Parameterized queries only (no string concatenation)
- **Geometry Validation**: PostGIS validates all WKT input

## Support

For issues or questions:
- Review [MCP_POSTGIS_INTEGRATION.md](../../../docs/dev/MCP_POSTGIS_INTEGRATION.md) for integration details
- Check PostgreSQL logs for database errors
- Enable `DEBUG_TOOLREGISTRY=1` for verbose logging

---

**Version**: 1.0.0  
**Last Updated**: February 13, 2026  
**License**: PROPRIETARY - TerraFusion OS
