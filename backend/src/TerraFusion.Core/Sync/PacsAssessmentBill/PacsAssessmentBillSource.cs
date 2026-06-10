namespace TerraFusion.Core.Sync.PacsAssessmentBill;

public sealed record PacsSourceAssessmentAgency(
    int AgencyId, string? AssessmentCd, string? AssessmentTypeCd, string? AssessmentDescription);

public sealed record PacsSourceAssessmentBillLine(
    long BillId, int PropId, short TaxYr, short SupNum, bool IsActive, string? BillType,
    int AgencyId, decimal? CurrentAmountDue, decimal? AmountPaid);

/// <summary>
/// REVENUE-SPINE Stage 2B: streams the special-assessment agency dictionary and
/// the current-year active special-assessment bill lines
/// (bill ⋈ assessment_bill, bill_type='A', is_active=1). Agency-backed,
/// rate-free; PACS-recorded amounts verbatim.
/// </summary>
public interface IPacsAssessmentBillSource
{
    string SourceSystem { get; }
    string SourceFileOrDatabase { get; }

    IAsyncEnumerable<PacsSourceAssessmentAgency> StreamAgenciesAsync(short year, System.Threading.CancellationToken ct);
    IAsyncEnumerable<PacsSourceAssessmentBillLine> StreamAssessmentBillLinesAsync(short year, System.Threading.CancellationToken ct);
}
