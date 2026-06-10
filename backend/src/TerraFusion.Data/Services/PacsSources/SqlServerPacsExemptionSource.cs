using System.Globalization;
using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsExemption;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// EXEMPTION-FACT-SEAL (2026-06-07): production
/// <see cref="IPacsExemptionSource"/> against live Harris PACS
/// <c>pacs_oltp.dbo.property_exemption</c> + <c>dbo.exmpt_type</c>.
///
/// <para>Doctrine: the current exemption fact for a parcel-year is at the
/// ACTIVE supplement = MAX(sup_num) per (prop_id, exmpt_tax_yr). A parcel-
/// year may carry multiple exemption types at that supplement; each is a
/// row. One grouped scan resolves the active supplement; the join returns
/// every exemption row at exactly that supplement.</para>
/// </summary>
public sealed class SqlServerPacsExemptionSource : IPacsExemptionSource
{
    private readonly string _connectionString;
    private readonly short _taxYear;

    public SqlServerPacsExemptionSource(string connectionString, short taxYear)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
        _taxYear = taxYear;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public string SourceQueryText =>
        $"SELECT pe.* FROM dbo.property_exemption pe JOIN (SELECT prop_id, exmpt_tax_yr, " +
        $"MAX(sup_num) active_sup FROM dbo.property_exemption WHERE exmpt_tax_yr={_taxYear} " +
        $"GROUP BY prop_id, exmpt_tax_yr) a ON pe.prop_id=a.prop_id AND pe.exmpt_tax_yr=a.exmpt_tax_yr " +
        $"AND pe.sup_num=a.active_sup WHERE pe.exmpt_tax_yr={_taxYear} (active-supplement)";

    public async IAsyncEnumerable<PacsSourceExemption> StreamExemptionsAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        const string sql = @"
            WITH active AS (
                SELECT prop_id, exmpt_tax_yr, MAX(sup_num) AS active_sup
                FROM dbo.property_exemption WHERE exmpt_tax_yr = @yr
                GROUP BY prop_id, exmpt_tax_yr)
            SELECT pe.prop_id,
                   pe.owner_id,
                   CAST(pe.exmpt_tax_yr AS smallint)   AS exmpt_tax_yr,
                   CAST(pe.sup_num AS smallint)        AS sup_num,
                   pe.exmpt_type_cd,
                   pe.exmpt_subtype_cd,
                   pe.exemption_pct,
                   pe.effective_dt,
                   pe.termination_dt,
                   pe.qualify_yr,
                   pe.owner_tax_yr,
                   pe.effective_tax_yr
            FROM dbo.property_exemption pe
            INNER JOIN active a
              ON pe.prop_id = a.prop_id AND pe.exmpt_tax_yr = a.exmpt_tax_yr
                 AND pe.sup_num = a.active_sup
            WHERE pe.exmpt_tax_yr = @yr";

        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 600 };
        cmd.Parameters.AddWithValue("@yr", (int)_taxYear);
        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);

        var oProp = rdr.GetOrdinal("prop_id");
        var oOwner = rdr.GetOrdinal("owner_id");
        var oYr = rdr.GetOrdinal("exmpt_tax_yr");
        var oSup = rdr.GetOrdinal("sup_num");
        var oType = rdr.GetOrdinal("exmpt_type_cd");
        var oSub = rdr.GetOrdinal("exmpt_subtype_cd");
        var oPct = rdr.GetOrdinal("exemption_pct");
        var oEff = rdr.GetOrdinal("effective_dt");
        var oTerm = rdr.GetOrdinal("termination_dt");
        var oQual = rdr.GetOrdinal("qualify_yr");
        var oOwnYr = rdr.GetOrdinal("owner_tax_yr");
        var oEffYr = rdr.GetOrdinal("effective_tax_yr");

        while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();
            yield return new PacsSourceExemption(
                PropId: IntFlex(rdr, oProp),
                OwnerId: Int64Flex(rdr, oOwner),
                ExmptTaxYr: rdr.GetInt16(oYr),
                SupNum: rdr.GetInt16(oSup),
                ExmptTypeCd: (Str(rdr, oType) ?? string.Empty),
                ExmptSubtypeCd: Str(rdr, oSub),
                ExemptionPct: rdr.IsDBNull(oPct) ? null : rdr.GetDecimal(oPct),
                EffectiveDt: Dt(rdr, oEff),
                TerminationDt: Dt(rdr, oTerm),
                QualifyYr: Shrt(rdr, oQual),
                OwnerTaxYr: Shrt(rdr, oOwnYr),
                EffectiveTaxYr: Shrt(rdr, oEffYr));
        }
    }

    public async IAsyncEnumerable<PacsSourceExemptionType> StreamExemptionTypesAsync(
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        const string sql = "SELECT exmpt_type_cd, exmpt_desc FROM dbo.exmpt_type";
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 120 };
        await using var rdr = await cmd.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
        var oCd = rdr.GetOrdinal("exmpt_type_cd");
        var oDesc = rdr.GetOrdinal("exmpt_desc");
        while (await rdr.ReadAsync(cancellationToken).ConfigureAwait(false))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var cd = Str(rdr, oCd);
            if (string.IsNullOrEmpty(cd)) continue;
            yield return new PacsSourceExemptionType(cd, Str(rdr, oDesc));
        }
    }

    // PACS stores many integer-ish columns as numeric/decimal — read via
    // Convert on the boxed value so int / smallint / numeric all coerce.
    private static int IntFlex(SqlDataReader rdr, int ord)
        => rdr.IsDBNull(ord) ? 0 : Convert.ToInt32(rdr.GetValue(ord), CultureInfo.InvariantCulture);
    private static long Int64Flex(SqlDataReader rdr, int ord)
        => rdr.IsDBNull(ord) ? 0L : Convert.ToInt64(rdr.GetValue(ord), CultureInfo.InvariantCulture);
    private static short? Shrt(SqlDataReader rdr, int ord)
        => rdr.IsDBNull(ord) ? null : Convert.ToInt16(rdr.GetValue(ord), CultureInfo.InvariantCulture);
    private static DateTime? Dt(SqlDataReader rdr, int ord)
        => rdr.IsDBNull(ord) ? null : DateTime.SpecifyKind(rdr.GetDateTime(ord), DateTimeKind.Utc);
    private static string? Str(SqlDataReader rdr, int ord)
    {
        if (rdr.IsDBNull(ord)) return null;
        var raw = rdr.GetValue(ord)?.ToString()?.Trim();
        return string.IsNullOrEmpty(raw) ? null : raw;
    }
}
