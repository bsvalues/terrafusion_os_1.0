using System;

namespace TerraFusion.Core.Entities.Sync.Profile;

/// <summary>
/// Per-table data-profile statistics produced by the B2 deep-profile pass
/// (separate from B1's structural atlas). One row per discovered table per
/// SyncBatch. Persisted alongside <see cref="SyncProfileTable"/> so the
/// operator can answer "how big is this table, and was the row count exact
/// or estimated?" without re-querying the source.
///
/// Sampling strategy (B2.0 decision, locked):
///   - Tables with <see cref="RowCount"/> &lt;= <c>100_000</c> are profiled
///     in FULL — every row participates in column stats.
///   - Tables larger than that are sampled via SQL Server
///     <c>TABLESAMPLE BERNOULLI(N)</c> with N chosen to land near
///     <c>10_000</c> rows. <see cref="SampleRowCount"/> records the
///     actual sample size; <see cref="SamplingMethod"/> records which
///     branch was taken so downstream consumers can tell exact stats
///     from estimated ones.
///   - <see cref="RowCount"/> itself comes from <c>sys.partitions</c>
///     for sampled tables (fast, approximate) and from a real
///     <c>SELECT COUNT(*)</c> for fully-profiled tables. The
///     <see cref="RowCountIsExact"/> flag distinguishes the two.
/// </summary>
public sealed class SyncProfileTableStats
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    public Guid SyncBatchId { get; set; }
    public SyncBatch SyncBatch { get; set; } = null!;

    public string SourceSystem { get; set; } = "PACS";

    public string SchemaName { get; set; } = "dbo";
    public string TableName { get; set; } = null!;

    /// <summary>
    /// Total rows in the source table at profile time. Exact for fully-profiled
    /// tables; estimated (from <c>sys.partitions</c>) for sampled tables —
    /// <see cref="RowCountIsExact"/> distinguishes.
    /// </summary>
    public long RowCount { get; set; }

    /// <summary>True when <see cref="RowCount"/> came from a real COUNT(*); false when estimated.</summary>
    public bool RowCountIsExact { get; set; }

    /// <summary>
    /// Number of rows actually sampled into column-level stats. Equals
    /// <see cref="RowCount"/> for fully-profiled tables; smaller for sampled.
    /// </summary>
    public int SampleRowCount { get; set; }

    /// <summary>
    /// One of: <c>"Full"</c>, <c>"BernoulliSample"</c>. Stored as string
    /// rather than enum so the DTO surface and downstream tooling don't
    /// have to chase an enum mapping in a domain that may grow more
    /// strategies later.
    /// </summary>
    public string SamplingMethod { get; set; } = "Full";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
