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

        // Always look up TF canonical assessed values from Properties.
        var allParcelIds = salesData.Select(s => s.ParcelId).Distinct().ToHashSet();
        Dictionary<string, decimal> assessedByParcel = new();
        if (allParcelIds.Count > 0)
        {
            assessedByParcel = (await _db.Properties
                .Where(p => allParcelIds.Contains(p.ParcelNumber) && p.AssessedValue > 0)
                .Select(p => new { p.ParcelNumber, p.AssessedValue })
                .ToListAsync(ct))
                .ToDictionary(p => p.ParcelNumber, p => p.AssessedValue);
        }

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

        // Look up TF canonical assessed values for all page items.
        var pageParcelIds = rawItems.Select(i => i.parcelId).Distinct().ToHashSet();
        Dictionary<string, decimal> pageAssessed = new();
        if (pageParcelIds.Count > 0)
        {
            pageAssessed = (await _db.Properties
                .Where(p => pageParcelIds.Contains(p.ParcelNumber) && p.AssessedValue > 0)
                .Select(p => new { p.ParcelNumber, p.AssessedValue })
                .ToListAsync(ct))
                .ToDictionary(p => p.ParcelNumber, p => p.AssessedValue);
        }

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
