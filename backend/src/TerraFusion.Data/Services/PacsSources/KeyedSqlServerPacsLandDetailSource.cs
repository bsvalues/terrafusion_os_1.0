using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsLandDetail;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Keyed land_detail source: drains <c>pacs_oltp.dbo.land_detail</c>
/// for ONLY the (prop_id, prop_val_yr) tuples explicitly requested.
/// Filters to <c>sup_num = 0</c>.
///
/// <para>land_detail can have multiple rows per parcel (one per
/// land segment: dry crop, irrigated, residential, commercial,
/// timber, etc). LAND-POP-1 lands the full set so the canonical
/// projector can write tf_land rows per segment.</para>
/// </summary>
public sealed class KeyedSqlServerPacsLandDetailSource : IPacsLandDetailSource
{
    private const int KeyChunkSize = 1000;

    private readonly string _connectionString;
    private readonly IReadOnlyCollection<(int PropId, short PropValYr)> _keys;

    public KeyedSqlServerPacsLandDetailSource(string connectionString, IReadOnlyCollection<(int PropId, short PropValYr)> keys)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _keys = keys ?? throw new ArgumentNullException(nameof(keys));
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    // LAND-POP-1 fixture-vs-real divergences (8 columns):
    //   PacsSourceLandDetail field | Benton column
    //   ---------------------------|--------------
    //   land_seg_type_cd           | land_type_cd      (no "_seg" prefix)
    //   land_seg_state_cd          | state_cd
    //   land_seg_class_cd          | land_class_code   (different naming)
    //   land_seg_use_cd            | primary_use_cd
    //   soil_cd                    | land_soil_code
    //   land_seg_market_val        | land_seg_mkt_val  (truncated suffix)
    //   land_seg_ag_value          | ag_val
    //   land_seg_assessed_val      | (no equivalent — project NULL)
    //   land_seg_eff_age           | (no equivalent — project NULL)
    // SYNC-DOCTRINE-4-IMPL-V3: ag_apply + ag_use_cd projected
    // verbatim from dbo.land_detail. Both columns are nullable on
    // the source side so the projection is a straight pass-through.
    public string SourceQueryText =>
        $"SELECT CAST(prop_val_yr AS smallint) AS prop_val_yr, CAST(sup_num AS smallint) AS sup_num, " +
        $"prop_id, land_seg_id, " +
        $"land_type_cd AS land_seg_type_cd, state_cd AS land_seg_state_cd, " +
        $"land_class_code AS land_seg_class_cd, primary_use_cd AS land_seg_use_cd, " +
        $"land_soil_code AS soil_cd, " +
        $"land_seg_homesite, size_acres, size_square_feet, " +
        $"land_seg_mkt_val AS land_seg_market_val, ag_val AS land_seg_ag_value, " +
        $"CAST(NULL AS decimal(18,2)) AS land_seg_assessed_val, " +
        $"CAST(NULL AS smallint) AS land_seg_eff_age, " +
        $"ag_apply, ag_use_cd " +
        $"FROM dbo.land_detail " +
        $"WHERE sup_num = 0 AND (prop_id, prop_val_yr) IN ({_keys.Count} keyed pairs)";

    public async IAsyncEnumerable<PacsSourceLandDetail> StreamLandDetailsAsync(
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
            sb.AppendLine("       prop_id, land_seg_id,");
            sb.AppendLine("       land_type_cd AS land_seg_type_cd,");
            sb.AppendLine("       state_cd AS land_seg_state_cd,");
            sb.AppendLine("       land_class_code AS land_seg_class_cd,");
            sb.AppendLine("       primary_use_cd AS land_seg_use_cd,");
            sb.AppendLine("       land_soil_code AS soil_cd,");
            sb.AppendLine("       land_seg_homesite, size_acres, size_square_feet,");
            sb.AppendLine("       land_seg_mkt_val AS land_seg_market_val,");
            sb.AppendLine("       ag_val AS land_seg_ag_value,");
            sb.AppendLine("       CAST(NULL AS decimal(18,2)) AS land_seg_assessed_val,");
            sb.AppendLine("       CAST(NULL AS smallint) AS land_seg_eff_age,");
            sb.AppendLine("       ag_apply, ag_use_cd");
            sb.AppendLine("FROM dbo.land_detail");
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
            var oLandSegId  = rdr.GetOrdinal("land_seg_id");
            var oTypeCd     = rdr.GetOrdinal("land_seg_type_cd");
            var oStateCd    = rdr.GetOrdinal("land_seg_state_cd");
            var oClassCd    = rdr.GetOrdinal("land_seg_class_cd");
            var oUseCd      = rdr.GetOrdinal("land_seg_use_cd");
            var oSoilCd     = rdr.GetOrdinal("soil_cd");
            var oHomesite   = rdr.GetOrdinal("land_seg_homesite");
            var oSizeAcres  = rdr.GetOrdinal("size_acres");
            var oSizeSqFt   = rdr.GetOrdinal("size_square_feet");
            var oMarketVal  = rdr.GetOrdinal("land_seg_market_val");
            var oAgValue    = rdr.GetOrdinal("land_seg_ag_value");
            var oAssessedVal= rdr.GetOrdinal("land_seg_assessed_val");
            var oEffAge     = rdr.GetOrdinal("land_seg_eff_age");
            var oAgApply    = rdr.GetOrdinal("ag_apply");
            var oAgUseCd    = rdr.GetOrdinal("ag_use_cd");

            while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return new PacsSourceLandDetail(
                    PropValYr:          rdr.GetInt16(oPropValYr),
                    SupNum:             rdr.GetInt16(oSupNum),
                    PropId:             rdr.GetInt32(oPropId),
                    LandSegId:          ReadInt64Flexible(rdr, oLandSegId),
                    LandSegTypeCd:      TrimOrNull(rdr, oTypeCd),
                    LandSegStateCd:     TrimOrNull(rdr, oStateCd),
                    LandSegClassCd:     TrimOrNull(rdr, oClassCd),
                    LandSegUseCd:       TrimOrNull(rdr, oUseCd),
                    SoilCd:             TrimOrNull(rdr, oSoilCd),
                    LandSegHomesite:    TrimOrNull(rdr, oHomesite),
                    SizeAcres:          ReadDecimalOrNull(rdr, oSizeAcres),
                    SizeSquareFeet:     ReadDecimalOrNull(rdr, oSizeSqFt),
                    LandSegMarketVal:   ReadDecimalOrNull(rdr, oMarketVal),
                    LandSegAgValue:     ReadDecimalOrNull(rdr, oAgValue),
                    LandSegAssessedVal: ReadDecimalOrNull(rdr, oAssessedVal),
                    LandSegEffAge:      ReadInt16OrNull(rdr, oEffAge),
                    AgApply:            TrimOrNull(rdr, oAgApply),
                    AgUseCd:            TrimOrNull(rdr, oAgUseCd));
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
