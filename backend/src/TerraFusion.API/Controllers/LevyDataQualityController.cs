using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Levy.Data;
using TerraFusion.Levy.Models;
using TerraFusion.Levy.Services;

// File-scoped aliases: the API controllers namespace has DTOs from sibling
// suites with overlapping simple names. Aliasing keeps this controller
// unambiguously bound to the Levy contract.
using LevyDataQualityAnalysisRequest = TerraFusion.Levy.Services.DataQualityAnalysisRequest;
using LevyDataQualityAnalysisResult = TerraFusion.Levy.Services.DataQualityAnalysisResult;
using LevyAiRecommendationsRequest = TerraFusion.Levy.Services.AiRecommendationsRequest;
using LevyAiRecommendationsResult = TerraFusion.Levy.Services.AiRecommendationsResult;
using LevyMonitoringStatusResult = TerraFusion.Levy.Services.MonitoringStatusResult;
using LevyMonitoringToggleRequest = TerraFusion.Levy.Services.MonitoringToggleRequest;
using LevyMonitoringToggleResult = TerraFusion.Levy.Services.MonitoringToggleResult;
using LevyRealtimeMetricsResult = TerraFusion.Levy.Services.RealtimeMetricsResult;
using LevyTrendAnalysisReq = TerraFusion.Levy.Services.LevyTrendAnalysisRequest;
using LevyTrendAnalysisRes = TerraFusion.Levy.Services.LevyTrendAnalysisResult;
using LevyDataQualityAuditRequest = TerraFusion.Levy.Services.DataQualityAuditRequest;
using LevyDataQualityAuditResult = TerraFusion.Levy.Services.DataQualityAuditResult;
using LevyDistrictRiskSummaryResult = TerraFusion.Levy.Services.DistrictRiskSummaryResult;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraLevy data-quality HTTP surface.
/// Ports the Flask <c>routes_data_quality.py</c> JSON endpoints:
/// <c>/analyze</c>, <c>/ai-recommendations</c>, <c>/monitoring-status</c>,
/// <c>/monitoring/toggle</c>, <c>/realtime-metrics</c>, <c>/trends</c>, <c>/audit</c>.
/// HTML dashboard routes (<c>/</c>, <c>/rules</c>, <c>/errors</c>, <c>/activities</c>,
/// <c>/rules/create</c>) are intentionally not ported — they live in the React shell.
/// </summary>
[ApiController]
[Route("api/levy/v1/data-quality")]
[Authorize]
public sealed class LevyDataQualityController : ControllerBase
{
    private readonly ILevyDataQualityService _service;
    private readonly ILevyRiskScoringService _riskScoringService;
    private readonly LevyDbContext _db;
    private readonly ILogger<LevyDataQualityController> _logger;

    public LevyDataQualityController(
        ILevyDataQualityService service,
        ILevyRiskScoringService riskScoringService,
        LevyDbContext db,
        ILogger<LevyDataQualityController> logger)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _riskScoringService = riskScoringService ?? throw new ArgumentNullException(nameof(riskScoringService));
        _db = db ?? throw new ArgumentNullException(nameof(db));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

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

    private async Task<int> ResolveEffectiveTaxYearAsync(int? requestedYear, CancellationToken cancellationToken)
    {
        if (requestedYear.HasValue)
        {
            return requestedYear.Value;
        }

        var latestRateYear = await _db.LevyRates
            .AsNoTracking()
            .Select(rate => (int?)rate.EffectiveDate.Year)
            .MaxAsync(cancellationToken);

        var latestCertificationYear = await _db.LevyCertifications
            .AsNoTracking()
            .Select(certification => (int?)certification.TaxYear)
            .MaxAsync(cancellationToken);

        return new[] { latestRateYear, latestCertificationYear }
            .Where(value => value.HasValue)
            .Select(value => value!.Value)
            .DefaultIfEmpty(DateTime.UtcNow.Year)
            .Max();
    }

    /// <summary>Trigger a data-quality analysis (placeholder).</summary>
    [HttpPost("analyze")]
    [ProducesResponseType(typeof(LevyDataQualityAnalysisResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Analyze(
        [FromBody] LevyDataQualityAnalysisRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.AnalyzeAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "[LevyDataQuality] Analyze rejected: {Message}", ex.Message);
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    /// <summary>Get AI-powered data-quality recommendations.</summary>
    [HttpPost("ai-recommendations")]
    [HttpGet("ai-recommendations")]
    [ProducesResponseType(typeof(LevyAiRecommendationsResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AiRecommendations(
        [FromBody] LevyAiRecommendationsRequest? request,
        CancellationToken cancellationToken)
    {
        try
        {
            var effective = request ?? new LevyAiRecommendationsRequest();
            var result = await _service.GetAiRecommendationsAsync(effective, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "[LevyDataQuality] AI recommendations rejected: {Message}", ex.Message);
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    /// <summary>Get real-time monitoring status.</summary>
    [HttpGet("monitoring-status")]
    [ProducesResponseType(typeof(LevyMonitoringStatusResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> MonitoringStatus(CancellationToken cancellationToken)
    {
        var result = await _service.GetMonitoringStatusAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>Enable or disable real-time monitoring.</summary>
    [HttpPost("monitoring/toggle")]
    [ProducesResponseType(typeof(LevyMonitoringToggleResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ToggleMonitoring(
        [FromBody] LevyMonitoringToggleRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.ToggleMonitoringAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "[LevyDataQuality] Monitoring toggle rejected: {Message}", ex.Message);
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    /// <summary>Get real-time data-quality metrics.</summary>
    [HttpGet("realtime-metrics")]
    [ProducesResponseType(typeof(LevyRealtimeMetricsResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> RealtimeMetrics(CancellationToken cancellationToken)
    {
        var result = await _service.GetRealtimeMetricsAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>Get per-district levy risk scoring output.</summary>
    [AllowAnonymous]
    [HttpGet("district-risk-summary")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> DistrictRiskSummary(
        [FromQuery] int? taxYear,
        CancellationToken cancellationToken)
    {
        var effectiveYear = await ResolveEffectiveTaxYearAsync(taxYear, cancellationToken);
        LevyDistrictRiskSummaryResult result =
            await _riskScoringService.GetDistrictRiskSummaryAsync(effectiveYear, cancellationToken);

        var currentRates = await _db.LevyRates
            .AsNoTracking()
            .Include(rate => rate.District)
            .Where(rate => rate.EffectiveDate.Year == effectiveYear && rate.ExpirationDate == null)
            .ToListAsync(cancellationToken);

        var priorRates = await _db.LevyRates
            .AsNoTracking()
            .Include(rate => rate.District)
            .Where(rate => rate.EffectiveDate.Year == effectiveYear - 1 && rate.ExpirationDate == null)
            .ToListAsync(cancellationToken);

        var priorRateByDistrictCode = priorRates
            .Where(rate => !string.IsNullOrWhiteSpace(rate.District?.DistrictCode))
            .GroupBy(rate => rate.District!.DistrictCode, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(rate => rate.EffectiveDate).First(),
                StringComparer.OrdinalIgnoreCase);

        var certificationByDistrictCode = (await _db.LevyCertifications
                .AsNoTracking()
                .Where(certification => certification.TaxYear == effectiveYear)
                .ToListAsync(cancellationToken))
            .Where(certification => !string.IsNullOrWhiteSpace(certification.DistrictCode))
            .GroupBy(certification => certification.DistrictCode, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.OrderByDescending(certification => certification.CreatedAt).First(),
                StringComparer.OrdinalIgnoreCase);

        var riskByDistrictCode = result.Districts
            .Where(score => !string.IsNullOrWhiteSpace(score.DistrictCode))
            .GroupBy(score => score.DistrictCode, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => group.First(),
                StringComparer.OrdinalIgnoreCase);

        var districts = currentRates.Select(rate =>
        {
            var districtCode = rate.District?.DistrictCode ?? rate.DistrictId?.ToString() ?? "unassigned";
            priorRateByDistrictCode.TryGetValue(districtCode, out var priorRate);
            certificationByDistrictCode.TryGetValue(districtCode, out var certification);
            riskByDistrictCode.TryGetValue(districtCode, out var risk);

            var statutoryLimit = ResolveStatutoryLimit(rate.District?.DistrictType);
            var utilizationPct = statutoryLimit > 0m
                ? Math.Round(rate.Rate / statutoryLimit * 100m, 2)
                : 0m;
            var priorYearRate = priorRate?.Rate ?? 0m;
            var yoyDelta = priorYearRate > 0m
                ? Math.Round((rate.Rate - priorYearRate) / priorYearRate * 100m, 2)
                : 0m;

            return new
            {
                districtId = districtCode,
                districtCode,
                districtName = rate.District?.Name ?? districtCode,
                riskFlag = risk?.OverallRisk ?? "ok",
                riskReasons = risk?.RiskReasons ?? Array.Empty<string>(),
                confidence = risk?.Confidence ?? 0d,
                currentRate = rate.Rate,
                statutoryLimit,
                utilizationPct,
                priorYearRate,
                yoyDelta,
                certificationStatus = certification?.Status.ToString().ToLowerInvariant() ?? "uncertified",
                computedAt = risk?.ComputedAt,
                computedFrom = risk?.ComputedFrom,
            };
        }).ToList();

        return Ok(new
        {
            success = result.Success,
            error = result.Error,
            districts,
            taxYear = effectiveYear,
            generatedAt = result.GeneratedAt,
            provenanceNote = !string.IsNullOrWhiteSpace(result.ProvenanceNote)
                ? result.ProvenanceNote
                : "Computed from LevyRates and LevyCertifications using the canonical levy risk rules engine.",
        });
    }

    /// <summary>Run a levy-trend analysis.</summary>
    [HttpPost("trends")]
    [ProducesResponseType(typeof(LevyTrendAnalysisRes), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Trends(
        [FromBody] LevyTrendAnalysisReq request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.AnalyzeTrendsAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "[LevyDataQuality] Trend analysis rejected: {Message}", ex.Message);
            return BadRequest(new { success = false, error = ex.Message });
        }
    }

    /// <summary>Run a comprehensive data-quality audit.</summary>
    [HttpPost("audit")]
    [ProducesResponseType(typeof(LevyDataQualityAuditResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Audit(
        [FromBody] LevyDataQualityAuditRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _service.AuditAsync(request, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "[LevyDataQuality] Audit rejected: {Message}", ex.Message);
            return BadRequest(new { success = false, error = ex.Message });
        }
    }
}
