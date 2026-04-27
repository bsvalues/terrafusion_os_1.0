namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Pure data records returned by <see cref="IDeepProfileReader"/>. Mirror the
/// shape of <c>SyncProfileTableStats</c> / <c>SyncProfileColumnStats</c> /
/// <c>SyncProfileCodeCandidate</c> entities (Slice B2.1) but carry no
/// CountyId or SyncBatchId — the orchestrator (Slice B2.3) maps these onto
/// entities with proper county/batch scoping. Same shape philosophy as the
/// B1 metadata records: keeps the reader testable without a live
/// TerraFusion DB.
/// </summary>
public sealed record TableStatsRecord(
    string SchemaName,
    string TableName,
    long RowCount,
    bool RowCountIsExact,
    int SampleRowCount,
    string SamplingMethod);

public sealed record ColumnStatsRecord(
    string SchemaName,
    string TableName,
    string ColumnName,
    int ParentRowCount,
    long NullCount,
    decimal NullPct,
    int DistinctCount,
    bool DistinctCountIsExact,
    string? MinValue,
    string? MaxValue,
    string? SampleValuesJson,
    string? TopValuesJson);

public sealed record CodeCandidateRecord(
    string SchemaName,
    string TableName,
    string ColumnName,
    int DistinctCount,
    int SampleSize,
    decimal DistinctRatio,
    string Reason,
    string? CandidateCodesJson);

/// <summary>
/// Caller-supplied minimal column descriptor. The deep-profile reader doesn't
/// re-query <c>sys.columns</c> for column types — Slice B1's structural atlas
/// already has them, and re-querying would race against schema changes mid-run.
/// Caller passes the columns it wants stats for; reader profiles exactly that
/// set in declaration order.
///
/// <para><see cref="DataType"/> is the SQL Server type name as returned by
/// <c>sys.types</c> (e.g. <c>"varchar"</c>, <c>"int"</c>, <c>"datetime2"</c>).
/// Used to decide whether the column is a code-table candidate and whether
/// MIN/MAX coercion to NVARCHAR is safe.</para>
/// </summary>
public sealed record ColumnRef(
    string Name,
    string DataType,
    bool IsNullable);

/// <summary>
/// One table's worth of deep-profile output: the table-level row, the per-
/// column rows, and any code-table candidates the heuristic detected.
/// Returned by <see cref="IDeepProfileReader.ProfileTableAsync"/>.
/// </summary>
public sealed record DeepProfileResult(
    TableStatsRecord Table,
    IReadOnlyList<ColumnStatsRecord> Columns,
    IReadOnlyList<CodeCandidateRecord> CodeCandidates);

/// <summary>
/// Sampling strategy selected for a single table profile run. Internal to the
/// reader but exposed so unit tests can verify the B2.0 decision logic without
/// running against a live SQL Server.
/// </summary>
public sealed record DeepProfileSamplingPlan(
    string Method,         // "Full" | "BernoulliSample"
    int    TargetRowCount, // ~10_000 for Bernoulli; equals RowCount for Full
    decimal? BernoulliPct, // null for Full; the percentage passed to TABLESAMPLE BERNOULLI
    bool   RowCountIsExact);

/// <summary>
/// Reads sample-based deep-profile statistics for a single source table.
///
/// Implementation contract:
///   - Each call profiles ONE table. The orchestrator picks which tables to
///     profile, in what order, and with what concurrency.
///   - The reader is read-only against the source. No source rows are mutated.
///     Profile mode is sample-only by design (Slice B2 contract).
///   - Sampling strategy is chosen per <see cref="DeepProfileSamplingPlan"/>,
///     which encodes the B2.0 decision (Full ≤ 100K rows; BernoulliSample
///     targeting ~10_000 rows otherwise).
///   - Code-candidate detection runs over the produced column stats and
///     fires on text-like or small-int columns where the distinct count is
///     exact (no clamping), &lt;= 100, and &lt; 5% of the sample size.
/// </summary>
public interface IDeepProfileReader
{
    /// <summary>
    /// Profile one table. <paramref name="columns"/> is the set the caller
    /// wants stats for — typically the structural atlas's columns for that
    /// table. The reader does NOT re-query <c>sys.columns</c>.
    /// </summary>
    Task<DeepProfileResult> ProfileTableAsync(
        string schemaName,
        string tableName,
        IReadOnlyList<ColumnRef> columns,
        CancellationToken ct = default);
}
