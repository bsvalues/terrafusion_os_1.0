# PACS Integration Guide (TMR-151)

## Overview

TerraFusion DataMining integrates with Harris PACS 9.0 for property assessment data. This document covers configuration, data flow, and operational procedures.

**IMPORTANT**: Never modify Harris PACS integration without county approval.

## Configuration

All connection details are read from environment variables or `appsettings.json`. No credentials are stored in code.

### Required Configuration Keys

| Key | Description | Source |
|-----|-------------|--------|
| `DataSources:pacs:Endpoint` | PACS server URL | Environment / Config |
| `DataSources:pacs:ApiKey` | API authentication key | Environment / Secret Store |
| `DataSources:pacs:CountyCode` | County identifier | Config |

### Environment Variables

```bash
export DATASOURCES__PACS__ENDPOINT="https://pacs-server.example.com/api"
export DATASOURCES__PACS__APIKEY="<from-secure-vault>"
export DATASOURCES__PACS__COUNTYCODE="benton"
```

## Data Flow

1. `PacsServerRunner` validates configuration via `IConfiguration`
2. Connectivity check against the configured endpoint
3. Data sync pulls records filtered by county code
4. Records are written to the DataMining store with audit fields

## Key Classes

- `Scripts/PacsServerRunner.cs` - Server connectivity and sync
- `Seeds/DataSourceInit.cs` - Configuration validation
- `Connectors/` - PACS connector implementations

## County Data Isolation

All PACS data operations enforce Sovereign County isolation. Queries always filter by the authenticated user's `CountyId`.

## Troubleshooting

- **"PACS server not configured"**: Verify `DataSources:pacs:Endpoint` is set
- **Connection timeout**: Check network access to the PACS server
- **Auth failures**: Verify API key in secure configuration store
