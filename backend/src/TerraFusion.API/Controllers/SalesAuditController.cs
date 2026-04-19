using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class SalesAuditController : ControllerBase
{
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

    private Guid? GetCountyId() =>
        Guid.TryParse(User.FindFirst("county_id")?.Value, out var id) ? id : null;

    private string GetUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? "unknown";

    // GET /api/SalesAudit/strata?taxYear=2026
    [HttpGet("strata")]
    public async Task<IActionResult> GetStrata([FromQuery] int taxYear = 0,
        CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var summaries = await _diagSvc.GetDiagnoseSummariesAsync(countyId.Value, taxYear, ct);
        return Ok(summaries);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/sales?taxYear=2026
    [HttpGet("strata/{stratumKey}/sales")]
    public async Task<IActionResult> GetStratumSales(string stratumKey,
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var sales = await _diagSvc.GetStratumSalesAsync(countyId.Value, stratumKey, taxYear, ct);
        return Ok(sales);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/diagnosis?taxYear=2026
    [HttpGet("strata/{stratumKey}/diagnosis")]
    public async Task<IActionResult> GetDiagnosis(string stratumKey,
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var diagnosis = await _db.SaleAuditDiagnoses
            .FirstOrDefaultAsync(
                d => d.CountyId == countyId && d.TaxYear == taxYear && d.StratumKey == stratumKey,
                ct);

        return diagnosis is null ? NotFound() : Ok(diagnosis);
    }

    // POST /api/SalesAudit/strata/{stratumKey}/diagnose?taxYear=2026
    [HttpPost("strata/{stratumKey}/diagnose")]
    public async Task<IActionResult> DiagnoseStratum(string stratumKey,
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var result = await _diagSvc.DiagnoseStratumAsync(countyId.Value, taxYear, stratumKey, ct);
        return Ok(result);
    }

    // POST /api/SalesAudit/diagnose-county?taxYear=2026
    [HttpPost("diagnose-county")]
    public async Task<IActionResult> DiagnoseCounty(
        [FromQuery] int taxYear = 0, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var count = await _diagSvc.DiagnoseCountyAsync(countyId.Value, taxYear, ct);
        return Ok(new { DiagnosedCount = count });
    }

    // POST /api/SalesAudit/sales/bulk-decision
    [HttpPost("sales/bulk-decision")]
    public async Task<IActionResult> BulkDecision(
        [FromBody] BulkDecisionRequest req, CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();

        return await ApplyDecisions(countyId.Value, req.SaleIds, req.Decision, req.Reason, ct);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/simulate?taxYear=2026&factor=1.04&excludeIds=...
    [HttpGet("strata/{stratumKey}/simulate")]
    public async Task<IActionResult> Simulate(string stratumKey,
        [FromQuery] int taxYear = 0,
        [FromQuery] decimal factor = 1.0m,
        [FromQuery] string? excludeIds = null,
        CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var exclude = excludeIds?
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => Guid.TryParse(s.Trim(), out var g) ? g : (Guid?)null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value) ?? Enumerable.Empty<Guid>();

        var result = await _diagSvc.SimulateAsync(
            countyId.Value, stratumKey, taxYear, factor, exclude, ct);
        return Ok(result);
    }

    // POST /api/SalesAudit/strata/{stratumKey}/propose-adjustment?taxYear=2026
    [HttpPost("strata/{stratumKey}/propose-adjustment")]
    public async Task<IActionResult> ProposeAdjustment(string stratumKey,
        [FromQuery] int taxYear,
        [FromBody] ProposeAdjustmentRequest req,
        CancellationToken ct = default)
    {
        var countyId = GetCountyId();
        if (countyId is null) return Unauthorized();

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
            CountyId = countyId.Value,
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

    // ── Shared helpers ─────────────────────────────────────────────────────

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
        return Ok();
    }
}
