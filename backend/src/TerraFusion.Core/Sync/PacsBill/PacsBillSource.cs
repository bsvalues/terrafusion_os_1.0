namespace TerraFusion.Core.Sync.PacsBill;

public sealed record PacsSourceLevyRate(short TaxYr, int TaxDistrictId, string LevyCd, decimal? LevyRate);

public sealed record PacsSourceTaxBillLine(
    long BillId, int PropId, short TaxYr, short SupNum, bool IsActive, string? BillType,
    string? LevyCd, int TaxDistrictId, int TaxAreaId,
    decimal? TaxableVal, decimal? CurrentAmountDue, decimal? AmountPaid);

/// <summary>
/// REVENUE-SPINE Stage 1: streams the levy rate table and the current-year
/// active levy bill lines (bill ⋈ levy_bill, bill_type='L', is_active=1).
/// </summary>
public interface IPacsBillSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }

    IAsyncEnumerable<PacsSourceLevyRate> StreamLevyRatesAsync(short year, System.Threading.CancellationToken ct);
    IAsyncEnumerable<PacsSourceTaxBillLine> StreamTaxBillLinesAsync(short year, System.Threading.CancellationToken ct);
}
