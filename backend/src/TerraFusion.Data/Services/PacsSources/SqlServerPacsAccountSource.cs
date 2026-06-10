using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsAccount;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Slice B1-A — production <see cref="IPacsAccountSource"/> against
/// live Harris PACS <c>pacs_oltp.dbo.account</c>.
///
/// <para>The PACS account table is the global party/entity identity
/// record. One row per person OR organization. <c>file_as_name</c> is
/// always present (the assessor's display label); <c>first_name</c>
/// and <c>last_name</c> populate for natural persons but may be NULL
/// for organizations. The redaction flags
/// (<c>web_suppression</c>, <c>confidential_flag</c>) drive
/// canonical-layer PII redaction at projection time.</para>
///
/// <para>OWN-POP TopN proof note: when <c>topN</c> is set the query
/// orders <c>acct_id DESC</c> so the most recently created accounts
/// surface first. Production landing leaves <c>topN = null</c> to
/// drain the full corpus (~Benton scale).</para>
/// </summary>
public sealed class SqlServerPacsAccountSource : IPacsAccountSource
{
    private readonly string _connectionString;
    private readonly int? _topN;

    public SqlServerPacsAccountSource(string connectionString, int? topN = null)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _topN = topN;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public string SourceQueryText =>
        "SELECT acct_id, file_as_name, first_name, last_name, " +
        "dl_num, dl_state, email_addr, " +
        "web_suppression, confidential_flag " +
        "FROM dbo.account " +
        "ORDER BY acct_id DESC";

    public async IAsyncEnumerable<PacsSourceAccount> StreamAccountsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var topClause = _topN.HasValue ? $"TOP {_topN.Value} " : "";
        var sql = $@"
            SELECT {topClause}acct_id,
                   file_as_name,
                   first_name,
                   last_name,
                   dl_num,
                   dl_state,
                   email_addr,
                   web_suppression,
                   confidential_flag
            FROM dbo.account
            ORDER BY acct_id DESC";

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 600 };
        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        var oAcctId      = rdr.GetOrdinal("acct_id");
        var oFileAsName  = rdr.GetOrdinal("file_as_name");
        var oFirstName   = rdr.GetOrdinal("first_name");
        var oLastName    = rdr.GetOrdinal("last_name");
        var oDlNum       = rdr.GetOrdinal("dl_num");
        var oDlState     = rdr.GetOrdinal("dl_state");
        var oEmailAddr   = rdr.GetOrdinal("email_addr");
        var oWebSuppress = rdr.GetOrdinal("web_suppression");
        var oConfidFlag  = rdr.GetOrdinal("confidential_flag");

        while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return new PacsSourceAccount(
                AcctId:           ReadInt64Flexible(rdr, oAcctId),
                FileAsName:       TrimOrNull(rdr, oFileAsName),
                FirstName:        TrimOrNull(rdr, oFirstName),
                LastName:         TrimOrNull(rdr, oLastName),
                DlNum:            TrimOrNull(rdr, oDlNum),
                DlState:          TrimOrNull(rdr, oDlState),
                EmailAddr:        TrimOrNull(rdr, oEmailAddr),
                WebSuppression:   ReadBoolFlexible(rdr, oWebSuppress),
                ConfidentialFlag: ReadBoolFlexible(rdr, oConfidFlag));
        }
    }

    /// <summary>Read int OR bigint as long. PACS may use either.</summary>
    private static long ReadInt64Flexible(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return 0L;
        return rdr.GetFieldType(ordinal) == typeof(int)
            ? rdr.GetInt32(ordinal)
            : rdr.GetInt64(ordinal);
    }

    /// <summary>
    /// Read a flag column. PACS frequently uses <c>bit</c> but
    /// occasionally <c>char(1)</c> ('Y'/'N') or <c>tinyint</c>.
    /// </summary>
    private static bool ReadBoolFlexible(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return false;
        var t = rdr.GetFieldType(ordinal);
        if (t == typeof(bool)) return rdr.GetBoolean(ordinal);
        if (t == typeof(byte)) return rdr.GetByte(ordinal) != 0;
        if (t == typeof(short)) return rdr.GetInt16(ordinal) != 0;
        if (t == typeof(int)) return rdr.GetInt32(ordinal) != 0;
        if (t == typeof(string))
        {
            var s = rdr.GetString(ordinal).Trim();
            return s.Equals("Y", StringComparison.OrdinalIgnoreCase) || s == "1" || s.Equals("true", StringComparison.OrdinalIgnoreCase);
        }
        return false;
    }

    private static string? TrimOrNull(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return null;
        var raw = rdr.GetString(ordinal).Trim();
        return string.IsNullOrEmpty(raw) ? null : raw;
    }
}
