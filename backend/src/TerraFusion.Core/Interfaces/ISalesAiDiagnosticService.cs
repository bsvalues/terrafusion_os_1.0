using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;

namespace TerraFusion.Core.Interfaces;

public interface ISalesAiDiagnosticService
{
    /// <summary>Run diagnostics for one stratum. Upserts result into SaleAuditDiagnoses.</summary>
    Task<SaleAuditDiagnosis> DiagnoseStratumAsync(
        Guid countyId, int taxYear, string stratumKey, CancellationToken ct = default);

    /// <summary>Run diagnostics for all strata in the county. Returns count diagnosed.</summary>
    Task<int> DiagnoseCountyAsync(
        Guid countyId, int taxYear, CancellationToken ct = default);

    /// <summary>Get pre-computed diagnoses for all strata (summary rows for the strata list).</summary>
    Task<List<StratumDiagnosisSummaryDto>> GetDiagnoseSummariesAsync(
        Guid countyId, int taxYear, CancellationToken ct = default);

    /// <summary>Get all sales in a stratum enriched with AI flags.</summary>
    Task<List<StratumSaleDto>> GetStratumSalesAsync(
        Guid countyId, string stratumKey, int taxYear, CancellationToken ct = default);

    /// <summary>
    /// Simulate IAAO stats after applying a mass adjustment factor and/or excluding specific sales.
    /// Pass factor=1.0 and excludeSaleIds to simulate disqualifications only.
    /// Pass factor != 1.0 to simulate mass adjustment (can be combined with excludes).
    /// </summary>
    Task<SimulationResultDto> SimulateAsync(
        Guid countyId, string stratumKey, int taxYear,
        decimal factor = 1.0m,
        IEnumerable<Guid>? excludeSaleIds = null,
        CancellationToken ct = default);
}
