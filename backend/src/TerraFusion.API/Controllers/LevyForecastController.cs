using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-008: Levy revenue forecasting and scenario modeling.
/// Exposes persisted scenario and projection data from the TerraLevy schema.
/// Write-side forecast generation remains governed unavailable until a
/// persisted request contract and evidence path exist.
/// </summary>
[ApiController]
[Route("api/levy/forecast")]
[Authorize]
public sealed class LevyForecastController : ControllerBase
{
    private readonly LevyDbContext _db;
    private readonly ILogger<LevyForecastController> _logger;

    public LevyForecastController(
        LevyDbContext db,
        ILogger<LevyForecastController> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public sealed record ForecastProjectionDto(
        Guid ScenarioId,
        string ScenarioName,
        string ScenarioType,
        int FiscalYear,
        decimal ProjectedAssessedValue,
        decimal ProjectedLevyAmount,
        decimal ProjectedCollectionRate,
        decimal ProjectedNetRevenue,
        decimal GrowthRate,
        decimal? ConfidenceLevel);

    public sealed record DistrictForecastMeasureDto(
        Guid LevyMeasureId,
        string LevyMeasureName,
        string LevyType,
        int LevyYear,
        decimal? CurrentRate,
        decimal? CurrentLevyAmount,
        int ScenarioCount,
        int ProjectionCount);

    public sealed record DistrictForecastEnvelope(
        int TaxYear,
        string Source,
        DateTime GeneratedAt,
        Guid DistrictId,
        string DistrictCode,
        string DistrictName,
        string DistrictType,
        int MeasureCount,
        int ScenarioCount,
        int ProjectionCount,
        decimal? CurrentRate,
        decimal? CurrentLevyAmount,
        decimal TotalProjectedNetRevenue,
        IReadOnlyList<DistrictForecastMeasureDto> Measures,
        IReadOnlyList<ForecastProjectionDto> Projections);

    public sealed record ForecastDashboardDistrictDto(
        Guid DistrictId,
        string DistrictCode,
        string DistrictName,
        string DistrictType,
        decimal CurrentRate,
        decimal CurrentLevyAmount,
        decimal ProjectedNetRevenue,
        decimal AverageGrowthRate,
        int ScenarioCount);

    public sealed record ForecastDashboardEnvelope(
        int TaxYear,
        string Source,
        DateTime GeneratedAt,
        int DistrictCount,
        int ScenarioCount,
        int ProjectionCount,
        decimal TotalProjectedNetRevenue,
        decimal AverageGrowthRate,
        IReadOnlyList<int> FiscalYears,
        IReadOnlyList<ForecastDashboardDistrictDto> TopDistricts);

    public sealed record ForecastComparisonItem(
        string GroupType,
        string GroupKey,
        string Label,
        int TaxYear,
        int ScenarioCount,
        int ProjectionCount,
        decimal CurrentLevyAmount,
        decimal CurrentRate,
        decimal TotalProjectedNetRevenue,
        decimal AverageGrowthRate,
        IReadOnlyList<int> FiscalYears);

    private static IQueryable<LevyScenario> ApplyCountyFilter(
        IQueryable<LevyScenario> query,
        string? countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            return query;
        }

        var normalized = countyId.Trim();
        return query.Where(scenario => scenario.CountyId == normalized);
    }

    private static IQueryable<RevenueProjection> ApplyCountyFilter(
        IQueryable<RevenueProjection> query,
        string? countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            return query;
        }

        var normalized = countyId.Trim();
        return query.Where(projection => projection.CountyId == normalized);
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

    private static IQueryable<District> ApplyCountyFilter(
        IQueryable<District> query,
        string? countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            return query;
        }

        var normalized = countyId.Trim();
        return query.Where(district => district.CountyId == normalized);
    }

    private async Task<int> ResolveEffectiveTaxYearAsync(int? requestedYear, string? countyId, CancellationToken cancellationToken)
    {
        if (requestedYear.HasValue)
        {
            return requestedYear.Value;
        }

        var latestProjectionYear = await ApplyCountyFilter(_db.RevenueProjections.AsNoTracking(), countyId)
            .Select(projection => (int?)projection.FiscalYear)
            .MaxAsync(cancellationToken);

        var latestScenarioYear = await ApplyCountyFilter(_db.LevyScenarios.AsNoTracking(), countyId)
            .Select(scenario => (int?)scenario.LevyMeasure.LevyYear)
            .MaxAsync(cancellationToken);

        var latestRateYear = await ApplyCountyFilter(_db.LevyRates.AsNoTracking(), countyId)
            .Select(rate => (int?)rate.EffectiveDate.Year)
            .MaxAsync(cancellationToken);

        return new[] { latestProjectionYear, latestScenarioYear, latestRateYear }
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .DefaultIfEmpty(DateTime.UtcNow.Year)
            .Max();
    }

    private async Task<Dictionary<Guid, decimal>> LoadCurrentRateByMeasureAsync(
        int effectiveYear,
        string? countyId,
        Guid? districtId,
        CancellationToken cancellationToken)
    {
        var rateQuery = ApplyCountyFilter(_db.LevyRates.AsNoTracking(), countyId)
            .Where(rate => rate.EffectiveDate.Year == effectiveYear && rate.ExpirationDate == null);

        if (districtId.HasValue)
        {
            rateQuery = rateQuery.Where(rate => rate.DistrictId == districtId.Value);
        }

        var rates = await rateQuery
            .OrderByDescending(rate => rate.EffectiveDate)
            .ToListAsync(cancellationToken);

        return rates
            .GroupBy(rate => rate.LevyMeasureId)
            .ToDictionary(
                group => group.Key,
                group => group.First().Rate);
    }

    private async Task<Dictionary<Guid, decimal>> LoadCurrentLevyByMeasureAsync(
        int effectiveYear,
        string? countyId,
        Guid? districtId,
        CancellationToken cancellationToken)
    {
        var rateQuery = ApplyCountyFilter(_db.LevyRates.AsNoTracking(), countyId)
            .Where(rate => rate.EffectiveDate.Year == effectiveYear && rate.ExpirationDate == null);

        if (districtId.HasValue)
        {
            rateQuery = rateQuery.Where(rate => rate.DistrictId == districtId.Value);
        }

        var rates = await rateQuery
            .OrderByDescending(rate => rate.EffectiveDate)
            .ToListAsync(cancellationToken);

        return rates
            .GroupBy(rate => rate.LevyMeasureId)
            .ToDictionary(
                group => group.Key,
                group => group.First().LevyAmount);
    }

    /// <summary>
    /// Generate a levy revenue forecast from a request body.
    /// Persisted scenarios must exist before this surface can accept writes.
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(StatusCodes.Status501NotImplemented)]
    public IActionResult Generate([FromBody] object request)
    {
        _logger.LogInformation("LEV-008: Forecast generation requested but no governed write contract exists.");
        return StatusCode(StatusCodes.Status501NotImplemented, new
        {
            success = false,
            error = "forecast_generation_contract_unavailable",
            message = "Forecast generation write operations are not exposed until a persisted request contract, evidence path, and containment flow are implemented.",
            useInstead = new[]
            {
                "GET /api/levy/forecast/dashboard",
                "GET /api/levy/forecast/district/{id}",
                "GET /api/levy/forecast/compare",
                "GET /api/levy/budget/scenarios",
                "GET /api/levy/budget/visualization",
            },
        });
    }

    /// <summary>
    /// Retrieve the current forecast for a specific district.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("district/{id}")]
    [ProducesResponseType(typeof(DistrictForecastEnvelope), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByDistrict(
        string id,
        [FromQuery] int? year,
        [FromQuery] string? countyId,
        CancellationToken cancellationToken)
    {
        var districtQuery = ApplyCountyFilter(_db.Districts.AsNoTracking(), countyId);
        District? district;

        if (Guid.TryParse(id, out var districtGuid))
        {
            district = await districtQuery.FirstOrDefaultAsync(
                row => row.Id == districtGuid || row.DistrictCode == id,
                cancellationToken);
        }
        else
        {
            district = await districtQuery.FirstOrDefaultAsync(
                row => row.DistrictCode == id,
                cancellationToken);
        }

        if (district is null)
        {
            return NotFound(new
            {
                error = "district_not_found",
                message = "No levy district matched the requested id or district code.",
                districtId = id,
            });
        }

        var effectiveYear = await ResolveEffectiveTaxYearAsync(year, district.CountyId, cancellationToken);

        var rateRows = await ApplyCountyFilter(_db.LevyRates.AsNoTracking(), district.CountyId)
            .Where(rate =>
                rate.DistrictId == district.Id &&
                rate.EffectiveDate.Year == effectiveYear &&
                rate.ExpirationDate == null)
            .Include(rate => rate.LevyMeasure)
            .OrderByDescending(rate => rate.EffectiveDate)
            .ToListAsync(cancellationToken);

        var measureIds = rateRows
            .Select(rate => rate.LevyMeasureId)
            .Distinct()
            .ToList();

        var scenarios = measureIds.Count == 0
            ? new List<LevyScenario>()
            : await ApplyCountyFilter(_db.LevyScenarios.AsNoTracking(), district.CountyId)
                .Include(scenario => scenario.LevyMeasure)
                .Where(scenario => measureIds.Contains(scenario.LevyMeasureId))
                .OrderByDescending(scenario => scenario.IsActive)
                .ThenByDescending(scenario => scenario.CreatedAt)
                .ToListAsync(cancellationToken);

        var scenarioIds = scenarios.Select(scenario => scenario.Id).ToList();

        var projections = scenarioIds.Count == 0
            ? new List<RevenueProjection>()
            : await ApplyCountyFilter(_db.RevenueProjections.AsNoTracking(), district.CountyId)
                .Include(projection => projection.LevyScenario)
                .Where(projection => scenarioIds.Contains(projection.LevyScenarioId))
                .OrderBy(projection => projection.FiscalYear)
                .ThenByDescending(projection => projection.ProjectedNetRevenue)
                .ToListAsync(cancellationToken);

        var projectionDtos = projections.Select(projection => new ForecastProjectionDto(
            ScenarioId: projection.LevyScenarioId,
            ScenarioName: projection.LevyScenario?.Name ?? projection.LevyScenarioId.ToString(),
            ScenarioType: projection.LevyScenario?.ScenarioType ?? "Unknown",
            FiscalYear: projection.FiscalYear,
            ProjectedAssessedValue: projection.ProjectedAssessedValue,
            ProjectedLevyAmount: projection.ProjectedLevyAmount,
            ProjectedCollectionRate: projection.ProjectedCollectionRate,
            ProjectedNetRevenue: projection.ProjectedNetRevenue,
            GrowthRate: projection.GrowthRate,
            ConfidenceLevel: projection.ConfidenceLevel)).ToList();

        var scenarioCountByMeasure = scenarios
            .GroupBy(scenario => scenario.LevyMeasureId)
            .ToDictionary(group => group.Key, group => group.Count());

        var projectionCountByMeasure = projections
            .GroupBy(projection => projection.LevyScenario.LevyMeasureId)
            .ToDictionary(group => group.Key, group => group.Count());

        var measureDtos = rateRows
            .GroupBy(rate => rate.LevyMeasureId)
            .Select(group =>
            {
                var latest = group.OrderByDescending(rate => rate.EffectiveDate).First();
                var measure = latest.LevyMeasure;
                return new DistrictForecastMeasureDto(
                    LevyMeasureId: latest.LevyMeasureId,
                    LevyMeasureName: measure?.Name ?? latest.LevyMeasureId.ToString(),
                    LevyType: measure?.LevyType ?? "Unknown",
                    LevyYear: measure?.LevyYear ?? effectiveYear,
                    CurrentRate: latest.Rate,
                    CurrentLevyAmount: latest.LevyAmount,
                    ScenarioCount: scenarioCountByMeasure.GetValueOrDefault(latest.LevyMeasureId, 0),
                    ProjectionCount: projectionCountByMeasure.GetValueOrDefault(latest.LevyMeasureId, 0));
            })
            .OrderByDescending(item => item.CurrentLevyAmount ?? 0m)
            .ToList();

        _logger.LogInformation(
            "LEV-008: District forecast requested for district={DistrictCode}, taxYear={TaxYear}, measures={MeasureCount}, projections={ProjectionCount}",
            district.DistrictCode,
            effectiveYear,
            measureDtos.Count,
            projectionDtos.Count);

        return Ok(new DistrictForecastEnvelope(
            TaxYear: effectiveYear,
            Source: "Districts + LevyRates + LevyScenarios + RevenueProjections",
            GeneratedAt: DateTime.UtcNow,
            DistrictId: district.Id,
            DistrictCode: district.DistrictCode,
            DistrictName: district.Name,
            DistrictType: district.DistrictType,
            MeasureCount: measureDtos.Count,
            ScenarioCount: scenarios.Count,
            ProjectionCount: projectionDtos.Count,
            CurrentRate: rateRows.Count > 0 ? rateRows.Max(rate => rate.Rate) : (decimal?)null,
            CurrentLevyAmount: rateRows.Count > 0 ? rateRows.Sum(rate => rate.LevyAmount) : (decimal?)null,
            TotalProjectedNetRevenue: projectionDtos.Sum(item => item.ProjectedNetRevenue),
            Measures: measureDtos,
            Projections: projectionDtos));
    }

    /// <summary>
    /// Retrieve the forecast dashboard summary across all districts.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ForecastDashboardEnvelope), StatusCodes.Status200OK)]
    public async Task<IActionResult> Dashboard(
        [FromQuery] int? year,
        [FromQuery] string? countyId,
        CancellationToken cancellationToken)
    {
        var effectiveYear = await ResolveEffectiveTaxYearAsync(year, countyId, cancellationToken);

        var rateRows = await ApplyCountyFilter(_db.LevyRates.AsNoTracking(), countyId)
            .Where(rate => rate.EffectiveDate.Year == effectiveYear && rate.ExpirationDate == null && rate.DistrictId != null)
            .Include(rate => rate.District)
            .Include(rate => rate.LevyMeasure)
            .OrderByDescending(rate => rate.LevyAmount)
            .ToListAsync(cancellationToken);

        var scenarios = await ApplyCountyFilter(_db.LevyScenarios.AsNoTracking(), countyId)
            .Include(scenario => scenario.LevyMeasure)
            .Where(scenario => scenario.LevyMeasure.LevyYear == effectiveYear)
            .OrderByDescending(scenario => scenario.IsActive)
            .ThenByDescending(scenario => scenario.CreatedAt)
            .ToListAsync(cancellationToken);

        var scenarioIds = scenarios.Select(scenario => scenario.Id).ToList();
        var projections = scenarioIds.Count == 0
            ? new List<RevenueProjection>()
            : await ApplyCountyFilter(_db.RevenueProjections.AsNoTracking(), countyId)
                .Include(projection => projection.LevyScenario)
                .Where(projection => scenarioIds.Contains(projection.LevyScenarioId))
                .OrderBy(projection => projection.FiscalYear)
                .ThenByDescending(projection => projection.ProjectedNetRevenue)
                .ToListAsync(cancellationToken);

        var projectionsByMeasure = projections
            .GroupBy(projection => projection.LevyScenario.LevyMeasureId)
            .ToDictionary(group => group.Key, group => group.ToList());

        var scenarioCountByMeasure = scenarios
            .GroupBy(scenario => scenario.LevyMeasureId)
            .ToDictionary(group => group.Key, group => group.Count());

        var topDistricts = rateRows
            .GroupBy(rate => rate.DistrictId!.Value)
            .Select(group =>
            {
                var latest = group.OrderByDescending(rate => rate.EffectiveDate).First();
                var groupProjections = group
                    .SelectMany(rate => projectionsByMeasure.GetValueOrDefault(rate.LevyMeasureId, new List<RevenueProjection>()))
                    .ToList();

                return new ForecastDashboardDistrictDto(
                    DistrictId: latest.DistrictId!.Value,
                    DistrictCode: latest.District?.DistrictCode ?? latest.DistrictId!.Value.ToString(),
                    DistrictName: latest.District?.Name ?? latest.DistrictId!.Value.ToString(),
                    DistrictType: latest.District?.DistrictType ?? "Unknown",
                    CurrentRate: group.Sum(rate => rate.Rate),
                    CurrentLevyAmount: group.Sum(rate => rate.LevyAmount),
                    ProjectedNetRevenue: groupProjections.Sum(projection => projection.ProjectedNetRevenue),
                    AverageGrowthRate: groupProjections.Count > 0 ? Math.Round(groupProjections.Average(projection => projection.GrowthRate), 4) : 0m,
                    ScenarioCount: group.Select(rate => rate.LevyMeasureId).Distinct().Sum(measureId => scenarioCountByMeasure.GetValueOrDefault(measureId, 0)));
            })
            .OrderByDescending(item => item.ProjectedNetRevenue)
            .Take(10)
            .ToList();

        _logger.LogInformation(
            "LEV-008: Forecast dashboard requested for taxYear={TaxYear}, county={CountyId}, districts={DistrictCount}, projections={ProjectionCount}",
            effectiveYear,
            countyId ?? "<all>",
            topDistricts.Count,
            projections.Count);

        return Ok(new ForecastDashboardEnvelope(
            TaxYear: effectiveYear,
            Source: "Districts + LevyRates + LevyScenarios + RevenueProjections",
            GeneratedAt: DateTime.UtcNow,
            DistrictCount: rateRows
                .Where(rate => rate.DistrictId.HasValue)
                .Select(rate => rate.DistrictId!.Value)
                .Distinct()
                .Count(),
            ScenarioCount: scenarios.Count,
            ProjectionCount: projections.Count,
            TotalProjectedNetRevenue: projections.Sum(projection => projection.ProjectedNetRevenue),
            AverageGrowthRate: projections.Count > 0 ? Math.Round(projections.Average(projection => projection.GrowthRate), 4) : 0m,
            FiscalYears: projections.Select(projection => projection.FiscalYear).Distinct().OrderBy(value => value).ToList(),
            TopDistricts: topDistricts));
    }

    /// <summary>
    /// Compare forecasts across multiple districts or scenarios.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("compare")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Compare(
        [FromQuery] string? districtIds,
        [FromQuery] string? scenarioIds,
        [FromQuery] int? year,
        [FromQuery] string? countyId,
        CancellationToken cancellationToken)
    {
        var districtTokens = (districtIds ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var parsedScenarioIds = (scenarioIds ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(token => Guid.TryParse(token, out var parsed) ? parsed : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToList();

        if (districtTokens.Count == 0 && parsedScenarioIds.Count == 0)
        {
            return BadRequest(new
            {
                error = "missing_compare_scope",
                message = "Provide at least one districtId or scenarioId to compare levy forecasts.",
            });
        }

        var effectiveYear = await ResolveEffectiveTaxYearAsync(year, countyId, cancellationToken);
        var items = new List<ForecastComparisonItem>();
        var districtGuids = districtTokens
            .Select(token => Guid.TryParse(token, out var parsed) ? parsed : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToList();
        var currentRateByMeasure = parsedScenarioIds.Count > 0
            ? await LoadCurrentRateByMeasureAsync(effectiveYear, countyId, null, cancellationToken)
            : new Dictionary<Guid, decimal>();
        var currentLevyByMeasure = parsedScenarioIds.Count > 0
            ? await LoadCurrentLevyByMeasureAsync(effectiveYear, countyId, null, cancellationToken)
            : new Dictionary<Guid, decimal>();

        if (districtTokens.Count > 0)
        {
            var districts = await ApplyCountyFilter(_db.Districts.AsNoTracking(), countyId)
                .Where(district => districtTokens.Contains(district.DistrictCode) || districtGuids.Contains(district.Id))
                .ToListAsync(cancellationToken);

            foreach (var district in districts)
            {
                var rateRows = await ApplyCountyFilter(_db.LevyRates.AsNoTracking(), countyId)
                    .Where(rate => rate.DistrictId == district.Id && rate.EffectiveDate.Year == effectiveYear && rate.ExpirationDate == null)
                    .Include(rate => rate.LevyMeasure)
                    .ToListAsync(cancellationToken);

                var measureIds = rateRows.Select(rate => rate.LevyMeasureId).Distinct().ToList();
                var districtScenarios = measureIds.Count == 0
                    ? new List<LevyScenario>()
                    : await ApplyCountyFilter(_db.LevyScenarios.AsNoTracking(), countyId)
                        .Where(scenario => measureIds.Contains(scenario.LevyMeasureId))
                        .ToListAsync(cancellationToken);

                var districtScenarioIds = districtScenarios.Select(scenario => scenario.Id).ToList();
                var districtProjections = districtScenarioIds.Count == 0
                    ? new List<RevenueProjection>()
                    : await ApplyCountyFilter(_db.RevenueProjections.AsNoTracking(), countyId)
                        .Where(projection => districtScenarioIds.Contains(projection.LevyScenarioId))
                        .ToListAsync(cancellationToken);

                items.Add(new ForecastComparisonItem(
                    GroupType: "district",
                    GroupKey: district.DistrictCode,
                    Label: district.Name,
                    TaxYear: effectiveYear,
                    ScenarioCount: districtScenarios.Count,
                    ProjectionCount: districtProjections.Count,
                    CurrentLevyAmount: rateRows.Sum(rate => rate.LevyAmount),
                    CurrentRate: rateRows.Sum(rate => rate.Rate),
                    TotalProjectedNetRevenue: districtProjections.Sum(projection => projection.ProjectedNetRevenue),
                    AverageGrowthRate: districtProjections.Count > 0 ? Math.Round(districtProjections.Average(projection => projection.GrowthRate), 4) : 0m,
                    FiscalYears: districtProjections.Select(projection => projection.FiscalYear).Distinct().OrderBy(value => value).ToList()));
            }
        }

        if (parsedScenarioIds.Count > 0)
        {
            var scenarios = await ApplyCountyFilter(_db.LevyScenarios.AsNoTracking(), countyId)
                .Include(scenario => scenario.LevyMeasure)
                .Where(scenario => parsedScenarioIds.Contains(scenario.Id))
                .ToListAsync(cancellationToken);

            foreach (var scenario in scenarios)
            {
                var projections = await ApplyCountyFilter(_db.RevenueProjections.AsNoTracking(), countyId)
                    .Where(projection => projection.LevyScenarioId == scenario.Id)
                    .OrderBy(projection => projection.FiscalYear)
                    .ToListAsync(cancellationToken);

                items.Add(new ForecastComparisonItem(
                    GroupType: "scenario",
                    GroupKey: scenario.Id.ToString(),
                    Label: scenario.Name,
                    TaxYear: scenario.LevyMeasure?.LevyYear ?? effectiveYear,
                    ScenarioCount: 1,
                    ProjectionCount: projections.Count,
                    CurrentLevyAmount: currentLevyByMeasure.GetValueOrDefault(scenario.LevyMeasureId, 0m),
                    CurrentRate: currentRateByMeasure.GetValueOrDefault(scenario.LevyMeasureId, 0m),
                    TotalProjectedNetRevenue: projections.Sum(projection => projection.ProjectedNetRevenue),
                    AverageGrowthRate: projections.Count > 0 ? Math.Round(projections.Average(projection => projection.GrowthRate), 4) : 0m,
                    FiscalYears: projections.Select(projection => projection.FiscalYear).Distinct().OrderBy(value => value).ToList()));
            }
        }

        _logger.LogInformation(
            "LEV-008: Forecast comparison requested for taxYear={TaxYear}, districtCount={DistrictCount}, scenarioCount={ScenarioCount}, results={ResultCount}",
            effectiveYear,
            districtTokens.Count,
            parsedScenarioIds.Count,
            items.Count);

        return Ok(new
        {
            taxYear = effectiveYear,
            source = "Districts + LevyRates + LevyScenarios + RevenueProjections",
            generatedAt = DateTime.UtcNow,
            count = items.Count,
            items,
        });
    }
}
