using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;
using ICountyResolver = TerraFusion.Core.Services.ICountyResolver;
using CountyNotFoundException = TerraFusion.Core.Services.CountyNotFoundException;

namespace TerraFusion.API.Controllers;

/// <summary>
/// AI-powered sales ratio audit surface.
/// Auth pattern: matches TerraForgeController — explicit county context from query,
/// county header, or authenticated claim. Missing county scope fails honestly.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class SalesAuditController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ISalesAiDiagnosticService _diagSvc;
    private readonly ILogger<SalesAuditController> _logger;
    private readonly ICountyResolver _countyResolver;

    public SalesAuditController(
        TerraFusionDbContext db,
        ISalesAiDiagnosticService diagSvc,
        ILogger<SalesAuditController> logger,
        ICountyResolver countyResolver)
    {
        _db = db;
        _diagSvc = diagSvc;
        _logger = logger;
        _countyResolver = countyResolver;
    }

    /// <summary>
    /// Returns the county ID for the current request. County scope may arrive as
    /// query string, county header, or authenticated claim; it never defaults.
    /// </summary>
    private string? ResolveCountyScopeToken(string? countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            countyId = Request.Headers["x-county-id"].FirstOrDefault()
                ?? Request.Headers["X-County-Id"].FirstOrDefault()
                ?? User.FindFirst("county_id")?.Value
                ?? User.FindFirst("countyId")?.Value;
        }

        return string.IsNullOrWhiteSpace(countyId) ? null : countyId.Trim();
    }

    private async Task<Guid> ResolveCountyScopeAsync(string? countyId, CancellationToken ct)
    {
        var countyToken = ResolveCountyScopeToken(countyId);
        if (string.IsNullOrWhiteSpace(countyToken))
        {
            throw new ArgumentException("County context required.", nameof(countyId));
        }

        return await _countyResolver.ResolveAsync(countyToken, ct);
    }

    private async Task<(Guid CountyId, IActionResult? Error)> TryResolveCountyScopeAsync(string? countyId, CancellationToken ct)
    {
        try
        {
            return (await ResolveCountyScopeAsync(countyId, ct), null);
        }
        catch (ArgumentException ex) when (ex.ParamName == "countyId")
        {
            return (Guid.Empty, BadRequest(new { error = ex.Message, field = "countyId" }));
        }
        catch (CountyNotFoundException ex)
        {
            return (Guid.Empty, BadRequest(new { error = ex.Message, field = "countyId" }));
        }
    }

    private string GetUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst("sub")?.Value
        ?? User.FindFirst("nameid")?.Value
        ?? "system";

    // GET /api/SalesAudit/strata?taxYear=2025
    [HttpGet("strata")]
    public async Task<IActionResult> GetStrata([FromQuery] int taxYear = 0,
        [FromQuery] string? countyId = null,
        CancellationToken ct = default)
    {
        var countyScope = await TryResolveCountyScopeAsync(countyId, ct);
        if (countyScope.Error is not null) return countyScope.Error;
        var scopedCountyId = countyScope.CountyId;
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var summaries = await _diagSvc.GetDiagnoseSummariesAsync(scopedCountyId, taxYear, ct);
        return Ok(summaries);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/sales?taxYear=2025
    [HttpGet("strata/{stratumKey}/sales")]
    public async Task<IActionResult> GetStratumSales(string stratumKey,
        [FromQuery] int taxYear = 0,
        [FromQuery] string? countyId = null,
        CancellationToken ct = default)
    {
        var countyScope = await TryResolveCountyScopeAsync(countyId, ct);
        if (countyScope.Error is not null) return countyScope.Error;
        var scopedCountyId = countyScope.CountyId;
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var sales = await _diagSvc.GetStratumSalesAsync(scopedCountyId, stratumKey, taxYear, ct);
        return Ok(sales);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/diagnosis?taxYear=2025
    [HttpGet("strata/{stratumKey}/diagnosis")]
    public async Task<IActionResult> GetDiagnosis(string stratumKey,
        [FromQuery] int taxYear = 0,
        [FromQuery] string? countyId = null,
        CancellationToken ct = default)
    {
        var countyScope = await TryResolveCountyScopeAsync(countyId, ct);
        if (countyScope.Error is not null) return countyScope.Error;
        var scopedCountyId = countyScope.CountyId;
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var diagnosis = await _db.SaleAuditDiagnoses
            .FirstOrDefaultAsync(
                d => d.CountyId == scopedCountyId && d.TaxYear == taxYear && d.StratumKey == stratumKey,
                ct);

        return diagnosis is null ? NotFound() : Ok(diagnosis);
    }

    // POST /api/SalesAudit/strata/{stratumKey}/diagnose?taxYear=2025
    [HttpPost("strata/{stratumKey}/diagnose")]
    public async Task<IActionResult> DiagnoseStratum(string stratumKey,
        [FromQuery] int taxYear = 0,
        [FromQuery] string? countyId = null,
        CancellationToken ct = default)
    {
        var countyScope = await TryResolveCountyScopeAsync(countyId, ct);
        if (countyScope.Error is not null) return countyScope.Error;
        var scopedCountyId = countyScope.CountyId;
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var result = await _diagSvc.DiagnoseStratumAsync(scopedCountyId, taxYear, stratumKey, ct);
        return Ok(result);
    }

    // POST /api/SalesAudit/diagnose-county?taxYear=2025
    [HttpPost("diagnose-county")]
    public async Task<IActionResult> DiagnoseCounty(
        [FromQuery] int taxYear = 0,
        [FromQuery] string? countyId = null,
        CancellationToken ct = default)
    {
        var countyScope = await TryResolveCountyScopeAsync(countyId, ct);
        if (countyScope.Error is not null) return countyScope.Error;
        var scopedCountyId = countyScope.CountyId;
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var count = await _diagSvc.DiagnoseCountyAsync(scopedCountyId, taxYear, ct);
        return Ok(new { DiagnosedCount = count });
    }

    // POST /api/SalesAudit/sales/bulk-decision
    [HttpPost("sales/bulk-decision")]
    public async Task<IActionResult> BulkDecision(
        [FromBody] BulkDecisionRequest req,
        [FromQuery] string? countyId = null,
        CancellationToken ct = default)
    {
        var countyScope = await TryResolveCountyScopeAsync(countyId, ct);
        if (countyScope.Error is not null) return countyScope.Error;
        return await ApplyDecisions(countyScope.CountyId, req.SaleIds, req.Decision, req.Reason, ct);
    }

    // GET /api/SalesAudit/strata/{stratumKey}/simulate?taxYear=2025&factor=1.04&excludeIds=...
    [HttpGet("strata/{stratumKey}/simulate")]
    public async Task<IActionResult> Simulate(string stratumKey,
        [FromQuery] int taxYear = 0,
        [FromQuery] string? countyId = null,
        [FromQuery] decimal factor = 1.0m,
        [FromQuery] string? excludeIds = null,
        CancellationToken ct = default)
    {
        var countyScope = await TryResolveCountyScopeAsync(countyId, ct);
        if (countyScope.Error is not null) return countyScope.Error;
        var scopedCountyId = countyScope.CountyId;
        if (taxYear == 0) taxYear = DateTime.UtcNow.Year;

        var exclude = excludeIds?
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => Guid.TryParse(s.Trim(), out var g) ? g : (Guid?)null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value) ?? Enumerable.Empty<Guid>();

        var result = await _diagSvc.SimulateAsync(scopedCountyId, stratumKey, taxYear, factor, exclude, ct);
        return Ok(result);
    }

    // POST /api/SalesAudit/strata/{stratumKey}/propose-adjustment?taxYear=2025
    [HttpPost("strata/{stratumKey}/propose-adjustment")]
    public async Task<IActionResult> ProposeAdjustment(string stratumKey,
        [FromQuery] int taxYear,
        [FromBody] ProposeAdjustmentRequest req,
        [FromQuery] string? countyId = null,
        CancellationToken ct = default)
    {
        var countyScope = await TryResolveCountyScopeAsync(countyId, ct);
        if (countyScope.Error is not null) return countyScope.Error;
        var scopedCountyId = countyScope.CountyId;
        if (taxYear <= 0) taxYear = DateTime.UtcNow.Year;

        var userId = GetUserId();

        // Supersede any existing draft for this stratum+year
        var existing = await _db.SalesAuditAdjustmentProposals
            .Where(p => p.CountyId == scopedCountyId && p.TaxYear == taxYear
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
            CountyId = scopedCountyId,
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
            scopedCountyId, stratumKey, taxYear, req.Factor);

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
