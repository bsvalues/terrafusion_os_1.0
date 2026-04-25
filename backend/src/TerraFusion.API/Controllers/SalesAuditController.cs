using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// AI-powered sales ratio audit surface.
/// Auth pattern: matches TerraForgeController — sovereign single-county deployment,
/// county isolation enforced at the infrastructure/network layer.
/// BentonCountyId is the hardcoded sovereign deployment ID for Benton WA.
/// Multi-county production path: add [Authorize] and parse county_id / countyId JWT claim.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class SalesAuditController : ControllerBase
{
    // Benton County WA sovereign deployment identifier
    private static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");

    private readonly TerraFusionDbContext _db;
    private readonly ISalesAiDiagnosticService _diagSvc;
    private readonly ILogger<SalesAuditController> _logger;

    public SalesAuditController(
        TerraFusionDbContext db,
        ISalesAiDiagnosticService diagSvc,
        ILogger<SalesAuditController> logger)
    {
        _db = db;
        _diagSvc = diagSvc;
        _logger = logger;
    }

    /// <summary>
    /// Returns the county ID for the current request.
    /// Reads JWT claim when present (future multi-county); falls back to BentonCountyId.
    /// </summary>
    private Guid GetCountyId()
    {
        var raw = User.FindFirst("county_id")?.Value
               ?? User.FindFirst("countyId")?.Value;
        return Guid.TryParse(raw, out var id) ? id : BentonCountyId;
    }

    private string GetUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? User.FindFirst("nameid")?.Value
        ?? "system";

    // GET /api/SalesAudit/strata?taxYear=2025
    [HttpGet("strata")]
    public async Task<IActionResult> GetStrata([FromQuery] int taxYear = 0,
        CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var summaries = await _diagSvc.GetDiagnoseSummariesAsync(countyId, taxYear, ct);
        return Ok(summaries);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/sales?taxYear=2025
    [HttpGet("strata/{stratumKey}/sales")]
    public async Task<IActionResult> GetStratumSales(string stratumKey,
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var sales = await _diagSvc.GetStratumSalesAsync(countyId, stratumKey, taxYear, ct);
        return Ok(sales);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/diagnosis?taxYear=2025
    [HttpGet("strata/{stratumKey}/diagnosis")]
    public async Task<IActionResult> GetDiagnosis(string stratumKey,
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var diagnosis = await _db.SaleAuditDiagnoses
            .FirstOrDefaultAsync(
                d => d.CountyId == countyId && d.TaxYear == taxYear && d.StratumKey == stratumKey,
                ct);

        return diagnosis is null ? NotFound() : Ok(diagnosis);
    }

    // POST /api/SalesAudit/strata/{stratumKey}/diagnose?taxYear=2025
    [HttpPost("strata/{stratumKey}/diagnose")]
    public async Task<IActionResult> DiagnoseStratum(string stratumKey,
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var result = await _diagSvc.DiagnoseStratumAsync(countyId, taxYear, stratumKey, ct);
        return Ok(result);
    }

    // POST /api/SalesAudit/diagnose-county?taxYear=2025
    [HttpPost("diagnose-county")]
    public async Task<IActionResult> DiagnoseCounty(
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var count = await _diagSvc.DiagnoseCountyAsync(countyId, taxYear, ct);
        return Ok(new { DiagnosedCount = count });
    }

    // POST /api/SalesAudit/sales/bulk-decision
    [HttpPost("sales/bulk-decision")]
    public async Task<IActionResult> BulkDecision(
        [FromBody] BulkDecisionRequest req, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        return await ApplyDecisions(countyId, req.SaleIds, req.Decision, req.Reason, ct);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/simulate?taxYear=2025&factor=1.04&excludeIds=...
    [HttpGet("strata/{stratumKey}/simulate")]
    public async Task<IActionResult> Simulate(string stratumKey,
        [FromQuery] int taxYear = 0,
        [FromQuery] decimal factor = 1.0m,
        [FromQuery] string? excludeIds = null,
        CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var exclude = excludeIds?
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => Guid.TryParse(s.Trim(), out var g) ? g : (Guid?)null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value) ?? Enumerable.Empty<Guid>();

        var result = await _diagSvc.SimulateAsync(countyId, stratumKey, taxYear, factor, exclude, ct);
        return Ok(result);
    }

    // POST /api/SalesAudit/strata/{stratumKey}/propose-adjustment?taxYear=2025
    [HttpPost("strata/{stratumKey}/propose-adjustment")]
    public async Task<IActionResult> ProposeAdjustment(string stratumKey,
        [FromQuery] int taxYear,
        [FromBody] ProposeAdjustmentRequest req,
        CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (taxYear <= 0) taxYear = DateTime.UtcNow.Year;

        var userId = GetUserId();

        // Supersede any existing draft for this stratum+year
        var existing = await _db.SalesAuditAdjustmentProposals
            .Where(p => p.CountyId == countyId && p.TaxYear == taxYear
                     && p.StratumKey == stratumKey && p.Status == "draft")
            .ToListAsync(ct);

        foreach (var old in existing)
        {
            old.Status = "superseded";
            old.UpdatedAt = DateTime.UtcNow;
            old.UpdatedBy = userId;
        }

        var proposal = new SalesAuditAdjustmentProposal
        {
            Id = Guid.NewGuid(),
            CountyId = countyId,
            TaxYear = taxYear,
            StratumKey = stratumKey,
            ProposedFactor = req.Factor,
            ProjectedCod = req.ProjectedCod,
            ProjectedMedianRatio = req.ProjectedMedianRatio,
            ProjectedPrd = req.ProjectedPrd,
            Status = "draft",
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            UpdatedBy = userId
        };
        _db.SalesAuditAdjustmentProposals.Add(proposal);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Adjustment proposal: county={CountyId} stratum={Key} year={Year} factor={Factor}",
            countyId, stratumKey, taxYear, req.Factor);

        return Ok(new { proposal.Id, proposal.Status });
    }

    // ── Shared helpers ─────────────────────────────────────────────────────────

    private async Task<IActionResult> ApplyDecisions(
        Guid countyId, IEnumerable<Guid> saleIds, string decision,
        string? reason, CancellationToken ct)
    {
        var ids = saleIds.ToList();
        var sales = await _db.ComparableSales
            .Where(s => s.CountyId == countyId && ids.Contains(s.Id))
            .ToListAsync(ct);

        if (sales.Count == 0) return NotFound();

        var userId = GetUserId();
        var now = DateTime.UtcNow;

        foreach (var sale in sales)
        {
            sale.QualificationDecision = decision;
            sale.DecisionReason = reason;
            sale.DecisionBy = userId;
            sale.DecisionAt = now;
            sale.DecisionSource = "AssessorOverride";
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "QualificationDecision bulk update: county={CountyId} count={Count} decision={Decision} by={UserId}",
            countyId, sales.Count, decision, userId);

        return Ok();
    }
}
