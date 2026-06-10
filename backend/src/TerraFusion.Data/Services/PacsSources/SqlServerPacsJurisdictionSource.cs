using System.Globalization;
using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsJurisdiction;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// JURISDICTION-SPINE (2026-06-07): production <see cref="IPacsJurisdictionSource"/>
/// against live Harris PACS. Parcel→TCA at the ACTIVE supplement (MAX sup_num
/// per (prop_id, year)); TCA→district from tax_area_fund_assoc with only the
/// (tax_area_id, tax_district_id) pair (levy_cd / fund_id are Revenue Spine).
/// </summary>
public sealed class SqlServerPacsJurisdictionSource : IPacsJurisdictionSource
{
    private readonly string _connectionString;

    public SqlServerPacsJurisdictionSource(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public async IAsyncEnumerable<PacsSourceTaxArea> StreamTaxAreasAsync(
        [EnumeratorCancellation] CancellationToken ct)
    {
        const string sql = "SELECT tax_area_id, tax_area_number, tax_area_state, tax_area_description, " +
                           "is_inactive_after_year, inactive_after_year FROM dbo.tax_area";
        await foreach (var r in Read(sql, ct).ConfigureAwait(false))
            yield return new PacsSourceTaxArea(
                IntFlex(r, 0), Str(r, 1), Str(r, 2), Str(r, 3),
                Shrt(r, 5), !r.IsDBNull(4) && System.Convert.ToInt32(r.GetValue(4), CultureInfo.InvariantCulture) != 0);
    }

    public async IAsyncEnumerable<PacsSourceTaxDistrict> StreamTaxDistrictsAsync(
        [EnumeratorCancellation] CancellationToken ct)
    {
        const string sql = "SELECT tax_district_id, tax_district_cd, tax_district_desc, " +
                           "tax_district_type_cd, location_code FROM dbo.tax_district";
        await foreach (var r in Read(sql, ct).ConfigureAwait(false))
            yield return new PacsSourceTaxDistrict(IntFlex(r, 0), Str(r, 1), Str(r, 2), Str(r, 3), Str(r, 4));
    }

    public async IAsyncEnumerable<PacsSourceTaxAreaDistrict> StreamTaxAreaDistrictsAsync(
        short year, [EnumeratorCancellation] CancellationToken ct)
    {
        const string sql = "SELECT DISTINCT tax_area_id, tax_district_id FROM dbo.tax_area_fund_assoc WHERE year = @yr";
        await foreach (var r in Read(sql, ct, year).ConfigureAwait(false))
            yield return new PacsSourceTaxAreaDistrict(IntFlex(r, 0), IntFlex(r, 1));
    }

    public async IAsyncEnumerable<PacsSourceParcelTaxArea> StreamParcelTaxAreasAsync(
        short year, [EnumeratorCancellation] CancellationToken ct)
    {
        const string sql = @"
            WITH active AS (
                SELECT prop_id, year, MAX(sup_num) AS active_sup
                FROM dbo.property_tax_area WHERE year = @yr GROUP BY prop_id, year)
            SELECT pta.prop_id, CAST(pta.year AS smallint) AS year,
                   CAST(pta.sup_num AS smallint) AS sup_num, pta.tax_area_id
            FROM dbo.property_tax_area pta
            INNER JOIN active a ON pta.prop_id=a.prop_id AND pta.year=a.year AND pta.sup_num=a.active_sup
            WHERE pta.year = @yr";
        await foreach (var r in Read(sql, ct, year).ConfigureAwait(false))
            yield return new PacsSourceParcelTaxArea(IntFlex(r, 0), Shrt(r, 1) ?? year, Shrt(r, 2) ?? 0, IntFlex(r, 3));
    }

    private async IAsyncEnumerable<SqlDataReader> Read(
        string sql, [EnumeratorCancellation] CancellationToken ct, short? year = null)
    {
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(ct).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 600 };
        if (year.HasValue) cmd.Parameters.AddWithValue("@yr", (int)year.Value);
        await using var rdr = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await rdr.ReadAsync(ct).ConfigureAwait(false))
        {
            ct.ThrowIfCancellationRequested();
            yield return rdr;
        }
    }

    private static int IntFlex(SqlDataReader r, int o)
        => r.IsDBNull(o) ? 0 : System.Convert.ToInt32(r.GetValue(o), CultureInfo.InvariantCulture);
    private static short? Shrt(SqlDataReader r, int o)
        => r.IsDBNull(o) ? null : System.Convert.ToInt16(r.GetValue(o), CultureInfo.InvariantCulture);
    private static string? Str(SqlDataReader r, int o)
    {
        if (r.IsDBNull(o)) return null;
        var v = r.GetValue(o)?.ToString()?.Trim();
        return string.IsNullOrEmpty(v) ? null : v;
    }
}
