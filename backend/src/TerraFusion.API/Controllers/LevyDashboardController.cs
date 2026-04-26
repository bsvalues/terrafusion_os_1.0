using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-021: Levy operations dashboard.
/// Provides live summary views and district-level levy rows sourced from the
/// native TerraLevy tables.
/// </summary>
[ApiController]
[Route("api/levy/dashboard")]
[Authorize]
public sealed class LevyDashboardController : ControllerBase
{
    private readonly ILogger<LevyDashboardController> _logger;
    private readonly LevyDbContext _db;

    public LevyDashboardController(
        ILogger<LevyDashboardController> logger,
        LevyDbContext db)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _db = db ?? throw new ArgumentNullException(nameof(db));
    }

    public sealed record DashboardBudgetSummaryEnvelope(
        int TaxYear,
        string Source,
        bool SpecialistGated,
        string SpecialistGateNote,
        IReadOnlyList<object> Categories,
        int Count);

    public sealed record DashboardDistrictOverviewDto(
        string DistrictId,
        string DistrictCode,
        string DistrictName,
        string DistrictType,
        Guid LevyMeasureId,
        string LevyMeasureName,
        decimal Rate,
        decimal AssessedValue,
        decimal LevyAmount,
        decimal? AiOptimalRate,
        decimal? ConfidenceScore,
        DateTime EffectiveDate,
        DateTime? ExpirationDate,
        string CertificationStatus,
        bool IsCertified,
        int ParcelCount,
        decimal TotalAssessedValue,
        decimal StatutoryLimit,
        decimal UtilizationPct,
        decimal PriorYearRate,
        decimal YoyDelta,
        string CountyId);

    private static decimal ResolveStatutoryLimit(string? districtType)
    {
        var normalized = districtType?.Trim().ToLowerInvariant() ?? string.Empty;

        return normalized switch
        {
            "county" or "county-regular" => 3.60m,
            "county-roads" or "road" or "road district" => 2.25m,
            "city" or "town" => 3.375m,
            "school" or "school district" or "state-school" => 5.90m,
            "fire" or "fire district" => 1.50m,
            "library" or "library district" => 0.50m,
            "hospital" or "hospital district" => 0.75m,
            _ => 10.00m,
        };
    }

    private static IQueryable<LevyRate> ApplyCountyFilter(
        IQueryable<LevyRate> query,
        string? countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            return query;
        }

        var normalized = countyId.Trim();
        return query.Where(rate => rate.CountyId == normalized);
    }

    private static IQueryable<LevyCertification> ApplyCountyFilter(
        IQueryable<LevyCertification> query,
        string? countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            return query;
        }

        var normalized = countyId.Trim();
        return query.Where(certification => certification.CountyId == normalized);
    }

    private static IQueryable<LevyMeasure> ApplyCountyFilter(
        IQueryable<LevyMeasure> query,
        string? countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            return query;
        }

        var normalized = countyId.Trim();
        return query.Where(measure => measure.CountyId == normalized);
    }

    private async Task<int> ResolveEffectiveTaxYearAsync(int? requestedYear, string? countyId, CancellationToken cancellationToken)
    {
        if (requestedYear.HasValue)
        {
            return requestedYear.Value;
        }

        var latestRateYear = await ApplyCountyFilter(_db.LevyRates.AsNoTracking(), countyId)
            .Select(rate => (int?)rate.EffectiveDate.Year)
            .MaxAsync(cancellationToken);

        var latestCertificationYear = await ApplyCountyFilter(_db.LevyCertifications.AsNoTracking(), countyId)
            .Select(certification => (int?)certification.TaxYear)
            .MaxAsync(cancellationToken);

        var latestMeasureYear = await ApplyCountyFilter(_db.LevyMeasures.AsNoTracking(), countyId)
            .Select(measure => (int?)measure.LevyYear)
            .MaxAsync(cancellationToken);

        return new[] { latestRateYear, latestCertificationYear, latestMeasureYear }
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .DefaultIfEmpty(DateTime.UtcNow.Year)
            .Max();
    }

    /// <summary>
    /// Retrieve the levy dashboard budget summary surface.
    /// Honesty note: TerraLevy has scenario/projection rows, but not a certified
    /// budget-category mapping. Return an explicit gated envelope instead of a
    /// fabricated budget rollup.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("summary")]
    [ProducesResponseType(typeof(DashboardBudgetSummaryEnvelope), StatusCodes.Status200OK)]
    public async Task<IActionResult> Summary(
        [FromQuery] int? year,
        [FromQuery] string? countyId,
        CancellationToken cancellationToken)
    {
        var effectiveYear = await ResolveEffectiveTaxYearAsync(year, countyId, cancellationToken);
        var hasScenarioRows = await ApplyCountyFilter(_db.LevyMeasures.AsNoTracking(), countyId)
            .Where(measure => measure.LevyYear == effectiveYear)
            .Join(
                _db.LevyScenarios.AsNoTracking(),
                measure => measure.Id,
                scenario => scenario.LevyMeasureId,
                (_, _) => 1)
            .AnyAsync(cancellationToken);

        _logger.LogInformation(
            "LEV-021: Dashboard summary requested for taxYear={TaxYear}, county={CountyId}, hasScenarioRows={HasScenarioRows}",
            effectiveYear,
            countyId ?? "<all>",
            hasScenarioRows);

        return Ok(new DashboardBudgetSummaryEnvelope(
            TaxYear: effectiveYear,
            Source: "LevyScenarios + RevenueProjections",
            SpecialistGated: true,
            SpecialistGateNote: hasScenarioRows
                ? "Live levy scenarios exist for this tax year, but TerraLevy does not yet have a certified budget-category mapping. Use /api/levy/budget/scenarios and /api/levy/budget/visualization for the native scenario surfaces."
                : "No levy scenarios were found for the requested tax year, so no budget-category summary can be derived.",
            Categories: Array.Empty<object>(),
            Count: 0));
    }

    /// <summary>
    /// Retrieve key levy metrics (totals, averages, certification coverage).
    /// </summary>
    [AllowAnonymous]
    [HttpGet("metrics")]
    public async Task<IActionResult> Metrics(
        [FromQuery] int? year,
        [FromQuery] string? countyId,
        CancellationToken cancellationToken)
    {
        var effectiveYear = await ResolveEffectiveTaxYearAsync(year, countyId, cancellationToken);

        var rateRows = await ApplyCountyFilter(_db.LevyRates.AsNoTracking(), countyId)
            .Include(rate => rate.District)
            .Where(rate => rate.EffectiveDate.Year == effectiveYear && rate.ExpirationDate == null)
            .ToListAsync(cancellationToken);

        var certifications = await ApplyCountyFilter(_db.LevyCertifications.AsNoTracking(), countyId)
            .Where(certification => certification.TaxYear == effectiveYear)
            .ToListAsync(cancellationToken);

        var certifiedDistrictCodes = certifications
            .Where(certification => certification.Status == LevyCertificationStatus.Certified)
            .Select(certification => certification.DistrictCode)
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var totalLevies = rateRows.Count;
        var certifiedLevyCount = rateRows.Count(rate =>
            !string.IsNullOrWhiteSpace(rate.District?.DistrictCode) &&
            certifiedDistrictCodes.Contains(rate.District!.DistrictCode));

        _logger.LogInformation(
            "LEV-021: Dashboard metrics requested for taxYear={TaxYear}, county={CountyId}, levyRows={LevyRows}",
            effectiveYear,
            countyId ?? "<all>",
            totalLevies);

        return Ok(new
        {
            taxYear = effectiveYear,
            totalLevies,
            totalLevyAmount = totalLevies > 0 ? rateRows.Sum(rate => rate.LevyAmount) : 0m,
            averageLevyRate = totalLevies > 0 ? rateRows.Average(rate => rate.Rate) : 0m,
            certifiedRate = totalLevies > 0
                ? Math.Round((decimal)certifiedLevyCount / totalLevies * 100m, 2)
                : 0m,
            source = "LevyRates + LevyCertifications",
            countyId,
        });
    }

    /// <summary>
    /// Retrieve an overview of all tax districts and their current levy rows.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("districts-overview")]
    public async Task<IActionResult> DistrictsOverview(
        [FromQuery] int? year,
        [FromQuery] string? countyId,
        CancellationToken cancellationToken)
    {
        var effectiveYear = await ResolveEffectiveTaxYearAsync(year, countyId, cancellationToken);
        var priorYear = effectiveYear - 1;

        var currentRates = await ApplyCountyFilter(_db.LevyRates.AsNoTracking(), countyId)
            .Include(rate => rate.District)
            .Include(rate => rate.LevyMeasure)
            .Where(rate => rate.EffectiveDate.Year == effectiveYear && rate.ExpirationDate == null)
            .OrderByDescending(rate => rate.EffectiveDate)
            .ThenByDescending(rate => rate.LevyAmount)
            .ToListAsync(cancellationToken);

        var priorRates = await ApplyCountyFilter(_db.LevyRates.AsNoTracking(), countyId)
            .Include(rate => rate.District)
            .Where(rate => rate.EffectiveDate.Year == priorYear && rate.ExpirationDate == null)
            .ToListAsync(cancellationToken);

        var priorRateByDistrictCode = priorRates
            .Where(rate => !string.IsNullOrWhiteSpace(rate.District?.DistrictCode))
            .GroupBy(rate => rate.District!.DistrictCode, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(rate => rate.EffectiveDate).First(),
                StringComparer.OrdinalIgnoreCase);

        var certificationByDistrictCode = (await ApplyCountyFilter(_db.LevyCertifications.AsNoTracking(), countyId)
                .Where(certification => certification.TaxYear == effectiveYear)
                .ToListAsync(cancellationToken))
            .Where(certification => !string.IsNullOrWhiteSpace(certification.DistrictCode))
            .GroupBy(certification => certification.DistrictCode, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(certification => certification.CreatedAt).First(),
                StringComparer.OrdinalIgnoreCase);

        var districts = currentRates.Select(rate =>
        {
            var districtCode = rate.District?.DistrictCode ?? rate.DistrictId?.ToString() ?? "unassigned";
            certificationByDistrictCode.TryGetValue(districtCode, out var certification);
            priorRateByDistrictCode.TryGetValue(districtCode, out var priorRate);

            var statutoryLimit = ResolveStatutoryLimit(rate.District?.DistrictType);
            var utilizationPct = statutoryLimit > 0m
                ? Math.Round(rate.Rate / statutoryLimit * 100m, 2)
                : 0m;
            var priorYearRate = priorRate?.Rate ?? 0m;
            var yoyDelta = priorYearRate > 0m
                ? Math.Round((rate.Rate - priorYearRate) / priorYearRate * 100m, 2)
                : 0m;

            return new DashboardDistrictOverviewDto(
                DistrictId: rate.DistrictId?.ToString() ?? districtCode,
                DistrictCode: districtCode,
                DistrictName: rate.District?.Name ?? districtCode,
                DistrictType: rate.District?.DistrictType ?? "unknown",
                LevyMeasureId: rate.LevyMeasureId,
                LevyMeasureName: rate.LevyMeasure?.Name ?? "Unlabeled Levy Measure",
                Rate: rate.Rate,
                AssessedValue: rate.AssessedValue,
                LevyAmount: rate.LevyAmount,
                AiOptimalRate: rate.AiOptimalRate,
                ConfidenceScore: rate.ConfidenceScore,
                EffectiveDate: rate.EffectiveDate,
                ExpirationDate: rate.ExpirationDate,
                CertificationStatus: certification?.Status.ToString() ?? "Uncertified",
                IsCertified: certification?.Status == LevyCertificationStatus.Certified,
                ParcelCount: rate.District?.ParcelCount ?? 0,
                TotalAssessedValue: rate.District?.TotalAssessedValue ?? rate.AssessedValue,
                StatutoryLimit: statutoryLimit,
                UtilizationPct: utilizationPct,
                PriorYearRate: priorYearRate,
                YoyDelta: yoyDelta,
                CountyId: rate.CountyId);
        }).ToList();

        _logger.LogInformation(
            "LEV-021: District overview requested for taxYear={TaxYear}, county={CountyId}, districts={DistrictCount}",
            effectiveYear,
            countyId ?? "<all>",
            districts.Count);

        return Ok(new
        {
            taxYear = effectiveYear,
            source = "LevyRates + Districts + LevyMeasures + LevyCertifications",
            generatedAt = DateTime.UtcNow,
            districts,
        });
    }
}
