using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsImprvAttr;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Keyed imprv_attr source: drains <c>pacs_oltp.dbo.imprv_attr</c>
/// for ONLY the (prop_id, prop_val_yr) tuples explicitly requested.
/// Filters to <c>sup_num = 0</c>.
///
/// <para>imprv_attr stores per-detail attribute key/value pairs (e.g.
/// for the bedroom-count attribute: i_attr_val_id=1, i_attr_val_cd='3').
/// Identity is the 6-key composite (year, sup_num, prop_id, imprv_id,
/// imprv_det_id, i_attr_val_id).</para>
/// </summary>
public sealed class KeyedSqlServerPacsImprvAttrSource : IPacsImprvAttrSource
{
    private const int KeyChunkSize = 1000;

    private readonly string _connectionString;
    private readonly IReadOnlyCollection<(int PropId, short PropValYr)> _keys;

    public KeyedSqlServerPacsImprvAttrSource(string connectionString, IReadOnlyCollection<(int PropId, short PropValYr)> keys)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _keys = keys ?? throw new ArgumentNullException(nameof(keys));
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    // IMP-POP-1 fixture-vs-real divergence:
    //   - attr_value_text does not exist on Benton dbo.imprv_attr → use imprv_attr_val
    //   - attr_value_numeric does not exist → projected as NULL (the underlying value
    //     in Benton lives in imprv_attr_val as a string; consumers that need numeric
    //     can parse downstream)
    public string SourceQueryText =>
        $"SELECT CAST(prop_val_yr AS smallint) AS prop_val_yr, CAST(sup_num AS smallint) AS sup_num, " +
        $"prop_id, imprv_id, imprv_det_id, i_attr_val_id, " +
        $"i_attr_val_cd, CAST(imprv_attr_val AS varchar(50)) AS attr_value_text, " +
        $"imprv_attr_val AS attr_value_numeric " +
        $"FROM dbo.imprv_attr " +
        $"WHERE sup_num = 0 AND (prop_id, prop_val_yr) IN ({_keys.Count} keyed pairs)";

    public async IAsyncEnumerable<PacsSourceImprvAttr> StreamImprvAttrsAsync(
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
            sb.AppendLine("       prop_id, imprv_id, imprv_det_id, i_attr_val_id,");
            sb.AppendLine("       i_attr_val_cd,");
            sb.AppendLine("       CAST(imprv_attr_val AS varchar(50)) AS attr_value_text,");
            sb.AppendLine("       imprv_attr_val AS attr_value_numeric");
            sb.AppendLine("FROM dbo.imprv_attr");
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
            var oPropValYr     = rdr.GetOrdinal("prop_val_yr");
            var oSupNum        = rdr.GetOrdinal("sup_num");
            var oPropId        = rdr.GetOrdinal("prop_id");
            var oImprvId       = rdr.GetOrdinal("imprv_id");
            var oImprvDetId    = rdr.GetOrdinal("imprv_det_id");
            var oIAttrValId    = rdr.GetOrdinal("i_attr_val_id");
            var oIAttrValCd    = rdr.GetOrdinal("i_attr_val_cd");
            var oAttrValueText = rdr.GetOrdinal("attr_value_text");
            var oAttrValueNum  = rdr.GetOrdinal("attr_value_numeric");

            while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return new PacsSourceImprvAttr(
                    PropValYr:        rdr.GetInt16(oPropValYr),
                    SupNum:           rdr.GetInt16(oSupNum),
                    PropId:           rdr.GetInt32(oPropId),
                    ImprvId:          ReadInt64Flexible(rdr, oImprvId),
                    ImprvDetId:       ReadInt64Flexible(rdr, oImprvDetId),
                    IAttrValId:       ReadInt64Flexible(rdr, oIAttrValId),
                    IAttrValCd:       (TrimOrNull(rdr, oIAttrValCd) ?? string.Empty),
                    AttrValueText:    TrimOrNull(rdr, oAttrValueText),
                    AttrValueNumeric: ReadDecimalOrNull(rdr, oAttrValueNum));
            }
        }
    }

    private static long ReadInt64Flexible(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return 0L;
        return rdr.GetFieldType(ordinal) == typeof(int) ? rdr.GetInt32(ordinal) : rdr.GetInt64(ordinal);
    }

    private static decimal? ReadDecimalOrNull(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return null;
        var t = rdr.GetFieldType(ordinal);
        if (t == typeof(decimal)) return rdr.GetDecimal(ordinal);
        if (t == typeof(double)) return (decimal)rdr.GetDouble(ordinal);
        if (t == typeof(int)) return rdr.GetInt32(ordinal);
        if (t == typeof(long)) return rdr.GetInt64(ordinal);
        return null;
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
