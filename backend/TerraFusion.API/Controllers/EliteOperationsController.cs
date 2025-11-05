// TerraFusion.API/Controllers/EliteOperationsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.Operations.Services;
using TerraFusion.Operations.Interfaces;
using TerraFusion.Operations.Models;
using TerraFusion.Abstractions.Interfaces;
using ElitePerformanceMetrics = TerraFusion.Operations.Models.ElitePerformanceMetrics;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Elite Operations Controller - Championship-level operational management integrated with TerraFusion API
/// Provides REST API endpoints for transcendent government operational excellence
/// </summary>
[ApiController]
[Route("api/elite-operations")]
public class EliteOperationsController : ControllerBase
{
    private readonly IEliteOperationalService _eliteOperationalService;
    private readonly IAuditLogger _auditLogger;
    private readonly ILogger<EliteOperationsController> _logger;

    public EliteOperationsController(
        IEliteOperationalService eliteOperationalService,
        IAuditLogger auditLogger,
        ILogger<EliteOperationsController> logger)
    {
        _eliteOperationalService = eliteOperationalService;
        _auditLogger = auditLogger;
        _logger = logger;
    }

    /// <summary>
    /// Get Elite Operational Excellence Dashboard
    /// Returns comprehensive championship-level operational metrics
    /// </summary>
    /// <returns>Elite operational dashboard data</returns>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(EliteOperationalDashboard), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetEliteOperationalDashboard()
    {
        try
        {
            await _auditLogger.LogAsync("EliteOperationalDashboardRequest",
                new { RequestedBy = User.Identity?.Name ?? "Anonymous", Timestamp = DateTime.UtcNow });

            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            _logger.LogInformation("🏆 Elite Operational Dashboard generated with excellence score: {Score}/100",
                dashboard.OperationalExcellenceScore);

            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Elite Operational Dashboard");
            await _auditLogger.LogAsync("EliteOperationalDashboardError",
                new { Error = ex.Message, User = User.Identity?.Name ?? "Anonymous" });

            return StatusCode(500, new
            {
                Error = "Elite Operational Dashboard generation failed",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get Elite System Status
    /// Returns real-time championship-level system status
    /// </summary>
    /// <returns>Elite system status information</returns>
    [HttpGet("status")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEliteSystemStatus()
    {
        try
        {
            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            return Ok(new
            {
                Status = "Elite Operational Excellence",
                Health = dashboard.SystemStatus.OverallHealth,
                OperationalScore = dashboard.OperationalExcellenceScore,
                Uptime = dashboard.SystemStatus.SystemUptime.ToString(@"dd\.hh\:mm\:ss"),
                ActiveServices = dashboard.SystemStatus.ActiveServices,
                ResponseTime = $"{dashboard.SystemStatus.ResponseTime.TotalMilliseconds:F0}ms",
                ThroughputPerSecond = dashboard.SystemStatus.ThroughputPerSecond,
                AIAgents = dashboard.AIAgentStatus.ActiveAgents,
                Counties = dashboard.CountyServiceMetrics.ActiveCounties,
                CitizenSatisfaction = dashboard.CitizenServiceExcellence.CitizenFeedbackScore,
                Message = "Government. Transcended. - Championship Level Operational Excellence"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Elite System Status");
            return StatusCode(500, new
            {
                Error = "Elite System Status retrieval failed",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Execute Elite Operational Excellence Cycle
    /// Performs comprehensive system optimization and health validation
    /// </summary>
    /// <returns>Elite operational cycle execution result</returns>
    [HttpPost("execute-cycle")]
    [ProducesResponseType(typeof(EliteOperationalResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ExecuteOperationalExcellenceCycle()
    {
        try
        {
            await _auditLogger.LogAsync("EliteOperationalCycleRequest",
                new { RequestedBy = User.Identity?.Name ?? "Anonymous", Timestamp = DateTime.UtcNow });

            var result = await _eliteOperationalService.ExecuteOperationalExcellenceCycleAsync();

            if (result.Success)
            {
                _logger.LogInformation("🚀 Elite Operational Excellence cycle completed with score: {Score}/100",
                    result.OperationalExcellenceScore);
                return Ok(result);
            }
            else
            {
                _logger.LogError("Elite Operational Excellence cycle failed: {Error}", result.ErrorMessage);
                return StatusCode(500, result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to execute Elite Operational Excellence cycle");
            await _auditLogger.LogAsync("EliteOperationalCycleError",
                new { Error = ex.Message, User = User.Identity?.Name ?? "Anonymous" });

            return StatusCode(500, new
            {
                Error = "Elite Operational Excellence cycle failed",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get Elite Operational Excellence Score
    /// Returns current championship-level operational excellence rating
    /// </summary>
    /// <returns>Operational excellence score</returns>
    [HttpGet("excellence-score")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEliteOperationalExcellenceScore()
    {
        try
        {
            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            return Ok(new
            {
                Score = dashboard.OperationalExcellenceScore,
                Rating = GetExcellenceRating(dashboard.OperationalExcellenceScore),
                Message = GetExcellenceMessage(dashboard.OperationalExcellenceScore),
                GeneratedAt = dashboard.GeneratedAt,
                Classification = "Government. Transcended. - Championship Level Excellence"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Elite Operational Excellence Score");
            return StatusCode(500, new
            {
                Error = "Elite Operational Excellence Score retrieval failed",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Initialize Elite Operational Excellence Framework
    /// Establishes championship-level operational capabilities
    /// </summary>
    /// <returns>Elite operational initialization result</returns>
    [HttpPost("initialize")]
    [ProducesResponseType(typeof(EliteOperationalResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> InitializeEliteOperationalExcellence()
    {
        try
        {
            await _auditLogger.LogAsync("EliteOperationalInitializeRequest",
                new { RequestedBy = User.Identity?.Name ?? "Anonymous", Timestamp = DateTime.UtcNow });

            var result = await _eliteOperationalService.InitializeAsync();

            if (result.Success)
            {
                _logger.LogInformation("🏆 Elite Operational Excellence framework initialized successfully");
                return Ok(result);
            }
            else
            {
                _logger.LogError("Elite Operational Excellence initialization failed: {Error}", result.ErrorMessage);
                return StatusCode(500, result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Elite Operational Excellence framework");
            await _auditLogger.LogAsync("EliteOperationalInitializeError",
                new { Error = ex.Message, User = User.Identity?.Name ?? "Anonymous" });

            return StatusCode(500, new
            {
                Error = "Elite Operational Excellence initialization failed",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get AI Agent Coordination Status
    /// Returns championship-level AI agent coordination metrics
    /// </summary>
    /// <returns>AI agent coordination status</returns>
    [HttpGet("ai-agents")]
    [ProducesResponseType(typeof(AIAgentCoordinationStatus), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAIAgentCoordinationStatus()
    {
        try
        {
            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            return Ok(dashboard.AIAgentStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get AI Agent Coordination Status");
            return StatusCode(500, new
            {
                Error = "AI Agent Coordination Status retrieval failed",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get Elite Performance Metrics
    /// Returns championship-level performance analytics
    /// </summary>
    /// <returns>Elite performance metrics</returns>
    [HttpGet("performance")]
    [ProducesResponseType(typeof(ElitePerformanceMetrics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetElitePerformanceMetrics()
    {
        try
        {
            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            return Ok(dashboard.PerformanceMetrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Elite Performance Metrics");
            return StatusCode(500, new
            {
                Error = "Elite Performance Metrics retrieval failed",
                Message = ex.Message
            });
        }
    }

    // Private helper methods

    private static string GetExcellenceRating(double score)
    {
        return score switch
        {
            >= 98.0 => "Championship Elite",
            >= 95.0 => "Elite Excellence",
            >= 90.0 => "Superior Performance",
            >= 80.0 => "High Performance",
            >= 70.0 => "Good Performance",
            _ => "Needs Improvement"
        };
    }

    private static string GetExcellenceMessage(double score)
    {
        return score switch
        {
            >= 98.0 => "Transcendent operational excellence - Government technology championship achieved",
            >= 95.0 => "Elite operational excellence - Superior government service delivery",
            >= 90.0 => "Superior operational performance - Excellent government service standards",
            >= 80.0 => "High operational performance - Strong government service delivery",
            >= 70.0 => "Good operational performance - Acceptable government service standards",
            _ => "Operational performance requires improvement - Enhancement needed"
        };
    }
}
