using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Phase 10 — PropertyForge valuation API contract.
/// Four approaches: cost, sales-comparison, income, and reconciliation.
/// Implementations query PACS tables for real data and return structured fallback
/// where PACS data is incomplete.
/// </summary>
public interface IValuationService
{
    Task<CostApproachResult> CalculateCostApproachAsync(string parcelId, int taxYear, CancellationToken ct);
    Task<SalesComparisonResult> CalculateSalesComparisonAsync(string parcelId, int taxYear, CancellationToken ct);
    Task<IncomeApproachResult> CalculateIncomeApproachAsync(string parcelId, int taxYear, CancellationToken ct);
    Task<ReconciliationResult> ReconcileAsync(string parcelId, int taxYear, CancellationToken ct);
}
