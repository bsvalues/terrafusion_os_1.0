using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// TerraFusionSync Service Interface - Central orchestration hub for all data synchronization
/// This is the SINGLE SOURCE OF TRUTH for all legacy database coordination
/// </summary>
public interface ITerraFusionSyncService
{
    // Core synchronization methods
    Task<SyncResult> StartSynchronizationAsync(string? specificCounty = null);
    Task<SyncResult> StopSynchronizationAsync();
    Task<SyncStatus> GetSyncStatusAsync();
    Task<bool> IsSyncActiveAsync();

    // Legacy system management
    Task<IEnumerable<LegacySystemInfo>> GetAvailableLegacySystemsAsync();
    Task<bool> RegisterLegacySystemAsync(LegacySystemConfig config);
    Task<bool> UnregisterLegacySystemAsync(string systemId);
    Task<LegacySystemHealth> GetLegacySystemHealthAsync(string systemId);

    // County-specific operations
    Task<CountySyncResult> SyncCountyDataAsync(string countyName, SyncOptions? options = null);
    Task<IEnumerable<CountyInfo>> GetConfiguredCountiesAsync();
    Task<bool> ConfigureCountyAsync(CountyConfig config);

    // Real-time monitoring
    Task<SyncMetrics> GetSyncMetricsAsync();
    Task<IEnumerable<SyncEvent>> GetRecentSyncEventsAsync(int count = 50);
    
    // Data orchestration
    Task<OrchestrationStatus> GetOrchestrationStatusAsync();
    Task<bool> RestartOrchestrationAsync();
}

// Supporting data structures
public class SyncResult
{
    public bool Success { get; set; }
    public DateTime Timestamp { get; set; }
    public int RecordsProcessed { get; set; }
    public int RecordsUpdated { get; set; }
    public int RecordsAdded { get; set; }
    public int RecordsSkipped { get; set; }
    public int ErrorCount { get; set; }
    public List<string> Errors { get; set; } = new();
    public TimeSpan Duration { get; set; }
    public string? CountyName { get; set; }
}

public class SyncStatus
{
    public bool IsActive { get; set; }
    public string CurrentOperation { get; set; } = string.Empty;
    public DateTime? LastSyncTime { get; set; }
    public DateTime? NextScheduledSync { get; set; }
    public int ActiveConnections { get; set; }
    public Dictionary<string, object> Metrics { get; set; } = new();
}

public class LegacySystemInfo
{
    public string SystemId { get; set; } = string.Empty;
    public string SystemName { get; set; } = string.Empty;
    public string SystemType { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public bool IsAvailable { get; set; }
    public bool IsConfigured { get; set; }
    public DateTime LastHealthCheck { get; set; }
    public Dictionary<string, object> Capabilities { get; set; } = new();
}

public class LegacySystemConfig
{
    public string SystemId { get; set; } = string.Empty;
    public string SystemName { get; set; } = string.Empty;
    public string SystemType { get; set; } = string.Empty;
    public string ConnectionString { get; set; } = string.Empty;
    public string? ApiEndpoint { get; set; }
    public string? ApiKey { get; set; }
    public Dictionary<string, string> CustomSettings { get; set; } = new();
    public bool EnableAutoSync { get; set; } = true;
    public TimeSpan SyncInterval { get; set; } = TimeSpan.FromMinutes(15);
}

// LegacySystemHealth is defined in ILegacyDatabaseService.cs

public class CountySyncResult : SyncResult
{
    public new string CountyName { get; set; } = string.Empty;
    public string LegacySystemType { get; set; } = string.Empty;
    public int TotalParcels { get; set; }
    public Dictionary<string, int> RecordTypes { get; set; } = new();
}

public class CountyInfo
{
    public string CountyName { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string LegacySystemType { get; set; } = string.Empty;
    public string LegacySystemId { get; set; } = string.Empty;
    public bool IsConfigured { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastSync { get; set; }
    public int TotalParcels { get; set; }
    public Dictionary<string, object> Configuration { get; set; } = new();
}

public class CountyConfig
{
    public string CountyName { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string LegacySystemId { get; set; } = string.Empty;
    public Dictionary<string, string> ConnectionSettings { get; set; } = new();
    public SyncOptions? DefaultSyncOptions { get; set; }
    public bool EnableAutoSync { get; set; } = true;
    public TimeSpan SyncInterval { get; set; } = TimeSpan.FromMinutes(15);
}

public class SyncOptions
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public List<string> PropertyTypes { get; set; } = new();
    public List<string> DataTypes { get; set; } = new(); // Properties, Assessments, Sales, etc.
    public bool FullSync { get; set; } = false;
    public bool ValidateData { get; set; } = true;
    public int BatchSize { get; set; } = 1000;
    public int MaxRetries { get; set; } = 3;
    public TimeSpan Timeout { get; set; } = TimeSpan.FromMinutes(30);
}

public class SyncMetrics
{
    public DateTime Timestamp { get; set; }
    public int TotalSyncOperations { get; set; }
    public int SuccessfulSyncs { get; set; }
    public int FailedSyncs { get; set; }
    public double AverageResponseTime { get; set; }
    public int TotalRecordsProcessed { get; set; }
    public Dictionary<string, int> CountyMetrics { get; set; } = new();
    public Dictionary<string, int> SystemMetrics { get; set; } = new();
    public List<string> RecentErrors { get; set; } = new();
}

public class SyncEvent
{
    public string EventId { get; set; } = Guid.NewGuid().ToString();
    public DateTime Timestamp { get; set; }
    public string EventType { get; set; } = string.Empty; // Started, Completed, Error, Warning
    public string CountyName { get; set; } = string.Empty;
    public string LegacySystem { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Dictionary<string, object> Details { get; set; } = new();
}

public class OrchestrationStatus
{
    public bool IsRunning { get; set; }
    public DateTime StartTime { get; set; }
    public int ActiveSyncOperations { get; set; }
    public int QueuedOperations { get; set; }
    public Dictionary<string, bool> SystemStatus { get; set; } = new();
    public Dictionary<string, object> PerformanceMetrics { get; set; } = new();
    public string Version { get; set; } = "TerraFusionSync v3.0.0";
}