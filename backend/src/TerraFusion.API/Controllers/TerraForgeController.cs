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

    // ── Ratio Study ───────────────────────────────────────────────────────

    /// <summary>
    /// County-wide ratio study for a given tax year.
    /// Population: effective qualified pool — QualificationDecision="qualified"
    /// wins when set; QualificationRecommendation="qualified" is the fallback.
    /// Sales suppressed from the ratio report or flagged IncludeNoCalc are excluded.
    /// Returns IAAO stats (median ratio, mean ratio, COD, PRD) plus paginated detail.
    /// Ratio = PacsComputedRatio / 100 (PACS stores as 0–100; normalized here to 0–1).
    /// </summary>
    [HttpGet("ratio-study")]
    public async Task<IActionResult> GetRatioStudy(
        [FromQuery] int taxYear = 2026,
        [FromQuery] string? hood = null,
        [FromQuery] string? propertyType = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        if (pageSize > 200) pageSize = 200;
        if (page < 1) page = 1;

        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Effective qualified pool: Layer 3 decision wins; Layer 2 recommendation is fallback.
        // Never include non-arms-length or exempt sales in ratio study population.
        var baseQuery = _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SalesYear == null
                         && s.SaleDate >= lookbackStart
                         && s.SaleDate < lookbackEnd))
            .Where(s => (s.QualificationDecision != null && s.QualificationDecision == "qualified")
                     || (s.QualificationDecision == null && s.QualificationRecommendation == "qualified"))
            .Where(s => s.SuppressOnRatioRptCd != "T")
            .Where(s => s.IncludeNoCalc != true);

        if (!string.IsNullOrWhiteSpace(hood))
            baseQuery = baseQuery.Where(s => s.Neighborhood == hood);
        if (!string.IsNullOrWhiteSpace(propertyType))
            baseQuery = baseQuery.Where(s => s.PropertyType == propertyType);

        var total = await baseQuery.CountAsync(ct);

        // Load ratio data for IAAO stats — only rows where PACS computed a ratio.
        // PacsComputedRatio = assessed_val / sale_price * 100; normalize to 0–1 decimal.
        var ratioRows = await baseQuery
            .Where(s => s.PacsComputedRatio != null && s.PacsComputedRatio > 0)
            .Select(s => new
            {
                ratio        = s.PacsComputedRatio!.Value / 100m,
                salePrice    = s.AdjustedSalePrice ?? s.SalePrice,
                assessedVal  = (s.AdjustedSalePrice ?? s.SalePrice) * s.PacsComputedRatio!.Value / 100m
            })
            .ToListAsync(ct);

        var countWithRatio = ratioRows.Count;

        // IAAO ratio study statistics.
        double? medianRatio = null, meanRatio = null, cod = null, prd = null;

        if (countWithRatio > 0)
        {
            var ratios    = ratioRows.Select(r => (double)r.ratio).OrderBy(r => r).ToArray();
            var n         = ratios.Length;
            meanRatio     = ratios.Average();
            medianRatio   = n % 2 == 0
                ? (ratios[n / 2 - 1] + ratios[n / 2]) / 2.0
                : ratios[n / 2];

            // COD = (mean |ratio - median|) / median × 100   (IAAO Standard on Ratio Studies §7)
            if (medianRatio > 0)
                cod = ratios.Average(r => Math.Abs(r - medianRatio.Value)) / medianRatio.Value * 100.0;

            // PRD = mean ratio / weighted mean ratio   where weighted = Σassessed / Σsale_price
            var sumAssessed  = ratioRows.Sum(r => (double)r.assessedVal);
            var sumSalePrice = ratioRows.Sum(r => (double)r.salePrice);
            if (sumSalePrice > 0 && meanRatio > 0)
                prd = meanRatio.Value / (sumAssessed / sumSalePrice);
        }

        // Paginated detail.
        var items = await baseQuery
            .OrderByDescending(s => s.SaleDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                saleId              = s.Id,
                parcelId            = s.ParcelId,
                saleDate            = s.SaleDate,
                salePrice           = s.AdjustedSalePrice ?? s.SalePrice,
                rawSalePrice        = s.SalePrice,
                adjustedSalePrice   = s.AdjustedSalePrice,
                pacsComputedRatio   = s.PacsComputedRatio,
                ratio               = s.PacsComputedRatio != null
                                        ? s.PacsComputedRatio / 100m
                                        : (decimal?)null,
                gla                 = s.SlLivingArea ?? s.GrossLivingArea,
                yearBuilt           = s.SlYearBuilt ?? s.YearBuilt,
                hood                = s.Neighborhood,
                propertyType        = s.PropertyType,
                qualificationSource = s.QualificationDecision != null ? "decision" : "recommendation"
            })
            .ToListAsync(ct);

        _logger.LogInformation(
            "[TerraForge] RatioStudy: year={Year} hood={Hood} total={Total} withRatio={WithRatio} " +
            "median={Median:F4} mean={Mean:F4} COD={COD:F2} PRD={PRD:F4}",
            taxYear, hood ?? "all", total, countWithRatio,
            medianRatio, meanRatio, cod, prd);

        return Ok(new
        {
            taxYear,
            total,
            countWithRatio,
            stats = new
            {
                medianRatio = medianRatio.HasValue ? Math.Round(medianRatio.Value, 4) : (double?)null,
                meanRatio   = meanRatio.HasValue   ? Math.Round(meanRatio.Value,   4) : (double?)null,
                cod         = cod.HasValue         ? Math.Round(cod.Value,         2) : (double?)null,
                prd         = prd.HasValue         ? Math.Round(prd.Value,         4) : (double?)null
            },
            filters = new { taxYear, hood, propertyType },
            page,
            pageSize,
            items
        });
    }

    // ── Comps Pool Browser ────────────────────────────────────────────────

    /// <summary>
    /// Browse the effective qualified comps pool for the given tax year.
    /// Filterable by neighborhood, property type, sale price range, and GLA range.
    /// Returns physical characteristics frozen at time of sale for comp selection.
    /// </summary>
    [HttpGet("comps-pool")]
    public async Task<IActionResult> GetCompsPool(
        [FromQuery] int taxYear = 2026,
        [FromQuery] string? hood = null,
        [FromQuery] string? propertyType = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] decimal? minGla = null,
        [FromQuery] decimal? maxGla = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        if (pageSize > 200) pageSize = 200;
        if (page < 1) page = 1;

        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Effective qualified pool — same population rule as ratio-study.
        var query = _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SalesYear == null
                         && s.SaleDate >= lookbackStart
                         && s.SaleDate < lookbackEnd))
            .Where(s => (s.QualificationDecision != null && s.QualificationDecision == "qualified")
                     || (s.QualificationDecision == null && s.QualificationRecommendation == "qualified"));

        if (!string.IsNullOrWhiteSpace(hood))
            query = query.Where(s => s.Neighborhood == hood);
        if (!string.IsNullOrWhiteSpace(propertyType))
            query = query.Where(s => s.PropertyType == propertyType);
        if (minPrice.HasValue)
            query = query.Where(s => (s.AdjustedSalePrice ?? s.SalePrice) >= minPrice.Value);
        if (maxPrice.HasValue)
            query = query.Where(s => (s.AdjustedSalePrice ?? s.SalePrice) <= maxPrice.Value);
        if (minGla.HasValue)
            query = query.Where(s => (s.SlLivingArea ?? s.GrossLivingArea) >= minGla.Value);
        if (maxGla.HasValue)
            query = query.Where(s => (s.SlLivingArea ?? s.GrossLivingArea) <= maxGla.Value);

        var total = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(s => s.SaleDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                saleId              = s.Id,
                parcelId            = s.ParcelId,
                address             = s.Address,
                hood                = s.Neighborhood,
                propertyType        = s.PropertyType,
                imprvTypeCode       = s.ImprvTypeCode,
                saleDate            = s.SaleDate,
                salePrice           = s.AdjustedSalePrice ?? s.SalePrice,
                rawSalePrice        = s.SalePrice,
                adjustedSalePrice   = s.AdjustedSalePrice,
                gla                 = s.SlLivingArea ?? s.GrossLivingArea,
                lotSizeSqft         = s.SlLandSqft ?? s.LotSizeSqft,
                yearBuilt           = s.SlYearBuilt ?? s.YearBuilt,
                bedrooms            = s.Bedrooms,
                bathrooms           = s.Bathrooms,
                condition           = s.Condition,
                qualityGrade        = s.QualityGrade,
                pacsComputedRatio   = s.PacsComputedRatio,
                qualificationSource = s.QualificationDecision != null ? "decision" : "recommendation"
            })
            .ToListAsync(ct);

        _logger.LogInformation(
            "[TerraForge] CompsPool: year={Year} hood={Hood} type={Type} priceRange=[{Min},{Max}] " +
            "glaRange=[{MinGla},{MaxGla}] total={Total} page={Page}",
            taxYear, hood ?? "all", propertyType ?? "all",
            minPrice, maxPrice, minGla, maxGla, total, page);

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
