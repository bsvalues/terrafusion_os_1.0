using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsPropertyVal;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// SYNC-DOCTRINE-4-IMPL-V4: keyed property_val source. Drains
/// <c>pacs_oltp.dbo.property_val</c> for ONLY the
/// (prop_id, prop_val_yr) tuples explicitly requested. Filters to
/// <c>sup_num = 0</c>.
///
/// <para>One physical parcel maps to multiple property_val rows
/// (one per year-supplement pair). The improvement drain anchors
/// on a working year + sup=0; this source matches that scope.</para>
/// </summary>
public sealed class KeyedSqlServerPacsPropertyValSource : IPacsPropertyValSource
{
    private const int KeyChunkSize = 1000;

    private readonly string _connectionString;
    private readonly IReadOnlyCollection<(int PropId, short PropValYr)> _keys;

    public KeyedSqlServerPacsPropertyValSource(
        string connectionString,
        IReadOnlyCollection<(int PropId, short PropValYr)> keys)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _keys = keys ?? throw new ArgumentNullException(nameof(keys));
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public string SourceQueryText =>
        $"SELECT CAST(prop_val_yr AS smallint) AS prop_val_yr, " +
        $"CAST(sup_num AS smallint) AS sup_num, " +
        $"prop_id, property_use_cd, prop_inactive_dt " +
        $"FROM dbo.property_val " +
        $"WHERE sup_num = 0 AND (prop_id, prop_val_yr) IN ({_keys.Count} keyed pairs)";

    public async IAsyncEnumerable<PacsSourcePropertyVal> StreamPropertyValsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        if (_keys.Count == 0) yield break;

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        foreach (var chunk in Chunk(_keys, KeyChunkSize))
        {
            cancellationToken.ThrowIfCancellationRequested();

            var sb = new StringBuilder();
            sb.AppendLine("SELECT CAST(prop_val_yr AS smallint) AS prop_val_yr,");
            sb.AppendLine("       CAST(sup_num AS smallint) AS sup_num,");
            sb.AppendLine("       prop_id, property_use_cd, prop_inactive_dt");
            sb.AppendLine("FROM dbo.property_val");
            sb.AppendLine("WHERE sup_num = 0 AND (");

            await using var cmd = new SqlCommand { Connection = conn, CommandTimeout = 600 };
            for (var i = 0; i < chunk.Count; i++)
            {
                if (i > 0) sb.Append("   OR ");
                sb.AppendLine($"(prop_id = @p{i} AND prop_val_yr = @y{i})");
                cmd.Parameters.AddWithValue($"@p{i}", chunk[i].PropId);
                cmd.Parameters.AddWithValue($"@y{i}", (int)chunk[i].PropValYr);
            }
            sb.AppendLine(")");
            cmd.CommandText = sb.ToString();

            await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            var oPropValYr  = rdr.GetOrdinal("prop_val_yr");
            var oSupNum     = rdr.GetOrdinal("sup_num");
            var oPropId     = rdr.GetOrdinal("prop_id");
            var oUseCd      = rdr.GetOrdinal("property_use_cd");
            var oInactiveDt = rdr.GetOrdinal("prop_inactive_dt");

            while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();
                // PACS returns prop_inactive_dt with Kind=Unspecified.
                // Npgsql requires UTC for `timestamp with time zone`
                // columns. Treat the PACS timestamp as already UTC
                // (it is — PACS stores in server-local but the column
                // semantics are calendar-date-style anyway).
                DateTime? inactiveDt = rdr.IsDBNull(oInactiveDt)
                    ? null
                    : DateTime.SpecifyKind(rdr.GetDateTime(oInactiveDt), DateTimeKind.Utc);

                yield return new PacsSourcePropertyVal(
                    PropValYr:      rdr.GetInt16(oPropValYr),
                    SupNum:         rdr.GetInt16(oSupNum),
                    PropId:         rdr.GetInt32(oPropId),
                    PropertyUseCd:  TrimOrNull(rdr, oUseCd),
                    PropInactiveDt: inactiveDt);
            }
        }
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
