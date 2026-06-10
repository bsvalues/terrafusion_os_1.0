using System.Runtime.CompilerServices;
using System.Text;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsWashPropOwnerVal;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Keyed wash_prop_owner_val source: drains live Harris PACS
/// <c>pacs_oltp.dbo.wash_prop_owner_val</c>, but ONLY for the
/// <c>(prop_id, year, owner_id)</c> triples explicitly requested by
/// the caller.
///
/// <para>Used by the OWN-POP-2 closure to land WPOV rows that align
/// with a just-promoted owner-truth batch's identity keys, so the
/// B4 canonical projector can resolve every WPOV row's parcel and
/// owner xrefs without a full-corpus drain.</para>
///
/// <para>Each triple uses 3 parameters; chunks at 600 triples per
/// round-trip (1800 parameters) for headroom under SQL Server's
/// 2100-parameter cap.</para>
/// </summary>
public sealed class KeyedSqlServerPacsWashPropOwnerValSource : IPacsWashPropOwnerValSource
{
    private const int KeyChunkSize = 600;

    private readonly string _connectionString;
    private readonly IReadOnlyCollection<(int PropId, short Year, long OwnerId)> _keys;

    public KeyedSqlServerPacsWashPropOwnerValSource(
        string connectionString,
        IReadOnlyCollection<(int PropId, short Year, long OwnerId)> keys)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _keys = keys ?? throw new ArgumentNullException(nameof(keys));
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    // OWN-POP-2 fixture-vs-real divergence: real Benton dbo.wash_prop_owner_val
    // uses different column names than the original PacsSourceWashPropOwnerVal
    // record. Mapping (entity field ← Benton column):
    //   AssessedVal              ← appraised        (Benton's appraised IS the assessed)
    //   MarketVal                ← market
    //   AppraisedVal             ← appraised
    //   TaxableClassified        ← taxable_classified
    //   TaxableNonClassified     ← taxable_non_classified
    //   LandTaxableClassified    ← land_hstd_val    (homestead == classified for valuation)
    //   LandTaxableNonClassified ← land_non_hstd_val
    //   ImprvTaxableClassified   ← imprv_hstd_val
    //   ImprvTaxableNonClassified← imprv_non_hstd_val
    //   StateValueClassified     ← appraised_classified
    //   StateValueNonClassified  ← appraised_non_classified
    //   DisasterProrationPct     ← destroyed_prorate_pct
    public string SourceQueryText =>
        $"SELECT CAST(year AS smallint) AS prop_val_yr, CAST(sup_num AS smallint) AS sup_num, " +
        $"prop_id, owner_id, " +
        $"appraised AS assessed_val, market AS market_val, appraised AS appraised_val, " +
        $"taxable_classified, taxable_non_classified, " +
        $"land_hstd_val AS land_taxable_classified, land_non_hstd_val AS land_taxable_non_classified, " +
        $"imprv_hstd_val AS imprv_taxable_classified, imprv_non_hstd_val AS imprv_taxable_non_classified, " +
        $"appraised_classified AS state_value_classified, appraised_non_classified AS state_value_non_classified, " +
        // Real Benton boe_status is a bit; cast to 'Y'/'N' for the doctrine
        // entity which expects a string code.
        $"CASE WHEN boe_status = 1 THEN 'Y' WHEN boe_status = 0 THEN 'N' END AS boe_status, " +
        $"destroyed_prorate_pct AS disaster_proration_pct, snr_frz_imprv_hs, snr_frz_land_hs " +
        $"FROM dbo.wash_prop_owner_val " +
        $"WHERE sup_num = 0 AND (prop_id, year, owner_id) IN ({_keys.Count} keyed triples)";

    public async IAsyncEnumerable<PacsSourceWashPropOwnerVal> StreamWashPropOwnerValsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        if (_keys.Count == 0) yield break;

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        foreach (var chunk in Chunk(_keys, KeyChunkSize))
        {
            cancellationToken.ThrowIfCancellationRequested();

            var sb = new StringBuilder();
            sb.AppendLine("SELECT CAST(year AS smallint) AS prop_val_yr,");
            sb.AppendLine("       CAST(sup_num AS smallint) AS sup_num,");
            sb.AppendLine("       prop_id, owner_id,");
            sb.AppendLine("       appraised AS assessed_val,");
            sb.AppendLine("       market AS market_val,");
            sb.AppendLine("       appraised AS appraised_val,");
            sb.AppendLine("       taxable_classified, taxable_non_classified,");
            sb.AppendLine("       land_hstd_val AS land_taxable_classified,");
            sb.AppendLine("       land_non_hstd_val AS land_taxable_non_classified,");
            sb.AppendLine("       imprv_hstd_val AS imprv_taxable_classified,");
            sb.AppendLine("       imprv_non_hstd_val AS imprv_taxable_non_classified,");
            sb.AppendLine("       appraised_classified AS state_value_classified,");
            sb.AppendLine("       appraised_non_classified AS state_value_non_classified,");
            sb.AppendLine("       CASE WHEN boe_status = 1 THEN 'Y' WHEN boe_status = 0 THEN 'N' END AS boe_status,");
            sb.AppendLine("       destroyed_prorate_pct AS disaster_proration_pct,");
            sb.AppendLine("       snr_frz_imprv_hs, snr_frz_land_hs");
            sb.AppendLine("FROM dbo.wash_prop_owner_val");
            sb.AppendLine("WHERE sup_num = 0 AND (");

            await using var cmd = new SqlCommand { Connection = conn, CommandTimeout = 600 };
            for (var i = 0; i < chunk.Count; i++)
            {
                if (i > 0) sb.Append("   OR ");
                sb.AppendLine($"(prop_id = @p{i} AND year = @y{i} AND owner_id = @o{i})");
                cmd.Parameters.AddWithValue($"@p{i}", chunk[i].PropId);
                cmd.Parameters.AddWithValue($"@y{i}", (int)chunk[i].Year);
                cmd.Parameters.AddWithValue($"@o{i}", chunk[i].OwnerId);
            }
            sb.AppendLine(")");

            cmd.CommandText = sb.ToString();

            await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            var oPropValYr = rdr.GetOrdinal("prop_val_yr");
            var oSupNum    = rdr.GetOrdinal("sup_num");
            var oPropId    = rdr.GetOrdinal("prop_id");
            var oOwnerId   = rdr.GetOrdinal("owner_id");
            var oAssessed  = rdr.GetOrdinal("assessed_val");
            var oMarket    = rdr.GetOrdinal("market_val");
            var oAppraised = rdr.GetOrdinal("appraised_val");
            var oTaxC      = rdr.GetOrdinal("taxable_classified");
            var oTaxN      = rdr.GetOrdinal("taxable_non_classified");
            var oLandC     = rdr.GetOrdinal("land_taxable_classified");
            var oLandN     = rdr.GetOrdinal("land_taxable_non_classified");
            var oImprvC    = rdr.GetOrdinal("imprv_taxable_classified");
            var oImprvN    = rdr.GetOrdinal("imprv_taxable_non_classified");
            var oStateC    = rdr.GetOrdinal("state_value_classified");
            var oStateN    = rdr.GetOrdinal("state_value_non_classified");
            var oBoe       = rdr.GetOrdinal("boe_status");
            var oDisaster  = rdr.GetOrdinal("disaster_proration_pct");
            var oSnrImprv  = rdr.GetOrdinal("snr_frz_imprv_hs");
            var oSnrLand   = rdr.GetOrdinal("snr_frz_land_hs");

            while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return new PacsSourceWashPropOwnerVal(
                    PropValYr:                rdr.GetInt16(oPropValYr),
                    SupNum:                   rdr.GetInt16(oSupNum),
                    PropId:                   rdr.GetInt32(oPropId),
                    OwnerId:                  ReadInt64Flexible(rdr, oOwnerId),
                    AssessedVal:              ReadDecimalOrNull(rdr, oAssessed),
                    MarketVal:                ReadDecimalOrNull(rdr, oMarket),
                    AppraisedVal:             ReadDecimalOrNull(rdr, oAppraised),
                    TaxableClassified:        ReadDecimalOrNull(rdr, oTaxC),
                    TaxableNonClassified:     ReadDecimalOrNull(rdr, oTaxN),
                    LandTaxableClassified:    ReadDecimalOrNull(rdr, oLandC),
                    LandTaxableNonClassified: ReadDecimalOrNull(rdr, oLandN),
                    ImprvTaxableClassified:   ReadDecimalOrNull(rdr, oImprvC),
                    ImprvTaxableNonClassified:ReadDecimalOrNull(rdr, oImprvN),
                    StateValueClassified:     ReadDecimalOrNull(rdr, oStateC),
                    StateValueNonClassified:  ReadDecimalOrNull(rdr, oStateN),
                    BoeStatus:                TrimOrNull(rdr, oBoe),
                    DisasterProrationPct:     ReadDecimalOrNull(rdr, oDisaster),
                    SnrFrzImprvHs:            ReadDecimalOrNull(rdr, oSnrImprv),
                    SnrFrzLandHs:             ReadDecimalOrNull(rdr, oSnrLand));
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

    private static decimal? ReadDecimalOrNull(SqlDataReader rdr, int ordinal)
    {
        if (rdr.IsDBNull(ordinal)) return null;
        var t = rdr.GetFieldType(ordinal);
        if (t == typeof(decimal)) return rdr.GetDecimal(ordinal);
        if (t == typeof(double)) return (decimal)rdr.GetDouble(ordinal);
        if (t == typeof(float)) return (decimal)rdr.GetFloat(ordinal);
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
