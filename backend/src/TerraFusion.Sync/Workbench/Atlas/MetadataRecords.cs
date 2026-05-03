namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// Metadata DTOs and interface returned by <see cref="IMetadataReader"/>.
///
/// These are pure data records — no CountyId, no SyncBatchId. The orchestrator
/// (Slice B1.4) maps these onto SyncProfile* entities with proper county/batch
/// scoping. This separation keeps the reader testable in isolation without
/// requiring a live TerraFusion DB.
/// </summary>
public sealed record TableMetadata(
    string SchemaName,
    string TableName,
    bool IsView,
    long? RowCountEstimate,
    int ColumnCount);

public sealed record ColumnMetadata(
    string SchemaName,
    string TableName,
    string ColumnName,
    int OrdinalPosition,
    string DataType,
    int? MaxLength,
    int? NumericPrecision,
    int? NumericScale,
    bool IsNullable,
    bool IsPrimaryKey,
    bool IsForeignKey,
    string? DefaultValue);

public sealed record ViewMetadata(
    string SchemaName,
    string ViewName,
    string Definition);

public sealed record ProcedureMetadata(
    string SchemaName,
    string ProcedureName,
    string Definition);

public sealed record UdfMetadata(
    string SchemaName,
    string FunctionName,
    string FunctionType,
    string Definition);

public sealed record TriggerMetadata(
    string SchemaName,
    string TriggerName,
    string ParentTableName,
    bool IsAfter,
    bool IsInsteadOf,
    string Events,
    string Definition);

public sealed record ConstraintMetadata(
    string SchemaName,
    string TableName,
    string ConstraintName,
    string ConstraintType,
    string? Definition,
    string? ReferencedTable,
    string? ReferencedColumns);

/// <summary>
/// Reads source-system schema metadata. Implementations are connector-specific
/// (SQL Server today; ODBC / flat-file / Informix later).
///
/// Read methods are read-only — no source data is touched, no source rows are
/// modified. Profile mode is metadata-only by design (Slice B1 contract).
/// </summary>
public interface IMetadataReader
{
    Task<IReadOnlyList<TableMetadata>> ReadTablesAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ColumnMetadata>> ReadColumnsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ViewMetadata>> ReadViewsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ProcedureMetadata>> ReadProceduresAsync(CancellationToken ct = default);
    Task<IReadOnlyList<UdfMetadata>> ReadUdfsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<TriggerMetadata>> ReadTriggersAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ConstraintMetadata>> ReadConstraintsAsync(CancellationToken ct = default);
}
