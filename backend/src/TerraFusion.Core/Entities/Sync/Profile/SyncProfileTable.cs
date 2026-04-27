using System;

namespace TerraFusion.Core.Entities.Sync.Profile;

/// <summary>
/// One row per source-system table or view discovered by the Atlas profiler.
/// Metadata only — no source data is read into this row.
/// </summary>
public sealed class SyncProfileTable
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid SyncBatchId { get; set; }
    public SyncBatch SyncBatch { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";

    public string SchemaName { get; set; } = "dbo";
    public string TableName { get; set; } = null!;

    public bool IsView { get; set; }

    public long? RowCountEstimate { get; set; }
    public int ColumnCount { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
