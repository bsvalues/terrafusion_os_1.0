using System;

namespace TerraFusion.Core.Entities.Sync.Profile;

/// <summary>
/// One row per source-system trigger discovered by the Atlas profiler.
/// Triggers encode silent business rules — surface them so an assessor can audit.
/// </summary>
public sealed class SyncProfileTrigger
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid SyncBatchId { get; set; }
    public SyncBatch SyncBatch { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";

    public string SchemaName { get; set; } = "dbo";
    public string TriggerName { get; set; } = null!;
    public string ParentTableName { get; set; } = null!;

    public bool IsInsteadOf { get; set; }
    public bool IsAfter { get; set; }

    /// <summary>Comma-separated list of triggering events: INSERT, UPDATE, DELETE.</summary>
    public string Events { get; set; } = "INSERT";

    public string Definition { get; set; } = null!;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
