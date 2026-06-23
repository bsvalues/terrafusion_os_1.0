using System.Globalization;
using System.Runtime.CompilerServices;
using Microsoft.Data.SqlClient;
using TerraFusion.Core.Sync.PacsAssessmentBill;

namespace TerraFusion.Data.Services.PacsSources;

/// <summary>
/// REVENUE-SPINE Stage 2B (2026-06-07): production <see cref="IPacsAssessmentBillSource"/>
/// against live Harris PACS. Current-year active special-assessment bill lines =
/// <c>bill</c> ⋈ <c>assessment_bill</c> (1:1) for <c>bill_type='A'</c>,
/// <c>is_active=1</c>. Agency dictionary from <c>special_assessment_agency</c>.
/// Read-only; PACS-recorded amounts verbatim.
/// </summary>
public sealed class SqlServerPacsAssessmentBillSource : IPacsAssessmentBillSource
{
    private readonly string _connectionString;

    public SqlServerPacsAssessmentBillSource(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("PACS connection string is required.", nameof(connectionString));
        _connectionString = connectionString;
    }

    public string SourceSystem => "JCHARRISPACS";
    public string SourceFileOrDatabase => "pacs_oltp";

    public async IAsyncEnumerable<PacsSourceAssessmentAgency> StreamAgenciesAsync(
        short year, [EnumeratorCancellation] CancellationToken ct)
    {
        const string sql =
            "SELECT agency_id, assessment_cd, assessment_type_cd, assessment_description " +
            "FROM dbo.special_assessment_agency";
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(ct).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 300 };
        await using var rdr = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await rdr.ReadAsync(ct).ConfigureAwait(false))
        {
            ct.ThrowIfCancellationRequested();
            yield return new PacsSourceAssessmentAgency(
                AgencyId: IntFlex(rdr, 0),
                AssessmentCd: Str(rdr, 1),
                AssessmentTypeCd: Str(rdr, 2),
                AssessmentDescription: Str(rdr, 3));
        }
    }

    public async IAsyncEnumerable<PacsSourceAssessmentBillLine> StreamAssessmentBillLinesAsync(
        short year, [EnumeratorCancellation] CancellationToken ct)
    {
        const string sql = @"
            SELECT b.bill_id, b.prop_id, CAST(b.year AS smallint) AS year,
                   CAST(b.sup_num AS smallint) AS sup_num, b.is_active, b.bill_type,
                   ab.agency_id, b.current_amount_due, b.amount_paid
            FROM dbo.bill b
            INNER JOIN dbo.assessment_bill ab ON ab.bill_id = b.bill_id AND ab.year = b.year
            WHERE b.year = @yr AND b.is_active = 1 AND b.bill_type = 'A'";
        await using var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync(ct).ConfigureAwait(false);
        await using var cmd = new SqlCommand(sql, conn) { CommandTimeout = 1800 };
        cmd.Parameters.AddWithValue("@yr", (int)year);
        await using var rdr = await cmd.ExecuteReaderAsync(ct).ConfigureAwait(false);
        while (await rdr.ReadAsync(ct).ConfigureAwait(false))
        {
            ct.ThrowIfCancellationRequested();
            yield return new PacsSourceAssessmentBillLine(
                BillId: LongFlex(rdr, 0),
                PropId: IntFlex(rdr, 1),
                TaxYr: Shrt(rdr, 2) ?? year,
                SupNum: Shrt(rdr, 3) ?? 0,
                IsActive: !rdr.IsDBNull(4) && System.Convert.ToBoolean(rdr.GetValue(4)),
                BillType: Str(rdr, 5),
                AgencyId: IntFlex(rdr, 6),
                CurrentAmountDue: Dec(rdr, 7),
                AmountPaid: Dec(rdr, 8));
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
