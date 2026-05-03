using Microsoft.Data.SqlClient;

namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// SQL Server implementation of <see cref="IMetadataReader"/>. Reads from
/// <c>sys.*</c> catalog views — strictly metadata, never source data.
///
/// The reader does NOT manage the connection's lifetime. The caller (the
/// orchestrator at Slice B1.4) owns connection open/close and any retry
/// policy. This keeps the reader pure and testable.
///
/// Each query is exposed as a public static string constant so unit tests
/// can verify shape (correct sys.* references, no SQL injection vectors)
/// without needing a live SQL Server. Integration tests against a real
/// SQL Server fixture land in Slice B1.6.
/// </summary>
public sealed class SqlServerMetadataReader : IMetadataReader
{
    private readonly SqlConnection _connection;

    public SqlServerMetadataReader(SqlConnection connection)
    {
        ArgumentNullException.ThrowIfNull(connection);
        _connection = connection;
    }

    // ────────────────────────────────────────────────────────────────────
    // SQL queries (public for testability — shape-checked by unit tests)
    // ────────────────────────────────────────────────────────────────────

    public const string TablesSql = @"
SELECT
    SCHEMA_NAME(t.schema_id) AS SchemaName,
    t.name                    AS TableName,
    CAST(0 AS bit)            AS IsView,
    SUM(p.rows)               AS RowCountEstimate,
    COUNT_BIG(c.column_id)    AS ColumnCount
FROM sys.tables t
LEFT JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
LEFT JOIN sys.columns    c ON c.object_id = t.object_id
WHERE t.is_ms_shipped = 0
GROUP BY t.schema_id, t.name
UNION ALL
SELECT
    SCHEMA_NAME(v.schema_id) AS SchemaName,
    v.name                    AS TableName,
    CAST(1 AS bit)            AS IsView,
    NULL                      AS RowCountEstimate,
    COUNT_BIG(c.column_id)    AS ColumnCount
FROM sys.views v
LEFT JOIN sys.columns c ON c.object_id = v.object_id
WHERE v.is_ms_shipped = 0
GROUP BY v.schema_id, v.name
ORDER BY SchemaName, TableName;";

    public const string ColumnsSql = @"
SELECT
    SCHEMA_NAME(o.schema_id) AS SchemaName,
    o.name                    AS TableName,
    c.name                    AS ColumnName,
    c.column_id               AS OrdinalPosition,
    ty.name                   AS DataType,
    CASE WHEN c.max_length = -1 THEN NULL ELSE c.max_length END AS MaxLength,
    c.precision               AS NumericPrecision,
    c.scale                   AS NumericScale,
    c.is_nullable             AS IsNullable,
    CAST(CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END AS bit) AS IsPrimaryKey,
    CAST(CASE WHEN fk.parent_column_id IS NOT NULL THEN 1 ELSE 0 END AS bit) AS IsForeignKey,
    OBJECT_DEFINITION(c.default_object_id) AS DefaultValue
FROM sys.columns c
JOIN sys.objects o ON o.object_id = c.object_id
JOIN sys.types   ty ON ty.user_type_id = c.user_type_id
LEFT JOIN (
    SELECT ic.object_id, ic.column_id
    FROM sys.indexes i
    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    WHERE i.is_primary_key = 1
) pk ON pk.object_id = c.object_id AND pk.column_id = c.column_id
LEFT JOIN sys.foreign_key_columns fk
    ON fk.parent_object_id = c.object_id AND fk.parent_column_id = c.column_id
WHERE o.is_ms_shipped = 0
  AND o.type IN ('U', 'V')
ORDER BY SchemaName, TableName, OrdinalPosition;";

    public const string ViewsSql = @"
SELECT
    SCHEMA_NAME(v.schema_id) AS SchemaName,
    v.name                    AS ViewName,
    OBJECT_DEFINITION(v.object_id) AS Definition
FROM sys.views v
WHERE v.is_ms_shipped = 0
ORDER BY SchemaName, ViewName;";

    public const string ProceduresSql = @"
SELECT
    SCHEMA_NAME(p.schema_id) AS SchemaName,
    p.name                    AS ProcedureName,
    OBJECT_DEFINITION(p.object_id) AS Definition
FROM sys.procedures p
WHERE p.is_ms_shipped = 0
ORDER BY SchemaName, ProcedureName;";

    public const string UdfsSql = @"
SELECT
    SCHEMA_NAME(f.schema_id) AS SchemaName,
    f.name                    AS FunctionName,
    CASE f.type
        WHEN 'FN' THEN 'scalar'
        WHEN 'IF' THEN 'inline-table'
        WHEN 'TF' THEN 'multi-statement-table'
        ELSE f.type COLLATE DATABASE_DEFAULT
    END                       AS FunctionType,
    OBJECT_DEFINITION(f.object_id) AS Definition
FROM sys.objects f
WHERE f.is_ms_shipped = 0
  AND f.type IN ('FN', 'IF', 'TF')
ORDER BY SchemaName, FunctionName;";

    public const string TriggersSql = @"
SELECT
    SCHEMA_NAME(o.schema_id) AS SchemaName,
    tr.name                   AS TriggerName,
    o.name                    AS ParentTableName,
    CAST(CASE WHEN tr.is_instead_of_trigger = 0 THEN 1 ELSE 0 END AS bit) AS IsAfter,
    tr.is_instead_of_trigger  AS IsInsteadOf,
    STUFF((
        SELECT ',' + e.type_desc
        FROM sys.trigger_events e
        WHERE e.object_id = tr.object_id
        FOR XML PATH(''), TYPE
    ).value('.', 'varchar(max)'), 1, 1, '') AS Events,
    OBJECT_DEFINITION(tr.object_id) AS Definition
FROM sys.triggers tr
JOIN sys.objects o ON o.object_id = tr.parent_id
WHERE tr.is_ms_shipped = 0
  AND tr.parent_class = 1
ORDER BY SchemaName, ParentTableName, TriggerName;";

    public const string ConstraintsSql = @"
SELECT
    SCHEMA_NAME(t.schema_id) AS SchemaName,
    t.name                    AS TableName,
    kc.name                   AS ConstraintName,
    CASE kc.type
        WHEN 'PK' THEN 'PRIMARY_KEY'
        WHEN 'UQ' THEN 'UNIQUE'
    END                       AS ConstraintType,
    NULL                      AS Definition,
    NULL                      AS ReferencedTable,
    NULL                      AS ReferencedColumns
FROM sys.key_constraints kc
JOIN sys.tables t ON t.object_id = kc.parent_object_id
WHERE t.is_ms_shipped = 0
UNION ALL
SELECT
    SCHEMA_NAME(t.schema_id),
    t.name,
    fk.name,
    'FOREIGN_KEY',
    NULL,
    OBJECT_NAME(fk.referenced_object_id),
    STUFF((
        SELECT ',' + COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id)
        FROM sys.foreign_key_columns fkc
        WHERE fkc.constraint_object_id = fk.object_id
        FOR XML PATH(''), TYPE
    ).value('.', 'varchar(max)'), 1, 1, '')
FROM sys.foreign_keys fk
JOIN sys.tables t ON t.object_id = fk.parent_object_id
WHERE t.is_ms_shipped = 0
UNION ALL
SELECT
    SCHEMA_NAME(t.schema_id),
    t.name,
    cc.name,
    'CHECK',
    cc.definition,
    NULL,
    NULL
FROM sys.check_constraints cc
JOIN sys.tables t ON t.object_id = cc.parent_object_id
WHERE t.is_ms_shipped = 0
UNION ALL
SELECT
    SCHEMA_NAME(t.schema_id),
    t.name,
    dc.name,
    'DEFAULT',
    dc.definition,
    NULL,
    NULL
FROM sys.default_constraints dc
JOIN sys.tables t ON t.object_id = dc.parent_object_id
WHERE t.is_ms_shipped = 0
ORDER BY SchemaName, TableName, ConstraintType, ConstraintName;";

    // ────────────────────────────────────────────────────────────────────
    // IMetadataReader implementation
    // ────────────────────────────────────────────────────────────────────

    public async Task<IReadOnlyList<TableMetadata>> ReadTablesAsync(CancellationToken ct = default)
    {
        var rows = new List<TableMetadata>();
        await using var cmd = new SqlCommand(TablesSql, _connection);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            rows.Add(new TableMetadata(
                SchemaName: reader.GetString(0),
                TableName: reader.GetString(1),
                IsView: reader.GetBoolean(2),
                RowCountEstimate: reader.IsDBNull(3) ? null : reader.GetInt64(3),
                ColumnCount: (int)reader.GetInt64(4)));
        }
        return rows;
    }

    public async Task<IReadOnlyList<ColumnMetadata>> ReadColumnsAsync(CancellationToken ct = default)
    {
        var rows = new List<ColumnMetadata>();
        await using var cmd = new SqlCommand(ColumnsSql, _connection);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            rows.Add(new ColumnMetadata(
                SchemaName: reader.GetString(0),
                TableName: reader.GetString(1),
                ColumnName: reader.GetString(2),
                OrdinalPosition: reader.GetInt32(3),
                DataType: reader.GetString(4),
                MaxLength: reader.IsDBNull(5) ? null : reader.GetInt16(5),
                NumericPrecision: reader.IsDBNull(6) ? null : (int)reader.GetByte(6),
                NumericScale: reader.IsDBNull(7) ? null : (int)reader.GetByte(7),
                IsNullable: reader.GetBoolean(8),
                IsPrimaryKey: reader.GetBoolean(9),
                IsForeignKey: reader.GetBoolean(10),
                DefaultValue: reader.IsDBNull(11) ? null : reader.GetString(11)));
        }
        return rows;
    }

    public async Task<IReadOnlyList<ViewMetadata>> ReadViewsAsync(CancellationToken ct = default)
    {
        var rows = new List<ViewMetadata>();
        await using var cmd = new SqlCommand(ViewsSql, _connection);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            rows.Add(new ViewMetadata(
                SchemaName: reader.GetString(0),
                ViewName: reader.GetString(1),
                Definition: reader.IsDBNull(2) ? string.Empty : reader.GetString(2)));
        }
        return rows;
    }

    public async Task<IReadOnlyList<ProcedureMetadata>> ReadProceduresAsync(CancellationToken ct = default)
    {
        var rows = new List<ProcedureMetadata>();
        await using var cmd = new SqlCommand(ProceduresSql, _connection);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            rows.Add(new ProcedureMetadata(
                SchemaName: reader.GetString(0),
                ProcedureName: reader.GetString(1),
                Definition: reader.IsDBNull(2) ? string.Empty : reader.GetString(2)));
        }
        return rows;
    }

    public async Task<IReadOnlyList<UdfMetadata>> ReadUdfsAsync(CancellationToken ct = default)
    {
        var rows = new List<UdfMetadata>();
        await using var cmd = new SqlCommand(UdfsSql, _connection);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            rows.Add(new UdfMetadata(
                SchemaName: reader.GetString(0),
                FunctionName: reader.GetString(1),
                FunctionType: reader.GetString(2),
                Definition: reader.IsDBNull(3) ? string.Empty : reader.GetString(3)));
        }
        return rows;
    }

    public async Task<IReadOnlyList<TriggerMetadata>> ReadTriggersAsync(CancellationToken ct = default)
    {
        var rows = new List<TriggerMetadata>();
        await using var cmd = new SqlCommand(TriggersSql, _connection);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            rows.Add(new TriggerMetadata(
                SchemaName: reader.GetString(0),
                TriggerName: reader.GetString(1),
                ParentTableName: reader.GetString(2),
                IsAfter: reader.GetBoolean(3),
                IsInsteadOf: reader.GetBoolean(4),
                Events: reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
                Definition: reader.IsDBNull(6) ? string.Empty : reader.GetString(6)));
        }
        return rows;
    }

    public async Task<IReadOnlyList<ConstraintMetadata>> ReadConstraintsAsync(CancellationToken ct = default)
    {
        var rows = new List<ConstraintMetadata>();
        await using var cmd = new SqlCommand(ConstraintsSql, _connection);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            rows.Add(new ConstraintMetadata(
                SchemaName: reader.GetString(0),
                TableName: reader.GetString(1),
                ConstraintName: reader.GetString(2),
                ConstraintType: reader.GetString(3),
                Definition: reader.IsDBNull(4) ? null : reader.GetString(4),
                ReferencedTable: reader.IsDBNull(5) ? null : reader.GetString(5),
                ReferencedColumns: reader.IsDBNull(6) ? null : reader.GetString(6)));
        }
        return rows;
    }
}
