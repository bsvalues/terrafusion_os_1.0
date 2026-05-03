using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-033: Levy data search and autocomplete.
/// Searches the native levy tables. User-specific search history is not
/// persisted, so the recent endpoint returns an honest empty state.
/// </summary>
[ApiController]
[Route("api/levy/search")]
[Authorize]
public sealed class LevySearchController : ControllerBase
{
    private readonly LevyDbContext _db;
    private readonly ILogger<LevySearchController> _logger;

    public LevySearchController(
        LevyDbContext db,
        ILogger<LevySearchController> logger)
    {
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public sealed record SearchResultDto(
        string ResultType,
        string Id,
        string Title,
        string Subtitle,
        string CountyId,
        int? TaxYear,
        string? DistrictCode,
        IReadOnlyDictionary<string, object?> Metadata);

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

    /// <summary>
    /// Search levy records by keyword, district, or scenario.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("search")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] string? type,
        [FromQuery] int? limit,
        [FromQuery] string? countyId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new
            {
                error = "missing_query",
                message = "q is required for levy search.",
            });
        }

        var query = q.Trim();
        var maxResults = Math.Clamp(limit ?? 20, 1, 100);
        var normalizedType = type?.Trim().ToLowerInvariant() ?? "all";
        var results = new List<SearchResultDto>();

        if (normalizedType is "all" or "district" or "districts")
        {
            var districts = await ApplyCountyFilter(_db.Districts.AsNoTracking(), countyId)
                .Where(district =>
                    EF.Functions.ILike(district.Name, $"%{query}%") ||
                    EF.Functions.ILike(district.DistrictCode, $"%{query}%") ||
                    EF.Functions.ILike(district.DistrictType, $"%{query}%"))
                .OrderBy(district => district.Name)
                .Take(maxResults)
                .ToListAsync(cancellationToken);

            results.AddRange(districts.Select(district => new SearchResultDto(
                ResultType: "district",
                Id: district.Id.ToString(),
                Title: district.Name,
                Subtitle: $"{district.DistrictCode} · {district.DistrictType}",
                CountyId: district.CountyId,
                TaxYear: null,
                DistrictCode: district.DistrictCode,
                Metadata: new Dictionary<string, object?>
                {
                    ["parcelCount"] = district.ParcelCount,
                    ["totalAssessedValue"] = district.TotalAssessedValue,
                    ["isActive"] = district.IsActive,
                })));
        }

        if (normalizedType is "all" or "measure" or "measures")
        {
            var measures = await ApplyCountyFilter(_db.LevyMeasures.AsNoTracking(), countyId)
                .Where(measure =>
                    EF.Functions.ILike(measure.Name, $"%{query}%") ||
                    (measure.Description != null && EF.Functions.ILike(measure.Description, $"%{query}%")) ||
                    EF.Functions.ILike(measure.LevyType, $"%{query}%"))
                .OrderByDescending(measure => measure.LevyYear)
                .ThenBy(measure => measure.Name)
                .Take(maxResults)
                .ToListAsync(cancellationToken);

            results.AddRange(measures.Select(measure => new SearchResultDto(
                ResultType: "measure",
                Id: measure.Id.ToString(),
                Title: measure.Name,
                Subtitle: $"{measure.LevyType} · {measure.Status}",
                CountyId: measure.CountyId,
                TaxYear: measure.LevyYear,
                DistrictCode: null,
                Metadata: new Dictionary<string, object?>
                {
                    ["targetAmount"] = measure.TargetAmount,
                    ["calculatedAmount"] = measure.CalculatedAmount,
                    ["calculatedRate"] = measure.CalculatedRate,
                })));
        }

        if (normalizedType is "all" or "certification" or "certifications")
        {
            var certifications = await ApplyCountyFilter(_db.LevyCertifications.AsNoTracking(), countyId)
                .Where(certification =>
                    EF.Functions.ILike(certification.DistrictCode, $"%{query}%") ||
                    (certification.CertifiedBy != null && EF.Functions.ILike(certification.CertifiedBy, $"%{query}%")) ||
                    (certification.Notes != null && EF.Functions.ILike(certification.Notes, $"%{query}%")))
                .OrderByDescending(certification => certification.TaxYear)
                .ThenBy(certification => certification.DistrictCode)
                .Take(maxResults)
                .ToListAsync(cancellationToken);

            results.AddRange(certifications.Select(certification => new SearchResultDto(
                ResultType: "certification",
                Id: certification.Id.ToString(),
                Title: certification.DistrictCode,
                Subtitle: $"{certification.Status} · levy rate {certification.LevyRate:F6}",
                CountyId: certification.CountyId,
                TaxYear: certification.TaxYear,
                DistrictCode: certification.DistrictCode,
                Metadata: new Dictionary<string, object?>
                {
                    ["leviedAmount"] = certification.LeviedAmount,
                    ["certifiedAt"] = certification.CertifiedAt,
                    ["certifiedBy"] = certification.CertifiedBy,
                })));
        }

        if (normalizedType is "all" or "scenario" or "scenarios")
        {
            var scenarios = await ApplyCountyFilter(_db.LevyScenarios.AsNoTracking(), countyId)
                .Include(scenario => scenario.LevyMeasure)
                .Where(scenario =>
                    EF.Functions.ILike(scenario.Name, $"%{query}%") ||
                    (scenario.Description != null && EF.Functions.ILike(scenario.Description, $"%{query}%")) ||
                    EF.Functions.ILike(scenario.ScenarioType, $"%{query}%"))
                .OrderByDescending(scenario => scenario.CreatedAt)
                .Take(maxResults)
                .ToListAsync(cancellationToken);

            results.AddRange(scenarios.Select(scenario => new SearchResultDto(
                ResultType: "scenario",
                Id: scenario.Id.ToString(),
                Title: scenario.Name,
                Subtitle: $"{scenario.ScenarioType} · {scenario.LevyMeasure?.Name ?? "Unlabeled levy measure"}",
                CountyId: scenario.CountyId,
                TaxYear: scenario.LevyMeasure?.LevyYear,
                DistrictCode: null,
                Metadata: new Dictionary<string, object?>
                {
                    ["projectedRevenue"] = scenario.ProjectedRevenue,
                    ["collectionRate"] = scenario.CollectionRate,
                    ["isActive"] = scenario.IsActive,
                    ["confidenceScore"] = scenario.ConfidenceScore,
                })));
        }

        if (normalizedType is "all" or "rate" or "rates")
        {
            var rates = await ApplyCountyFilter(_db.LevyRates.AsNoTracking(), countyId)
                .Include(rate => rate.District)
                .Include(rate => rate.LevyMeasure)
                .Where(rate =>
                    (rate.District != null && (
                        EF.Functions.ILike(rate.District.Name, $"%{query}%") ||
                        EF.Functions.ILike(rate.District.DistrictCode, $"%{query}%"))) ||
                    (rate.LevyMeasure != null && EF.Functions.ILike(rate.LevyMeasure.Name, $"%{query}%")))
                .OrderByDescending(rate => rate.EffectiveDate)
                .Take(maxResults)
                .ToListAsync(cancellationToken);

            results.AddRange(rates.Select(rate => new SearchResultDto(
                ResultType: "rate",
                Id: rate.Id.ToString(),
                Title: rate.District?.Name ?? rate.DistrictId?.ToString() ?? "Unassigned district",
                Subtitle: $"{rate.District?.DistrictCode ?? "no-code"} · rate {rate.Rate:F6}",
                CountyId: rate.CountyId,
                TaxYear: rate.EffectiveDate.Year,
                DistrictCode: rate.District?.DistrictCode,
                Metadata: new Dictionary<string, object?>
                {
                    ["levyAmount"] = rate.LevyAmount,
                    ["assessedValue"] = rate.AssessedValue,
                    ["measureName"] = rate.LevyMeasure?.Name,
                })));
        }

        var ordered = results
            .OrderBy(result => result.ResultType)
            .ThenByDescending(result => result.TaxYear ?? 0)
            .ThenBy(result => result.Title)
            .Take(maxResults)
            .ToList();

        _logger.LogInformation(
            "LEV-033: Levy search requested with query={Query}, type={Type}, county={CountyId}, results={ResultCount}",
            query,
            normalizedType,
            countyId ?? "<all>",
            ordered.Count);

        return Ok(new
        {
            query,
            type = normalizedType,
            count = ordered.Count,
            items = ordered,
            source = "Districts + LevyMeasures + LevyCertifications + LevyScenarios + LevyRates",
        });
    }

    /// <summary>
    /// Provide autocomplete suggestions for levy search fields.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("autocomplete")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Autocomplete(
        [FromQuery] string? q,
        [FromQuery] string? field,
        [FromQuery] int? limit,
        [FromQuery] string? countyId,
        CancellationToken cancellationToken)
    {
        var query = q?.Trim() ?? string.Empty;
        var normalizedField = field?.Trim().ToLowerInvariant() ?? "all";
        var maxResults = Math.Clamp(limit ?? 10, 1, 50);
        var suggestions = new List<string>();

        if (normalizedField is "all" or "district" or "districtcode")
        {
            suggestions.AddRange(await ApplyCountyFilter(_db.Districts.AsNoTracking(), countyId)
                .Where(district =>
                    string.IsNullOrWhiteSpace(query) ||
                    EF.Functions.ILike(district.Name, $"%{query}%") ||
                    EF.Functions.ILike(district.DistrictCode, $"%{query}%"))
                .OrderBy(district => district.Name)
                .Select(district => district.DistrictCode)
                .Distinct()
                .Take(maxResults)
                .ToListAsync(cancellationToken));
        }

        if (normalizedField is "all" or "districtname" or "name")
        {
            suggestions.AddRange(await ApplyCountyFilter(_db.Districts.AsNoTracking(), countyId)
                .Where(district => string.IsNullOrWhiteSpace(query) || EF.Functions.ILike(district.Name, $"%{query}%"))
                .OrderBy(district => district.Name)
                .Select(district => district.Name)
                .Distinct()
                .Take(maxResults)
                .ToListAsync(cancellationToken));
        }

        if (normalizedField is "all" or "measure" or "measurename")
        {
            suggestions.AddRange(await ApplyCountyFilter(_db.LevyMeasures.AsNoTracking(), countyId)
                .Where(measure => string.IsNullOrWhiteSpace(query) || EF.Functions.ILike(measure.Name, $"%{query}%"))
                .OrderByDescending(measure => measure.LevyYear)
                .ThenBy(measure => measure.Name)
                .Select(measure => measure.Name)
                .Distinct()
                .Take(maxResults)
                .ToListAsync(cancellationToken));
        }

        if (normalizedField is "all" or "scenario" or "scenarioname")
        {
            suggestions.AddRange(await ApplyCountyFilter(_db.LevyScenarios.AsNoTracking(), countyId)
                .Where(scenario => string.IsNullOrWhiteSpace(query) || EF.Functions.ILike(scenario.Name, $"%{query}%"))
                .OrderByDescending(scenario => scenario.CreatedAt)
                .Select(scenario => scenario.Name)
                .Distinct()
                .Take(maxResults)
                .ToListAsync(cancellationToken));
        }

        var ordered = suggestions
            .Where(suggestion => !string.IsNullOrWhiteSpace(suggestion))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(suggestion => suggestion)
            .Take(maxResults)
            .ToList();

        _logger.LogInformation(
            "LEV-033: Levy autocomplete requested for field={Field}, county={CountyId}, suggestions={SuggestionCount}",
            normalizedField,
            countyId ?? "<all>",
            ordered.Count);

        return Ok(new
        {
            field = normalizedField,
            query,
            count = ordered.Count,
            items = ordered,
        });
    }

    /// <summary>
    /// Retrieve recent searches for the current user.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("recent")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetRecent([FromQuery] int? limit)
    {
        var maxResults = Math.Clamp(limit ?? 10, 1, 50);

        _logger.LogInformation(
            "LEV-033: Recent searches requested but no persisted user search history exists. limit={Limit}",
            maxResults);

        return Ok(new
        {
            count = 0,
            items = Array.Empty<object>(),
            limit = maxResults,
            userHistoryAvailable = false,
            message = "No persisted levy search history exists for this environment.",
        });
    }
}
