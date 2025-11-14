# TerraFusion Sync - Benton County Legacy Integration Plan
*Strategic roadmap for Harris PACS → TerraFusion data synchronization*

## 🎯 Integration Architecture

### Current Infrastructure
- **Modern Stack**: Benton County Docker (PostgreSQL + TerraFusion API)
- **Legacy System**: Harris PACS clone (`pacs-server-benton.code-workspace`)
- **Sync Engine**: TerraFusion.Sync service (enhanced implementation needed)

### Data Flow Strategy
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Legacy PACS   │◄──►│ TerraFusion     │◄──►│ Modern TF Stack │
│   (Read-Only)   │    │ Sync Engine     │    │ (PostgreSQL)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
    Property Data          Real-time Sync          Modern APIs
    Permit Records         Conflict Resolution     County Services
    Assessment History     Data Transformation     Citizen Portal
```

## 📋 Implementation Phases

### Phase 1: TerraFusion Sync Enhancement (Days 1-3)

**1.1 Core Sync Services**
```csharp
// TerraFusion.Sync/Services/
├── ILegacySystemConnector.cs          // Generic legacy integration
├── HarrisPACSConnector.cs             // Harris-specific implementation
├── BentonCountyDataBridge.cs          // County sync orchestration
├── PropertyDataSynchronizer.cs        // Property record sync
├── PermitDataSynchronizer.cs          // Permit workflow sync
├── LegacySystemHealthMonitor.cs       // Connection monitoring
└── DataConflictResolver.cs            // Merge strategy engine
```

**1.2 Configuration Architecture**
```yaml
# counties/benton/sync/pacs-sync-config.yml
legacy_systems:
  harris_pacs:
    connection_string: "Server=${LEGACY_PACS_HOST};Database=PACS;..."
    sync_mode: "real_time"          # real_time | scheduled | on_demand
    conflict_resolution: "modern_wins"  # modern_wins | legacy_wins | merge

sync_schedules:
  properties:
    interval: "5m"                  # Every 5 minutes
    batch_size: 100
    priority: "high"

  permits:
    interval: "15m"                 # Every 15 minutes
    batch_size: 50
    priority: "medium"

data_mappings:
  property:
    legacy_table: "PROPERTIES"
    modern_table: "Properties"
    key_mapping:
      "PARCEL_ID": "ParcelNumber"
      "OWNER_NAME": "OwnerName"
      "TAX_VALUE": "AssessedValue"
```

**1.3 Health Check Integration**
```csharp
// Add to TerraFusion.API health checks
builder.Services.AddHealthChecks()
    .AddCheck<LegacyPACSHealthCheck>("legacy_pacs", tags: new[] { "ready", "legacy" })
    .AddCheck<TerraFusionSyncHealthCheck>("sync_engine", tags: new[] { "ready", "sync" });
```

### Phase 2: Legacy Database Connection (Days 4-5)

**2.1 PACS Database Schema Analysis**
```sql
-- Analyze Harris PACS structure
USE PACS;

-- Key tables for property assessment
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('PROPERTIES', 'OWNERS', 'ASSESSMENTS', 'PERMITS', 'PARCELS')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- Sample data extraction
SELECT TOP 10 * FROM PROPERTIES;
SELECT TOP 10 * FROM PERMITS;
```

**2.2 Enhanced Docker Compose for Legacy**
```yaml
# counties/benton/docker-compose.legacy.yml
version: '3.8'

services:
  # Extend existing stack
  legacy-pacs-proxy:
    image: mcr.microsoft.com/mssql-tools
    container_name: benton-pacs-proxy
    environment:
      PACS_HOST: ${LEGACY_PACS_HOST}
      PACS_DATABASE: ${LEGACY_PACS_DATABASE}
    networks:
      - benton-net
    command: |
      sh -c "
        # Wait for PACS availability then create read-only connection
        sqlcmd -S ${PACS_HOST} -d ${PACS_DATABASE} -Q 'SELECT 1'
      "
    depends_on:
      - api

  # Enhanced API with legacy sync
  api:
    environment:
      # Add legacy connection
      LEGACY_PACS_CONNECTION: "Server=${LEGACY_PACS_HOST};Database=${LEGACY_PACS_DATABASE};User Id=${LEGACY_PACS_USER};Password=${LEGACY_PACS_PASSWORD};TrustServerCertificate=true;"
      TERRAFUSION_SYNC_ENABLED: "true"
      SYNC_INTERVAL_MINUTES: "5"
```

### Phase 3: Data Synchronization Engine (Days 6-8)

**3.1 Real-Time Sync Implementation**
```csharp
// TerraFusion.Sync/Services/PropertyDataSynchronizer.cs
public class PropertyDataSynchronizer : BackgroundService
{
    private readonly ILegacySystemConnector _legacyConnector;
    private readonly ITerraFusionDbContext _modernDb;
    private readonly ILogger<PropertyDataSynchronizer> _logger;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Check for changes in legacy system
                var legacyChanges = await _legacyConnector.GetPropertyChangesAsync(DateTime.UtcNow.AddMinutes(-5));

                foreach (var change in legacyChanges)
                {
                    // Transform legacy format → modern format
                    var modernProperty = await TransformPropertyAsync(change);

                    // Apply conflict resolution
                    await ResolveConflictsAndSyncAsync(modernProperty);
                }

                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Property sync cycle failed");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }
}
```

**3.2 Bidirectional Sync Strategy**
```csharp
// Sync priority rules
public enum SyncDirection
{
    LegacyToModern,    // PACS → TerraFusion (assessment data)
    ModernToLegacy,    // TerraFusion → PACS (citizen updates)
    Bidirectional      // Both ways with conflict resolution
}

// Data type sync rules
var syncRules = new Dictionary<string, SyncRule>
{
    ["Properties"] = new SyncRule
    {
        Direction = SyncDirection.LegacyToModern,
        ConflictResolution = ConflictStrategy.LegacyWins,  // PACS is authoritative for assessments
        SyncInterval = TimeSpan.FromMinutes(5)
    },

    ["CitizenRequests"] = new SyncRule
    {
        Direction = SyncDirection.ModernToLegacy,
        ConflictResolution = ConflictStrategy.ModernWins,  // Citizens use modern portal
        SyncInterval = TimeSpan.FromMinutes(1)
    }
};
```

### Phase 4: Operational Integration (Days 9-10)

**4.1 Monitoring & Alerting**
```csharp
// Add to Prometheus metrics
public class TerraFusionSyncMetrics
{
    private readonly Counter _syncOperationsTotal;
    private readonly Histogram _syncDuration;
    private readonly Gauge _legacySystemHealth;
    private readonly Counter _conflictResolutionsTotal;

    public void RecordSyncOperation(string operation, bool success, TimeSpan duration)
    {
        _syncOperationsTotal.WithLabels(operation, success ? "success" : "failure").Inc();
        _syncDuration.WithLabels(operation).Observe(duration.TotalSeconds);
    }
}
```

**4.2 Enhanced Health Endpoints**
```http
GET /api/sync/health
{
  "status": "healthy",
  "legacy_systems": {
    "harris_pacs": {
      "status": "connected",
      "last_sync": "2025-11-06T12:34:56Z",
      "records_synced": 1847,
      "conflicts_resolved": 3
    }
  },
  "sync_queues": {
    "properties_pending": 0,
    "permits_pending": 2
  }
}

GET /api/sync/status/{county}
{
  "county": "benton",
  "sync_enabled": true,
  "last_full_sync": "2025-11-06T08:00:00Z",
  "incremental_sync_interval": "5m",
  "health_score": 98.5,
  "data_freshness": {
    "properties": "2m ago",
    "permits": "1m ago",
    "assessments": "30s ago"
  }
}
```

## 🚀 Implementation Priority

### **Immediate Next Steps (This Week):**
1. **Enhance TerraFusion.Sync Services** - Implement core sync architecture
2. **PACS Database Analysis** - Connect to legacy system and map schema
3. **Benton County Sync Configuration** - Set up county-specific sync rules
4. **Health Check Integration** - Add legacy system monitoring

### **Week 2 Priority:**
1. **Real-Time Property Sync** - Live property data synchronization
2. **Permit Workflow Integration** - Bidirectional permit processing
3. **Conflict Resolution Testing** - Handle data merge scenarios
4. **Performance Optimization** - Batch processing and queue management

### **Production Readiness (Week 3):**
1. **Monitoring Dashboard** - Sync status visibility for ops
2. **Alert Configuration** - Legacy system health alerting
3. **Backup Sync Strategy** - Fallback when legacy unavailable
4. **Documentation** - Operational runbooks for county staff

## 📊 Success Metrics

- **Data Freshness**: Property updates sync within 5 minutes
- **Availability**: 99.9% sync service uptime
- **Accuracy**: <0.1% data conflicts requiring manual resolution
- **Performance**: <10s P95 for sync operations
- **Monitoring**: Complete visibility into legacy system health

This approach gives you a **production-grade legacy integration** while maintaining the modern TerraFusion architecture. The key is treating the Harris PACS clone as a **read-mostly source of truth** for assessment data while allowing the modern system to handle citizen services and workflow improvements.

Ready to implement Phase 1?
