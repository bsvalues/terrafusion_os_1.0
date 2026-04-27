using System;

namespace TerraFusion.Core.Entities.Sync.Profile;

/// <summary>
/// Per-column data-profile statistics produced by the B2 deep-profile pass.
/// One row per discovered column per <see cref="SyncBatch"/>. Sits next to
/// <see cref="SyncProfileColumn"/> (which carries structural metadata only)
/// so the operator can answer "what does this column actually contain?"
/// without re-querying the source.
///
/// Cardinality / sample-size context:
///   - <see cref="ParentRowCount"/> is the table's stat sample size
///     (i.e., <see cref="SyncProfileTableStats.SampleRowCount"/>) — copied
///     here so column-level analytics don't need a join to interpret
///     null percentage and distinct ratio.
///   - <see cref="DistinctCountIsExact"/> is false when the column's
///     distinct count exceeded the cap (currently 1_000) and was clamped
///     to "&gt;= 1000". Downstream code must not treat clamped values as
///     exact identifiers.
///
/// Sample-value transport:
///   - <see cref="SampleValuesJson"/> is a JSON array of up to 10 random
///     values from the sampled rows, every element string-encoded.
///     CLOB-typed columns are summarized as length+head only (decided per
///     reader heuristic).
///   - <see cref="TopValuesJson"/> is a JSON array of up to 100 objects
///     <c>{ "value": "...", "count": 42 }</c> ordered by count descending
///     — the frequency view that drives code-table candidate detection.
/// </summary>
public sealed class SyncProfileColumnStats
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

    /// <summary>Sample size used as the denominator for null-pct and distinct-ratio math.</summary>
    public int ParentRowCount { get; set; }

    public long NullCount { get; set; }
    public decimal NullPct { get; set; }

    public int DistinctCount { get; set; }
    public bool DistinctCountIsExact { get; set; }

    public string? MinValue { get; set; }
    public string? MaxValue { get; set; }

    public string? SampleValuesJson { get; set; }
    public string? TopValuesJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
