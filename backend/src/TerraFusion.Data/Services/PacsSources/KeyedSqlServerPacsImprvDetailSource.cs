using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsImprvDetail;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Keyed imprv_detail source: drains <c>pacs_oltp.dbo.imprv_detail</c>
/// for ONLY the (prop_id, prop_val_yr) tuples explicitly requested.
/// Filters to <c>sup_num = 0</c>.
///
/// <para>The detail table can have multiple rows per parent imprv
/// (one per component: COVPATIO, ATTGAR, MA, BSMT, POOL, etc).
/// IMP-POP-1 lands the full detail set for the keyed parents so the
/// canonical projector can write tf_improvement_feature rows.</para>
/// </summary>
public sealed class KeyedSqlServerPacsImprvDetailSource : IPacsImprvDetailSource
{
    private const int KeyChunkSize = 1000;

    private readonly string _connectionString;
    private readonly IReadOnlyCollection<(int PropId, short PropValYr)> _keys;

    public KeyedSqlServerPacsImprvDetailSource(string connectionString, IReadOnlyCollection<(int PropId, short PropValYr)> keys)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _keys = keys ?? throw new ArgumentNullException(nameof(keys));
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public string SourceQueryText =>
        $"SELECT CAST(prop_val_yr AS smallint) AS prop_val_yr, CAST(sup_num AS smallint) AS sup_num, " +
        $"prop_id, imprv_id, imprv_det_id, " +
        $"imprv_det_type_cd, imprv_det_meth_cd, imprv_det_class_cd, imprv_det_sub_class_cd, " +
        $"condition_cd, imprv_det_area, imprv_det_val, num_units, yr_built " +
        $"FROM dbo.imprv_detail " +
        $"WHERE sup_num = 0 AND (prop_id, prop_val_yr) IN ({_keys.Count} keyed pairs)";

    public async IAsyncEnumerable<PacsSourceImprvDetail> StreamImprvDetailsAsync(
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
            sb.AppendLine("       prop_id, imprv_id, imprv_det_id,");
            sb.AppendLine("       imprv_det_type_cd, imprv_det_meth_cd,");
            sb.AppendLine("       imprv_det_class_cd, imprv_det_sub_class_cd,");
            sb.AppendLine("       condition_cd, imprv_det_area, imprv_det_val,");
            sb.AppendLine("       num_units, yr_built");
            sb.AppendLine("FROM dbo.imprv_detail");
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
            var oImprvId    = rdr.GetOrdinal("imprv_id");
            var oImprvDetId = rdr.GetOrdinal("imprv_det_id");
            var oTypeCd     = rdr.GetOrdinal("imprv_det_type_cd");
            var oMethCd     = rdr.GetOrdinal("imprv_det_meth_cd");
            var oClassCd    = rdr.GetOrdinal("imprv_det_class_cd");
            var oSubClassCd = rdr.GetOrdinal("imprv_det_sub_class_cd");
            var oCondCd     = rdr.GetOrdinal("condition_cd");
            var oArea       = rdr.GetOrdinal("imprv_det_area");
            var oVal        = rdr.GetOrdinal("imprv_det_val");
            var oNumUnits   = rdr.GetOrdinal("num_units");
            var oYrBuilt    = rdr.GetOrdinal("yr_built");

            while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return new PacsSourceImprvDetail(
                    PropValYr:          rdr.GetInt16(oPropValYr),
                    SupNum:             rdr.GetInt16(oSupNum),
                    PropId:             rdr.GetInt32(oPropId),
                    ImprvId:            ReadInt64Flexible(rdr, oImprvId),
                    ImprvDetId:         ReadInt64Flexible(rdr, oImprvDetId),
                    ImprvDetTypeCd:     TrimOrNull(rdr, oTypeCd),
                    ImprvDetMethCd:     TrimOrNull(rdr, oMethCd),
                    ImprvDetClassCd:    TrimOrNull(rdr, oClassCd),
                    ImprvDetSubClassCd: TrimOrNull(rdr, oSubClassCd),
                    ConditionCd:        TrimOrNull(rdr, oCondCd),
                    ImprvDetArea:       ReadDecimalOrNull(rdr, oArea),
                    ImprvDetVal:        ReadDecimalOrNull(rdr, oVal),
                    NumUnits:           rdr.IsDBNull(oNumUnits) ? null : rdr.GetInt32(oNumUnits),
                    YrBuilt:            ReadInt16OrNull(rdr, oYrBuilt));
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

    private static short? ReadInt16OrNull(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return null;
        var t = rdr.GetFieldType(ordinal);
        if (t == typeof(short)) return rdr.GetInt16(ordinal);
        if (t == typeof(int)) return (short)rdr.GetInt32(ordinal);
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
