using System;

namespace TerraFusion.Core.Entities.Sync.Profile;

/// <summary>
/// Code-table candidate detection record produced by the B2 deep-profile pass.
/// One row per (SyncBatch, table, column) where the column looks like it
/// holds a small enumerated value set rather than free-form data.
///
/// Detection heuristic (B2.0 decision, locked):
///   A column is flagged as a candidate when ALL of the following hold on
///   its <see cref="SyncProfileColumnStats"/> sibling:
///     - <c>DataType</c> is text-like (varchar / nvarchar / char / nchar)
///       OR small-int-like (smallint / tinyint).
///     - <c>DistinctCount</c> is exact (i.e. did NOT hit the clamp cap).
///     - <c>DistinctCount &lt;= 100</c>.
///     - <c>DistinctCount / ParentRowCount &lt; 0.05</c>
///       (less than 5% of sampled rows are distinct values).
///   The thresholds are intentionally conservative for the first pass —
///   tighter detection later can graduate candidates into firm code-table
///   mappings during Slice C (Mapping Workbook).
///
/// What this row carries:
///   - <see cref="DistinctCount"/>, <see cref="SampleSize"/>,
///     <see cref="DistinctRatio"/> — the math the heuristic ran on.
///   - <see cref="Reason"/> — short human-readable label for why the
///     column qualified (e.g. "low_cardinality_string").
///   - <see cref="CandidateCodesJson"/> — JSON array of
///     <c>{ "code": "K", "count": 42 }</c> entries, the frequency-ordered
///     distinct values that the operator will turn into a code-table
///     mapping during Slice C. Up to 100 entries — same cap as
///     <see cref="SyncProfileColumnStats.TopValuesJson"/>.
/// </summary>
public sealed class SyncProfileCodeCandidate
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

    public int DistinctCount { get; set; }
    public int SampleSize { get; set; }
    public decimal DistinctRatio { get; set; }

    public string Reason { get; set; } = null!;

    public string? CandidateCodesJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
