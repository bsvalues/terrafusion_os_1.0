using System;

namespace TerraFusion.Core.Entities.Sync.Profile;

/// <summary>
/// One row per source-system constraint (PK, FK, CHECK, UNIQUE, DEFAULT) discovered
/// by the Atlas profiler. Constraints encode invariants the vendor expects.
/// </summary>
public sealed class SyncProfileConstraint
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid SyncBatchId { get; set; }
    public SyncBatch SyncBatch { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";

    public string SchemaName { get; set; } = "dbo";
    public string TableName { get; set; } = null!;
    public string ConstraintName { get; set; } = null!;

    /// <summary>One of: PRIMARY_KEY, FOREIGN_KEY, CHECK, UNIQUE, DEFAULT.</summary>
    public string ConstraintType { get; set; } = null!;

    public string? Definition { get; set; }
    public string? ReferencedTable { get; set; }
    public string? ReferencedColumns { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
