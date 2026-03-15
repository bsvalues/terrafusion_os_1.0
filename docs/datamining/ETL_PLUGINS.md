# ETL Plugin Development Guide (TMR-154)

## Overview

TerraFusion DataMining supports ETL (Extract, Transform, Load) plugins for integrating external data sources. This guide covers plugin architecture, development, and registration.

## Plugin Architecture

Each ETL plugin implements a standard interface for data extraction, transformation, and loading.

### Plugin Interface

```csharp
public interface IEtlPlugin
{
    string SourceId { get; }
    string DisplayName { get; }
    Task<EtlResult> ExecuteAsync(EtlContext context, CancellationToken ct);
    Task<bool> ValidateConfigAsync();
}
```

### EtlContext

```csharp
public class EtlContext
{
    public string CountyId { get; set; }        // Required: county isolation
    public IConfiguration Configuration { get; set; }
    public DateTime? SinceDate { get; set; }     // Incremental sync
    public int BatchSize { get; set; } = 1000;
}
```

## Creating a Plugin

1. Create a class in `backend/src/TerraFusion.DataMining/ETL/`
2. Implement `IEtlPlugin`
3. Read all config from `IConfiguration` (no hardcoded credentials)
4. Register in DI container

### Example

```csharp
public class MyDataSourceEtl : IEtlPlugin
{
    public string SourceId => "my-source";
    public string DisplayName => "My Data Source";

    public async Task<EtlResult> ExecuteAsync(EtlContext context, CancellationToken ct)
    {
        // 1. Extract: fetch data from external source
        // 2. Transform: normalize, validate, deduplicate
        // 3. Load: write to DataMining store with county isolation
        return new EtlResult { RecordsProcessed = 0 };
    }

    public Task<bool> ValidateConfigAsync()
    {
        // Verify required config keys are present
        return Task.FromResult(true);
    }
}
```

## Built-in Plugins

| Plugin | Source ID | Description |
|--------|-----------|-------------|
| ATTOM | `attom` | Property and market data |
| PACMLS | `pacmls` | MLS listing data |
| Zillow | `zillow` | Property estimates |
| Benton GIS | `benton-gis` | Spatial/parcel data |
| PACS | `pacs` | Harris PACS assessment data |

## Configuration

All plugins read configuration from the `DataSources:{sourceId}` section:

```json
{
  "DataSources": {
    "my-source": {
      "Endpoint": "https://api.example.com",
      "ApiKey": "<from-env-or-vault>",
      "BatchSize": 500
    }
  }
}
```

## Testing

Use the test patterns in `TerraFusion.DataMining.Tests/`:

- Mock `IConfiguration` with test values
- Use `IHttpClientFactory` with mock handlers
- Verify county isolation is enforced
- Test error handling and retry logic

## Monitoring

ETL pipeline status is exposed via:
- `/api/datamining/etl/status` API endpoint
- `EtlStatusPanel` frontend component
- `MonitoringBackgroundService` health checks
