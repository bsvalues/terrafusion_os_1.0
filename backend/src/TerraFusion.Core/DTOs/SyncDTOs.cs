// TFT-099 — Sync Operation DTOs
// Data transfer objects for canon-sync operations.

namespace TerraFusion.Core.DTOs;

/// <summary>Represents a sync job in progress or completed.</summary>
public sealed record SyncJobDto
{
    /// <summary>Unique job identifier.</summary>
    public required string JobId { get; init; }

    /// <summary>Connector name that sourced the data.</summary>
    public required string ConnectorName { get; init; }

    /// <summary>Current job status (Queued, Running, Completed, Failed, Cancelled).</summary>
    public required string Status { get; init; }

    /// <summary>When the job was created.</summary>
    public DateTime CreatedAt { get; init; }

    /// <summary>When the job started executing.</summary>
    public DateTime? StartedAt { get; init; }

    /// <summary>When the job finished.</summary>
    public DateTime? CompletedAt { get; init; }

    /// <summary>Total records processed.</summary>
    public int RecordsProcessed { get; init; }

    /// <summary>Total records that failed during sync.</summary>
    public int RecordsFailed { get; init; }

    /// <summary>Error message if the job failed.</summary>
    public string? ErrorMessage { get; init; }
}

/// <summary>Result summary of a completed sync operation.</summary>
public sealed record SyncResultDto
{
    /// <summary>The job that produced this result.</summary>
    public required string JobId { get; init; }

    /// <summary>Whether the sync completed successfully.</summary>
    public bool Success { get; init; }

    /// <summary>Total records read from source.</summary>
    public int RecordsRead { get; init; }

    /// <summary>Records written to the target store.</summary>
    public int RecordsWritten { get; init; }

    /// <summary>Records skipped (duplicates, filtered out).</summary>
    public int RecordsSkipped { get; init; }

    /// <summary>Duration of the sync operation.</summary>
    public TimeSpan Duration { get; init; }

    /// <summary>Any warnings generated during sync.</summary>
    public IReadOnlyList<string> Warnings { get; init; } = [];
}

/// <summary>Status snapshot of a single data connector.</summary>
public sealed record ConnectorStatusDto
{
    /// <summary>Connector identifier.</summary>
    public required string Name { get; init; }

    /// <summary>Human-readable display name.</summary>
    public required string DisplayName { get; init; }

    /// <summary>Whether the connector is currently connected.</summary>
    public bool IsConnected { get; init; }

    /// <summary>Last successful sync timestamp.</summary>
    public DateTime? LastSyncAt { get; init; }

    /// <summary>Number of entities exposed by this connector.</summary>
    public int EntityCount { get; init; }
}

/// <summary>Health information for a connector.</summary>
public sealed record ConnectorHealthDto
{
    /// <summary>Connector identifier.</summary>
    public required string Name { get; init; }

    /// <summary>Whether the last health check passed.</summary>
    public bool IsHealthy { get; init; }

    /// <summary>Round-trip latency of the last health check.</summary>
    public TimeSpan Latency { get; init; }

    /// <summary>Uptime percentage over the trailing window.</summary>
    public double UptimePercent { get; init; }

    /// <summary>Timestamp of the last health check.</summary>
    public DateTime CheckedAt { get; init; }

    /// <summary>Error details if unhealthy.</summary>
    public string? ErrorDetail { get; init; }
}

/// <summary>Schedule definition for a recurring sync job.</summary>
public sealed record SyncScheduleDto
{
    /// <summary>Schedule identifier.</summary>
    public required string ScheduleId { get; init; }

    /// <summary>Connector this schedule applies to.</summary>
    public required string ConnectorName { get; init; }

    /// <summary>Cron expression for the schedule.</summary>
    public required string CronExpression { get; init; }

    /// <summary>Whether the schedule is enabled.</summary>
    public bool Enabled { get; init; }

    /// <summary>Next scheduled run time.</summary>
    public DateTime? NextRunAt { get; init; }

    /// <summary>Last run time.</summary>
    public DateTime? LastRunAt { get; init; }
}

/// <summary>Request to trigger a data refresh for a connector.</summary>
public sealed record DataRefreshRequestDto
{
    /// <summary>Target connector name.</summary>
    public required string ConnectorName { get; init; }

    /// <summary>Optional entity filter (sync only specific entities).</summary>
    public IReadOnlyList<string>? Entities { get; init; }

    /// <summary>Whether to force a full refresh (ignore incremental state).</summary>
    public bool ForceFullRefresh { get; init; }

    /// <summary>Optional date filter — sync only records changed since this date.</summary>
    public DateTime? ChangedSince { get; init; }
}
