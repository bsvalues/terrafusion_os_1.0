using System;

namespace TerraFusion.Core.Entities.Sync.Profile;

/// <summary>
/// One row per code-table-shaped column candidate discovered by the Atlas profiler.
/// A column is a code-table candidate when it has low cardinality and/or matches
/// a known PACS code-table naming pattern (prop_type_cd, state_cd, wac_cd, etc.).
/// SampleValues stores up to ~25 distinct values for human inspection.
/// </summary>
public sealed class SyncProfileCode
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid SyncBatchId { get; set; }
    public SyncBatch SyncBatch { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";

    public string SchemaName { get; set; } = "dbo";
    public string TableName { get; set; } = null!;
    public string ColumnName { get; set; } = null!;

    public int DistinctValueCount { get; set; }
    public bool IsCodeTableCandidate { get; set; }

    /// <summary>Up to ~25 distinct values, comma-separated, for human inspection.</summary>
    public string? SampleValues { get; set; }

    /// <summary>If a corresponding lookup table exists in source, its name.</summary>
    public string? LookupTableName { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
