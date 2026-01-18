/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CODEX 3-6-9 FRAMEWORK API CONTROLLER
 * Divine Mathematical Balance API Endpoints
 * Exposes 3-6-9 Framework for Real-time Government Excellence
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.DTOs;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers;

/// <summary>
/// Codex 3-6-9 Framework API Controller
/// Provides championship-level endpoints for divine mathematical balance
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class Codex369Controller : ControllerBase
{
    private readonly ICodex369FrameworkService _codexService;
    private readonly ILogger<Codex369Controller> _logger;

    public Codex369Controller(
        ICodex369FrameworkService codexService,
        ILogger<Codex369Controller> logger)
    {
        _codexService = codexService;
        _logger = logger;
    }

    /// <summary>
    /// Get complete Codex 3-6-9 Framework status
    /// </summary>
    /// <param name="request">Calculation request parameters</param>
    /// <returns>Complete framework status with all 3 levels</returns>
    [HttpPost("status")]
    [ProducesResponseType(typeof(Codex369StatusDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<Codex369StatusDto>> GetFrameworkStatus(
        [FromBody] Codex369CalculationRequest request)
    {
        _logger.LogInformation("🔢 API: Calculating Codex 3-6-9 Framework status");

        try
        {
            var status = await _codexService.CalculateFrameworkStatusAsync(request);

            if (status.UltimatePower.InDivineBalance)
            {
                _logger.LogInformation("🌟 API: DIVINE BALANCE ACHIEVED! Score: {Score:F2}/12",
                    status.CurrentPowerScore);
            }

            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ API: Error calculating framework status");
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Framework Calculation Failed",
                Detail = ex.Message,
                Status = StatusCodes.Status500InternalServerError,
                Instance = HttpContext.Request.Path
            });
        }
    }

    /// <summary>
    /// Get real-time dashboard data for 3-6-9 framework
    /// </summary>
    /// <param name="countyId">Optional county filter</param>
    /// <returns>Real-time framework status</returns>
    [HttpGet("realtime")]
    [ProducesResponseType(typeof(Codex369StatusDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<Codex369StatusDto>> GetRealtimeStatus(
        [FromQuery] string? countyId = null)
    {
        _logger.LogInformation("📊 API: Getting real-time Codex 3-6-9 status for county: {County}",
            countyId ?? "ALL");

        var status = await _codexService.GetRealtimeFrameworkStatusAsync(countyId);
        return Ok(status);
    }

    /// <summary>
    /// Get Foundation Level (3) metrics only
    /// </summary>
    /// <param name="countyId">Optional county filter</param>
    /// <returns>Foundation-level metrics</returns>
    [HttpGet("foundation")]
    [ProducesResponseType(typeof(List<FoundationMetric>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<FoundationMetric>>> GetFoundationMetrics(
        [FromQuery] string? countyId = null)
    {
        _logger.LogInformation("📊 API: Getting Foundation Level (3) metrics");

        var metrics = await _codexService.MeasureFoundationMetricsAsync(countyId);
        return Ok(metrics);
    }

    /// <summary>
    /// Get Amplification Level (6) metrics with 666 safeguard validation
    /// </summary>
    /// <param name="countyId">Optional county filter</param>
    /// <returns>Amplification-level metrics</returns>
    [HttpGet("amplification")]
    [ProducesResponseType(typeof(List<AmplificationMetric>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AmplificationMetric>>> GetAmplificationMetrics(
        [FromQuery] string? countyId = null)
    {
        _logger.LogInformation("🔊 API: Getting Amplification Level (6) metrics");

        var foundationMetrics = await _codexService.MeasureFoundationMetricsAsync(countyId);
        var amplifications = await _codexService.AmplifyMetricsAsync(foundationMetrics);

        // Check for 666 warnings
        var unsafeAmplifications = amplifications.Where(a => !a.SafeFromImbalance).ToList();
        if (unsafeAmplifications.Any())
        {
            _logger.LogWarning("⚠️ API: {Count} amplifications approaching 666 threshold!",
                unsafeAmplifications.Count);
        }

        return Ok(amplifications);
    }

    /// <summary>
    /// Get Ultimate Power Level (9) score
    /// </summary>
    /// <param name="countyId">Optional county filter</param>
    /// <returns>Ultimate power metrics</returns>
    [HttpGet("ultimate-power")]
    [ProducesResponseType(typeof(UltimatePowerMetric), StatusCodes.Status200OK)]
    public async Task<ActionResult<UltimatePowerMetric>> GetUltimatePower(
        [FromQuery] string? countyId = null)
    {
        _logger.LogInformation("⚡ API: Calculating Ultimate Power Level (9)");

        var foundationMetrics = await _codexService.MeasureFoundationMetricsAsync(countyId);
        var amplifications = await _codexService.AmplifyMetricsAsync(foundationMetrics);
        var ultimatePower = await _codexService.CalculateUltimatePowerAsync(amplifications);

        if (ultimatePower.InDivineBalance)
        {
            _logger.LogInformation("🌟 API: DIVINE BALANCE! Ultimate Power: {Score:F2}/12",
                ultimatePower.UltimatePowerScore);
        }

        return Ok(ultimatePower);
    }

    /// <summary>
    /// Validate if a value is safe from 666 threshold
    /// </summary>
    /// <param name="value">Value to validate</param>
    /// <returns>Safeguard validation result</returns>
    [HttpGet("validate-safeguard")]
    [ProducesResponseType(typeof(SafeguardValidationDto), StatusCodes.Status200OK)]
    public ActionResult<SafeguardValidationDto> ValidateSafeguard([FromQuery] double value)
    {
        var isSafe = _codexService.ValidateSafeguard(value);
        var safetyMargin = 666.0 - value;

        var result = new SafeguardValidationDto
        {
            Value = value,
            IsSafe = isSafe,
            SafetyMargin = safetyMargin,
            Threshold = 666.0,
            Message = isSafe
                ? $"✅ Safe: {safetyMargin:F2} points below 666 threshold"
                : $"🚨 DANGER: Value crosses 666 threshold by {Math.Abs(safetyMargin):F2}!"
        };

        if (!isSafe)
        {
            _logger.LogWarning("🚨 API: Safeguard validation failed! Value: {Value}", value);
        }

        return Ok(result);
    }

    /// <summary>
    /// Get framework health summary
    /// </summary>
    /// <returns>Quick health summary</returns>
    [HttpGet("health-summary")]
    [ProducesResponseType(typeof(FrameworkHealthSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<FrameworkHealthSummaryDto>> GetHealthSummary()
    {
        _logger.LogInformation("🏥 API: Getting Codex 3-6-9 health summary");

        var status = await _codexService.GetRealtimeFrameworkStatusAsync();

        var summary = new FrameworkHealthSummaryDto
        {
            CurrentPowerScore = status.CurrentPowerScore,
            TargetScore = 12.0,
            BalanceProximity = status.UltimatePower.BalanceProximity,
            InDivineBalance = status.UltimatePower.InDivineBalance,
            HealthStatus = status.UltimatePower.HealthStatus,
            TotalFoundationMetrics = status.TotalFoundationMetrics,
            TotalAmplifications = status.TotalAmplifications,
            MetricsWithinBaseline = status.FoundationMetrics.Count(m => m.WithinBaseline),
            SafeAmplifications = status.AmplificationMetrics.Count(a => a.SafeFromImbalance),
            ComplianceAligned = status.ComplianceAligned,
            TopRecommendation = status.SystemRecommendations.FirstOrDefault() ?? "System operating optimally",
            LastUpdated = status.StatusTimestamp
        };

        return Ok(summary);
    }
}

/// <summary>
/// Safeguard validation result DTO
/// </summary>
public class SafeguardValidationDto
{
    public double Value { get; set; }
    public bool IsSafe { get; set; }
    public double SafetyMargin { get; set; }
    public double Threshold { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Framework health summary DTO
/// </summary>
public class FrameworkHealthSummaryDto
{
    public double CurrentPowerScore { get; set; }
    public double TargetScore { get; set; }
    public double BalanceProximity { get; set; }
    public bool InDivineBalance { get; set; }
    public SystemHealthStatus HealthStatus { get; set; }
    public int TotalFoundationMetrics { get; set; }
    public int TotalAmplifications { get; set; }
    public int MetricsWithinBaseline { get; set; }
    public int SafeAmplifications { get; set; }
    public bool ComplianceAligned { get; set; }
    public string TopRecommendation { get; set; } = string.Empty;
    public DateTime LastUpdated { get; set; }
}
