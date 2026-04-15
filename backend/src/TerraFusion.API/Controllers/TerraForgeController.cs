using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.API.Services;
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
    private readonly IOlsRegressionService _ols;
    private readonly ISaleQualificationService _saleQual;

    private static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");

    public TerraForgeController(
        TerraFusionDbContext db,
        ILogger<TerraForgeController> logger,
        IOlsRegressionService ols,
        ISaleQualificationService saleQual)
    {
        _db       = db;
        _logger   = logger;
        _ols      = ols;
        _saleQual = saleQual;
    }

    // ── Sale Qualification ────────────────────────────────────────────────

    /// <summary>
    /// County-wide sale qualification queue.
    /// status: all | pending | staff-confirmed | appraiser-final (default: all)
    /// taxYear: filter on SalesYear (DOR ratio study year assignment)
    /// Supports filtering by hood, propertyType, date range, and price range.
    /// Response includes computed assessedValue + salesRatio (from Properties join).
    /// </summary>
    [HttpGet("sale-qualification")]
    public async Task<IActionResult> GetSaleQualification(
        [FromQuery] int taxYear = 2026,
        [FromQuery] string status = "all",
        [FromQuery] string? hood = null,
        [FromQuery] string? propertyType = null,
        [FromQuery] DateTime? saleDateFrom = null,
        [FromQuery] DateTime? saleDateTo = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        if (pageSize > 200) pageSize = 200;
        if (page < 1) page = 1;

        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var query = _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart
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
            "all"             => query,   // No decision filter — return every sale in the window
            _                 => query    // Unknown status → return all (safe fallback)
        };

        if (!string.IsNullOrWhiteSpace(hood))
            query = query.Where(s => s.Neighborhood == hood);
        if (!string.IsNullOrWhiteSpace(propertyType))
            query = query.Where(s => s.PropertyType == propertyType);
        if (saleDateFrom.HasValue)
            query = query.Where(s => s.SaleDate >= saleDateFrom.Value);
        if (saleDateTo.HasValue)
            query = query.Where(s => s.SaleDate <= saleDateTo.Value);
        if (minPrice.HasValue)
            query = query.Where(s => (s.AdjustedSalePrice ?? s.SalePrice) >= minPrice.Value);
        if (maxPrice.HasValue)
            query = query.Where(s => (s.AdjustedSalePrice ?? s.SalePrice) <= maxPrice.Value);

        var total = await query.CountAsync(ct);

        var rawItems = await query
            .OrderByDescending(s => s.SaleDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                saleId                      = s.Id,
                parcelId                    = s.ParcelId,
                address                     = s.Address,
                saleDate                    = s.SaleDate,
                salePrice                   = s.SalePrice,
                adjustedSalePrice           = s.AdjustedSalePrice,
                gla                         = s.SlLivingArea ?? s.GrossLivingArea,
                hood                        = s.Neighborhood,
                propertyType                = s.PropertyType,
                rawSaleQualifier            = s.RawSaleQualifier,
                rawCountyRatioCd            = s.RawCountyRatioCd,
                rawWacCd                    = s.RawWacCd,
                rawExcludeCalcCd            = s.RawExcludeCalcCd,
                rawRatioTypeCd              = s.RawRatioTypeCd,
                rawSaleTypeCode             = s.RawSaleTypeCode,
                rawFinancingCode            = s.RawFinancingCode,
                rawAdjReason                = s.RawAdjReason,
                rawComment                  = s.RawComment,
                slLivingArea                = s.SlLivingArea,
                slYearBuilt                 = s.SlYearBuilt,
                salesYear                   = s.SalesYear,
                qualificationRecommendation = s.QualificationRecommendation,
                recommendationReason        = s.RecommendationReason,
                qualificationDecision       = s.QualificationDecision,
                qualificationDecisionBy     = s.DecisionBy,
                qualificationDecisionAt     = s.DecisionAt,
                decisionSource              = s.DecisionSource,
                decisionReason              = s.DecisionReason,
            })
            .ToListAsync(ct);

        // Join PacsValuations (canonical assessed values) via GeoId→PacsParcel→PacsValuation.
        var pageParcelIds = rawItems.Select(i => i.parcelId).Where(id => id != null).ToHashSet();
        var pageAssessed  = await GetAssessedValueMapAsync(pageParcelIds, taxYear, ct);

        var items = rawItems.Select(i =>
        {
            var effectivePrice = i.adjustedSalePrice ?? i.salePrice;
            decimal? assessedValue = i.parcelId != null && pageAssessed.TryGetValue(i.parcelId, out var av)
                ? av : (decimal?)null;
            decimal? salesRatio = assessedValue.HasValue && effectivePrice > 0
                ? assessedValue.Value / effectivePrice : (decimal?)null;
            return new
            {
                i.saleId, i.parcelId, i.address, i.saleDate, i.salePrice,
                i.adjustedSalePrice, i.gla, i.hood, i.propertyType,
                i.rawSaleQualifier, i.rawCountyRatioCd, i.rawWacCd,
                i.rawExcludeCalcCd, i.rawRatioTypeCd, i.rawSaleTypeCode,
                i.rawFinancingCode, i.rawAdjReason, i.rawComment,
                i.slLivingArea, i.slYearBuilt, i.salesYear,
                i.qualificationRecommendation, i.recommendationReason,
                i.qualificationDecision, i.qualificationDecisionBy,
                i.qualificationDecisionAt, i.decisionSource, i.decisionReason,
                assessedValue, salesRatio,
            };
        }).ToList();

        _logger.LogInformation(
            "[TerraForge] SaleQualification: year={Year} status={Status} hood={Hood} total={Total} page={Page}/{Pages}",
            taxYear, status, hood ?? "all", total, page, (int)Math.Ceiling(total / (double)pageSize));

        return Ok(new { total, page, pageSize, items });
    }

    /// <summary>
    /// Full detail for a single sale — all 40+ fields plus Properties join for assessed value.
    /// </summary>
    [HttpGet("sale-qualification/{saleId:guid}")]
    public async Task<IActionResult> GetSaleQualificationDetail(
        Guid saleId,
        CancellationToken ct = default)
    {
        var s = await _db.ComparableSales
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == saleId && s.CountyId == BentonCountyId, ct);

        if (s is null)
            return NotFound(new { error = $"Sale {saleId} not found for Benton County." });

        // PacsValuation join for assessed value (canonical source).
        decimal? assessedValue = null;
        if (s.ParcelId != null)
        {
            var avMap = await GetAssessedValueMapAsync(new[] { s.ParcelId }, s.SalesYear ?? DateTime.UtcNow.Year, ct);
            if (avMap.TryGetValue(s.ParcelId, out var avFound))
                assessedValue = avFound;
        }

        var effectivePrice = s.AdjustedSalePrice ?? s.SalePrice;
        decimal? salesRatio = assessedValue.HasValue && effectivePrice > 0
            ? assessedValue.Value / effectivePrice : (decimal?)null;

        return Ok(new
        {
            saleId              = s.Id,
            parcelId            = s.ParcelId,
            address             = s.Address,
            neighborhood        = s.Neighborhood,
            propertyType        = s.PropertyType,
            imprvTypeCode       = s.ImprvTypeCode,
            // Sale facts
            saleDate            = s.SaleDate,
            salePrice           = s.SalePrice,
            adjustedSalePrice   = s.AdjustedSalePrice,
            saleAdjustmentAmount = s.SaleAdjustmentAmount,
            saleExemptionAmount = s.SaleExemptionAmount,
            exciseNumber        = s.ExciseNumber,
            pacsChgOfOwnerId    = s.PacsChgOfOwnerId,
            salesYear           = s.SalesYear,
            // Time-of-sale physical characteristics (PACS snapshot — use these for ratio)
            slLivingArea        = s.SlLivingArea,
            slYearBuilt         = s.SlYearBuilt,
            slLandAcres         = s.SlLandAcres,
            slLandSqft          = s.SlLandSqft,
            // Current physical characteristics (assessment-time fallback)
            gla                 = s.GrossLivingArea,
            lotSizeSqft         = s.LotSizeSqft,
            yearBuilt           = s.YearBuilt,
            bedrooms            = s.Bedrooms,
            bathrooms           = s.Bathrooms,
            condition           = s.Condition,
            qualityGrade        = s.QualityGrade,
            // Raw PACS codes (Layer 1 — facts, never transformed)
            rawSaleQualifier    = s.RawSaleQualifier,
            rawCountyRatioCd    = s.RawCountyRatioCd,
            rawWacCd            = s.RawWacCd,
            rawExcludeCalcCd    = s.RawExcludeCalcCd,
            rawRatioTypeCd      = s.RawRatioTypeCd,
            rawSaleTypeCode     = s.RawSaleTypeCode,
            rawFinancingCode    = s.RawFinancingCode,
            rawRatioCd          = s.RawRatioCd,
            rawRatioCdReason    = s.RawRatioCdReason,
            rawAdjReason        = s.RawAdjReason,
            rawAdjCode          = s.RawAdjCode,
            rawComment          = s.RawComment,
            // Report suppression flags
            suppressOnRatioRptCd   = s.SuppressOnRatioRptCd,
            suppressOnRatioReason  = s.SuppressOnRatioReason,
            includeNoCalc          = s.IncludeNoCalc,
            landOnlySale           = s.LandOnlySale,
            continueCurrentUse     = s.ContinueCurrentUse,
            // TF rule engine recommendation (Layer 2)
            qualificationRecommendation = s.QualificationRecommendation,
            recommendationReason        = s.RecommendationReason,
            recommendationSource        = s.RecommendationSource,
            recommendationVersion       = s.RecommendationVersion,
            // Assessor decision (Layer 3 — final word)
            qualificationDecision  = s.QualificationDecision,
            decisionReason         = s.DecisionReason,
            decisionBy             = s.DecisionBy,
            decisionAt             = s.DecisionAt,
            decisionSource         = s.DecisionSource,
            // TF-computed ratio
            assessedValue,
            salesRatio,
            // Audit
            ingestedAt  = s.IngestedAt,
            ingestedBy  = s.IngestedBy,
        });
    }

    /// <summary>
    /// Live running IAAO statistics for the currently-qualified sale pool.
    /// Useful for the SalesForge stats rail: shows median/COD/PRD/PRB as decisions accumulate.
    /// Returns zeroed stats when no qualified sales exist (never throws).
    /// </summary>
    [HttpGet("sale-qualification/running-stats")]
    public async Task<IActionResult> GetSaleQualificationRunningStats(
        [FromQuery] int taxYear = 2026,
        [FromQuery] string? hood = null,
        [FromQuery] string? propertyType = null,
        CancellationToken ct = default)
    {
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Total counts for all sales in the window (regardless of qualification status).
        var allQuery = _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart && s.SaleDate < lookbackEnd));

        if (!string.IsNullOrWhiteSpace(hood))
            allQuery = allQuery.Where(s => s.Neighborhood == hood);
        if (!string.IsNullOrWhiteSpace(propertyType))
            allQuery = allQuery.Where(s => s.PropertyType == propertyType);

        var counts = await allQuery
            .GroupBy(_ => 1)
            .Select(g => new
            {
                total            = g.Count(),
                qualified        = g.Count(s => s.QualificationDecision == "qualified"
                                             || (s.QualificationDecision == null && s.QualificationRecommendation == "qualified")),
                nonQualified     = g.Count(s => s.QualificationDecision != null && s.QualificationDecision != "qualified"),
                pending          = g.Count(s => s.QualificationDecision == null && s.QualificationRecommendation != "qualified"),
            })
            .FirstOrDefaultAsync(ct);

        // IAAO stats from the effective qualified pool (same as ratio-study population rule).
        var qualQuery = _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart && s.SaleDate < lookbackEnd))
            .Where(s => (s.QualificationDecision != null && s.QualificationDecision == "qualified")
                     || (s.QualificationDecision == null && s.QualificationRecommendation == "qualified"))
            .Where(s => s.SuppressOnRatioRptCd != "T")
            .Where(s => s.IncludeNoCalc != true);

        if (!string.IsNullOrWhiteSpace(hood))
            qualQuery = qualQuery.Where(s => s.Neighborhood == hood);
        if (!string.IsNullOrWhiteSpace(propertyType))
            qualQuery = qualQuery.Where(s => s.PropertyType == propertyType);

        var salesData = await qualQuery
            .Select(s => new { s.ParcelId, SalePrice = s.AdjustedSalePrice ?? s.SalePrice })
            .ToListAsync(ct);

        // Compute IAAO stats (reuse ratio-study logic).
        double? medianRatio = null, meanRatio = null, cod = null, prd = null, prb = null, weightedMeanRatio = null;
        int countWithRatio = 0;

        if (salesData.Count > 0)
        {
            var parcelIds   = salesData.Select(s => s.ParcelId).Where(id => id != null).Distinct().ToHashSet();
            var assessedMap = await GetAssessedValueMapAsync(parcelIds, taxYear, ct);

            var ratioRows = salesData
                .Where(s => s.ParcelId != null && assessedMap.TryGetValue(s.ParcelId!, out _) && s.SalePrice > 0)
                .Select(s => new { ratio = (double)assessedMap[s.ParcelId!] / (double)s.SalePrice, salePrice = (double)s.SalePrice, assessed = (double)assessedMap[s.ParcelId!] })
                .Where(r => r.ratio > 0)
                .ToList();

            countWithRatio = ratioRows.Count;

            if (countWithRatio > 0)
            {
                var allRatios = ratioRows.Select(r => r.ratio).OrderBy(r => r).ToArray();
                var n = allRatios.Length;
                var q1 = allRatios[(int)Math.Floor(n * 0.25)];
                var q3 = allRatios[(int)Math.Floor(n * 0.75)];
                var iqr = q3 - q1;
                var trimmed = ratioRows.Where(r => r.ratio >= q1 - 1.5 * iqr && r.ratio <= q3 + 1.5 * iqr).ToList();

                if (trimmed.Count > 0)
                {
                    var ratios = trimmed.Select(r => r.ratio).OrderBy(r => r).ToArray();
                    var nt = ratios.Length;
                    meanRatio = ratios.Average();
                    medianRatio = nt % 2 == 0 ? (ratios[nt / 2 - 1] + ratios[nt / 2]) / 2.0 : ratios[nt / 2];
                    if (medianRatio > 0)
                        cod = ratios.Average(r => Math.Abs(r - medianRatio.Value)) / medianRatio.Value * 100.0;
                    var sumA = trimmed.Sum(r => r.assessed);
                    var sumS = trimmed.Sum(r => r.salePrice);
                    if (sumS > 0) weightedMeanRatio = sumA / sumS;
                    if (weightedMeanRatio.HasValue && weightedMeanRatio.Value > 0 && meanRatio > 0)
                        prd = meanRatio.Value / weightedMeanRatio.Value;
                    if (nt >= 5 && meanRatio > 0)
                    {
                        var logPrices = trimmed.Select(r => Math.Log(r.salePrice)).ToArray();
                        var meanLog = logPrices.Average();
                        var num = 0.0; var den = 0.0;
                        for (var i = 0; i < trimmed.Count; i++)
                        {
                            var dLog = logPrices[i] - meanLog;
                            var dR = trimmed[i].ratio - meanRatio.Value;
                            num += dR * dLog; den += dLog * dLog;
                        }
                        if (den > 0) prb = num / den;
                    }
                }
            }
        }

        var codPass = cod.HasValue && cod.Value < 15.0;
        var prdPass = prd.HasValue && prd.Value is >= 0.98 and <= 1.03;
        var prbPass = prb.HasValue && Math.Abs(prb.Value) < 0.05;
        var medPass = medianRatio.HasValue && medianRatio.Value is >= 0.90 and <= 1.10;

        return Ok(new
        {
            taxYear,
            filters = new { hood, propertyType },
            counts = new
            {
                total        = counts?.total        ?? 0,
                qualified    = counts?.qualified    ?? 0,
                nonQualified = counts?.nonQualified ?? 0,
                pending      = counts?.pending      ?? 0,
                withRatio    = countWithRatio,
            },
            stats = new
            {
                medianRatio       = medianRatio.HasValue       ? Math.Round(medianRatio.Value,       4) : (double?)null,
                meanRatio         = meanRatio.HasValue         ? Math.Round(meanRatio.Value,         4) : (double?)null,
                weightedMeanRatio = weightedMeanRatio.HasValue ? Math.Round(weightedMeanRatio.Value, 4) : (double?)null,
                cod               = cod.HasValue               ? Math.Round(cod.Value,               2) : (double?)null,
                prd               = prd.HasValue               ? Math.Round(prd.Value,               4) : (double?)null,
                prb               = prb.HasValue               ? Math.Round(prb.Value,               4) : (double?)null,
            },
            iaaoCompliant = new { median = medPass, cod = codPass, prd = prdPass, prb = prbPass },
        });
    }

    /// <summary>
    /// Neighborhood-level qualification stats for SalesForge equity view.
    /// Groups the taxYear sale window by neighborhood, returns count + IAAO stats per hood.
    /// Hoods with fewer than 5 qualified sales report null for median/COD (insufficient sample).
    /// </summary>
    [HttpGet("sale-qualification/neighborhood-stats")]
    public async Task<IActionResult> GetSaleQualificationNeighborhoodStats(
        [FromQuery] int taxYear = 2026,
        [FromQuery] string? propertyType = null,
        CancellationToken ct = default)
    {
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var query = _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart && s.SaleDate < lookbackEnd));

        if (!string.IsNullOrWhiteSpace(propertyType))
            query = query.Where(s => s.PropertyType == propertyType);

        // Pull all sales for the window. Group in memory for ratio stats.
        var allSales = await query
            .Select(s => new
            {
                s.ParcelId,
                s.Neighborhood,
                SalePrice        = s.AdjustedSalePrice ?? s.SalePrice,
                IsQualified      = s.QualificationDecision == "qualified"
                                 || (s.QualificationDecision == null && s.QualificationRecommendation == "qualified"),
                IsPending        = s.QualificationDecision == null,
                IsNonQualified   = s.QualificationDecision != null && s.QualificationDecision != "qualified",
            })
            .ToListAsync(ct);

        // Build assessed value + neighborhood maps from PacsValuations (canonical source).
        var allParcelIds = allSales.Select(s => s.ParcelId).Where(id => id != null).Distinct().ToHashSet();
        var assessedMap  = await GetAssessedValueMapAsync(allParcelIds, taxYear, ct);
        var hoodMap      = await GetNeighborhoodMapAsync(allParcelIds, taxYear, ct);

        // Group by neighborhood from PacsValuation.NeighborhoodCode (s.Neighborhood is null in PACS data).
        var hoods = allSales
            .GroupBy(s => s.ParcelId != null && hoodMap.TryGetValue(s.ParcelId!, out var hc) ? hc : s.Neighborhood ?? "(no neighborhood)")
            .Select(g =>
            {
                var qualRows = g.Where(s => s.IsQualified && s.ParcelId != null
                    && assessedMap.TryGetValue(s.ParcelId!, out _) && s.SalePrice > 0)
                    .Select(s => (double)assessedMap[s.ParcelId!] / (double)s.SalePrice)
                    .Where(r => r > 0)
                    .OrderBy(r => r)
                    .ToArray();

                double? medianRatio = null, cod = null;
                if (qualRows.Length >= 5)
                {
                    // IQR trim before computing IAAO stats (same as ratio-study endpoint).
                    var n   = qualRows.Length;
                    var q1  = qualRows[(int)Math.Floor(n * 0.25)];
                    var q3  = qualRows[(int)Math.Floor(n * 0.75)];
                    var iqr = q3 - q1;
                    var trimmed = qualRows.Where(r => r >= q1 - 1.5 * iqr && r <= q3 + 1.5 * iqr).ToArray();
                    if (trimmed.Length >= 5)
                    {
                        var nt = trimmed.Length;
                        medianRatio = nt % 2 == 0
                            ? (trimmed[nt / 2 - 1] + trimmed[nt / 2]) / 2.0
                            : trimmed[nt / 2];
                        if (medianRatio > 0)
                            cod = trimmed.Average(r => Math.Abs(r - medianRatio.Value)) / medianRatio.Value * 100.0;
                    }
                }

                return new
                {
                    hood          = g.Key,
                    totalCount    = g.Count(),
                    qualifiedCount = g.Count(s => s.IsQualified),
                    pendingCount  = g.Count(s => s.IsPending),
                    nonQualCount  = g.Count(s => s.IsNonQualified),
                    medianRatio   = medianRatio.HasValue ? Math.Round(medianRatio.Value, 4) : (double?)null,
                    cod           = cod.HasValue         ? Math.Round(cod.Value,         2) : (double?)null,
                };
            })
            .OrderByDescending(h => h.cod ?? double.MaxValue)    // worst COD first (nulls last)
            .ThenByDescending(h => h.totalCount)
            .ToList();

        var hoodDataGap = hoods.Count == 1 && hoods[0].hood == "(no neighborhood)";
        return Ok(new
        {
            taxYear,
            propertyType,
            hoods,
            hoodDataGap,
            hoodDataGapAlert = hoodDataGap
                ? "Neighborhood codes were not synced — neighborhood breakdown unavailable. Re-sync neighborhood codes to enable hood-level IAAO stats."
                : null,
        });
    }

    /// <summary>
    /// Code audit: breakdown of raw PACS qualification codes in the taxYear sale window.
    /// Exposes WAC code nulls as a data quality flag (the known PACS seeding gap).
    /// </summary>
    [HttpGet("sale-qualification/code-audit")]
    public async Task<IActionResult> GetSaleQualificationCodeAudit(
        [FromQuery] int taxYear = 2026,
        CancellationToken ct = default)
    {
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var sales = await _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart && s.SaleDate < lookbackEnd))
            .Select(s => new
            {
                s.RawWacCd,
                s.RawSaleQualifier,
                s.RawCountyRatioCd,
                s.RawRatioTypeCd,
                s.RawExcludeCalcCd,
            })
            .ToListAsync(ct);

        var totalSales = sales.Count;

        var wacBreakdown = sales
            .GroupBy(s => s.RawWacCd)
            .Select(g => new
            {
                wacCd       = g.Key,
                description = g.Key == null ? "No WAC code (PACS seeding gap — data quality issue)" : g.Key,
                count       = g.Count(),
                isDataGap   = g.Key == null,
            })
            .OrderByDescending(x => x.isDataGap)
            .ThenByDescending(x => x.count)
            .ToList();

        var saleQualifierBreakdown = sales
            .GroupBy(s => s.RawSaleQualifier ?? "(null)")
            .Select(g => new { code = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToList();

        var countyRatioBreakdown = sales
            .GroupBy(s => s.RawCountyRatioCd ?? "(null)")
            .Select(g => new { code = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToList();

        var ratioTypeBreakdown = sales
            .GroupBy(s => s.RawRatioTypeCd ?? "(null)")
            .Select(g => new { code = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToList();

        var excludeCalcBreakdown = sales
            .GroupBy(s => s.RawExcludeCalcCd ?? "(null)")
            .Select(g => new { code = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToList();

        var wacNullCount = wacBreakdown.FirstOrDefault(x => x.isDataGap)?.count ?? 0;
        var wacNullPct   = totalSales > 0 ? Math.Round((double)wacNullCount / totalSales * 100.0, 1) : 0.0;

        return Ok(new
        {
            taxYear,
            totalSales,
            dataQualityAlert = wacNullCount > 0
                ? $"{wacNullCount:N0} of {totalSales:N0} sales ({wacNullPct}%) have no WAC code — PACS seeding gap"
                : null,
            wacCdBreakdown        = wacBreakdown,
            saleQualifierBreakdown,
            countyRatioBreakdown,
            ratioTypeBreakdown,
            excludeCalcBreakdown,
        });
    }

    // ── Ratio Study ───────────────────────────────────────────────────────

    /// <summary>
    /// County-wide ratio study for a given tax year.
    /// Population: effective qualified pool — QualificationDecision="qualified"
    /// wins when set; QualificationRecommendation="qualified" is the fallback.
    /// Sales suppressed from the ratio report or flagged IncludeNoCalc are excluded.
    /// Returns IAAO stats (median ratio, mean ratio, COD, PRD) plus paginated detail.
    /// Ratio = Properties.AssessedValue / ComparableSales.SalePrice (TF-computed; PACS ratio column unused).
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
                     || (s.SaleDate >= lookbackStart
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

        // TF computes its own sales ratios: AssessedValue / SalePrice.
        // PACS is the legacy system being replaced — TF never uses PACS-computed ratio values.
        var salesData = await baseQuery
            .Select(s => new
            {
                s.ParcelId,
                SalePrice = s.AdjustedSalePrice ?? s.SalePrice,
            })
            .ToListAsync(ct);

        // Look up canonical assessed values from PacsValuations via GeoId→Parcel→Valuation.
        var allParcelIds      = salesData.Select(s => s.ParcelId).Distinct().ToHashSet();
        var assessedByParcel  = await GetAssessedValueMapAsync(allParcelIds, taxYear, ct);

        var ratioRows = salesData
            .Select(s =>
            {
                decimal? computedRatio = assessedByParcel.TryGetValue(s.ParcelId, out var av) && s.SalePrice > 0
                    ? av / s.SalePrice
                    : (decimal?)null;
                return new { ratio = computedRatio, salePrice = s.SalePrice, assessedVal = computedRatio.HasValue ? s.SalePrice * computedRatio.Value : 0m };
            })
            .Where(r => r.ratio.HasValue && r.ratio.Value > 0)
            .Select(r => new { ratio = r.ratio!.Value, salePrice = r.salePrice, assessedVal = r.assessedVal })
            .ToList();

        var countWithRatio = ratioRows.Count;

        // IAAO ratio study statistics with IQR outlier trimming.
        // Per IAAO Standard on Ratio Studies §5.1.3, outliers are identified using
        // Tukey's fence method: [Q1 - 1.5*IQR, Q3 + 1.5*IQR].
        // Statistics are computed on the trimmed population; all rows still appear
        // in the paginated detail so staff can review and act on anomalous ratios.
        double? medianRatio = null, meanRatio = null, cod = null, prd = null;
        double? weightedMeanRatio = null, prb = null, cov = null;
        int trimmedCount = 0;

        if (countWithRatio > 0)
        {
            var allRatios = ratioRows.Select(r => (double)r.ratio).OrderBy(r => r).ToArray();
            var n         = allRatios.Length;

            // IQR bounds.
            var q1  = allRatios[(int)Math.Floor(n * 0.25)];
            var q3  = allRatios[(int)Math.Floor(n * 0.75)];
            var iqr = q3 - q1;
            var lo  = q1 - 1.5 * iqr;
            var hi  = q3 + 1.5 * iqr;

            // Trim to IAAO-clean population for statistics.
            var trimmedRatioRows = ratioRows.Where(r => (double)r.ratio >= lo && (double)r.ratio <= hi).ToList();
            trimmedCount = n - trimmedRatioRows.Count;

            if (trimmedRatioRows.Count > 0)
            {
                var ratios = trimmedRatioRows.Select(r => (double)r.ratio).OrderBy(r => r).ToArray();
                var nt     = ratios.Length;
                meanRatio  = ratios.Average();
                medianRatio = nt % 2 == 0
                    ? (ratios[nt / 2 - 1] + ratios[nt / 2]) / 2.0
                    : ratios[nt / 2];

                // COD = (mean |ratio - median|) / median × 100   (IAAO §7)
                if (medianRatio > 0)
                    cod = ratios.Average(r => Math.Abs(r - medianRatio.Value)) / medianRatio.Value * 100.0;

                // Weighted mean ratio = Σassessed / Σsale_price
                var sumAssessed  = trimmedRatioRows.Sum(r => (double)r.assessedVal);
                var sumSalePrice = trimmedRatioRows.Sum(r => (double)r.salePrice);
                if (sumSalePrice > 0)
                    weightedMeanRatio = sumAssessed / sumSalePrice;

                // PRD = mean ratio / weighted mean ratio   (IAAO §6)
                if (weightedMeanRatio.HasValue && meanRatio > 0 && weightedMeanRatio.Value > 0)
                    prd = meanRatio.Value / weightedMeanRatio.Value;

                // COV = stddev / mean × 100
                if (meanRatio > 0 && nt > 1)
                {
                    var variance = ratios.Sum(r => Math.Pow(r - meanRatio.Value, 2)) / (nt - 1);
                    cov = Math.Sqrt(variance) / meanRatio.Value * 100.0;
                }

                // PRB = OLS β₁ of (ratio − mean) on (ln(sp) − mean(ln(sp)))
                // Measures price-related bias: positive → regressivity (low values over-assessed)
                if (nt >= 5)
                {
                    var logPrices  = trimmedRatioRows.Select(r => Math.Log((double)r.salePrice)).ToArray();
                    var meanLogSP  = logPrices.Average();
                    var numerator  = 0.0;
                    var denominator = 0.0;
                    for (var i = 0; i < trimmedRatioRows.Count; i++)
                    {
                        var dLog   = logPrices[i] - meanLogSP;
                        var dRatio = (double)trimmedRatioRows[i].ratio - meanRatio.Value;
                        numerator   += dRatio * dLog;
                        denominator += dLog * dLog;
                    }
                    if (denominator > 0)
                        prb = numerator / denominator;
                }
            }
        }

        // IAAO compliance thresholds (residential SFR defaults)
        var codPass  = cod.HasValue  && cod.Value  < 15.0;
        var prdPass  = prd.HasValue  && prd.Value  is >= 0.98 and <= 1.03;
        var prbPass  = prb.HasValue  && Math.Abs(prb.Value) < 0.05;
        var medPass  = medianRatio.HasValue && medianRatio.Value is >= 0.90 and <= 1.10;
        var iaaoCompliant = codPass && prdPass && prbPass && medPass;
        var complianceNotes = new List<string>();
        if (cod.HasValue)   complianceNotes.Add($"COD {cod.Value:F1} {(codPass ? "✓" : "✗")} (< 15.0)");
        if (prd.HasValue)   complianceNotes.Add($"PRD {prd.Value:F3} {(prdPass ? "✓" : "✗")} (0.98–1.03)");
        if (prb.HasValue)   complianceNotes.Add($"PRB {prb.Value:F3} {(prbPass ? "✓" : "✗")} (|PRB| < 0.05)");
        if (medianRatio.HasValue) complianceNotes.Add($"Median {medianRatio.Value:F3} {(medPass ? "✓" : "✗")} (0.90–1.10)");

        // Paginated detail — TF computes sales ratio from Properties.AssessedValue / SalePrice.
        var rawItems = await baseQuery
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
                gla                 = s.SlLivingArea ?? s.GrossLivingArea,
                yearBuilt           = s.SlYearBuilt ?? s.YearBuilt,
                hood                = s.Neighborhood,
                propertyType        = s.PropertyType,
                qualificationSource = s.QualificationDecision != null ? "decision" : "recommendation"
            })
            .ToListAsync(ct);

        // Look up canonical assessed values for page items from PacsValuations.
        var pageParcelIds = rawItems.Select(i => i.parcelId).Distinct().ToHashSet();
        var pageAssessed  = await GetAssessedValueMapAsync(pageParcelIds, taxYear, ct);

        var items = rawItems.Select(i =>
        {
            decimal? salesRatio = pageAssessed.TryGetValue(i.parcelId, out var av) && i.salePrice > 0
                ? av / i.salePrice
                : (decimal?)null;
            return new
            {
                i.saleId, i.parcelId, i.saleDate, i.salePrice, i.rawSalePrice,
                i.adjustedSalePrice, salesRatio,
                i.gla, i.yearBuilt, i.hood, i.propertyType, i.qualificationSource
            };
        }).ToList();

        _logger.LogInformation(
            "[TerraForge] RatioStudy: year={Year} hood={Hood} total={Total} withRatio={WithRatio} " +
            "trimmed={Trimmed} median={Median:F4} mean={Mean:F4} COD={COD:F2} PRD={PRD:F4}",
            taxYear, hood ?? "all", total, countWithRatio,
            trimmedCount, medianRatio, meanRatio, cod, prd);

        return Ok(new
        {
            taxYear,
            total,
            countWithRatio,
            outliersExcluded = trimmedCount,
            iaaoCompliant,
            complianceNotes,
            stats = new
            {
                medianRatio       = medianRatio.HasValue       ? Math.Round(medianRatio.Value,       4) : (double?)null,
                meanRatio         = meanRatio.HasValue         ? Math.Round(meanRatio.Value,         4) : (double?)null,
                weightedMeanRatio = weightedMeanRatio.HasValue ? Math.Round(weightedMeanRatio.Value, 4) : (double?)null,
                cod               = cod.HasValue               ? Math.Round(cod.Value,               2) : (double?)null,
                prd               = prd.HasValue               ? Math.Round(prd.Value,               4) : (double?)null,
                prb               = prb.HasValue               ? Math.Round(prb.Value,               4) : (double?)null,
                cov               = cov.HasValue               ? Math.Round(cov.Value,               2) : (double?)null,
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
                     || (s.SaleDate >= lookbackStart
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

        var rawItems = await query
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
                qualificationSource = s.QualificationDecision != null ? "decision" : "recommendation"
            })
            .ToListAsync(ct);

        // Compute sales ratio (AssessedValue / SalePrice) from current assessed values
        var pageParcelIds = rawItems.Select(i => i.parcelId).Where(id => id != null).ToHashSet();
        Dictionary<string, decimal> pageAssessed = new();
        if (pageParcelIds.Count > 0)
        {
            pageAssessed = (await _db.Properties
                .AsNoTracking()
                .Where(p => pageParcelIds.Contains(p.ParcelNumber) && p.AssessedValue > 0)
                .Select(p => new { p.ParcelNumber, p.AssessedValue })
                .ToListAsync(ct))
                .ToDictionary(p => p.ParcelNumber!, p => p.AssessedValue);
        }

        var items = rawItems.Select(i =>
        {
            decimal? salesRatio = i.parcelId != null
                && pageAssessed.TryGetValue(i.parcelId, out var av)
                && i.salePrice > 0
                ? av / i.salePrice
                : (decimal?)null;
            return new
            {
                i.saleId, i.parcelId, i.address, i.hood, i.propertyType, i.imprvTypeCode,
                i.saleDate, i.salePrice, i.rawSalePrice, i.adjustedSalePrice,
                i.gla, i.lotSizeSqft, i.yearBuilt, i.bedrooms, i.bathrooms,
                i.condition, i.qualityGrade, salesRatio, i.qualificationSource
            };
        }).ToList();

        _logger.LogInformation(
            "[TerraForge] CompsPool: year={Year} hood={Hood} type={Type} priceRange=[{Min},{Max}] " +
            "glaRange=[{MinGla},{MaxGla}] total={Total} page={Page}",
            taxYear, hood ?? "all", propertyType ?? "all",
            minPrice, maxPrice, minGla, maxGla, total, page);

        return Ok(new { total, page, pageSize, items });
    }

    // ── OLS Regression ───────────────────────────────────────────────────

    /// <summary>
    /// County-wide OLS regression of SalePrice against physical characteristics
    /// for the effective qualified pool.
    ///
    /// Model: SalePrice ~ intercept + GLA + LotSizeSqft + YearBuilt
    /// Predictors use sale-time values (sl_living_area, sl_land_sqft, sl_yr_blt)
    /// falling back to assessment-time values when PACS did not record sale-time data.
    /// Observations missing both GLA sources are excluded from the fit.
    ///
    /// Filters: same effective qualified pool as ratio-study (hood / propertyType optional).
    /// Requires ≥ 5 qualified observations with usable predictors.
    /// </summary>
    [HttpGet("regression")]
    public async Task<IActionResult> GetRegression(
        [FromQuery] int taxYear = 2026,
        [FromQuery] string? hood = null,
        [FromQuery] string? propertyType = null,
        CancellationToken ct = default)
    {
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Effective qualified pool — same population as ratio-study.
        var baseQuery = _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.SalesYear == taxYear
                     || (s.SaleDate >= lookbackStart
                         && s.SaleDate < lookbackEnd))
            .Where(s => (s.QualificationDecision != null && s.QualificationDecision == "qualified")
                     || (s.QualificationDecision == null && s.QualificationRecommendation == "qualified"))
            .Where(s => s.SuppressOnRatioRptCd != "T")
            .Where(s => s.IncludeNoCalc != true);

        if (!string.IsNullOrWhiteSpace(hood))
            baseQuery = baseQuery.Where(s => s.Neighborhood == hood);
        if (!string.IsNullOrWhiteSpace(propertyType))
            baseQuery = baseQuery.Where(s => s.PropertyType == propertyType);

        // Fetch fields needed for regression. Prefer sale-time PACS values; fall back to
        // assessment-time values. YearBuilt of 0 is treated as missing.
        var rows = await baseQuery
            .Select(s => new
            {
                s.Id,
                s.ParcelId,
                s.SaleDate,
                salePrice  = (double)(s.AdjustedSalePrice ?? s.SalePrice),
                gla        = (double?)(s.SlLivingArea ?? s.GrossLivingArea),
                lotSqft    = (double?)(s.SlLandSqft   ?? s.LotSizeSqft),
                yearBuilt  = (double?)(s.SlYearBuilt  ?? s.YearBuilt),
                s.Neighborhood,
                s.PropertyType
            })
            .ToListAsync(ct);

        // Discard observations that cannot contribute a valid predictor vector.
        // GLA is required. LotSqft and YearBuilt fall back to 0 when absent
        // (acceptable for regression but flagged in output).
        var usable = rows
            .Where(r => r.gla is > 0 && r.salePrice > 0)
            .ToList();

        var totalPool   = rows.Count;
        var excludedCount = rows.Count - usable.Count;

        if (usable.Count < 5)
        {
            _logger.LogWarning(
                "[TerraForge] Regression: year={Year} hood={Hood} — insufficient observations: {N} (need ≥5)",
                taxYear, hood ?? "all", usable.Count);

            return Ok(new
            {
                taxYear,
                hood,
                propertyType,
                totalPool,
                usedForFit    = usable.Count,
                excludedCount,
                insufficientData = true,
                minimumRequired  = 5,
                model            = (object?)null,
                residuals        = Array.Empty<object>()
            });
        }

        var observations = usable
            .Select(r => new OlsObservation(
                SalePrice:   r.salePrice,
                Gla:         r.gla!.Value,
                LotSizeSqft: r.lotSqft    ?? 0,
                YearBuilt:   r.yearBuilt  ?? 0))
            .ToList();

        var fit = _ols.Fit(observations);

        if (fit is null)
        {
            return Ok(new
            {
                taxYear,
                hood,
                propertyType,
                totalPool,
                usedForFit       = usable.Count,
                excludedCount,
                insufficientData = false,
                singularMatrix   = true,
                model            = (object?)null,
                residuals        = Array.Empty<object>()
            });
        }

        // RMSE = sqrt( Σresidual² / n )
        var rmse = Math.Sqrt(fit.Residuals.Sum(r => r * r) / fit.N);

        // Per-sale residual details — index-aligned with usable list.
        var residualDetails = usable.Select((r, i) => new
        {
            parcelId         = r.ParcelId,
            saleDate         = r.SaleDate,
            salePrice        = r.salePrice,
            gla              = r.gla,
            lotSqft          = r.lotSqft,
            yearBuilt        = (int?)(r.yearBuilt.HasValue && r.yearBuilt > 0 ? (int)r.yearBuilt : (int?)null),
            fitted           = Math.Round(r.salePrice - fit.Residuals[i], 2),
            residual         = Math.Round(fit.Residuals[i], 2),
            percentResidual  = r.salePrice > 0
                                 ? Math.Round(fit.Residuals[i] / r.salePrice * 100.0, 2)
                                 : (double?)null,
            hood             = r.Neighborhood,
            propertyType     = r.PropertyType
        }).ToList();

        _logger.LogInformation(
            "[TerraForge] Regression: year={Year} hood={Hood} n={N} R2={R2:F4} R2adj={R2adj:F4} RMSE={RMSE:F0}",
            taxYear, hood ?? "all", fit.N, fit.RSquared, fit.RSquaredAdj, rmse);

        return Ok(new
        {
            taxYear,
            hood,
            propertyType,
            totalPool,
            usedForFit    = fit.N,
            excludedCount,
            insufficientData = false,
            singularMatrix   = false,
            model = new
            {
                predictors   = new[] { "intercept", "GLA_sqft", "LotSizeSqft", "YearBuilt" },
                beta         = fit.Beta.Select(b => Math.Round(b, 4)).ToArray(),
                rSquared     = fit.RSquared,
                rSquaredAdj  = fit.RSquaredAdj,
                rmse         = Math.Round(rmse, 2),
                n            = fit.N
            },
            residuals = residualDetails
        });
    }

    // ── County KPI Stats ──────────────────────────────────────────────────

    /// <summary>
    /// County-wide KPI summary for the TerraForge suite home dashboard.
    /// Source: pacs_valuations WHERE PropValYear = taxYear AND SupNum = 0
    /// (working layer only — SupNum > 0 are supplemental corrections, excluded from KPIs).
    ///
    /// Fields returned:
    ///   totalParcels              — row count in working layer
    ///   averageAssessedValue      — AVG(Market) over rows with a non-null market value
    ///   assessedThisYear          — proxy: same as totalParcels (all rows in working year)
    ///   pendingAssessments        — COUNT WHERE NewVal > 0 (new-construction additions not yet certified)
    ///   assessmentCompletionPercent — pct of rows with Market > 0
    ///
    /// Note: county isolation is implicit — pacs_valuations contains only Benton data
    /// seeded from pacs_oltp. Multi-county filtering via ParcelId → PacsParcel.CountyId
    /// join is deferred until a second county is onboarded.
    /// </summary>
    [HttpGet("county-stats")]
    public async Task<IActionResult> GetCountyStats(
        [FromQuery] int taxYear = 2026,
        CancellationToken ct = default)
    {
        // SupNum=0 — the working (base supplement) layer only.
        // Supplemental layers (SupNum > 0) represent corrections-in-progress
        // and must not inflate the KPI parcel count.
        var rows = await _db.PacsValuations
            .Where(v => v.PropValYear == taxYear && v.SupNum == 0)
            .Select(v => new { v.AssessedVal, v.Market, v.NewVal })
            .ToListAsync(ct);

        var totalParcels = rows.Count;

        // AssessedVal is the value that goes to the tax roll (may differ from Market for
        // ag/timber current-use, partial exemptions, etc.).  Fall back to Market only when
        // AssessedVal is absent so older/incomplete records don't drop to zero.
        var rowsWithAssessed = rows.Where(r => (r.AssessedVal ?? r.Market) is > 0).ToList();
        var avgAssessed      = rowsWithAssessed.Count > 0
            ? rowsWithAssessed.Average(r => (double)(r.AssessedVal ?? r.Market)!.Value)
            : 0.0;

        var pendingAssessments = rows.Count(r => r.NewVal is > 0);

        // assessmentCompletionPercent: percentage of parcels that have an assessed value assigned.
        var completionPct = totalParcels > 0
            ? Math.Round((double)rowsWithAssessed.Count / totalParcels * 100.0, 1)
            : 0.0;

        _logger.LogInformation(
            "[TerraForge] CountyStats: year={Year} total={Total} avgAssessed={Avg:F0} " +
            "pending={Pending} completion={Pct}%",
            taxYear, totalParcels, avgAssessed, pendingAssessments, completionPct);

        return Ok(new
        {
            taxYear,
            totalParcels,
            averageAssessedValue        = Math.Round((decimal)avgAssessed, 2),
            assessedThisYear            = totalParcels,   // proxy: all working-layer rows = assessed this year
            pendingAssessments,
            assessmentCompletionPercent = completionPct,
        });
    }

    /// <summary>
    /// Apply WAC-code-based qualification recommendations to all pending ComparableSales.
    /// Mimics the AI recommendation engine: sales with no disqualifying WAC code or
    /// sale qualifier → recommended "qualified". This is the standard DOR workflow step
    /// that normally runs after PACS import, before staff review.
    /// </summary>
    [HttpPost("apply-recommendations")]
    public async Task<IActionResult> ApplyQualificationRecommendations(
        CancellationToken ct = default)
    {
        // Step 1: Backfill raw PACS qualification codes that were null at import time.
        // Join ComparableSales → pacs_sales via PacsParcel (GeoId = county parcel number).
        // Benton's primary qualification source is sl_county_ratio_cd (Layer 2 in the
        // 4-layer hierarchy). WAC codes are preserved for DOR analytics — they are NOT
        // the primary disqualification trigger (Benton has its own codes for that).
        var pacsLookup = await (
            from ps in _db.PacsSales
            join pp in _db.PacsParcel on ps.ParcelId equals pp.Id
            where pp.GeoId != null
            select new
            {
                GeoId            = pp.GeoId!,
                SaleDate         = ps.SaleDate,
                SalePrice        = ps.SalePrice,
                CountyRatioCd    = ps.SaleCountyRatioCd,
                WacCd            = ps.WacCd,
                RatioTypeCd      = ps.SaleRatioTypeCd,
                ExcludeCalcCd    = ps.SalesExcludeCalcCd,
                SaleQualifier    = ps.SaleQualifier,
            })
            .ToListAsync(ct);

        // Build a lookup keyed by (parcelGeoId, saleDate, salePrice) for fast match.
        // Use first match per key — sale dates are generally unique per parcel.
        var pacsByKey = new Dictionary<(string, DateTime?, decimal?), (string? county, string? wac, string? ratioType, string? exclude, string? qualifier)>();
        foreach (var row in pacsLookup)
        {
            var key = (row.GeoId, row.SaleDate, row.SalePrice);
            if (!pacsByKey.ContainsKey(key))
                pacsByKey[key] = (row.CountyRatioCd, row.WacCd, row.RatioTypeCd, row.ExcludeCalcCd, row.SaleQualifier);
        }

        // Backfill any ComparableSale that still has all null raw qualification fields.
        var toBackfill = await _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .Where(s => s.RawCountyRatioCd == null && s.RawWacCd == null
                     && s.RawRatioTypeCd == null && s.RawSaleQualifier == null)
            .ToListAsync(ct);

        int backfilled = 0;
        foreach (var sale in toBackfill)
        {
            var key = (sale.ParcelId, (DateTime?)sale.SaleDate, (decimal?)sale.SalePrice);
            if (pacsByKey.TryGetValue(key, out var pacs))
            {
                sale.RawCountyRatioCd = pacs.county;
                sale.RawWacCd         = pacs.wac;
                sale.RawRatioTypeCd   = pacs.ratioType;
                sale.RawExcludeCalcCd = pacs.exclude;
                sale.RawSaleQualifier = pacs.qualifier;
                backfilled++;
            }
        }

        if (backfilled > 0)
            await _db.SaveChangesAsync(ct);

        _logger.LogInformation("[TerraForge] apply-recommendations backfill: {Backfilled} sales got raw PACS codes", backfilled);

        // Step 2: Run the proper 4-layer qualification engine (county code → DOR code → WAC → default).
        // Try FK-aware async version first (needs SaleRatioTypes, CountyRatioCodes, ReetWacCodes seeded).
        // Falls back to sync version with hardcoded county code map when lookup tables aren't in dev DB.
        int processed;
        try
        {
            processed = await _saleQual.ComputeRecommendationsAsync(BentonCountyId, ct);
        }
        catch (Exception ex) when (ex.Message.Contains("no such table") || ex.Message.Contains("Invalid object name"))
        {
            _logger.LogWarning("[TerraForge] Lookup tables not seeded — using hardcoded county code map (dev fallback)");
            var allSales = await _db.ComparableSales
                .Where(s => s.CountyId == BentonCountyId)
                .ToListAsync(ct);
            _saleQual.ComputeRecommendations(allSales);
            await _db.SaveChangesAsync(ct);
            processed = allSales.Count;
        }

        // Tally results for the response.
        var summary = await _db.ComparableSales
            .Where(s => s.CountyId == BentonCountyId)
            .GroupBy(s => s.QualificationRecommendation)
            .Select(g => new { recommendation = g.Key, count = g.Count() })
            .ToListAsync(ct);

        _logger.LogInformation(
            "[TerraForge] apply-recommendations: processed={Total} backfilled={Backfilled}",
            processed, backfilled);

        return Ok(new
        {
            processed,
            backfilled,
            summary,
            message = $"Applied 4-layer qualification to {processed} sales. Benton county codes used as primary source."
        });
    }

    /// <summary>
    /// Bulk qualification decision — apply the same decision to multiple sales in one call.
    /// Max 200 sales per call. Errors on individual sales are logged but do not abort the batch.
    /// </summary>
    [HttpPatch("sale-qualification/bulk")]
    public async Task<IActionResult> BulkPatchSaleQualification(
        [FromBody] BulkSaleQualificationPatchDto body,
        CancellationToken ct = default)
    {
        if (body.SaleIds == null || body.SaleIds.Length == 0)
            return BadRequest(new { error = "saleIds is required and must not be empty." });

        var ids = body.SaleIds.Take(200).ToArray();

        var sales = await _db.ComparableSales
            .Where(s => ids.Contains(s.Id) && s.CountyId == BentonCountyId)
            .ToListAsync(ct);

        var now = DateTime.UtcNow;
        foreach (var sale in sales)
        {
            sale.QualificationDecision = body.QualificationDecision;
            sale.DecisionReason        = body.ResearchNotes;
            sale.DecisionBy            = body.DecidedBy;
            sale.DecisionAt            = now;
            sale.DecisionSource        = body.DecisionSource ?? "StaffConfirmed";
        }

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "[TerraForge] Bulk sale qualification: {Count} sales set to {Decision} by {By}",
            sales.Count, body.QualificationDecision, body.DecidedBy);

        return Ok(new
        {
            requested = ids.Length,
            updated   = sales.Count,
            qualificationDecision = body.QualificationDecision,
            decidedAt = now,
        });
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

    // ── Ratio Study Trends ────────────────────────────────────────────────────

    /// <summary>
    /// Returns quarterly COD and PRD trend data for the last 6 quarters,
    /// computed from live qualified ComparableSales + Properties join.
    /// </summary>
    [HttpGet("ratio-study/trends")]
    public async Task<IActionResult> GetRatioStudyTrends(
        [FromQuery] int taxYear = 2026,
        CancellationToken ct = default)
    {
        _logger.LogInformation("GetRatioStudyTrends: taxYear={TaxYear}", taxYear);

        var cutoff = taxYear - 2;
        var rawSales = await (
            from s in _db.ComparableSales
            where s.SaleQualification == "qualified"
               && s.SaleDate >= new DateTime(cutoff, 1, 1)
               && s.SaleDate <= new DateTime(taxYear, 12, 31)
            join p in _db.Properties on s.ParcelId equals p.ParcelId into pj
            from p in pj.DefaultIfEmpty()
            where p == null || p.AssessedValue > 0
            select new
            {
                s.SaleDate,
                SalePrice = s.AdjustedSalePrice > 0 ? s.AdjustedSalePrice!.Value : s.SalePrice,
                AssessedValue = p != null ? p.AssessedValue : 0m,
            }
        ).Where(x => x.AssessedValue > 0 && x.SalePrice > 0).ToListAsync(ct);

        // Build quarter → ratio list map
        var byQuarter = rawSales
            .Select(x => new
            {
                Period = $"Q{((x.SaleDate.Month - 1) / 3) + 1}-{x.SaleDate.Year}",
                Ratio = Math.Clamp((double)(x.AssessedValue / x.SalePrice), 0.5, 2.0),
                AV = x.AssessedValue,
            })
            .GroupBy(x => x.Period)
            .OrderBy(g =>
            {
                var parts = g.Key.Split('-');
                return int.Parse(parts[1]) * 10 + int.Parse(parts[0].Replace("Q", ""));
            })
            .ToList();

        var codTrend = new List<object>();
        var prdTrend = new List<object>();

        foreach (var grp in byQuarter)
        {
            var ratios = grp.Select(x => (decimal)x.Ratio).ToList();
            var avs    = grp.Select(x => x.AV).ToList();
            var cod    = TrendStats.ComputeCod(ratios);
            var prd    = TrendStats.ComputePrd(ratios, avs);
            codTrend.Add(new { period = grp.Key, cod = Math.Round((double)cod, 1) });
            prdTrend.Add(new { period = grp.Key, prd = Math.Round((double)prd, 3) });
        }

        return Ok(new { codTrend, prdTrend, source = "live", saleCount = rawSales.Count });
    }

    /// <summary>
    /// Returns per-stratum IAAO ratio study statistics (Property Type × Quality Grade).
    /// Strata with fewer than <paramref name="minSales"/> qualified sales are flagged as
    /// insufficient — IAAO Standard 5 §9 requires minimum 5 sales per stratum.
    /// </summary>
    [HttpGet("ratio-study/stratified")]
    public async Task<IActionResult> GetStratifiedRatioStudy(
        [FromQuery] int taxYear = 2026,
        [FromQuery] int minSales = 5,
        [FromQuery] string? propertyType = null,
        [FromQuery] string? qualityGrade = null,
        CancellationToken ct = default)
    {
        _logger.LogInformation("GetStratifiedRatioStudy: taxYear={TaxYear} minSales={MinSales}", taxYear, minSales);

        try
        {
            // Qualified sale population — same rule as other ratio-study endpoints
            var salesQuery = _db.ComparableSales
                .AsNoTracking()
                .Where(cs => cs.SalesYear == taxYear
                    && cs.SaleQualification == "qualified"
                    && cs.SalePrice > 0);

            if (!string.IsNullOrEmpty(propertyType))
                salesQuery = salesQuery.Where(cs => cs.PropertyType == propertyType);

            var sales = await salesQuery
                .Select(cs => new
                {
                    cs.ParcelId,
                    cs.SalePrice,
                    cs.AdjustedSalePrice,
                    cs.PropertyType,
                })
                .ToListAsync(ct);

            if (sales.Count == 0)
                return Ok(new { taxYear, minSales, totalStrata = 0, sufficientStrata = 0, strata = Array.Empty<object>() });

            var parcelIds = sales.Select(s => s.ParcelId).Distinct().ToHashSet();

            // Join to CamaCharacteristics for QualityGrade
            var camaMap = await _db.CamaCharacteristics
                .AsNoTracking()
                .Where(cc => parcelIds.Contains(cc.ParcelId) && cc.TaxYear == taxYear)
                .Select(cc => new { cc.ParcelId, cc.QualityGrade })
                .ToListAsync(ct);
            var camaLookup = camaMap
                .GroupBy(cc => cc.ParcelId)
                .ToDictionary(g => g.Key, g => g.First().QualityGrade);

            // Join to Properties for AssessedValue
            var propMap = await _db.Properties
                .AsNoTracking()
                .Where(p => parcelIds.Contains(p.ParcelNumber) && p.TaxYear == taxYear && p.AssessedValue > 0)
                .Select(p => new { p.ParcelNumber, p.AssessedValue })
                .ToDictionaryAsync(p => p.ParcelNumber!, p => p.AssessedValue, ct);

            // Build ratio records
            var ratioRows = sales
                .Select(s =>
                {
                    var effectiveSalePrice = (double)(s.AdjustedSalePrice > 0 ? s.AdjustedSalePrice!.Value : s.SalePrice);
                    if (!propMap.TryGetValue(s.ParcelId, out var assessedValue)
                        || assessedValue <= 0
                        || effectiveSalePrice <= 0)
                        return null;
                    camaLookup.TryGetValue(s.ParcelId, out var qg);
                    return new
                    {
                        PropertyType = s.PropertyType ?? "Unknown",
                        QualityGrade = qg ?? "Unknown",
                        Ratio = (double)assessedValue / effectiveSalePrice,
                        SalePrice = effectiveSalePrice,
                        AssessedValue = (double)assessedValue,
                    };
                })
                .Where(r => r != null && r.Ratio > 0.1 && r.Ratio < 5.0)
                .ToList();

            if (!string.IsNullOrEmpty(qualityGrade))
                ratioRows = ratioRows.Where(r => r!.QualityGrade == qualityGrade).ToList();

            // Group and compute IAAO stats
            var groups = ratioRows
                .GroupBy(r => (r!.PropertyType, r.QualityGrade))
                .Select(g =>
                {
                    var rows = g.OrderBy(r => r!.Ratio).ToList();
                    var n = rows.Count;
                    var insufficient = n < minSales;

                    double? medianRatio = null, cod = null, prd = null, prb = null;

                    if (!insufficient)
                    {
                        medianRatio = n % 2 == 0
                            ? (rows[n / 2 - 1]!.Ratio + rows[n / 2]!.Ratio) / 2.0
                            : rows[n / 2]!.Ratio;

                        cod = rows.Average(r => Math.Abs(r!.Ratio - medianRatio.Value) / medianRatio.Value) * 100.0;

                        var meanRatio = rows.Average(r => r!.Ratio);
                        var sumSP = rows.Sum(r => r!.SalePrice);
                        var wMean = sumSP > 0 ? rows.Sum(r => r!.AssessedValue) / sumSP : meanRatio;
                        prd = wMean > 0 ? meanRatio / wMean : (double?)null;

                        if (n >= 5)
                        {
                            var vVals = rows.Select(r => 0.5 * (r!.SalePrice + r.AssessedValue)).ToList();
                            var vMean = vVals.Average();
                            var rMean = rows.Average(r => r!.Ratio);
                            var num = rows.Zip(vVals, (r, v) => (r!.Ratio - rMean) * (v - vMean)).Sum();
                            var den = vVals.Sum(v => (v - vMean) * (v - vMean));
                            if (den > 0) prb = num / den;
                        }
                    }

                    bool medPass = medianRatio.HasValue && medianRatio >= 0.90 && medianRatio <= 1.10;
                    bool codPass = cod.HasValue && cod <= 20.0;
                    bool prdPass = prd.HasValue && prd >= 0.98 && prd <= 1.03;
                    bool prbPass = prb.HasValue && Math.Abs(prb.Value) <= 0.05;

                    return new
                    {
                        propertyType = g.Key.PropertyType,
                        qualityGrade = g.Key.QualityGrade,
                        saleCount = n,
                        insufficientSample = insufficient,
                        medianRatio = medianRatio.HasValue ? Math.Round(medianRatio.Value, 4) : (double?)null,
                        cod = cod.HasValue ? Math.Round(cod.Value, 2) : (double?)null,
                        prd = prd.HasValue ? Math.Round(prd.Value, 4) : (double?)null,
                        prb = prb.HasValue ? Math.Round(prb.Value, 4) : (double?)null,
                        iaaoMedianPass = medPass,
                        iaaoCodPass = codPass,
                        iaaoPrdPass = prdPass,
                        iaaoPrbPass = prbPass,
                    };
                })
                .OrderBy(g => g.propertyType)
                .ThenBy(g => g.qualityGrade)
                .ToList();

            return Ok(new
            {
                taxYear,
                minSales,
                totalStrata = groups.Count,
                sufficientStrata = groups.Count(g => !g.insufficientSample),
                strata = groups,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetStratifiedRatioStudy failed: taxYear={TaxYear}", taxYear);
            return StatusCode(500, new { error = "Failed to compute stratified ratio study." });
        }
    }

    // ── Driver Analysis ───────────────────────────────────────────────────────

    /// <summary>
    /// Returns median ratio deviation by physical improvement feature type.
    /// Identifies which features (basement, pool, garage, etc.) are pulling
    /// ratios above or below county median — calibration signals for the cost schedule.
    /// </summary>
    [HttpGet("ratio-study/driver-analysis")]
    public async Task<IActionResult> GetDriverAnalysis(
        [FromQuery] int taxYear = 2026,
        [FromQuery] string? propertyType = null)
    {
        _logger.LogInformation("GetDriverAnalysis: taxYear={TaxYear}", taxYear);

        var featureMap = new Dictionary<string, string>
        {
            { "BSMT",     "Basement" },
            { "POOL",     "Pool" },
            { "ATTGAR",   "Attached Garage" },
            { "CovPatio", "Covered Patio" },
            { "POLEBLDG", "Pole Building" },
            { "DETGAR",   "Detached Garage" },
            { "MA",       "Manufactured Addition" },
        };

        try
        {
            // County-wide qualified sale population (same population rule as ratio-study)
            var salesQuery = _db.ComparableSales
                .Where(cs => cs.SalesYear == taxYear
                    && cs.SaleQualification == "qualified"
                    && cs.SalePrice > 0);
            if (!string.IsNullOrEmpty(propertyType))
                salesQuery = salesQuery.Where(cs => cs.PropertyType == propertyType);

            var allSales = await salesQuery
                .Select(cs => new { cs.ParcelId, cs.SalePrice, cs.AdjustedSalePrice })
                .ToListAsync();

            var allParcelIds = allSales.Select(s => s.ParcelId).ToList();
            var allPropMap = await _db.Properties
                .Where(p => allParcelIds.Contains(p.ParcelNumber) && p.AssessedValue > 0)
                .Select(p => new { p.ParcelNumber, p.AssessedValue })
                .ToDictionaryAsync(p => p.ParcelNumber, p => p.AssessedValue);

            // Build county ratio list
            var countyRatios = allSales
                .Where(s => allPropMap.ContainsKey(s.ParcelId))
                .Select(s =>
                {
                    var sp = (double)(s.AdjustedSalePrice ?? s.SalePrice);
                    var av = (double)allPropMap[s.ParcelId]!;
                    return av / sp;
                })
                .Where(r => r > 0.1 && r < 5.0)
                .OrderBy(r => r)
                .ToList();

            double countyMedian = countyRatios.Count == 0 ? 1.0
                : countyRatios.Count % 2 == 0
                    ? (countyRatios[countyRatios.Count / 2 - 1] + countyRatios[countyRatios.Count / 2]) / 2.0
                    : countyRatios[countyRatios.Count / 2];

            // Per-feature analysis — join CamaImprovementDetails by SegmentType
            var results = new List<object>();
            foreach (var (featureCode, featureLabel) in featureMap)
            {
                var featureParcelIds = await _db.CamaImprovementDetails
                    .Where(d => d.SegmentType == featureCode
                        && d.TaxYear == taxYear
                        && allParcelIds.Contains(d.ParcelId))
                    .Select(d => d.ParcelId)
                    .Distinct()
                    .ToListAsync();

                var featureSales = allSales
                    .Where(s => featureParcelIds.Contains(s.ParcelId) && allPropMap.ContainsKey(s.ParcelId))
                    .Select(s =>
                    {
                        var sp = (double)(s.AdjustedSalePrice ?? s.SalePrice);
                        var av = (double)allPropMap[s.ParcelId]!;
                        return av / sp;
                    })
                    .Where(r => r > 0.1 && r < 5.0)
                    .OrderBy(r => r)
                    .ToList();

                double? featureMedian = null;
                double? deviation = null;
                string signal = "insufficient";

                if (featureSales.Count >= 5)
                {
                    featureMedian = featureSales.Count % 2 == 0
                        ? (featureSales[featureSales.Count / 2 - 1] + featureSales[featureSales.Count / 2]) / 2.0
                        : featureSales[featureSales.Count / 2];
                    deviation = featureMedian.Value - countyMedian;
                    signal = Math.Abs(deviation.Value) <= 0.04 ? "ok"
                        : deviation.Value > 0 ? "under"
                        : "over";
                }

                results.Add(new
                {
                    featureCode,
                    featureLabel,
                    saleCount = featureSales.Count,
                    medianRatio = featureMedian.HasValue ? Math.Round(featureMedian.Value, 4) : (double?)null,
                    deviationFromCountyMedian = deviation.HasValue ? Math.Round(deviation.Value, 4) : (double?)null,
                    signal,
                });
            }

            return Ok(new
            {
                taxYear,
                countyMedianRatio = Math.Round(countyMedian, 4),
                countyQualifiedSaleCount = countyRatios.Count,
                features = results,
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetDriverAnalysis failed: taxYear={TaxYear}", taxYear);
            return StatusCode(500, new { error = "Failed to compute driver analysis." });
        }
    }

    // ── Neighborhood Comparison Snapshots ─────────────────────────────────────

    /// <summary>
    /// Returns per-neighborhood ratio study statistics (median_ratio, COD, PRD, sale_count)
    /// for the NeighborhoodRatioStudyDashboard.
    /// Neighborhood code joined from CamaCharacteristics (same pattern as neighborhood-matrix).
    /// </summary>
    [HttpGet("comparison-snapshots")]
    public async Task<IActionResult> GetComparisonSnapshots(
        [FromQuery] int taxYear = 2026,
        [FromQuery] string? countyId = null,
        CancellationToken ct = default)
    {
        _logger.LogInformation("GetComparisonSnapshots: taxYear={TaxYear}", taxYear);

        var cutoff = taxYear - 2;

        // Step 1: pull qualified sales (SP + ParcelId)
        var sales = await _db.ComparableSales
            .AsNoTracking()
            .Where(s => s.SaleQualification == "qualified"
                     && s.SalesYear >= cutoff
                     && s.SalesYear <= taxYear
                     && s.SalePrice > 10_000)
            .Select(s => new { s.ParcelId, SalePrice = s.AdjustedSalePrice > 0 ? s.AdjustedSalePrice!.Value : s.SalePrice })
            .ToListAsync(ct);

        if (sales.Count == 0) return Ok(Array.Empty<object>());

        var parcelIds = sales.Select(s => s.ParcelId).Distinct().ToHashSet();

        // Step 2: AV from Properties (ParcelNumber = ParcelId)
        var avMap = await _db.Properties
            .AsNoTracking()
            .Where(p => parcelIds.Contains(p.ParcelNumber) && p.TaxYear == taxYear && p.AssessedValue > 0)
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToDictionaryAsync(p => p.ParcelNumber!, p => p.AssessedValue, ct);

        // Step 3: neighborhood from CamaCharacteristics
        var hoodMap = await _db.CamaCharacteristics
            .AsNoTracking()
            .Where(c => parcelIds.Contains(c.ParcelId) && c.NeighborhoodCode != null && c.NeighborhoodCode != "")
            .Select(c => new { c.ParcelId, c.NeighborhoodCode })
            .ToDictionaryAsync(c => c.ParcelId, c => c.NeighborhoodCode!, ct);

        // Step 4: group by neighborhood and compute IAAO stats
        var byHood = new Dictionary<string, List<(decimal AV, decimal SP)>>();
        foreach (var s in sales)
        {
            if (s.ParcelId == null) continue;
            if (!avMap.TryGetValue(s.ParcelId, out var av)) continue;
            if (!hoodMap.TryGetValue(s.ParcelId, out var hood)) continue;
            var ratio = av / s.SalePrice;
            if (ratio < 0.5m || ratio > 2.0m) continue;
            if (!byHood.ContainsKey(hood)) byHood[hood] = new();
            byHood[hood].Add((av, s.SalePrice));
        }

        var snapshots = byHood
            .Where(kv => kv.Value.Count >= 5)
            .Select(kv =>
            {
                var ratios = kv.Value.Select(p => p.AV / p.SP).ToList();
                var avs    = kv.Value.Select(p => p.AV).ToList();
                var parcelCount = kv.Value.Count; // using sale count as proxy
                return new
                {
                    neighborhood_code = kv.Key,
                    parcel_count = parcelCount,
                    median_ratio = Math.Round((double)TrendStats.Median(ratios), 3),
                    cod = Math.Round((double)TrendStats.ComputeCod(ratios), 1),
                    prd = Math.Round((double)TrendStats.ComputePrd(ratios, avs), 3),
                    sale_count = kv.Value.Count,
                };
            })
            .OrderByDescending(x => x.sale_count)
            .ToList();

        _logger.LogInformation("GetComparisonSnapshots: {Count} neighborhoods returned", snapshots.Count);
        return Ok(snapshots);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /// <summary>
    /// Returns ParcelNumber → AssessedValue from the Properties table for the given tax year.
    /// Properties.ParcelNumber matches ComparableSales.ParcelId directly.
    /// </summary>
    private async Task<Dictionary<string, decimal>> GetAssessedValueMapAsync(
        IEnumerable<string?> parcelNumbers, int taxYear, CancellationToken ct)
    {
        var ids = parcelNumbers.Where(id => id != null).Distinct().Cast<string>().ToHashSet();
        if (ids.Count == 0) return new Dictionary<string, decimal>();

        var rows = await _db.Properties
            .AsNoTracking()
            .Where(p => ids.Contains(p.ParcelNumber) && p.TaxYear == taxYear && p.AssessedValue > 0)
            .Select(p => new { p.ParcelNumber, p.AssessedValue })
            .ToListAsync(ct);

        return rows.ToDictionary(p => p.ParcelNumber, p => p.AssessedValue);
    }

    /// <summary>
    /// Returns ParcelNumber → neighborhood string.
    /// Neighborhood data is not currently synced — returns empty map (UI shows data gap alert).
    /// </summary>
    private Task<Dictionary<string, string>> GetNeighborhoodMapAsync(
        IEnumerable<string?> parcelNumbers, int taxYear, CancellationToken ct)
    {
        return Task.FromResult(new Dictionary<string, string>());
    }
}

/// <summary>
/// Shared IAAO stat helpers used by TerraForge trend and snapshot endpoints.
/// </summary>
internal static class TrendStats
{
    internal static decimal Median(List<decimal> values)
    {
        if (values.Count == 0) return 0m;
        var s = values.Order().ToList();
        return s.Count % 2 == 1
            ? s[s.Count / 2]
            : (s[s.Count / 2 - 1] + s[s.Count / 2]) / 2m;
    }

    internal static decimal ComputeCod(List<decimal> ratios)
    {
        if (ratios.Count < 3) return 0m;
        var sorted = ratios.Order().ToList();
        var q1 = sorted[(int)(sorted.Count * 0.25)];
        var q3 = sorted[(int)(sorted.Count * 0.75)];
        var iqr = q3 - q1;
        var lo = q1 - 1.5m * iqr;
        var hi = q3 + 1.5m * iqr;
        var trimmed = sorted.Where(r => r >= lo && r <= hi).ToList();
        if (trimmed.Count < 3) trimmed = sorted;
        var med = Median(trimmed);
        if (med == 0) return 0m;
        var mad = trimmed.Average(r => Math.Abs(r - med));
        return (mad / med) * 100m;
    }

    internal static decimal ComputePrd(List<decimal> ratios, List<decimal> avs)
    {
        if (ratios.Count == 0) return 1m;
        var mean = ratios.Average();
        var totalAv = avs.Sum();
        if (totalAv == 0) return 1m;
        var totalSp = ratios.Zip(avs, (r, av) => r > 0 ? av / r : 0m).Sum();
        if (totalSp == 0) return 1m;
        var weightedMean = totalAv / totalSp;
        return weightedMean == 0 ? 1m : mean / weightedMean;
    }
}

/// <summary>
/// PATCH body for sale qualification decisions.
/// Uses property-based (non-positional) form so System.Text.Json can handle
/// partial JSON where optional fields are omitted.
/// </summary>
public sealed class SaleQualificationPatchDto
{
    public string  QualificationDecision { get; init; } = string.Empty;
    public string? ResearchNotes         { get; init; }
    public string? DecidedBy             { get; init; }
    public string? DecisionSource        { get; init; }
}

/// <summary>PATCH body for bulk sale qualification decisions.</summary>
public sealed class BulkSaleQualificationPatchDto
{
    public Guid[]  SaleIds               { get; init; } = Array.Empty<Guid>();
    public string  QualificationDecision { get; init; } = string.Empty;
    public string? ResearchNotes         { get; init; }
    public string? DecidedBy             { get; init; }
    public string? DecisionSource        { get; init; }
}
