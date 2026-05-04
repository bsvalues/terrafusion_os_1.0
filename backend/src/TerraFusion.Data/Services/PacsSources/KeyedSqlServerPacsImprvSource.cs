using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsImprv;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Keyed imprv source: drains <c>pacs_oltp.dbo.imprv</c> for ONLY
/// the (prop_id, prop_val_yr) tuples explicitly requested by the
/// caller. Filters to <c>sup_num = 0</c> (active supplement).
///
/// <para>Used by IMP-POP-1's closure to align imprv landing with
/// existing tf_parcel xrefs. Each tuple uses 2 parameters; chunks
/// at 1000 tuples (2000 params) per round-trip.</para>
/// </summary>
public sealed class KeyedSqlServerPacsImprvSource : IPacsImprvSource
{
    private const int KeyChunkSize = 1000;

    private readonly string _connectionString;
    private readonly IReadOnlyCollection<(int PropId, short PropValYr)> _keys;

    public KeyedSqlServerPacsImprvSource(string connectionString, IReadOnlyCollection<(int PropId, short PropValYr)> keys)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _keys = keys ?? throw new ArgumentNullException(nameof(keys));
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    // IMP-POP-1 fixture-vs-real divergences:
    //   - imprv_class_cd does not exist on Benton dbo.imprv → projected as NULL
    //   - yr_built does not exist → reuse actual_year_built (the entity expects
    //     a separate "year built" but real PACS only has actual_year_built and
    //     effective_yr_blt for this purpose)
    //   - effective_yr_built is named effective_yr_blt (truncated suffix)
    public string SourceQueryText =>
        $"SELECT CAST(prop_val_yr AS smallint) AS prop_val_yr, CAST(sup_num AS smallint) AS sup_num, " +
        $"prop_id, imprv_id, imprv_type_cd, imprv_state_cd, " +
        $"CAST(NULL AS varchar(10)) AS imprv_class_cd, " +
        $"imprv_homesite, imprv_val, imprv_desc, " +
        $"actual_year_built AS year_built, effective_yr_blt AS effective_year_built, " +
        $"actual_year_built " +
        $"FROM dbo.imprv " +
        $"WHERE sup_num = 0 AND (prop_id, prop_val_yr) IN ({_keys.Count} keyed pairs)";

    public async IAsyncEnumerable<PacsSourceImprv> StreamImprvsAsync(
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
            sb.AppendLine("       prop_id, imprv_id,");
            sb.AppendLine("       imprv_type_cd, imprv_state_cd,");
            sb.AppendLine("       CAST(NULL AS varchar(10)) AS imprv_class_cd,");
            sb.AppendLine("       imprv_homesite, imprv_val, imprv_desc,");
            sb.AppendLine("       actual_year_built AS year_built,");
            sb.AppendLine("       effective_yr_blt AS effective_year_built,");
            sb.AppendLine("       actual_year_built");
            sb.AppendLine("FROM dbo.imprv");
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
            var oPropValYr   = rdr.GetOrdinal("prop_val_yr");
            var oSupNum      = rdr.GetOrdinal("sup_num");
            var oPropId      = rdr.GetOrdinal("prop_id");
            var oImprvId     = rdr.GetOrdinal("imprv_id");
            var oImprvType   = rdr.GetOrdinal("imprv_type_cd");
            var oImprvState  = rdr.GetOrdinal("imprv_state_cd");
            var oImprvClass  = rdr.GetOrdinal("imprv_class_cd");
            var oHomesite    = rdr.GetOrdinal("imprv_homesite");
            var oImprvVal    = rdr.GetOrdinal("imprv_val");
            var oImprvDesc   = rdr.GetOrdinal("imprv_desc");
            var oYrBuilt     = rdr.GetOrdinal("year_built");
            var oEffYrBuilt  = rdr.GetOrdinal("effective_year_built");
            var oActYrBuilt  = rdr.GetOrdinal("actual_year_built");

            while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return new PacsSourceImprv(
                    PropValYr:          rdr.GetInt16(oPropValYr),
                    SupNum:             rdr.GetInt16(oSupNum),
                    PropId:             rdr.GetInt32(oPropId),
                    ImprvId:            ReadInt64Flexible(rdr, oImprvId),
                    ImprvTypeCd:        TrimOrNull(rdr, oImprvType),
                    ImprvStateCd:       TrimOrNull(rdr, oImprvState),
                    ImprvClassCd:       TrimOrNull(rdr, oImprvClass),
                    ImprvHomesite:      TrimOrNull(rdr, oHomesite),
                    ImprvVal:           ReadDecimalOrNull(rdr, oImprvVal),
                    ImprvDesc:          TrimOrNull(rdr, oImprvDesc),
                    YearBuilt:          ReadInt16OrNull(rdr, oYrBuilt),
                    EffectiveYearBuilt: ReadInt16OrNull(rdr, oEffYrBuilt),
                    ActualYearBuilt:    ReadInt16OrNull(rdr, oActYrBuilt));
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
