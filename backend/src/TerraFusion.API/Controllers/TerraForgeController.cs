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

    private static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");

    public TerraForgeController(
        TerraFusionDbContext db,
        ILogger<TerraForgeController> logger,
        IOlsRegressionService ols)
    {
        _db     = db;
        _logger = logger;
        _ols    = ols;
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

        // IAAO ratio study statistics with IQR outlier trimming.
        // Per IAAO Standard on Ratio Studies §5.1.3, outliers are identified using
        // Tukey's fence method: [Q1 - 1.5*IQR, Q3 + 1.5*IQR].
        // Statistics are computed on the trimmed population; all rows still appear
        // in the paginated detail so staff can review and act on anomalous ratios.
        double? medianRatio = null, meanRatio = null, cod = null, prd = null;
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

                // PRD = mean ratio / weighted mean ratio   where weighted = Σassessed / Σsale_price
                var sumAssessed  = trimmedRatioRows.Sum(r => (double)r.assessedVal);
                var sumSalePrice = trimmedRatioRows.Sum(r => (double)r.salePrice);
                if (sumSalePrice > 0 && meanRatio > 0)
                    prd = meanRatio.Value / (sumAssessed / sumSalePrice);
            }
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
            "trimmed={Trimmed} median={Median:F4} mean={Mean:F4} COD={COD:F2} PRD={PRD:F4}",
            taxYear, hood ?? "all", total, countWithRatio,
            trimmedCount, medianRatio, meanRatio, cod, prd);

        return Ok(new
        {
            taxYear,
            total,
            countWithRatio,
            outliersExcluded = trimmedCount,
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
