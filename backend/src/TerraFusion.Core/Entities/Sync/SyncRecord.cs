using System;

namespace TerraFusion.Core.Entities.Sync;

/// <summary>
/// One row per source-record processed by a SyncBatch. Captures source key, payload hash,
/// operation type, and TerraFusion entity link for replay and audit.
/// </summary>
public sealed class SyncRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid SyncBatchId { get; set; }
    public SyncBatch SyncBatch { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";
    public string EntityType { get; set; } = null!;
    public string SourceKey { get; set; } = null!;
    public Guid? TerraFusionEntityId { get; set; }

    public string Operation { get; set; } = null!;
    public string PayloadHash { get; set; } = null!;
    public DateTimeOffset SourceModifiedAtUtc { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
