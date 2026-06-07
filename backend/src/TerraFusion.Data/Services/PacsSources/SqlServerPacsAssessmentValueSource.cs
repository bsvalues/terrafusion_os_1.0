using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsAssessment;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// ASSESSMENT-VALUE-SEAL (2026-06-07): production
/// <see cref="IPacsAssessmentValueSource"/> against live Harris PACS
/// <c>pacs_oltp.dbo.property_val</c>.
///
/// <para>Doctrine (proven, mirrors the Owner sup_num lesson): the CURRENT
/// assessment value for a parcel-year is the row at the ACTIVE supplement
/// = MAX(<c>sup_num</c>) per (prop_id, prop_val_yr), NOT <c>sup_num=0</c>.
/// One clean grouped scan resolves the active supplement; an inner join
/// pulls the value columns for exactly that row. One live row per
/// parcel-year for the requested operational year.</para>
/// </summary>
public sealed class SqlServerPacsAssessmentValueSource : IPacsAssessmentValueSource
{
    private readonly string _connectionString;
    private readonly short _assessmentYear;

    public SqlServerPacsAssessmentValueSource(string connectionString, short assessmentYear)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _assessmentYear = assessmentYear;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public string SourceQueryText =>
        $"SELECT pv.prop_id, pv.prop_val_yr, pv.sup_num, pv.property_use_cd, " +
        $"assessed_val, appraised_val, market, land_hstd_val, land_non_hstd_val, " +
        $"imprv_hstd_val, imprv_non_hstd_val, ag_use_val, ag_market, " +
        $"timber_hs_use_val, timber_market, hscap_newhsval, hscap_prevhsval " +
        $"FROM dbo.property_val pv JOIN (SELECT prop_id, prop_val_yr, MAX(sup_num) active_sup " +
        $"FROM dbo.property_val WHERE prop_val_yr={_assessmentYear} GROUP BY prop_id, prop_val_yr) a " +
        $"ON pv.prop_id=a.prop_id AND pv.prop_val_yr=a.prop_val_yr AND pv.sup_num=a.active_sup " +
        $"WHERE pv.prop_val_yr={_assessmentYear} (active-supplement)";

    public async IAsyncEnumerable<PacsSourceAssessmentValue> StreamAssessmentValuesAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        // ACTIVE-supplement resolution: one grouped scan picks MAX(sup_num)
        // per parcel-year; the join returns the value row at exactly that
        // supplement. Bounded to the requested operational year.
        const string sql = @"
            WITH active AS (
                SELECT prop_id, prop_val_yr, MAX(sup_num) AS active_sup
                FROM dbo.property_val WHERE prop_val_yr = @yr
                GROUP BY prop_id, prop_val_yr)
            SELECT pv.prop_id,
                   CAST(pv.prop_val_yr AS smallint)  AS prop_val_yr,
                   CAST(pv.sup_num AS smallint)      AS sup_num,
                   pv.property_use_cd,
                   pv.assessed_val, pv.appraised_val, pv.market,
                   pv.land_hstd_val, pv.land_non_hstd_val,
                   pv.imprv_hstd_val, pv.imprv_non_hstd_val,
                   pv.ag_use_val, pv.ag_market,
                   pv.timber_hs_use_val, pv.timber_market,
                   pv.hscap_newhsval, pv.hscap_prevhsval
            FROM dbo.property_val pv
            INNER JOIN active a
              ON pv.prop_id = a.prop_id AND pv.prop_val_yr = a.prop_val_yr
                 AND pv.sup_num = a.active_sup
            WHERE pv.prop_val_yr = @yr";

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 1800 };
        cmd.Parameters.AddWithValue("@yr", (int)_assessmentYear);

        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        var oPropId = rdr.GetOrdinal("prop_id");
        var oYr     = rdr.GetOrdinal("prop_val_yr");
        var oSup    = rdr.GetOrdinal("sup_num");
        var oUse    = rdr.GetOrdinal("property_use_cd");
        var oAssd   = rdr.GetOrdinal("assessed_val");
        var oApp    = rdr.GetOrdinal("appraised_val");
        var oMkt    = rdr.GetOrdinal("market");
        var oLandH  = rdr.GetOrdinal("land_hstd_val");
        var oLandN  = rdr.GetOrdinal("land_non_hstd_val");
        var oImpH   = rdr.GetOrdinal("imprv_hstd_val");
        var oImpN   = rdr.GetOrdinal("imprv_non_hstd_val");
        var oAgU    = rdr.GetOrdinal("ag_use_val");
        var oAgM    = rdr.GetOrdinal("ag_market");
        var oTimU   = rdr.GetOrdinal("timber_hs_use_val");
        var oTimM   = rdr.GetOrdinal("timber_market");
        var oHsNew  = rdr.GetOrdinal("hscap_newhsval");
        var oHsPrev = rdr.GetOrdinal("hscap_prevhsval");

        while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return new PacsSourceAssessmentValue(
                PropId:          rdr.GetInt32(oPropId),
                AssessmentYear:  rdr.GetInt16(oYr),
                SupNum:          rdr.GetInt16(oSup),
                PropertyUseCd:   Str(rdr, oUse),
                AssessedVal:     Dec(rdr, oAssd),
                AppraisedVal:    Dec(rdr, oApp),
                MarketVal:       Dec(rdr, oMkt),
                LandHstdVal:     Dec(rdr, oLandH),
                LandNonHstdVal:  Dec(rdr, oLandN),
                ImprvHstdVal:    Dec(rdr, oImpH),
                ImprvNonHstdVal: Dec(rdr, oImpN),
                AgUseVal:        Dec(rdr, oAgU),
                AgMarketVal:     Dec(rdr, oAgM),
                TimberUseVal:    Dec(rdr, oTimU),
                TimberMarketVal: Dec(rdr, oTimM),
                HsCapNewVal:     Dec(rdr, oHsNew),
                HsCapPrevVal:    Dec(rdr, oHsPrev));
        }
    }

    private static decimal? Dec(SqlDataReader rdr, int ord)
        => rdr.IsDBNull(ord) ? null : rdr.GetDecimal(ord);

    private static string? Str(SqlDataReader rdr, int ord)
    {
        if (rdr.IsDBNull(ord)) return null;
        var raw = rdr.GetValue(ord)?.ToString()?.Trim();
        return string.IsNullOrEmpty(raw) ? null : raw;
    }
}
