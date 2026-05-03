using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-015: Historical levy analysis and trend detection.
/// Provides statistical analysis, trend identification, and anomaly detection
/// across historical levy data for tax districts.
/// </summary>
[ApiController]
[Route("api/levy/historical")]
[Authorize]
public class HistoricalAnalysisController : ControllerBase
{
    private readonly ILogger<HistoricalAnalysisController> _logger;
    private readonly LevyDbContext _db;

    public HistoricalAnalysisController(
        ILogger<HistoricalAnalysisController> logger,
        LevyDbContext db)
    {
        _logger = logger;
        _db = db;
    }

    private async Task<District?> ResolveDistrictAsync(string districtIdentifier, CancellationToken cancellationToken)
    {
        if (Guid.TryParse(districtIdentifier, out var districtGuid))
        {
            return await _db.Districts
                .AsNoTracking()
                .FirstOrDefaultAsync(district => district.Id == districtGuid, cancellationToken);
        }

        var normalizedCode = districtIdentifier.Trim().ToUpperInvariant();
        return await _db.Districts
            .AsNoTracking()
            .FirstOrDefaultAsync(
                district => district.DistrictCode.ToUpper() == normalizedCode,
                cancellationToken);
    }

    /// <summary>
    /// Retrieve historical statistics for a specific tax district.
    /// </summary>
    [HttpGet("statistics/{districtId}")]
    public async Task<IActionResult> GetStatistics(string districtId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("LEV-015: Historical statistics requested for district {DistrictId}", districtId);

        var district = await ResolveDistrictAsync(districtId, cancellationToken);
        if (district is null)
        {
            return NotFound(new
            {
                error = "district_not_found",
                message = $"District '{districtId}' was not found in the levy registry.",
            });
        }

        var rates = await _db.LevyRates
            .AsNoTracking()
            .Where(rate => rate.DistrictId == district.Id)
            .OrderBy(rate => rate.EffectiveDate)
            .ToListAsync(cancellationToken);

        var certifications = await _db.LevyCertifications
            .AsNoTracking()
            .Where(certification => certification.DistrictCode == district.DistrictCode)
            .OrderBy(certification => certification.TaxYear)
            .ThenBy(certification => certification.CreatedAt)
            .ToListAsync(cancellationToken);

        var yearlySeries = rates
            .GroupBy(rate => rate.EffectiveDate.Year)
            .OrderBy(group => group.Key)
            .Select(group => new
            {
                taxYear = group.Key,
                averageRate = decimal.Round(group.Average(rate => rate.Rate), 6),
                totalLevyAmount = decimal.Round(group.Sum(rate => rate.LevyAmount), 2),
                averageAssessedValue = decimal.Round(group.Average(rate => rate.AssessedValue), 2),
                rateCount = group.Count(),
                averageConfidence = group.Where(rate => rate.ConfidenceScore.HasValue)
                    .Select(rate => rate.ConfidenceScore!.Value)
                    .DefaultIfEmpty(0m)
                    .Average(),
            })
            .ToList();

        var latestCertification = certifications
            .OrderByDescending(certification => certification.TaxYear)
            .ThenByDescending(certification => certification.CreatedAt)
            .FirstOrDefault();

        return Ok(new
        {
            success = true,
            source = "LevyRates + LevyCertifications",
            generatedAt = DateTime.UtcNow,
            district = new
            {
                district.Id,
                district.CountyId,
                district.DistrictCode,
                district.Name,
                district.DistrictType,
                district.ParcelCount,
                district.TotalAssessedValue,
            },
            rateSummary = new
            {
                count = rates.Count,
                minRate = rates.Count > 0 ? rates.Min(rate => rate.Rate) : 0m,
                maxRate = rates.Count > 0 ? rates.Max(rate => rate.Rate) : 0m,
                averageRate = rates.Count > 0 ? decimal.Round(rates.Average(rate => rate.Rate), 6) : 0m,
                totalLevyAmount = rates.Count > 0 ? decimal.Round(rates.Sum(rate => rate.LevyAmount), 2) : 0m,
                latestEffectiveDate = rates.LastOrDefault()?.EffectiveDate,
                yearsCovered = yearlySeries.Select(item => item.taxYear).ToArray(),
            },
            certificationSummary = new
            {
                count = certifications.Count,
                certifiedYears = certifications
                    .Where(certification => certification.Status == LevyCertificationStatus.Certified)
                    .Select(certification => certification.TaxYear)
                    .Distinct()
                    .OrderBy(year => year)
                    .ToArray(),
                latestStatus = latestCertification?.Status.ToString() ?? "none",
                latestTaxYear = latestCertification?.TaxYear,
                latestCertifiedAt = latestCertification?.CertifiedAt,
            },
            yearlySeries,
        });
    }

    /// <summary>
    /// Identify levy trends across districts and time periods.
    /// </summary>
    [HttpGet("trends")]
    public async Task<IActionResult> GetTrends(
        [FromQuery] int? years,
        [FromQuery] string? districtId,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("LEV-015: Trend analysis requested");

        var effectiveYears = Math.Clamp(years ?? 5, 1, 25);
        District? district = null;
        if (!string.IsNullOrWhiteSpace(districtId))
        {
            district = await ResolveDistrictAsync(districtId, cancellationToken);
            if (district is null)
            {
                return NotFound(new
                {
                    error = "district_not_found",
                    message = $"District '{districtId}' was not found in the levy registry.",
                });
            }
        }

        var ratesQuery = _db.LevyRates
            .AsNoTracking()
            .Include(rate => rate.District)
            .AsQueryable();

        if (district is not null)
        {
            ratesQuery = ratesQuery.Where(rate => rate.DistrictId == district.Id);
        }

        var latestYear = await ratesQuery
            .Select(rate => (int?)rate.EffectiveDate.Year)
            .MaxAsync(cancellationToken) ?? DateTime.UtcNow.Year;

        var startYear = latestYear - effectiveYears + 1;
        var rates = await ratesQuery
            .Where(rate => rate.EffectiveDate.Year >= startYear && rate.EffectiveDate.Year <= latestYear)
            .OrderBy(rate => rate.EffectiveDate)
            .ToListAsync(cancellationToken);

        decimal? previousAverageRate = null;
        var series = new List<object>();

        foreach (var group in rates.GroupBy(rate => rate.EffectiveDate.Year).OrderBy(group => group.Key))
        {
            var averageRate = group.Average(rate => rate.Rate);
            var rateChangePct = previousAverageRate.HasValue && previousAverageRate.Value != 0m
                ? decimal.Round((averageRate - previousAverageRate.Value) / previousAverageRate.Value * 100m, 2)
                : (decimal?)null;

            series.Add(new
            {
                taxYear = group.Key,
                districtCount = group.Where(rate => rate.DistrictId.HasValue)
                    .Select(rate => rate.DistrictId!.Value)
                    .Distinct()
                    .Count(),
                rateCount = group.Count(),
                averageRate = decimal.Round(averageRate, 6),
                totalLevyAmount = decimal.Round(group.Sum(rate => rate.LevyAmount), 2),
                averageAssessedValue = decimal.Round(group.Average(rate => rate.AssessedValue), 2),
                averageConfidence = group.Where(rate => rate.ConfidenceScore.HasValue)
                    .Select(rate => rate.ConfidenceScore!.Value)
                    .DefaultIfEmpty(0m)
                    .Average(),
                rateChangePct,
            });

            previousAverageRate = averageRate;
        }

        return Ok(new
        {
            success = true,
            source = "LevyRates",
            generatedAt = DateTime.UtcNow,
            filters = new
            {
                districtId = district?.Id,
                districtCode = district?.DistrictCode,
                districtName = district?.Name,
                years = effectiveYears,
                startYear,
                endYear = latestYear,
            },
            series,
            assumptions = series.Count == 0
                ? new[] { "No levy rate history exists for the requested filter." }
                : Array.Empty<string>(),
        });
    }

    /// <summary>
    /// Detect anomalies in historical levy data that may require review.
    /// </summary>
    [HttpGet("anomalies")]
    public async Task<IActionResult> GetAnomalies(
        [FromQuery] string? districtId,
        [FromQuery] double? threshold,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("LEV-015: Anomaly detection requested");

        District? district = null;
        if (!string.IsNullOrWhiteSpace(districtId))
        {
            district = await ResolveDistrictAsync(districtId, cancellationToken);
            if (district is null)
            {
                return NotFound(new
                {
                    error = "district_not_found",
                    message = $"District '{districtId}' was not found in the levy registry.",
                });
            }
        }

        var thresholdRatio = threshold.HasValue
            ? Math.Abs(threshold.Value > 1d ? threshold.Value / 100d : threshold.Value)
            : 0.15d;

        var ratesQuery = _db.LevyRates
            .AsNoTracking()
            .Include(rate => rate.District)
            .Where(rate => rate.DistrictId != null);

        if (district is not null)
        {
            ratesQuery = ratesQuery.Where(rate => rate.DistrictId == district.Id);
        }

        var yearlyDistrictRates = await ratesQuery
            .GroupBy(rate => new
            {
                rate.DistrictId,
                rate.District!.DistrictCode,
                rate.District.Name,
                TaxYear = rate.EffectiveDate.Year,
            })
            .Select(group => new
            {
                DistrictId = group.Key.DistrictId!.Value,
                group.Key.DistrictCode,
                DistrictName = group.Key.Name,
                group.Key.TaxYear,
                AverageRate = group.Average(rate => rate.Rate),
                TotalLevyAmount = group.Sum(rate => rate.LevyAmount),
                RateCount = group.Count(),
            })
            .OrderBy(item => item.DistrictCode)
            .ThenBy(item => item.TaxYear)
            .ToListAsync(cancellationToken);

        var anomalies = new List<object>();

        foreach (var districtSeries in yearlyDistrictRates.GroupBy(item => new { item.DistrictId, item.DistrictCode, item.DistrictName }))
        {
            var ordered = districtSeries.OrderBy(item => item.TaxYear).ToList();
            for (var index = 1; index < ordered.Count; index++)
            {
                var prior = ordered[index - 1];
                var current = ordered[index];
                if (prior.AverageRate == 0m)
                {
                    continue;
                }

                var rateChangeRatio = (double)((current.AverageRate - prior.AverageRate) / prior.AverageRate);
                if (Math.Abs(rateChangeRatio) < thresholdRatio)
                {
                    continue;
                }

                var levyAmountChangePct = prior.TotalLevyAmount != 0m
                    ? decimal.Round((current.TotalLevyAmount - prior.TotalLevyAmount) / prior.TotalLevyAmount * 100m, 2)
                    : (decimal?)null;

                anomalies.Add(new
                {
                    districtId = current.DistrictId,
                    districtCode = current.DistrictCode,
                    districtName = current.DistrictName,
                    priorYear = prior.TaxYear,
                    currentYear = current.TaxYear,
                    priorRate = decimal.Round(prior.AverageRate, 6),
                    currentRate = decimal.Round(current.AverageRate, 6),
                    rateChangePct = decimal.Round((decimal)(rateChangeRatio * 100d), 2),
                    priorLevyAmount = decimal.Round(prior.TotalLevyAmount, 2),
                    currentLevyAmount = decimal.Round(current.TotalLevyAmount, 2),
                    levyAmountChangePct,
                    rateCount = current.RateCount,
                });
            }
        }

        return Ok(new
        {
            success = true,
            source = "LevyRates",
            generatedAt = DateTime.UtcNow,
            thresholdPct = decimal.Round((decimal)(thresholdRatio * 100d), 2),
            count = anomalies.Count,
            anomalies,
        });
    }
}
