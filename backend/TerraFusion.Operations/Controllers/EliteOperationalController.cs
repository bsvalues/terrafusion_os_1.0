// TerraFusion.Operations/Controllers/EliteOperationalController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.Operations.Services;
using TerraFusion.Operations.Interfaces;
using TerraFusion.Operations.Models;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.Operations.Controllers;

/// <summary>
/// Elite Operational Excellence Controller - Championship-level operational management
/// Provides REST API endpoints for transcendent government operational excellence
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "EliteOperational")]
public class EliteOperationalController : ControllerBase
{
    private readonly IEliteOperationalService _eliteOperationalService;
    private readonly IAuditLogger _auditLogger;
    private readonly ILogger<EliteOperationalController> _logger;

    public EliteOperationalController(
        IEliteOperationalService eliteOperationalService,
        IAuditLogger auditLogger,
        ILogger<EliteOperationalController> logger)
    {
        _eliteOperationalService = eliteOperationalService;
        _auditLogger = auditLogger;
        _logger = logger;
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
                $"Elite operational initialization requested by {User.Identity?.Name}");

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
            await _auditLogger.LogErrorAsync("EliteOperationalInitializeError", ex, User.Identity?.Name ?? "Unknown");

            return StatusCode(500, new
            {
                Error = "Elite Operational Excellence initialization failed",
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
                $"Elite operational cycle requested by {User.Identity?.Name}");

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
            await _auditLogger.LogErrorAsync("EliteOperationalCycleError", ex, User.Identity?.Name ?? "Unknown");

            return StatusCode(500, new
            {
                Error = "Elite Operational Excellence cycle failed",
                Message = ex.Message
            });
        }
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
                $"Elite dashboard requested by {User.Identity?.Name}");

            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            _logger.LogInformation("Elite Operational Dashboard generated with excellence score: {Score}/100",
                dashboard.OperationalExcellenceScore);

            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate Elite Operational Dashboard");
            await _auditLogger.LogErrorAsync("EliteOperationalDashboardError", ex, User.Identity?.Name ?? "Unknown");

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
    [ProducesResponseType(typeof(EliteSystemStatus), StatusCodes.Status200OK)]
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
                Uptime = dashboard.SystemStatus.SystemUptime,
                ActiveServices = dashboard.SystemStatus.ActiveServices,
                ResponseTime = $"{dashboard.SystemStatus.ResponseTime.TotalMilliseconds}ms",
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
    /// Trigger Elite Emergency Response
    /// Activates championship-level emergency response protocols
    /// </summary>
    /// <param name="request">Elite emergency request details</param>
    /// <returns>Elite emergency response result</returns>
    [HttpPost("emergency")]
    [ProducesResponseType(typeof(EliteEmergencyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> TriggerEliteEmergencyResponse([FromBody] EliteEmergencyRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest("Elite emergency request is required");
            }

            await _auditLogger.LogSecurityEventAsync("EliteEmergencyTriggered",
                $"Elite emergency response triggered: {request.EmergencyType} by {User.Identity?.Name}",
                User.Identity?.Name ?? "Unknown");

            var response = await _eliteOperationalService.TriggerEliteEmergencyResponseAsync(request);

            if (response.Success)
            {
                _logger.LogWarning("🚨 Elite Emergency Response completed for {EmergencyType} with {ActionsCount} actions",
                    request.EmergencyType, response.ActionsExecuted.Count);
                return Ok(response);
            }
            else
            {
                _logger.LogError("Elite Emergency Response failed: {Error}", response.ErrorMessage);
                return StatusCode(500, response);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to execute Elite Emergency Response");
            await _auditLogger.LogErrorAsync("EliteEmergencyResponseError", ex, User.Identity?.Name ?? "Unknown");

            return StatusCode(500, new
            {
                Error = "Elite Emergency Response failed",
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

    /// <summary>
    /// Get Elite Health Metrics
    /// Returns championship-level health analytics
    /// </summary>
    /// <returns>Elite health metrics</returns>
    [HttpGet("health")]
    [ProducesResponseType(typeof(EliteHealthMetrics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEliteHealthMetrics()
    {
        try
        {
            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            return Ok(dashboard.HealthMetrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Elite Health Metrics");
            return StatusCode(500, new
            {
                Error = "Elite Health Metrics retrieval failed",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get Elite Security Metrics
    /// Returns championship-level security analytics
    /// </summary>
    /// <returns>Elite security metrics</returns>
    [HttpGet("security")]
    [ProducesResponseType(typeof(EliteSecurityMetrics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEliteSecurityMetrics()
    {
        try
        {
            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            return Ok(dashboard.SecurityMetrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Elite Security Metrics");
            return StatusCode(500, new
            {
                Error = "Elite Security Metrics retrieval failed",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get Elite Compliance Metrics
    /// Returns championship-level compliance analytics
    /// </summary>
    /// <returns>Elite compliance metrics</returns>
    [HttpGet("compliance")]
    [ProducesResponseType(typeof(EliteComplianceMetrics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetEliteComplianceMetrics()
    {
        try
        {
            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            return Ok(dashboard.ComplianceMetrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Elite Compliance Metrics");
            return StatusCode(500, new
            {
                Error = "Elite Compliance Metrics retrieval failed",
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
    /// Get County Service Metrics
    /// Returns championship-level county service delivery metrics
    /// </summary>
    /// <returns>County service metrics</returns>
    [HttpGet("county-services")]
    [ProducesResponseType(typeof(CountyServiceMetrics), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCountyServiceMetrics()
    {
        try
        {
            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            return Ok(dashboard.CountyServiceMetrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get County Service Metrics");
            return StatusCode(500, new
            {
                Error = "County Service Metrics retrieval failed",
                Message = ex.Message
            });
        }
    }

    /// <summary>
    /// Get Citizen Service Excellence Metrics
    /// Returns championship-level citizen service quality metrics
    /// </summary>
    /// <returns>Citizen service excellence metrics</returns>
    [HttpGet("citizen-services")]
    [ProducesResponseType(typeof(CitizenServiceExcellence), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCitizenServiceExcellenceMetrics()
    {
        try
        {
            var dashboard = await _eliteOperationalService.GetEliteOperationalDashboardAsync();

            return Ok(dashboard.CitizenServiceExcellence);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Citizen Service Excellence Metrics");
            return StatusCode(500, new
            {
                Error = "Citizen Service Excellence Metrics retrieval failed",
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
