using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;

namespace TerraFusion.Sync.Workbench.Pacs;

/// <summary>
/// Slice C22-B: live SQL Server implementation of
/// <see cref="IPacsDictionaryReader"/>. Connects to PACS via a
/// caller-provided connection string and runs <c>SELECT *</c>
/// against the named dictionary table.
///
/// <para>Per C22-A Hard Guard #1 (read PACS, never write), this
/// reader issues only <c>SELECT</c>. It does not call any stored
/// procedure, no DML, no DDL.</para>
///
/// <para>Per C22-A Hard Guard #5 (allowlisted dictionary tables),
/// the caller is responsible for validating
/// <paramref name="tableName"/> against an allowlist before calling
/// this reader. The reader applies a defense-in-depth syntactic
/// check (rejects identifiers that aren't <c>[A-Za-z_][A-Za-z0-9_]*</c>)
/// but the policy gate is operator-side.</para>
/// </summary>
public sealed class SqlPacsDictionaryReader : IPacsDictionaryReader
{
    private readonly string _connectionString;

    public SqlPacsDictionaryReader(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("Connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
    }

    public async Task<PacsDictionaryReadResult> ReadDictionaryAsync(
        string schemaName,
        string tableName,
        CancellationToken cancellationToken = default)
    {
        ValidateIdentifier(schemaName, nameof(schemaName));
        ValidateIdentifier(tableName, nameof(tableName));

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);

        // Bracket the identifiers as an SQL Server convention. Both
        // identifiers passed our regex check above, so bracket-injection
        // is not possible here (no `]` characters allowed).
        var sql = $"SELECT * FROM [{schemaName}].[{tableName}]";

        await using var cmd = new SqlCommand(sql, conn)
        {
            CommandTimeout = 600, // 10 minutes (PACS dictionaries are small but D0-D allows long timeouts)
        };

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

        var columnNames = Enumerable.Range(0, reader.FieldCount)
            .Select(i => reader.GetName(i))
            .ToList();

        var rows = new List<PacsDictionaryRow>();
        while (await reader.ReadAsync(cancellationToken))
        {
            var values = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
            for (var i = 0; i < reader.FieldCount; i++)
            {
                values[columnNames[i]] = reader.IsDBNull(i) ? null : reader.GetValue(i);
            }
            rows.Add(new PacsDictionaryRow(values));
        }

        return new PacsDictionaryReadResult(
            SchemaName:  schemaName,
            TableName:   tableName,
            ColumnNames: columnNames,
            Rows:        rows);
    }

    private static void ValidateIdentifier(string id, string paramName)
    {
        if (string.IsNullOrWhiteSpace(id))
            throw new ArgumentException("Identifier is required.", paramName);
        // Defense-in-depth: only allow [A-Za-z_][A-Za-z0-9_]*. The
        // policy-side allowlist (caller) is the primary check; this is
        // a syntactic floor.
        foreach (var c in id)
        {
            if (!(char.IsLetterOrDigit(c) || c == '_'))
            {
                throw new ArgumentException(
                    $"Invalid SQL identifier '{id}' (only [A-Za-z0-9_] allowed).",
                    paramName);
            }
        }
        if (!char.IsLetter(id[0]) && id[0] != '_')
        {
            throw new ArgumentException(
                $"Invalid SQL identifier '{id}' (must start with letter or underscore).",
                paramName);
        }
    }
}
