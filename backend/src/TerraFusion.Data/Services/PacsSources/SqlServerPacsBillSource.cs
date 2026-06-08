using System.Globalization;
using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsBill;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// REVENUE-SPINE Stage 1 (2026-06-07): production <see cref="IPacsBillSource"/>
/// against live Harris PACS. Current-year active levy bill lines =
/// <c>bill</c> ⋈ <c>levy_bill</c> (1:1) for <c>bill_type='L'</c>,
/// <c>is_active=1</c>. Read-only; PACS-recorded amounts verbatim.
/// </summary>
public sealed class SqlServerPacsBillSource : IPacsBillSource
{
    private readonly string _connectionString;

    public SqlServerPacsBillSource(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public async IAsyncEnumerable<PacsSourceLevyRate> StreamLevyRatesAsync(
        short year, [EnumeratorCancellation] CancellationToken ct)
    {
        const string sql = "SELECT year, tax_district_id, levy_cd, levy_rate FROM dbo.levy WHERE year = @yr";
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(ct).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 300 };
        cmd.Parameters.AddWithValue("@yr", (int)year);
        await using var rdr = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await rdr.ReadAsync(ct).ConfigureAwait(false))
        {
            ct.ThrowIfCancellationRequested();
            var cd = Str(rdr, 2);
            if (string.IsNullOrEmpty(cd)) continue;
            yield return new PacsSourceLevyRate(Shrt(rdr, 0) ?? year, IntFlex(rdr, 1), cd, Dec(rdr, 3));
        }
    }

    public async IAsyncEnumerable<PacsSourceTaxBillLine> StreamTaxBillLinesAsync(
        short year, [EnumeratorCancellation] CancellationToken ct)
    {
        const string sql = @"
            SELECT b.bill_id, b.prop_id, CAST(b.year AS smallint) AS year,
                   CAST(b.sup_num AS smallint) AS sup_num, b.is_active, b.bill_type,
                   lb.levy_cd, lb.tax_district_id, lb.tax_area_id, lb.taxable_val,
                   b.current_amount_due, b.amount_paid
            FROM dbo.bill b
            INNER JOIN dbo.levy_bill lb ON lb.bill_id = b.bill_id AND lb.year = b.year
            WHERE b.year = @yr AND b.is_active = 1 AND b.bill_type = 'L'";
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(ct).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 1800 };
        cmd.Parameters.AddWithValue("@yr", (int)year);
        await using var rdr = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await rdr.ReadAsync(ct).ConfigureAwait(false))
        {
            ct.ThrowIfCancellationRequested();
            yield return new PacsSourceTaxBillLine(
                BillId: LongFlex(rdr, 0),
                PropId: IntFlex(rdr, 1),
                TaxYr: Shrt(rdr, 2) ?? year,
                SupNum: Shrt(rdr, 3) ?? 0,
                IsActive: !rdr.IsDBNull(4) && System.Convert.ToBoolean(rdr.GetValue(4)),
                BillType: Str(rdr, 5),
                LevyCd: Str(rdr, 6),
                TaxDistrictId: IntFlex(rdr, 7),
                TaxAreaId: IntFlex(rdr, 8),
                TaxableVal: Dec(rdr, 9),
                CurrentAmountDue: Dec(rdr, 10),
                AmountPaid: Dec(rdr, 11));
        }
    }

    private static int IntFlex(SqlDataReader r, int o)
        => r.IsDBNull(o) ? 0 : System.Convert.ToInt32(r.GetValue(o), CultureInfo.InvariantCulture);
    private static long LongFlex(SqlDataReader r, int o)
        => r.IsDBNull(o) ? 0L : System.Convert.ToInt64(r.GetValue(o), CultureInfo.InvariantCulture);
    private static short? Shrt(SqlDataReader r, int o)
        => r.IsDBNull(o) ? null : System.Convert.ToInt16(r.GetValue(o), CultureInfo.InvariantCulture);
    private static decimal? Dec(SqlDataReader r, int o)
        => r.IsDBNull(o) ? null : System.Convert.ToDecimal(r.GetValue(o), CultureInfo.InvariantCulture);
    private static string? Str(SqlDataReader r, int o)
    {
        if (r.IsDBNull(o)) return null;
        var v = r.GetValue(o)?.ToString()?.Trim();
        return string.IsNullOrEmpty(v) ? null : v;
    }
}
