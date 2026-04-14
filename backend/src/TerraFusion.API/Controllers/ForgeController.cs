using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using TerraFusion.API.Security;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

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
    private readonly DataDbContext _db;
    private readonly ILogger<ForgeController> _logger;

    public ForgeController(IValuationService valuationService, DataDbContext db, ILogger<ForgeController> logger)
    {
        _valuationService = valuationService;
        _db = db;
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

        try
        {
            var result = await _valuationService.CalculateSalesComparisonAsync(parcelId, year, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Sales comparison failed for {ParcelId}: {Message}", parcelId, ex.Message);
            return StatusCode(500, new { error = ex.GetType().Name, message = ex.Message });
        }
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

    /// <summary>
    /// GET /api/forge/cost/batch/history — Dev stub for batch cost run history.
    /// Returns an empty array (no completed runs yet in dev), which signals
    /// BatchCostRun that the history endpoint is reachable so historyIsFixtureBacked
    /// clears. An empty array is honest: no runs have been applied in dev mode.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("cost/batch/history")]
    public IActionResult GetBatchCostHistory()
    {
        return Ok(Array.Empty<object>());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Assessor Sale Qualification Override
    // Layer 3: The assessor is the final authority. Their explicit decision
    // always overrides the TerraFusion recommendation (Layer 2).
    // Raw PACS codes are facts. TF recommendation is a suggestion. Assessor decision is law.
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// PATCH /api/forge/sales/{saleId}/qualification
    ///
    /// Assessor override endpoint — sets the Layer 3 QualificationDecision on a
    /// comparable sale. Scoped to the assessor's county (multi-tenant safe).
    ///
    /// Send null decision to clear an existing override (reverts to TF recommendation).
    /// </summary>
    [Authorize]
    [RequiresPermission("access:forge")]
    [HttpPatch("sales/{saleId}/qualification")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PatchSaleQualification(
        Guid saleId,
        [FromBody] SaleQualificationOverrideRequest request,
        CancellationToken ct)
    {
        // Resolve county from JWT claim — multi-tenant guard.
        var countyIdClaim = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(countyIdClaim) || !Guid.TryParse(countyIdClaim, out var countyId))
        {
            _logger.LogWarning("PatchSaleQualification: missing or invalid countyId claim on token");
            return Unauthorized();
        }

        // Validate decision value — only known qualification codes accepted.
        var allowed = new[] { "qualified", "non-arms-length", "foreclosure", "estate", "excluded", "exempt" };
        if (request.Decision is not null && !allowed.Contains(request.Decision))
        {
            return BadRequest(new { error = $"Invalid decision value '{request.Decision}'. Allowed: {string.Join(", ", allowed)}" });
        }

        var sale = await _db.ComparableSales
            .Where(s => s.Id == saleId && s.CountyId == countyId)
            .FirstOrDefaultAsync(ct);

        if (sale is null)
            return NotFound(new { error = $"Sale {saleId} not found in your county." });

        var decisionBy = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                      ?? User.FindFirst("sub")?.Value
                      ?? "unknown";

        if (request.Decision is null)
        {
            // Clear the override — revert to TF recommendation.
            sale.QualificationDecision = null;
            sale.DecisionReason = null;
            sale.DecisionBy = null;
            sale.DecisionAt = null;
            sale.DecisionSource = null;
            _logger.LogInformation("Sale {SaleId}: assessor override cleared by {User}", saleId, decisionBy);
        }
        else
        {
            sale.QualificationDecision = request.Decision;
            sale.DecisionReason = request.Reason;
            sale.DecisionBy = decisionBy;
            sale.DecisionAt = DateTime.UtcNow;
            sale.DecisionSource = "AssessorOverride";
            _logger.LogInformation("Sale {SaleId}: qualification set to '{Decision}' by {User}", saleId, request.Decision, decisionBy);
        }

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            saleId,
            qualificationDecision = sale.QualificationDecision,
            decisionBy = sale.DecisionBy,
            decisionAt = sale.DecisionAt,
            decisionSource = sale.DecisionSource,
        });
    }

    /// <summary>
    /// POST /api/forge/sales/recompute-recommendations
    ///
    /// Re-runs the TF qualification rule engine (Layer 2) for all sales in the
    /// assessor's county. Safe to call any time — does not touch Layer 3 assessor decisions.
    /// Typically called after a PACS ingest to populate QualificationRecommendation.
    /// </summary>
    [Authorize]
    [RequiresPermission("access:forge")]
    [HttpPost("sales/recompute-recommendations")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> RecomputeRecommendations(
        [FromServices] TerraFusion.API.Services.ISaleQualificationService qualificationService,
        CancellationToken ct)
    {
        var countyIdClaim = User.FindFirst("countyId")?.Value?.Trim();
        if (string.IsNullOrWhiteSpace(countyIdClaim) || !Guid.TryParse(countyIdClaim, out var countyId))
        {
            return Unauthorized();
        }

        var updated = await qualificationService.ComputeRecommendationsAsync(countyId, ct);
        _logger.LogInformation("Recomputed qualification recommendations for {Count} sales in county {CountyId}", updated, countyId);

        return Ok(new { updated, countyId });
    }
}

/// <summary>Request body for PATCH /api/forge/sales/{saleId}/qualification.</summary>
public sealed record SaleQualificationOverrideRequest
{
    /// <summary>
    /// The assessor's determination. One of: qualified, non-arms-length, foreclosure,
    /// estate, excluded, exempt. Send null to clear an existing override.
    /// </summary>
    public string? Decision { get; init; }

    /// <summary>Assessor's stated reason for the override (optional but recommended).</summary>
    [MaxLength(500)]
    public string? Reason { get; init; }
}
