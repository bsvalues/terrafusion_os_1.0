---
id: tf-mcp-integration
name: TerraFusion MCP Integration
lane: infrastructure
risk: read
status: operational
tags: [mcp, spatial, postgis, claude]
dependencies: []
version: 1.0.0
---

# TerraFusion MCP Integration Skill

## Overview

The TerraFusion MCP Integration skill validates Model Context Protocol (MCP) server configuration and ensures PostGIS spatial queries are properly exposed to Claude AI agents.

## Scope

**Lane:** Infrastructure  
**Risk Level:** Read-only (spatial queries only)  
**Status:** Operational

## Validation Targets

### 1. MCP Server Health
- MCP server is reachable and responsive
- Database connection pool is active
- PostGIS extension is available

### 2. Tool Registration
- All required tools are registered in MCP server
- Tool schemas match expected format
- Input validation is functioning

### 3. Query Execution
- Sample queries execute successfully
- Results are valid GeoJSON
- Query timeouts are enforced
- Result limits are respected

## TDC Command

```bash
# Test MCP server and all registered tools
tdc mcp test

# Test specific tool
tdc mcp test --tool parcel_search

# Validate tool schemas only
tdc mcp test --schemas-only

# Full integration test (requires test database)
tdc mcp test --full
```

## Violation Codes

### TF_MCP_001_SERVER_UNREACHABLE
**Severity:** Critical  
**Description:** MCP server is not responding or cannot be reached

**Causes:**
- Server process not running
- Network connectivity issues
- Port conflict or firewall blocking

**Resolution:**
```bash
# Check server status
ps aux | grep "mcp-postgis-server"

# Check logs
tail -f ~/Library/Logs/Claude/mcp-server-terrafusion-postgis.log

# Restart server
cd tools/mcp/postgis-server
pnpm run dev
```

### TF_MCP_002_INVALID_QUERY
**Severity:** High  
**Description:** PostGIS query failed or returned invalid results

**Causes:**
- Malformed SQL query
- Missing spatial indexes
- Invalid geometry data in database
- Query timeout exceeded

**Resolution:**
```bash
# Validate database schema
psql -d terrafusion_os -c "\d properties"

# Check PostGIS version
psql -d terrafusion_os -c "SELECT PostGIS_Version();"

# Verify spatial indexes
psql -d terrafusion_os -c "
  SELECT indexname, indexdef 
  FROM pg_indexes 
  WHERE tablename = 'properties' 
  AND indexdef LIKE '%gist%'
"

# Create missing index
psql -d terrafusion_os -c "
  CREATE INDEX IF NOT EXISTS idx_properties_geometry 
  ON properties USING GIST(geometry)
"
```

### TF_MCP_003_AUTH_FAILURE
**Severity:** Critical  
**Description:** Database authentication failed

**Causes:**
- Invalid database credentials
- Database user lacks permissions
- Connection limit exceeded

**Resolution:**
```bash
# Test database connection
psql -h localhost -U terrafusion -d terrafusion_os -c "SELECT 1"

# Verify user permissions
psql -d terrafusion_os -c "
  SELECT grantee, privilege_type 
  FROM information_schema.role_table_grants 
  WHERE table_name = 'properties'
"

# Grant required permissions
psql -d terrafusion_os -c "
  GRANT SELECT ON properties TO terrafusion;
  GRANT USAGE ON SCHEMA public TO terrafusion;
"
```

## Test Coverage

### Unit Tests
- Input validation (parcel ID, coordinates, polygon)
- Query generation and parameterization
- GeoJSON serialization
- Error handling

### Integration Tests
- End-to-end MCP tool invocation
- Database query execution
- Result formatting
- Performance benchmarks

### Security Tests
- SQL injection prevention
- Input sanitization
- Query timeout enforcement
- Result set limits

## Performance Benchmarks

| Query Type | Target | Max |
|------------|--------|-----|
| parcel_search (by ID) | < 50ms | 200ms |
| parcel_search (by address) | < 100ms | 500ms |
| spatial_intersection | < 500ms | 2000ms |
| nearest_parcels | < 200ms | 1000ms |

## Required Environment Variables

```bash
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

## Claude Desktop Integration

To enable this MCP server in Claude Desktop, add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "terrafusion-postgis": {
      "command": "node",
      "args": [
        "/absolute/path/to/terrafusion_os_1.0/tools/mcp/postgis-server/dist/index.js"
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

## Troubleshooting

### Server Won't Start
```bash
# Check Node.js version (requires 18+)
node --version

# Install dependencies
cd tools/mcp/postgis-server
pnpm install

# Build TypeScript
pnpm run build

# Start with debug logging
MCP_LOG_LEVEL=debug pnpm start
```

### Queries Timeout
```bash
# Check database performance
psql -d terrafusion_os -c "
  SELECT schemaname, tablename, last_vacuum, last_analyze 
  FROM pg_stat_user_tables 
  WHERE tablename = 'properties'
"

# Run ANALYZE to update statistics
psql -d terrafusion_os -c "ANALYZE properties"

# Increase timeout (development only)
export QUERY_TIMEOUT_MS=60000
```

### Invalid GeoJSON Results
```bash
# Verify geometry validity
psql -d terrafusion_os -c "
  SELECT COUNT(*) 
  FROM properties 
  WHERE NOT ST_IsValid(geometry)
"

# Fix invalid geometries
psql -d terrafusion_os -c "
  UPDATE properties 
  SET geometry = ST_MakeValid(geometry) 
  WHERE NOT ST_IsValid(geometry)
"
```

## Related Documentation

- [MCP Server README](../../mcp/postgis-server/README.md)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [TerraFusion Spatial Architecture](../../../../docs/architecture/spatial-layer.md)

## Change History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-13 | Initial MCP integration skill |

---

**Maintained by:** TerraFusion Infrastructure Team  
**Last Updated:** February 13, 2026
