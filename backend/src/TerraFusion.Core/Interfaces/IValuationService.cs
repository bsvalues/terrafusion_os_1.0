using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

/// <summary>
/// Phase 10 — PropertyForge valuation API contract.
/// Four approaches: cost, sales-comparison, income, and reconciliation.
/// Implementations query PACS tables for real data and return structured fallback
/// where PACS data is incomplete.
///
/// Year-layer model: callers are responsible for year selection. Use GetAvailableYearsAsync
/// to discover which layers exist for a parcel before requesting approach data.
/// The service queries exactly the year requested — no silent substitution.
/// </summary>
public interface IValuationService
{
    /// <summary>
    /// Returns all pacs_valuations year layers for a parcel with program enrollment metadata.
    /// Call this on parcel load to populate the year selector. DefaultYear is the recommended
    /// starting point (most recent base-roll layer).
    /// </summary>
    Task<ParcelYearLayersResult> GetAvailableYearsAsync(string parcelId, CancellationToken ct);

    Task<CostApproachResult> CalculateCostApproachAsync(string parcelId, int taxYear, CancellationToken ct);
    Task<SalesComparisonResult> CalculateSalesComparisonAsync(string parcelId, int taxYear, CancellationToken ct);
    Task<IncomeApproachResult> CalculateIncomeApproachAsync(string parcelId, int taxYear, CancellationToken ct);
    Task<ReconciliationResult> ReconcileAsync(string parcelId, int taxYear, CancellationToken ct);
}
