using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-026: Levy report generation and scheduling.
/// Serves report template metadata and live JSON evidence packets sourced
/// from the native levy tables. Scheduled delivery remains unavailable until
/// a real scheduler and persistence layer exist.
/// </summary>
[ApiController]
[Route("api/levy/reports")]
[Authorize]
public sealed class LevyReportController : ControllerBase
{
    private readonly LevyDbContext _db;
    private readonly ILogger<LevyReportController> _logger;

    public LevyReportController(
        LevyDbContext db,
        ILogger<LevyReportController> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public sealed record ReportTemplateDto(
        string TemplateId,
        string Title,
        string Description,
        IReadOnlyList<string> RequiredParameters,
        string Source,
        bool GeneratesJson);

    public sealed record GenerateReportRequest(
        string? TemplateId,
        int? Year,
        string? CountyId,
        string? DistrictId);

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

        var latestMeasureYear = await ApplyCountyFilter(_db.LevyMeasures.AsNoTracking(), countyId)
            .Select(measure => (int?)measure.LevyYear)
            .MaxAsync(cancellationToken);

        var latestProjectionYear = await ApplyCountyFilter(_db.RevenueProjections.AsNoTracking(), countyId)
            .Select(projection => (int?)projection.FiscalYear)
            .MaxAsync(cancellationToken);

        var latestCertificationYear = await ApplyCountyFilter(_db.LevyCertifications.AsNoTracking(), countyId)
            .Select(certification => (int?)certification.TaxYear)
            .MaxAsync(cancellationToken);

        return new[] { latestMeasureYear, latestProjectionYear, latestCertificationYear }
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .DefaultIfEmpty(DateTime.UtcNow.Year)
            .Max();
    }

    /// <summary>
    /// List available report templates for levy reporting.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("templates")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetTemplates()
    {
        var templates = new[]
        {
            new ReportTemplateDto(
                TemplateId: "county-forecast-brief",
                Title: "County Forecast Brief",
                Description: "County-wide scenario and revenue projection summary for the active levy year.",
                RequiredParameters: new[] { "year (optional)", "countyId (optional)" },
                Source: "LevyMeasures + LevyScenarios + RevenueProjections",
                GeneratesJson: true),
            new ReportTemplateDto(
                TemplateId: "district-certification-packet",
                Title: "District Certification Packet",
                Description: "District-specific rates, certifications, and projection evidence for a single levy district.",
                RequiredParameters: new[] { "districtId", "year (optional)", "countyId (optional)" },
                Source: "Districts + LevyRates + LevyCertifications + RevenueProjections",
                GeneratesJson: true),
            new ReportTemplateDto(
                TemplateId: "rate-summary",
                Title: "Rate Summary",
                Description: "Current-year levy rate summary by district for operational review and export staging.",
                RequiredParameters: new[] { "year (optional)", "countyId (optional)" },
                Source: "LevyRates + Districts",
                GeneratesJson: true),
        };

        _logger.LogInformation("LEV-026: Report templates requested, templates={TemplateCount}", templates.Length);

        return Ok(new
        {
            count = templates.Length,
            items = templates,
        });
    }

    /// <summary>
    /// Generate a levy report from a template with the specified parameters.
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Generate(
        [FromBody] GenerateReportRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TemplateId))
        {
            return BadRequest(new
            {
                error = "missing_template_id",
                message = "templateId is required to generate a levy report.",
            });
        }

        var effectiveYear = await ResolveEffectiveTaxYearAsync(request.Year, request.CountyId, cancellationToken);
        var templateId = request.TemplateId.Trim();

        if (templateId.Equals("county-forecast-brief", StringComparison.OrdinalIgnoreCase))
        {
            var scenarios = await ApplyCountyFilter(_db.LevyScenarios.AsNoTracking(), request.CountyId)
                .Include(scenario => scenario.LevyMeasure)
                .Where(scenario => scenario.LevyMeasure.LevyYear == effectiveYear)
                .OrderByDescending(scenario => scenario.IsActive)
                .ThenByDescending(scenario => scenario.CreatedAt)
                .ToListAsync(cancellationToken);

            var scenarioIds = scenarios.Select(scenario => scenario.Id).ToList();
            var projections = scenarioIds.Count == 0
                ? new List<RevenueProjection>()
                : await ApplyCountyFilter(_db.RevenueProjections.AsNoTracking(), request.CountyId)
                    .Where(projection => scenarioIds.Contains(projection.LevyScenarioId))
                    .OrderBy(projection => projection.FiscalYear)
                    .ToListAsync(cancellationToken);

            var measures = await ApplyCountyFilter(_db.LevyMeasures.AsNoTracking(), request.CountyId)
                .Where(measure => measure.LevyYear == effectiveYear)
                .OrderBy(measure => measure.Name)
                .ToListAsync(cancellationToken);

            var report = new
            {
                templateId = "county-forecast-brief",
                taxYear = effectiveYear,
                countyId = request.CountyId,
                source = "LevyMeasures + LevyScenarios + RevenueProjections",
                generatedAt = DateTime.UtcNow,
                summary = new
                {
                    measureCount = measures.Count,
                    scenarioCount = scenarios.Count,
                    projectionCount = projections.Count,
                    totalProjectedNetRevenue = projections.Sum(projection => projection.ProjectedNetRevenue),
                    averageGrowthRate = projections.Count > 0 ? Math.Round(projections.Average(projection => projection.GrowthRate), 4) : 0m,
                    fiscalYears = projections.Select(projection => projection.FiscalYear).Distinct().OrderBy(value => value).ToList(),
                },
                measures = measures.Select(measure => new
                {
                    measureId = measure.Id,
                    measure.Name,
                    measure.LevyType,
                    measure.Status,
                    measure.TargetAmount,
                    measure.CalculatedAmount,
                    measure.CalculatedRate,
                    measure.MaximumRate,
                    measure.TotalAssessedValue,
                }),
                scenarios = scenarios.Select(scenario => new
                {
                    scenarioId = scenario.Id,
                    scenario.Name,
                    scenario.ScenarioType,
                    scenario.LevyMeasureId,
                    measureName = scenario.LevyMeasure?.Name,
                    scenario.ProjectedRevenue,
                    scenario.CollectionRate,
                    scenario.IsActive,
                    scenario.ConfidenceScore,
                    scenario.QuantumOptimized,
                }),
            };

            _logger.LogInformation(
                "LEV-026: County forecast brief generated for taxYear={TaxYear}, county={CountyId}, scenarios={ScenarioCount}",
                effectiveYear,
                request.CountyId ?? "<all>",
                scenarios.Count);

            return Ok(report);
        }

        if (templateId.Equals("district-certification-packet", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(request.DistrictId))
            {
                return BadRequest(new
                {
                    error = "missing_district_id",
                    message = "districtId is required for the district-certification-packet template.",
                });
            }

            var districtQuery = ApplyCountyFilter(_db.Districts.AsNoTracking(), request.CountyId);
            District? district;

            if (Guid.TryParse(request.DistrictId, out var districtGuid))
            {
                district = await districtQuery.FirstOrDefaultAsync(
                    row => row.Id == districtGuid || row.DistrictCode == request.DistrictId,
                    cancellationToken);
            }
            else
            {
                district = await districtQuery.FirstOrDefaultAsync(
                    row => row.DistrictCode == request.DistrictId,
                    cancellationToken);
            }

            if (district is null)
            {
                return NotFound(new
                {
                    error = "district_not_found",
                    message = "No levy district matched the requested id or district code.",
                    districtId = request.DistrictId,
                });
            }

            var rates = await ApplyCountyFilter(_db.LevyRates.AsNoTracking(), district.CountyId)
                .Where(rate => rate.DistrictId == district.Id && rate.EffectiveDate.Year == effectiveYear)
                .Include(rate => rate.LevyMeasure)
                .OrderByDescending(rate => rate.EffectiveDate)
                .ToListAsync(cancellationToken);

            var certifications = await ApplyCountyFilter(_db.LevyCertifications.AsNoTracking(), district.CountyId)
                .Where(certification => certification.DistrictCode == district.DistrictCode && certification.TaxYear == effectiveYear)
                .OrderByDescending(certification => certification.CreatedAt)
                .ToListAsync(cancellationToken);

            var measureIds = rates.Select(rate => rate.LevyMeasureId).Distinct().ToList();
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
                    .Where(projection => scenarioIds.Contains(projection.LevyScenarioId))
                    .OrderBy(projection => projection.FiscalYear)
                    .ToListAsync(cancellationToken);

            var report = new
            {
                templateId = "district-certification-packet",
                taxYear = effectiveYear,
                countyId = district.CountyId,
                source = "Districts + LevyRates + LevyCertifications + LevyScenarios + RevenueProjections",
                generatedAt = DateTime.UtcNow,
                district = new
                {
                    district.Id,
                    district.CountyId,
                    district.DistrictCode,
                    district.Name,
                    district.DistrictType,
                    district.TotalAssessedValue,
                    district.ParcelCount,
                },
                rates = rates.Select(rate => new
                {
                    rate.Id,
                    rate.LevyMeasureId,
                    measureName = rate.LevyMeasure?.Name,
                    levyType = rate.LevyMeasure?.LevyType,
                    rate.Rate,
                    rate.AssessedValue,
                    rate.LevyAmount,
                    rate.EffectiveDate,
                    rate.ExpirationDate,
                    rate.ConfidenceScore,
                }),
                certifications = certifications.Select(certification => new
                {
                    certification.Id,
                    certification.TaxYear,
                    status = certification.Status.ToString(),
                    certification.HighestLawfulLevy,
                    certification.BankedCapacityUsed,
                    certification.BankedCapacityRemaining,
                    certification.LeviedAmount,
                    certification.LevyRate,
                    certification.CertifiedAt,
                    certification.CertifiedBy,
                    certification.AttestationHash,
                    certification.AttestationCorrelationId,
                }),
                projections = projections.Select(projection => new
                {
                    projection.Id,
                    projection.LevyScenarioId,
                    projection.FiscalYear,
                    projection.ProjectedAssessedValue,
                    projection.ProjectedLevyAmount,
                    projection.ProjectedCollectionRate,
                    projection.ProjectedNetRevenue,
                    projection.GrowthRate,
                    projection.ConfidenceLevel,
                }),
            };

            _logger.LogInformation(
                "LEV-026: District certification packet generated for district={DistrictCode}, taxYear={TaxYear}, rates={RateCount}, certifications={CertificationCount}",
                district.DistrictCode,
                effectiveYear,
                rates.Count,
                certifications.Count);

            return Ok(report);
        }

        if (templateId.Equals("rate-summary", StringComparison.OrdinalIgnoreCase))
        {
            var rates = await ApplyCountyFilter(_db.LevyRates.AsNoTracking(), request.CountyId)
                .Where(rate => rate.EffectiveDate.Year == effectiveYear && rate.ExpirationDate == null)
                .Include(rate => rate.District)
                .Include(rate => rate.LevyMeasure)
                .OrderByDescending(rate => rate.LevyAmount)
                .ToListAsync(cancellationToken);

            var report = new
            {
                templateId = "rate-summary",
                taxYear = effectiveYear,
                countyId = request.CountyId,
                source = "LevyRates + Districts",
                generatedAt = DateTime.UtcNow,
                count = rates.Count,
                items = rates.Select(rate => new
                {
                    rate.Id,
                    districtId = rate.DistrictId,
                    districtCode = rate.District?.DistrictCode,
                    districtName = rate.District?.Name,
                    districtType = rate.District?.DistrictType,
                    rate.LevyMeasureId,
                    measureName = rate.LevyMeasure?.Name,
                    rate.Rate,
                    rate.AssessedValue,
                    rate.LevyAmount,
                    rate.EffectiveDate,
                    rate.ConfidenceScore,
                }),
            };

            _logger.LogInformation(
                "LEV-026: Rate summary generated for taxYear={TaxYear}, county={CountyId}, rows={RowCount}",
                effectiveYear,
                request.CountyId ?? "<all>",
                rates.Count);

            return Ok(report);
        }

        return BadRequest(new
        {
            error = "unknown_template_id",
            message = "Unknown levy report template.",
            templateId,
        });
    }

    /// <summary>
    /// Retrieve the list of scheduled reports and their status.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("scheduled")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetScheduled()
    {
        _logger.LogInformation("LEV-026: Scheduled reports requested but no scheduler is configured.");
        return Ok(new
        {
            count = 0,
            items = Array.Empty<object>(),
            schedulerConfigured = false,
            message = "No persisted levy report scheduler is configured for this environment.",
        });
    }
}
