using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsPropSuppAssoc;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// SYNC-POP-3 source: drains live Harris PACS
/// <c>pacs_oltp.dbo.prop_supp_assoc</c>, but ONLY for the (prop_id,
/// prop_val_yr) tuples explicitly requested by the caller.
///
/// <para>The doctrine truth-promotion gate (PacsSaleTruthPromoter)
/// requires every promotable sale's (PropId, PropValYr) to resolve to
/// a row in the SAME prop_supp_assoc batch. Bounded proof runs need a
/// supp batch that exactly covers the sales batch — pulling all of
/// prop_supp_assoc would take far longer than necessary, while
/// pulling a generic TopN sample by year/prop_id rarely overlaps the
/// sales' specific keys.</para>
///
/// <para>This source takes a key set extracted from the just-landed
/// legacy_pacs_raw.sale batch and emits matching prop_supp_assoc
/// rows. The query uses parameterized IN clauses with batched chunks
/// to avoid the SQL Server 2100-parameter limit.</para>
/// </summary>
public sealed class KeyedSqlServerPacsPropSuppAssocSource : IPacsPropSuppAssocSource
{
    /// <summary>
    /// SQL Server caps a single command at 2100 parameters. Each key
    /// pair uses 2 parameters (prop_id + owner_tax_yr), so we batch
    /// up to 1000 pairs per round-trip.
    /// </summary>
    private const int KeyChunkSize = 1000;

    private readonly string _connectionString;
    private readonly IReadOnlyCollection<(int PropId, short PropValYr)> _keys;
    private readonly bool _activeSupp;

    /// <param name="activeSupp">SALES-SUPNUM-RESOLUTION (2026-06-03): when false
    /// (default), lands ONLY the sup_num=0 supplement — correct for the
    /// current-year (2026) land/improvement lanes whose active supplement is 0.
    /// When true, lands the ACTIVE supplement per (prop_id, owner_tax_yr) =
    /// MAX(sup_num), needed by the sales lane: sales reference HISTORICAL years
    /// (PropValYr from sl_dt) whose active supplement is frequently non-zero
    /// (e.g. prop 10130 / 2024 → sup_num=10). The sup=0-only filter silently
    /// dropped those qualified sales. Opt-in keeps the sealed lanes untouched.</param>
    public KeyedSqlServerPacsPropSuppAssocSource(
        string connectionString,
        IReadOnlyCollection<(int PropId, short PropValYr)> keys,
        bool activeSupp = false)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _keys = keys ?? throw new ArgumentNullException(nameof(keys));
        _activeSupp = activeSupp;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    /// <summary>
    /// Audit-anchor text. Hash includes the key count so re-runs with
    /// different sale batches produce different audit anchors.
    /// </summary>
    public string SourceQueryText =>
        $"SELECT CAST(owner_tax_yr AS smallint) AS prop_val_yr, prop_id, " +
        $"CAST(sup_num AS smallint) AS sup_num " +
        $"FROM dbo.prop_supp_assoc " +
        $"WHERE sup_num = 0 AND (prop_id, owner_tax_yr) IN ({_keys.Count} keyed pairs from sale batch)";

    public async IAsyncEnumerable<PacsSourcePropSuppAssoc> StreamPropSuppAssocsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        if (_keys.Count == 0)
            yield break;

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        // Stream chunked queries. Each chunk uses parameterized OR'd
        // (prop_id = @p AND owner_tax_yr = @y) groups.
        foreach (var chunk in Chunk(_keys, KeyChunkSize))
        {
            cancellationToken.ThrowIfCancellationRequested();

            var sb = new StringBuilder();
            if (_activeSupp)
            {
                // SALES mode: resolve the ACTIVE supplement per (prop_id, owner_tax_yr)
                // = MAX(sup_num). PACS keeps one row per (prop_id, owner_tax_yr, sup_num);
                // the highest sup_num is the current/active supplement for that year.
                // This replaces the sup=0-only filter so historical-year sales (whose
                // active supplement is frequently non-zero) can resolve + promote.
                sb.AppendLine("SELECT CAST(owner_tax_yr AS smallint) AS prop_val_yr,");
                sb.AppendLine("       prop_id,");
                sb.AppendLine("       CAST(MAX(sup_num) AS smallint) AS sup_num");
                sb.AppendLine("FROM dbo.prop_supp_assoc");
                sb.AppendLine("WHERE (");
            }
            else
            {
                sb.AppendLine("SELECT CAST(owner_tax_yr AS smallint) AS prop_val_yr,");
                sb.AppendLine("       prop_id,");
                sb.AppendLine("       CAST(sup_num AS smallint) AS sup_num");
                sb.AppendLine("FROM dbo.prop_supp_assoc");
                sb.AppendLine("WHERE sup_num = 0 AND (");
            }

            await using var cmd = new SqlCommand { Connection = conn, CommandTimeout = 600 };
            for (var i = 0; i < chunk.Count; i++)
            {
                if (i > 0) sb.Append("   OR ");
                sb.AppendLine($"(prop_id = @p{i} AND owner_tax_yr = @y{i})");
                cmd.Parameters.AddWithValue($"@p{i}", chunk[i].PropId);
                cmd.Parameters.AddWithValue($"@y{i}", (int)chunk[i].PropValYr);
            }
            sb.AppendLine(")");
            if (_activeSupp)
                sb.AppendLine("GROUP BY owner_tax_yr, prop_id");

            cmd.CommandText = sb.ToString();

            await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            var oPropValYr = rdr.GetOrdinal("prop_val_yr");
            var oPropId    = rdr.GetOrdinal("prop_id");
            var oSupNum    = rdr.GetOrdinal("sup_num");

            while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return new PacsSourcePropSuppAssoc(
                    PropValYr: rdr.GetInt16(oPropValYr),
                    PropId:    rdr.GetInt32(oPropId),
                    SupNum:    rdr.GetInt16(oSupNum));
            }
        }
    }

    private static IEnumerable<List<T>> Chunk<T>(IEnumerable<T> source, int size)
    {
        var bucket = new List<T>(size);
        foreach (var item in source)
        {
            bucket.Add(item);
            if (bucket.Count == size)
            {
                yield return bucket;
                bucket = new List<T>(size);
            }
        }
        if (bucket.Count > 0) yield return bucket;
    }
}
