using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Entities.Sync;

/// <summary>
/// Durable record of a single TerraFusion Sync run. One row per sync invocation.
/// </summary>
public sealed class SyncBatch
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";
    public string Mode { get; set; } = "delta";
    public string Status { get; set; } = "running";

    public DateTimeOffset StartedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAtUtc { get; set; }

    public int ReadCount { get; set; }
    public int InsertedCount { get; set; }
    public int UpdatedCount { get; set; }
    public int SkippedCount { get; set; }
    public int QuarantinedCount { get; set; }
    public int FailedCount { get; set; }

    public string? SourceChecksum { get; set; }
    public string? FailureMessage { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public ICollection<SyncRecord> Records { get; set; } = new List<SyncRecord>();
    public ICollection<SyncQuarantine> QuarantineItems { get; set; } = new List<SyncQuarantine>();
}
