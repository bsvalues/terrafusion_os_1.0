using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsWashPropOwnerVal;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// Slice B1-C — production <see cref="IPacsWashPropOwnerValSource"/>
/// against live Harris PACS <c>pacs_oltp.dbo.wash_prop_owner_val</c>.
///
/// <para>The PACS <c>wash_prop_owner_val</c> table is the
/// WSDOR-grade per-owner valuation snapshot. Identity is the 4-key
/// composite <c>(year, sup_num, prop_id, owner_id)</c> — same shape
/// as <c>owner</c>. Each row carries the per-owner share of the
/// parcel's assessed/market/taxable values plus WSDOR audit fields.</para>
///
/// <para>OWN-POP TopN proof note: bounded runs filter to
/// <c>year &gt;= 2018</c> (post-cutover) and <c>sup_num = 0</c>
/// (active supplement). Production landing relaxes both for full
/// drains.</para>
/// </summary>
public sealed class SqlServerPacsWashPropOwnerValSource : IPacsWashPropOwnerValSource
{
    private readonly string _connectionString;
    private readonly int? _topN;

    public SqlServerPacsWashPropOwnerValSource(string connectionString, int? topN = null)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _topN = topN;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    // OWN-POP-2 fixture-vs-real divergence: see KeyedSqlServerPacsWashPropOwnerValSource
    // for the full mapping doc-comment. Real Benton dbo.wash_prop_owner_val uses
    // appraised/market/hstd/non_hstd column names; the original source class assumed
    // assessed_val/market_val/taxable_classified/land_taxable_classified etc.
    public string SourceQueryText =>
        "SELECT CAST(year AS smallint) AS prop_val_yr, " +
        "CAST(sup_num AS smallint) AS sup_num, " +
        "prop_id, owner_id, " +
        "appraised AS assessed_val, market AS market_val, appraised AS appraised_val, " +
        "taxable_classified, taxable_non_classified, " +
        "land_hstd_val AS land_taxable_classified, land_non_hstd_val AS land_taxable_non_classified, " +
        "imprv_hstd_val AS imprv_taxable_classified, imprv_non_hstd_val AS imprv_taxable_non_classified, " +
        "appraised_classified AS state_value_classified, appraised_non_classified AS state_value_non_classified, " +
        // boe_status is a bit in real Benton; cast to 'Y'/'N' for the entity.
        "CASE WHEN boe_status = 1 THEN 'Y' WHEN boe_status = 0 THEN 'N' END AS boe_status, " +
        "destroyed_prorate_pct AS disaster_proration_pct, " +
        "snr_frz_imprv_hs, snr_frz_land_hs " +
        "FROM dbo.wash_prop_owner_val " +
        "WHERE sup_num = 0 AND year >= 2018 " +
        "ORDER BY year DESC, prop_id, owner_id";

    public async IAsyncEnumerable<PacsSourceWashPropOwnerVal> StreamWashPropOwnerValsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var topClause = _topN.HasValue ? $"TOP {_topN.Value} " : "";
        var sql = $@"
            SELECT {topClause}CAST(year AS smallint) AS prop_val_yr,
                   CAST(sup_num AS smallint) AS sup_num,
                   prop_id,
                   owner_id,
                   appraised AS assessed_val,
                   market AS market_val,
                   appraised AS appraised_val,
                   taxable_classified,
                   taxable_non_classified,
                   land_hstd_val AS land_taxable_classified,
                   land_non_hstd_val AS land_taxable_non_classified,
                   imprv_hstd_val AS imprv_taxable_classified,
                   imprv_non_hstd_val AS imprv_taxable_non_classified,
                   appraised_classified AS state_value_classified,
                   appraised_non_classified AS state_value_non_classified,
                   CASE WHEN boe_status = 1 THEN 'Y' WHEN boe_status = 0 THEN 'N' END AS boe_status,
                   destroyed_prorate_pct AS disaster_proration_pct,
                   snr_frz_imprv_hs,
                   snr_frz_land_hs
            FROM dbo.wash_prop_owner_val
            WHERE sup_num = 0 AND year >= 2018
            ORDER BY year DESC, prop_id, owner_id";

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);

        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 600 };
        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        var oPropValYr   = rdr.GetOrdinal("prop_val_yr");
        var oSupNum      = rdr.GetOrdinal("sup_num");
        var oPropId      = rdr.GetOrdinal("prop_id");
        var oOwnerId     = rdr.GetOrdinal("owner_id");
        var oAssessed    = rdr.GetOrdinal("assessed_val");
        var oMarket      = rdr.GetOrdinal("market_val");
        var oAppraised   = rdr.GetOrdinal("appraised_val");
        var oTaxC        = rdr.GetOrdinal("taxable_classified");
        var oTaxN        = rdr.GetOrdinal("taxable_non_classified");
        var oLandC       = rdr.GetOrdinal("land_taxable_classified");
        var oLandN       = rdr.GetOrdinal("land_taxable_non_classified");
        var oImprvC      = rdr.GetOrdinal("imprv_taxable_classified");
        var oImprvN      = rdr.GetOrdinal("imprv_taxable_non_classified");
        var oStateC      = rdr.GetOrdinal("state_value_classified");
        var oStateN      = rdr.GetOrdinal("state_value_non_classified");
        var oBoe         = rdr.GetOrdinal("boe_status");
        var oDisaster    = rdr.GetOrdinal("disaster_proration_pct");
        var oSnrImprv    = rdr.GetOrdinal("snr_frz_imprv_hs");
        var oSnrLand     = rdr.GetOrdinal("snr_frz_land_hs");

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
}
