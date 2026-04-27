using System;

namespace TerraFusion.Core.Entities.Sync.Profile;

/// <summary>
/// One row per source-system view discovered by the Atlas profiler.
/// Definition body is preserved so an assessor can read the vendor's view logic
/// (PACS encodes business rules in views; do not lose them at profile time).
/// </summary>
public sealed class SyncProfileView
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid SyncBatchId { get; set; }
    public SyncBatch SyncBatch { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";

    public string SchemaName { get; set; } = "dbo";
    public string ViewName { get; set; } = null!;

    public string Definition { get; set; } = null!;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
