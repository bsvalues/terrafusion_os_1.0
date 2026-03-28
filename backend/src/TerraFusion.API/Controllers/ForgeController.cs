using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Phase 10 — PropertyForge valuation API.
/// Four endpoints serving the Forge sub-tabs: cost, sales, income, reconciliation.
/// Queries PACS tables for real Benton County data; returns structured fallback
/// where PACS data is incomplete.
/// </summary>
[ApiController]
[Route("api/forge")]
public class ForgeController : ControllerBase
{
    private readonly IValuationService _valuationService;
    private readonly ILogger<ForgeController> _logger;

    public ForgeController(IValuationService valuationService, ILogger<ForgeController> logger)
    {
        _valuationService = valuationService;
        _logger = logger;
    }

    /// <summary>
    /// GET /api/forge/{parcelId}/years
    /// Returns all pacs_valuations year layers for a parcel with program enrollment metadata.
    /// Call this on parcel load to populate the year selector. Use DefaultYear as the
    /// starting point — it is the most recent base-roll (SupNum=0) layer.
    ///
    /// IsEarliestKnownLayer=true identifies the migration baseline layer (2015 for Benton County).
    /// Programs.CurrentUseAg=true with AgLossDeferred > 0 indicates RCW 84.34 enrollment
    /// with a deferred tax balance — the basis for removal penalty calculations.
    /// </summary>
    [HttpGet("{parcelId}/years")]
    [ProducesResponseType(typeof(ParcelYearLayersResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableYears(
        string parcelId,
        CancellationToken ct)
    {
        _logger.LogInformation("Forge available years requested for {ParcelId}", parcelId);
        var result = await _valuationService.GetAvailableYearsAsync(parcelId, ct);
        return Ok(result);
    }

    /// <summary>GET /api/forge/{parcelId}/cost?taxYear=2025</summary>
    [HttpGet("{parcelId}/cost")]
    [ProducesResponseType(typeof(CostApproachResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCostApproach(
        string parcelId,
        [FromQuery] int? taxYear,
        CancellationToken ct)
    {
        var year = taxYear ?? DateTime.UtcNow.Year;
        _logger.LogInformation("Forge cost approach requested for {ParcelId} year {TaxYear}", parcelId, year);

        var result = await _valuationService.CalculateCostApproachAsync(parcelId, year, ct);
        return Ok(result);
    }

    /// <summary>GET /api/forge/{parcelId}/sales?taxYear=2025</summary>
    [HttpGet("{parcelId}/sales")]
    [ProducesResponseType(typeof(SalesComparisonResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSalesComparison(
        string parcelId,
        [FromQuery] int? taxYear,
        CancellationToken ct)
    {
        var year = taxYear ?? DateTime.UtcNow.Year;
        _logger.LogInformation("Forge sales comparison requested for {ParcelId} year {TaxYear}", parcelId, year);

        var result = await _valuationService.CalculateSalesComparisonAsync(parcelId, year, ct);
        return Ok(result);
    }

    /// <summary>GET /api/forge/{parcelId}/income?taxYear=2025</summary>
    [HttpGet("{parcelId}/income")]
    [ProducesResponseType(typeof(IncomeApproachResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIncomeApproach(
        string parcelId,
        [FromQuery] int? taxYear,
        CancellationToken ct)
    {
        var year = taxYear ?? DateTime.UtcNow.Year;
        _logger.LogInformation("Forge income approach requested for {ParcelId} year {TaxYear}", parcelId, year);

        var result = await _valuationService.CalculateIncomeApproachAsync(parcelId, year, ct);
        return Ok(result);
    }

    /// <summary>GET /api/forge/{parcelId}/reconciliation?taxYear=2025</summary>
    [HttpGet("{parcelId}/reconciliation")]
    [ProducesResponseType(typeof(ReconciliationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReconciliation(
        string parcelId,
        [FromQuery] int? taxYear,
        CancellationToken ct)
    {
        var year = taxYear ?? DateTime.UtcNow.Year;
        _logger.LogInformation("Forge reconciliation requested for {ParcelId} year {TaxYear}", parcelId, year);

        var result = await _valuationService.ReconcileAsync(parcelId, year, ct);
        return Ok(result);
    }

    /// <summary>
    /// GET /api/forge/cost/batch/preview — Dev fixture for batch cost run preview.
    /// Returns a stub adjustment bundle so BatchCostRun clears its DEMO DATA banner
    /// without a live CAMA batch engine. Safe for anonymous dev access.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("cost/batch/preview")]
    public IActionResult GetBatchCostPreview(
        [FromQuery] string? neighborhood,
        [FromQuery] string? propertyType)
    {
        return Ok(new
        {
            neighborhood = neighborhood ?? "Downtown",
            propertyType = propertyType ?? "Residential",
            matchCount = 12,
            affectedCount = 12,
            batchId = Guid.NewGuid().ToString("N")[..8],
            adjustments = new[]
            {
                new { factor = "BaseRate",        currentValue = 1.00m, proposedValue = 1.05m,   delta =  0.050m, parcels = 12 },
                new { factor = "DepreciationRate", currentValue = 0.02m, proposedValue = 0.018m, delta = -0.002m, parcels = 12 },
            },
        });
    }
}
