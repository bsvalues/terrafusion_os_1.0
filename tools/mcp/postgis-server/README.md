# TerraFusion MCP PostGIS Server

## Overview

The TerraFusion MCP PostGIS Server exposes PostGIS spatial queries as Claude-accessible tools via the Model Context Protocol (MCP). This enables AI agents to perform spatial queries against the TerraFusion property database without direct database access.

## What It Does

- **Exposes PostGIS spatial queries** to Claude through MCP tools
- **Provides secure, validated access** to spatial data
- **Returns GeoJSON-formatted results** for easy consumption
- **Supports complex spatial operations** without SQL knowledge

## Supported Queries

### 1. `parcel_search`
Search for parcels by ID or address.

**Input:**
```json
{
  "parcelId": "string (optional)",
  "address": "string (optional)"
}
```

**Output:** GeoJSON Feature with parcel geometry and metadata

### 2. `spatial_intersection`
Find all parcels intersecting a given polygon.

**Input:**
```json
{
  "polygon": "GeoJSON Polygon"
}
```

**Output:** Array of GeoJSON Features (parcels)

### 3. `nearest_parcels`
Find parcels within a radius of a point.

**Input:**
```json
{
  "latitude": "number",
  "longitude": "number",
  "radiusMeters": "number (default: 1000)"
}
```

**Output:** Array of GeoJSON Features sorted by distance

## Setup Instructions

### Prerequisites

- Node.js 18+ with pnpm
- PostgreSQL 15+ with PostGIS 3.4+
- TerraFusion database with spatial data

### Environment Variables

Create a `.env` file in the server directory:

```env
# Database Connection
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=terrafusion_os
DATABASE_USER=terrafusion
DATABASE_PASSWORD=your_password

# MCP Server Config
MCP_SERVER_PORT=3100
MCP_LOG_LEVEL=info

# Security
MAX_QUERY_RESULTS=1000
QUERY_TIMEOUT_MS=30000
```

### Installation

```bash
cd tools/mcp/postgis-server
pnpm install
```

### Development

```bash
# Start development server with hot reload
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start
```

### Claude Desktop Configuration

Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "terrafusion-postgis": {
      "command": "node",
      "args": [
        "/path/to/terrafusion_os_1.0/tools/mcp/postgis-server/dist/index.js"
      ],
      "env": {
        "DATABASE_HOST": "localhost",
        "DATABASE_PORT": "5432",
        "DATABASE_NAME": "terrafusion_os",
        "DATABASE_USER": "terrafusion",
        "DATABASE_PASSWORD": "your_password"
      }
    }
  }
}
```

## Usage Examples

### From Claude Desktop

Once configured, Claude can use these tools directly:

```
"Find all parcels within 500 meters of 46.2396° N, 119.1014° W"
→ Uses nearest_parcels tool

"Show me parcels intersecting this polygon: [coordinates]"
→ Uses spatial_intersection tool

"Look up parcel 123456"
→ Uses parcel_search tool
```

## Security

- **Parameterized queries only** - No SQL injection vulnerabilities
- **Query timeouts** - Prevents long-running queries
- **Result limits** - Maximum 1000 results per query
- **Read-only access** - No write operations exposed
- **County isolation** - Queries respect county context when available

## Architecture

```
tools/mcp/postgis-server/
├── src/
│   ├── index.ts                    # MCP server entry point
│   ├── queries/
│   │   ├── parcel-search.ts        # Parcel lookup query
│   │   ├── spatial-intersection.ts # Intersection query
│   │   └── nearest-parcels.ts      # Proximity query
│   └── types.ts                    # TypeScript definitions
├── package.json
├── tsconfig.json
└── README.md
```

## Testing

```bash
# Run unit tests
pnpm test

# Test MCP integration
tdc mcp test

# Validate PostGIS queries
pnpm run test:queries
```

## Troubleshooting

### Connection Issues

```bash
# Verify PostgreSQL is running
pg_isready -h localhost -p 5432

# Test database connection
psql -h localhost -U terrafusion -d terrafusion_os -c "SELECT PostGIS_Version();"
```

### Query Performance

- Ensure spatial indexes exist: `CREATE INDEX idx_parcels_geom ON parcels USING GIST(geometry);`
- Monitor query execution: Set `MCP_LOG_LEVEL=debug`
- Check slow queries: `EXPLAIN ANALYZE` in PostgreSQL

### MCP Registration

```bash
# Verify MCP server is running
curl http://localhost:3100/health

# Check Claude Desktop logs
tail -f ~/Library/Logs/Claude/mcp-server-terrafusion-postgis.log
```

## Government Compliance

- **FISMA-HIGH compliant** - Audit logging for all queries
- **County isolation** - Multi-tenant aware queries
- **Data sovereignty** - Respects county boundaries
- **Rate limiting** - Prevents abuse

## Related Documentation

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [TerraFusion Spatial Architecture](../../../docs/architecture/spatial-layer.md)

---

**Version:** 1.0.0  
**Status:** Production Ready  
**Compliance:** FISMA-HIGH  
**Last Updated:** February 2026
