using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsAssessmentBill;

public sealed class PacsAssessmentAgencyResult
{
    public string Status { get; set; } = "IN_PROGRESS";
    public int Upserted { get; set; }
    public string? ErrorSummary { get; set; }
}

public sealed class PacsAssessmentBillResult
{
    public Guid PromotionLoadBatchId { get; set; }
    public string Status { get; set; } = "IN_PROGRESS";
    public int Landed { get; set; }
    public int Projected { get; set; }
    public int UnresolvedParcel { get; set; }
    public int AgencyUnbacked { get; set; }
    public int RollupRows { get; set; }
    public string? ErrorSummary { get; set; }
}

/// <summary>REVENUE-SPINE Stage 2B: agency dictionary populate + special-assessment
/// bill-line projection + parcel rollup.</summary>
public interface IPacsAssessmentBillService
{
    Task<PacsAssessmentAgencyResult> PopulateAgencyAsync(
        IPacsAssessmentBillSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default);
    Task<PacsAssessmentBillResult> ProjectAssessmentBillLineAsync(
        IPacsAssessmentBillSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default);
}
