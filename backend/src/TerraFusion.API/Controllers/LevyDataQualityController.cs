using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
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
    private readonly ILogger<LevyDataQualityController> _logger;

    public LevyDataQualityController(
        ILevyDataQualityService service,
        ILogger<LevyDataQualityController> logger)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
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
