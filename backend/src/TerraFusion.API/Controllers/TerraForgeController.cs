using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Data;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraForge Suite — county-wide assessment workflow endpoints.
/// Owner: Suite-Forge layer. Read PACS data; write appraiser decisions only.
/// </summary>
[ApiController]
[Route("api/terraforge")]
public class TerraForgeController : ControllerBase
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<TerraForgeController> _logger;

    private static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");

    public TerraForgeController(TerraFusionDbContext db, ILogger<TerraForgeController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── Sale Qualification ────────────────────────────────────────────────

    /// <summary>
    /// County-wide sale qualification queue.
    /// status: pending | staff-confirmed | appraiser-final (default: pending)
    /// taxYear: filter on SalesYear (DOR ratio study year assignment)
    /// </summary>
    [HttpGet("sale-qualification")]
    public async Task<IActionResult> GetSaleQualification(
        [FromQuery] int taxYear = 2026,
        [FromQuery] string status = "pending",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        if (pageSize > 200) pageSize = 200;
        if (page < 1) page = 1;

        // For a ratio study, taxYear=N means the assessment year.
        // The sale lookback window is 24 months prior to Jan 1 of that year.
        // e.g. taxYear=2026 → sales from Jan 1, 2024 through Dec 31, 2025.
        // SalesYear (PACS prop_val_yr assignment) takes precedence when populated;
        // otherwise fall through to the rolling sale-date window.
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var query = _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SalesYear == null
                         && s.SaleDate >= lookbackStart
                         && s.SaleDate < lookbackEnd));

        query = status.ToLowerInvariant() switch
        {
            "pending"         => query.Where(s => s.QualificationDecision == null),
            "staff-confirmed" => query.Where(s => s.QualificationDecision != null
                                                   && s.DecisionSource == "StaffConfirmed"),
            "appraiser-final" => query.Where(s => s.QualificationDecision != null
                                                   && (s.DecisionSource == "AppraiserFinal"
                                                       || s.DecisionSource == "AssessorOverride"
                                                       || s.DecisionSource == "AcceptedRecommendation")),
            _                 => query.Where(s => s.QualificationDecision == null)
        };

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(s => s.SaleDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                saleId                    = s.Id,
                parcelId                  = s.ParcelId,
                saleDate                  = s.SaleDate,
                salePrice                 = s.SalePrice,
                adjustedSalePrice         = s.AdjustedSalePrice,
                gla                       = s.SlLivingArea ?? s.GrossLivingArea,
                hood                      = s.Neighborhood,
                rawSaleQualifier          = s.RawSaleQualifier,
                rawCountyRatioCd          = s.RawCountyRatioCd,
                rawWacCd                  = s.RawWacCd,
                rawExcludeCalcCd          = s.RawExcludeCalcCd,
                rawRatioTypeCd            = s.RawRatioTypeCd,
                qualificationRecommendation = s.QualificationRecommendation,
                recommendationReason      = s.RecommendationReason,
                qualificationDecision     = s.QualificationDecision,
                qualificationDecisionBy   = s.DecisionBy,
                qualificationDecisionAt   = s.DecisionAt,
                researchNotes             = s.DecisionReason
            })
            .ToListAsync(ct);

        _logger.LogInformation(
            "[TerraForge] SaleQualification query: year={Year} status={Status} total={Total} page={Page}/{Pages}",
            taxYear, status, total, page, (int)Math.Ceiling(total / (double)pageSize));

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Record appraiser/staff qualification decision for a single sale.
    /// Body: { qualificationDecision, researchNotes, decidedBy, decisionSource }
    /// </summary>
    [HttpPatch("sale-qualification/{saleId:guid}")]
    public async Task<IActionResult> PatchSaleQualification(
        Guid saleId,
        [FromBody] SaleQualificationPatchDto body,
        CancellationToken ct = default)
    {
        var sale = await _db.ComparableSales
            .FirstOrDefaultAsync(s => s.Id == saleId && s.CountyId == BentonCountyId, ct);

        if (sale is null)
            return NotFound(new { error = $"Sale {saleId} not found for Benton County." });

        sale.QualificationDecision = body.QualificationDecision;
        sale.DecisionReason        = body.ResearchNotes;
        sale.DecisionBy            = body.DecidedBy;
        sale.DecisionAt            = DateTime.UtcNow;
        sale.DecisionSource        = body.DecisionSource ?? "StaffConfirmed";

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "[TerraForge] Sale {SaleId} qualification set to {Decision} by {By}",
            saleId, body.QualificationDecision, body.DecidedBy);

        return Ok(new
        {
            saleId,
            qualificationDecision = sale.QualificationDecision,
            decidedBy             = sale.DecisionBy,
            decidedAt             = sale.DecisionAt
        });
    }
}

public sealed record SaleQualificationPatchDto(
    string QualificationDecision,
    string? ResearchNotes,
    string? DecidedBy,
    string? DecisionSource);
