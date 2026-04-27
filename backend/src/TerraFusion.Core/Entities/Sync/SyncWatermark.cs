using System;

namespace TerraFusion.Core.Entities.Sync;

/// <summary>
/// Per-county, per-source-system, per-entity-type cursor used by delta sync to resume
/// from the last successful point. One row per (CountyId, SourceSystem, EntityType).
/// </summary>
public sealed class SyncWatermark
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";
    public string EntityType { get; set; } = "Parcel";

    public DateTimeOffset? LastSuccessfulModifiedUtc { get; set; }
    public string? LastSourceToken { get; set; }
    public Guid? LastSuccessfulBatchId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
