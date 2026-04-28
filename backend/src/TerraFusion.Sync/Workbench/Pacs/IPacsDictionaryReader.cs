using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Sync.Workbench.Pacs;

/// <summary>
/// Slice C22-B: read-only abstraction over a PACS canonical
/// dictionary table.
///
/// <para>The interface exists to keep the
/// <see cref="PropertyUseDictionaryLoaderService"/> testable without
/// requiring a live SQL Server — production uses
/// <see cref="SqlPacsDictionaryReader"/>; tests use a stub.</para>
///
/// <para>Per the C22-A policy, every read against PACS is
/// <c>SELECT</c>-only. Implementations of this interface MUST NOT
/// issue any DML, DDL, or stored-procedure call that mutates state.</para>
/// </summary>
public interface IPacsDictionaryReader
{
    /// <summary>
    /// Reads every row from the named PACS dictionary table.
    /// Caller is responsible for allowlist enforcement on
    /// <paramref name="tableName"/>; the reader itself does not
    /// validate beyond what the underlying SQL connection enforces.
    /// </summary>
    /// <remarks>
    /// The reader returns rows as ordered key-value snapshots so
    /// the caller can pick out the code / description / active /
    /// year columns by name without the reader hardcoding any
    /// PACS schema assumptions. This matches C22-A's "live
    /// inspection required" gate — column names live in caller
    /// configuration, not reader code.
    /// </remarks>
    Task<PacsDictionaryReadResult> ReadDictionaryAsync(
        string schemaName,
        string tableName,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// All rows from a PACS dictionary table, plus the column names the
/// reader saw. The caller (loader service) interprets which column
/// is the code / description / active / year per its own
/// configuration.
/// </summary>
public sealed record PacsDictionaryReadResult(
    string SchemaName,
    string TableName,
    IReadOnlyList<string> ColumnNames,
    IReadOnlyList<PacsDictionaryRow> Rows);

/// <summary>
/// One row from a PACS dictionary table, exposed as a
/// <c>columnName -&gt; value</c> map. Values are stored as
/// <see cref="object"/> so the reader doesn't bias the typing
/// decisions a caller makes (some columns are <c>char(N)</c>-padded
/// — see C12 trim-on-both-sides matcher — others are dates,
/// integers, etc.).
/// </summary>
public sealed record PacsDictionaryRow(
    IReadOnlyDictionary<string, object?> Values)
{
    /// <summary>
    /// Convenience: read a value as a (trimmed) string. Returns
    /// <c>null</c> when the underlying value is null / DBNull, the
    /// column is absent, or the trimmed value is empty.
    /// </summary>
    public string? GetTrimmedString(string columnName)
    {
        if (!Values.TryGetValue(columnName, out var raw)) return null;
        if (raw is null || raw == DBNull.Value) return null;
        var s = raw.ToString();
        if (string.IsNullOrEmpty(s)) return null;
        var trimmed = s.Trim();
        return trimmed.Length == 0 ? null : trimmed;
    }
}
