using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-C: SQL-Server-dialect <see cref="IPacsSchemaIntrospector"/>
/// implementation. Reads <c>INFORMATION_SCHEMA.TABLES</c>,
/// <c>INFORMATION_SCHEMA.COLUMNS</c>, and the
/// <c>INFORMATION_SCHEMA.KEY_COLUMN_USAGE</c> /
/// <c>INFORMATION_SCHEMA.TABLE_CONSTRAINTS</c> join for primary-key
/// membership. Produces a flat <see cref="PacsSchemaIntrospectionResult"/>
/// suitable for <see cref="LivePacsSchemaSource"/> translation.
///
/// <para><b>Validation status:</b> the wrapper logic + SQL queries
/// are not exercised against a live PACS database in C48-C (no
/// connection string available in this slice's test environment).
/// Live-DB validation is deferred to C48-D, which will pair this
/// introspector with the first consumer migration and add an
/// integration test gated on a configured connection string.</para>
///
/// <para>HG observance:</para>
/// <list type="bullet">
/// <item>HG1 PII-free: the queries pull column metadata only, never
/// row data. No <c>SELECT *</c> against any user table.</item>
/// <item>HG2 county-agnostic: the queries scope to the configured
/// SQL schema (default <c>dbo</c>), not to any per-county
/// filter.</item>
/// <item>HG6 source-traceable: each introspected row carries enough
/// information for <see cref="LivePacsSchemaSource"/> to stamp
/// provenance back to the source label + schema.</item>
/// </list>
/// </summary>
public sealed class SqlInformationSchemaIntrospector : IPacsSchemaIntrospector
{
    private readonly string _connectionString;
    private readonly string _schemaName;

    public SqlInformationSchemaIntrospector(string connectionString, string schemaName = "dbo")
    {
        _connectionString = connectionString ?? throw new ArgumentNullException(nameof(connectionString));
        _schemaName = schemaName ?? throw new ArgumentNullException(nameof(schemaName));
    }

    /// <summary>
    /// SQL queries used by the introspector. Exposed as constants so
    /// they can be asserted against in tests without requiring a live
    /// DB connection. <see cref="ReadAsync"/> uses them verbatim.
    /// </summary>
    public static class Queries
    {
        public const string Tables = @"
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = @schema AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME";

        // Slice C48-E real-bug fix: the Tables query filters TABLE_TYPE =
        // 'BASE TABLE', but INFORMATION_SCHEMA.COLUMNS includes columns
        // for views as well (Harris PACS ships ~700 reporting views, e.g.
        // ____aSalesRatio_shape).  Without aligning the filter, the
        // catalog's dangling-column-reference guard refuses to build.
        // Inner-join COLUMNS to TABLES with TABLE_TYPE='BASE TABLE' so
        // both lists stay consistent.
        public const string Columns = @"
SELECT C.TABLE_NAME, C.COLUMN_NAME, C.DATA_TYPE, C.IS_NULLABLE, C.ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS C
INNER JOIN INFORMATION_SCHEMA.TABLES T
  ON C.TABLE_SCHEMA = T.TABLE_SCHEMA
 AND C.TABLE_NAME   = T.TABLE_NAME
 AND T.TABLE_TYPE   = 'BASE TABLE'
WHERE C.TABLE_SCHEMA = @schema
ORDER BY C.TABLE_NAME, C.ORDINAL_POSITION";

        public const string PrimaryKeys = @"
SELECT KCU.TABLE_NAME, KCU.COLUMN_NAME, KCU.ORDINAL_POSITION
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE KCU
INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS TC
  ON KCU.CONSTRAINT_NAME = TC.CONSTRAINT_NAME
 AND KCU.TABLE_SCHEMA   = TC.TABLE_SCHEMA
WHERE TC.CONSTRAINT_TYPE = 'PRIMARY KEY'
  AND TC.TABLE_SCHEMA = @schema
ORDER BY KCU.TABLE_NAME, KCU.ORDINAL_POSITION";
    }

    /// <inheritdoc />
    public async Task<PacsSchemaIntrospectionResult> ReadAsync(CancellationToken ct)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(ct).ConfigureAwait(false);

        var tables = await ReadTablesAsync(connection, ct).ConfigureAwait(false);
        var columns = await ReadColumnsAsync(connection, ct).ConfigureAwait(false);
        var primaryKeys = await ReadPrimaryKeysAsync(connection, ct).ConfigureAwait(false);

        return new PacsSchemaIntrospectionResult(tables, columns, primaryKeys);
    }

    /// <summary>
    /// Slice C48-E real-bug fix: SqlCommand default CommandTimeout is 30
    /// seconds, which is too short for INFORMATION_SCHEMA reads against a
    /// real Harris PACS database (verified live: 2229 tables / 94k columns
    /// in <c>pacs_oltp.dbo</c>). Bumped to 5 minutes so live introspection
    /// completes on first-call load. Per-method override remains possible
    /// if a specific query needs a different ceiling.
    /// </summary>
    private const int DefaultCommandTimeoutSeconds = 300;

    private async Task<IReadOnlyList<IntrospectedTable>> ReadTablesAsync(SqlConnection connection, CancellationToken ct)
    {
        var result = new List<IntrospectedTable>();
        await using var cmd = new SqlCommand(Queries.Tables, connection)
        {
            CommandTimeout = DefaultCommandTimeoutSeconds,
        };
        cmd.Parameters.Add(new SqlParameter("@schema", _schemaName));
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            result.Add(new IntrospectedTable(reader.GetString(0)));
        }
        return result;
    }

    private async Task<IReadOnlyList<IntrospectedColumn>> ReadColumnsAsync(SqlConnection connection, CancellationToken ct)
    {
        var result = new List<IntrospectedColumn>();
        await using var cmd = new SqlCommand(Queries.Columns, connection)
        {
            CommandTimeout = DefaultCommandTimeoutSeconds,
        };
        cmd.Parameters.Add(new SqlParameter("@schema", _schemaName));
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            var nullableFlag = reader.GetString(3);
            result.Add(new IntrospectedColumn(
                TableName: reader.GetString(0),
                ColumnName: reader.GetString(1),
                DataType: reader.GetString(2),
                Nullable: string.Equals(nullableFlag, "YES", StringComparison.OrdinalIgnoreCase),
                OrdinalPosition: reader.GetInt32(4)));
        }
        return result;
    }

    private async Task<IReadOnlyList<IntrospectedPrimaryKeyMember>> ReadPrimaryKeysAsync(SqlConnection connection, CancellationToken ct)
    {
        var result = new List<IntrospectedPrimaryKeyMember>();
        await using var cmd = new SqlCommand(Queries.PrimaryKeys, connection)
        {
            CommandTimeout = DefaultCommandTimeoutSeconds,
        };
        cmd.Parameters.Add(new SqlParameter("@schema", _schemaName));
        await using var reader = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await reader.ReadAsync(ct).ConfigureAwait(false))
        {
            result.Add(new IntrospectedPrimaryKeyMember(
                TableName: reader.GetString(0),
                ColumnName: reader.GetString(1),
                OrdinalPosition: reader.GetInt32(2)));
        }
        return result;
    }
}
