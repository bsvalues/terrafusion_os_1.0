using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsAccount;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Keyed account source: drains live Harris PACS
/// <c>pacs_oltp.dbo.account</c>, but ONLY for the <c>acct_id</c>
/// values explicitly requested by the caller.
///
/// <para>Used by the owner-lane closure proof to land accounts that
/// align with a just-landed owner batch's <c>OwnerId</c> set, so the
/// truth_pacs.owner_current promoter (B2-A) can resolve every owner's
/// account FK without needing a full-corpus account drain.</para>
///
/// <para>Chunks at 2000 acct_ids per round-trip (1 parameter each,
/// headroom under SQL Server's 2100-parameter cap).</para>
/// </summary>
public sealed class KeyedSqlServerPacsAccountSource : IPacsAccountSource
{
    private const int KeyChunkSize = 2000;

    private readonly string _connectionString;
    private readonly IReadOnlyCollection<long> _acctIds;

    public KeyedSqlServerPacsAccountSource(string connectionString, IReadOnlyCollection<long> acctIds)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _acctIds = acctIds ?? throw new ArgumentNullException(nameof(acctIds));
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public string SourceQueryText =>
        $"SELECT acct_id, file_as_name, first_name, last_name, " +
        $"dl_num, dl_state, email_addr, web_suppression, confidential_flag " +
        $"FROM dbo.account " +
        $"WHERE acct_id IN ({_acctIds.Count} keyed acct_ids from owner batch)";

    public async IAsyncEnumerable<PacsSourceAccount> StreamAccountsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        if (_acctIds.Count == 0) yield break;

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        foreach (var chunk in Chunk(_acctIds, KeyChunkSize))
        {
            cancellationToken.ThrowIfCancellationRequested();

            var sb = new StringBuilder();
            sb.AppendLine("SELECT acct_id, file_as_name, first_name, last_name,");
            sb.AppendLine("       dl_num, dl_state, email_addr,");
            sb.AppendLine("       web_suppression, confidential_flag");
            sb.AppendLine("FROM dbo.account");
            sb.Append("WHERE acct_id IN (");

            await using var cmd = new SqlCommand { Connection = conn, CommandTimeout = 600 };
            for (var i = 0; i < chunk.Count; i++)
            {
                if (i > 0) sb.Append(", ");
                sb.Append($"@p{i}");
                cmd.Parameters.AddWithValue($"@p{i}", chunk[i]);
            }
            sb.AppendLine(")");

            cmd.CommandText = sb.ToString();

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
    }

    private static long ReadInt64Flexible(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return 0L;
        return rdr.GetFieldType(ordinal) == typeof(int)
            ? rdr.GetInt32(ordinal)
            : rdr.GetInt64(ordinal);
    }

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

    private static IEnumerable<List<T>> Chunk<T>(IEnumerable<T> source, int size)
    {
        var bucket = new List<T>(size);
        foreach (var item in source)
        {
            bucket.Add(item);
            if (bucket.Count == size) { yield return bucket; bucket = new List<T>(size); }
        }
        if (bucket.Count > 0) yield return bucket;
    }
}
