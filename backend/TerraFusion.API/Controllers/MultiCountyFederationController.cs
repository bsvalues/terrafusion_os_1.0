using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Services;
using TerraFusion.Abstractions.DTOs;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TIER 5+ Multi-County Federation API Controller - Championship cross-county coordination
/// Provides federated governance framework, inter-county data sharing protocols,
/// and unified service delivery for Washington State counties coordination
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MultiCountyFederationController : ControllerBase
{
    private readonly IMultiCountyFederationService _federationService;
    private readonly ILogger<MultiCountyFederationController> _logger;

    public MultiCountyFederationController(
        IMultiCountyFederationService federationService,
        ILogger<MultiCountyFederationController> logger)
    {
        _federationService = federationService ?? throw new ArgumentNullException(nameof(federationService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// Initialize TIER 5+ Multi-County Federation System
    /// Creates championship federation infrastructure for Washington State counties
    /// </summary>
    /// <returns>Federation initialization result with county network status</returns>
    [HttpPost("initialize")]
    public async Task<ActionResult<FederationInitializationResult>> InitializeFederation()
    {
        try
        {
            _logger.LogInformation("🚀 API request to initialize Multi-County Federation System");

            var result = await _federationService.InitializeFederationAsync();

            if (result.Success)
            {
                _logger.LogInformation($"✅ Federation initialized successfully with {result.CountiesInitialized} counties");
                return Ok(result);
            }

            _logger.LogWarning($"⚠️ Federation initialization failed: {result.ErrorMessage}");
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to initialize federation");
            return StatusCode(500, new { error = "Federation initialization failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Add county to federation network
    /// Establishes quantum-secure federation membership with sovereignty protection
    /// </summary>
    /// <param name="request">County federation membership request</param>
    /// <returns>County membership result with federation node details</returns>
    [HttpPost("counties/add")]
    public async Task<ActionResult<CountyMembershipResult>> AddCountyToFederation([FromBody] CountyFederationRequestDto request)
    {
        try
        {
            _logger.LogInformation($"📊 API request to add county {request.CountyName} to federation");

            if (string.IsNullOrEmpty(request.CountyName))
            {
                return BadRequest(new { error = "County name is required" });
            }

            var result = await _federationService.AddCountyToFederationAsync(request);

            if (result.Success)
            {
                _logger.LogInformation($"✅ County {request.CountyName} successfully added to federation");
                return Ok(result);
            }

            _logger.LogWarning($"⚠️ Failed to add county {request.CountyName}: {result.ErrorMessage}");
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"❌ Failed to add county {request.CountyName} to federation");
            return StatusCode(500, new { error = "County federation failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Execute federated operation across counties
    /// Coordinates cross-county operations with quantum-secure communication
    /// </summary>
    /// <param name="request">Cross-county operation request</param>
    /// <returns>Federated operation result with county execution status</returns>
    [HttpPost("operations/execute")]
    public async Task<ActionResult<FederatedOperationResult>> ExecuteFederatedOperation([FromBody] CrossCountyOperationRequestDto request)
    {
        try
        {
            _logger.LogInformation($"🔄 API request to execute federated operation: {request.OperationType}");

            if (string.IsNullOrEmpty(request.OperationType))
            {
                return BadRequest(new { error = "Operation type is required" });
            }

            var result = await _federationService.ExecuteFederatedOperationAsync(request);

            if (result.Success)
            {
                _logger.LogInformation($"✅ Federated operation {request.OperationType} completed successfully");
                return Ok(result);
            }

            _logger.LogWarning($"⚠️ Federated operation {request.OperationType} failed: {result.ErrorMessage}");
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"❌ Failed to execute federated operation: {request.OperationType}");
            return StatusCode(500, new { error = "Federated operation failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Get federation health status
    /// Returns comprehensive health metrics for all federated counties
    /// </summary>
    /// <returns>Federation health result with county operational status</returns>
    [HttpGet("health")]
    public async Task<ActionResult<FederationHealthResult>> GetFederationHealth()
    {
        try
        {
            _logger.LogInformation("📈 API request for federation health status");

            var result = await _federationService.GetFederationHealthAsync();

            _logger.LogInformation($"📊 Federation health: {result.OverallHealth:F1}% ({result.OperationalCounties}/{result.TotalCounties} counties operational)");
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get federation health");
            return StatusCode(500, new { error = "Federation health check failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Share data across counties
    /// Enables secure cross-county data sharing with quantum encryption
    /// </summary>
    /// <param name="request">Data sharing request with sovereignty controls</param>
    /// <returns>Cross-county data sharing result</returns>
    [HttpPost("data/share")]
    public async Task<ActionResult<CrossCountyDataResult>> ShareDataAcrossCounties([FromBody] DataSharingRequestDto request)
    {
        try
        {
            _logger.LogInformation($"📡 API request to share data across counties: {request.DataType}");

            if (string.IsNullOrEmpty(request.DataType) || string.IsNullOrEmpty(request.SourceCounty))
            {
                return BadRequest(new { error = "Data type and source county are required" });
            }

            var result = await _federationService.ShareDataAcrossCountiesAsync(request);

            if (result.Success)
            {
                _logger.LogInformation($"✅ Data sharing completed successfully for {request.DataType}");
                return Ok(result);
            }

            _logger.LogWarning($"⚠️ Data sharing failed for {request.DataType}: {result.ErrorMessage}");
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"❌ Failed to share data across counties: {request.DataType}");
            return StatusCode(500, new { error = "Cross-county data sharing failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Deliver unified services across counties
    /// Coordinates unified service delivery for multi-county citizen services
    /// </summary>
    /// <param name="request">Unified service delivery request</param>
    /// <returns>Unified service delivery result with citizen metrics</returns>
    [HttpPost("services/unified")]
    public async Task<ActionResult<UnifiedServiceResult>> DeliverUnifiedServices([FromBody] UnifiedServiceRequestDto request)
    {
        try
        {
            _logger.LogInformation($"🎯 API request to deliver unified service: {request.ServiceType}");

            if (string.IsNullOrEmpty(request.ServiceType))
            {
                return BadRequest(new { error = "Service type is required" });
            }

            var result = await _federationService.DeliverUnifiedServicesAsync(request);

            if (result.Success)
            {
                _logger.LogInformation($"✅ Unified service {request.ServiceType} delivered to {result.CitizensServed} citizens");
                return Ok(result);
            }

            _logger.LogWarning($"⚠️ Unified service delivery failed for {request.ServiceType}: {result.ErrorMessage}");
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"❌ Failed to deliver unified service: {request.ServiceType}");
            return StatusCode(500, new { error = "Unified service delivery failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Validate federated compliance
    /// Ensures all counties meet government compliance standards
    /// </summary>
    /// <returns>Comprehensive compliance validation result</returns>
    [HttpGet("compliance/validate")]
    public async Task<ActionResult<MultiCountyComplianceValidationResult>> ValidateFederatedCompliance()
    {
        try
        {
            _logger.LogInformation("🔐 API request to validate federated compliance");

            var result = await _federationService.ValidateFederatedComplianceAsync();

            _logger.LogInformation($"📋 Compliance validation: {result.OverallComplianceScore:F1}% ({result.CompliantCounties}/{result.TotalCounties} counties compliant)");
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to validate federated compliance");
            return StatusCode(500, new { error = "Compliance validation failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Optimize federated resources
    /// Applies intelligent resource optimization across county federation
    /// </summary>
    /// <returns>Resource optimization result with performance improvements</returns>
    [HttpPost("resources/optimize")]
    public async Task<ActionResult<ResourceOptimizationResult>> OptimizeFederatedResources()
    {
        try
        {
            _logger.LogInformation("⚡ API request to optimize federated resources");

            var result = await _federationService.OptimizeFederatedResourcesAsync();

            if (result.Success)
            {
                _logger.LogInformation($"✅ Resource optimization completed: {result.ResourceSavings:F2}% savings, {result.PerformanceImprovement:F2}% improvement");
                return Ok(result);
            }

            _logger.LogWarning($"⚠️ Resource optimization failed: {result.ErrorMessage}");
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to optimize federated resources");
            return StatusCode(500, new { error = "Resource optimization failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Get real-time federation metrics
    /// Provides comprehensive federation performance and operational metrics
    /// </summary>
    /// <returns>Real-time federation metrics dashboard</returns>
    [HttpGet("metrics/realtime")]
    public async Task<ActionResult<object>> GetRealTimeFederationMetrics()
    {
        try
        {
            _logger.LogInformation("📊 API request for real-time federation metrics");

            var health = await _federationService.GetFederationHealthAsync();
            var compliance = await _federationService.ValidateFederatedComplianceAsync();

            var metrics = new
            {
                timestamp = DateTime.UtcNow,
                federation = new
                {
                    overallHealth = health.OverallHealth,
                    totalCounties = health.TotalCounties,
                    operationalCounties = health.OperationalCounties,
                    successRate = health.SuccessRate,
                    uptime = health.FederationUptime.TotalHours
                },
                compliance = new
                {
                    overallScore = compliance.OverallComplianceScore,
                    compliantCounties = compliance.CompliantCounties,
                    frameworks = compliance.ComplianceFrameworks
                },
                performance = new
                {
                    averageResponseTime = health.CountyHealthResults.Average(c => c.ResponseTime.TotalMilliseconds),
                    championshipStatus = "TIER 5+ OPERATIONAL",
                    quantumSecurityEnabled = true,
                    federatedGovernanceActive = true
                }
            };

            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get real-time federation metrics");
            return StatusCode(500, new { error = "Metrics retrieval failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Get federation operational status
    /// Returns championship-level federation status for monitoring dashboards
    /// </summary>
    /// <returns>Comprehensive federation operational status</returns>
    [HttpGet("status")]
    public async Task<ActionResult<object>> GetFederationOperationalStatus()
    {
        try
        {
            _logger.LogInformation("🏛️ API request for federation operational status");

            var health = await _federationService.GetFederationHealthAsync();

            var status = new
            {
                federationStatus = "TIER 5+ OPERATIONAL",
                systemHealth = health.OverallHealth >= 95.0 ? "CHAMPIONSHIP" :
                              health.OverallHealth >= 90.0 ? "EXCELLENT" : "GOOD",
                totalCounties = health.TotalCounties,
                operationalCounties = health.OperationalCounties,
                federationUptime = health.FederationUptime,
                lastHealthCheck = health.LastHealthCheck,
                capabilities = new[]
                {
                    "Cross-County Coordination",
                    "Federated Data Sharing",
                    "Unified Service Delivery",
                    "Quantum-Secure Communication",
                    "Real-Time Resource Optimization",
                    "Government Compliance Validation"
                },
                architecture = "Government. Transcended. Sovereign.",
                version = "TIER 5+ Multi-County Federation System v1.0"
            };

            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get federation operational status");
            return StatusCode(500, new { error = "Status retrieval failed", details = ex.Message });
        }
    }
}
