using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.PacsBill;

public sealed class PacsLevyRateResult
{
    public string Status { get; set; } = "IN_PROGRESS";
    public int Upserted { get; set; }
    public string? ErrorSummary { get; set; }
}

public sealed class PacsTaxBillResult
{
    public Guid PromotionLoadBatchId { get; set; }
    public string Status { get; set; } = "IN_PROGRESS";
    public int Landed { get; set; }
    public int Projected { get; set; }
    public int UnresolvedParcel { get; set; }
    public int DistrictUnbacked { get; set; }
    public int RateUnbacked { get; set; }
    public int RollupRows { get; set; }
    public string? ErrorSummary { get; set; }
}

/// <summary>REVENUE-SPINE Stage 1: levy-rate populate + tax-bill-line projection + rollup.</summary>
public interface IPacsBillService
{
    Task<PacsLevyRateResult> PopulateLevyRateAsync(
        IPacsBillSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default);
    Task<PacsTaxBillResult> ProjectTaxBillLineAsync(
        IPacsBillSource source, Guid countyId, short year, string operatorName, CancellationToken ct = default);
}
