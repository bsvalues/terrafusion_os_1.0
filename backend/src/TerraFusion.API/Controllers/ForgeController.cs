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
}
