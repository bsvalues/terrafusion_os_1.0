using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using TerraFusion.API.Hubs;
using TerraFusion.API.Services;
using TerraFusion.API.Configuration;
using TerraFusion.Abstractions.Interfaces;
using System.Text.Json;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Enhancement Controller - PhD-Level Enhancement Phase Integration
/// Exposes TypeScript enhancement capabilities through unified API endpoints
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnhancementController : ControllerBase
{
    private readonly ILogger<EnhancementController> _logger;
    private readonly IHubContext<EnhancementHub> _enhancementHub;
    private readonly IEnhancementOrchestrationService _enhancementService;
    private readonly IAuditLogger _auditLogger;
    private readonly HttpClient _httpClient;

    public EnhancementController(
        ILogger<EnhancementController> logger,
        IHubContext<EnhancementHub> enhancementHub,
        IEnhancementOrchestrationService enhancementService,
        IAuditLogger auditLogger,
        HttpClient httpClient)
    {
        _logger = logger;
        _enhancementHub = enhancementHub;
        _enhancementService = enhancementService;
        _auditLogger = auditLogger;
        _httpClient = httpClient;
    }

    /// <summary>
    /// Get comprehensive enhancement status for all phases
    /// </summary>
    [HttpGet("status")]
    [AllowAnonymous] // Allow status checks without authentication
    public async Task<ActionResult<EnhancementStatus>> GetEnhancementStatus()
    {
        try
        {
            _logger.LogInformation("🔍 Enhancement status requested");
            
            var status = await _enhancementService.GetEnhancementStatusAsync();
            
            // Broadcast status update to connected clients
            await _enhancementHub.Clients.All.SendAsync("EnhancementStatusUpdate", status);
            
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get enhancement status");
            return StatusCode(500, new { error = "Failed to retrieve enhancement status", details = ex.Message });
        }
    }

    /// <summary>
    /// Execute AI Swarm Virtual Machine operations
    /// </summary>
    [HttpPost("swarm/execute")]
    public async Task<ActionResult<SwarmExecutionResult>> ExecuteSwarmOperation([FromBody] SwarmOperationRequest request)
    {
        try
        {
            _logger.LogInformation("🤖 Swarm operation requested: {Operation}", request.Operation);
            await _auditLogger.LogAsync("ENHANCEMENT_SWARM_EXECUTION", $"Operation: {request.Operation}", true);

            // Forward to AI Swarm Virtual Machine service
            var configService = HttpContext.RequestServices.GetService<ITerraFusionConfigService>();
            var defaultAgentCount = configService?.GetCurrentAgentCount() ?? 50000;
            
            var swarmPayload = new
            {
                operation = request.Operation,
                parameters = request.Parameters ?? new Dictionary<string, object>(),
                agentCount = request.AgentCount ?? defaultAgentCount,
                priority = request.Priority ?? "normal",
                timestamp = DateTime.UtcNow
            };

            var jsonContent = JsonSerializer.Serialize(swarmPayload);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            var enhancementPort = Environment.GetEnvironmentVariable("TF_ENHANCEMENT_PORT");
            if (string.IsNullOrEmpty(enhancementPort))
            {
                return BadRequest(new { error = "ANTI-HARDCODING: TF_ENHANCEMENT_PORT must be configured", message = "No hardcoded ports allowed in TerraFusion OS" });
            }
            var response = await _httpClient.PostAsync($"http://localhost:{enhancementPort}/api/enhancement/swarm/execute", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<SwarmExecutionResult>(responseContent);
                
                await _auditLogger.LogAsync("ENHANCEMENT_SWARM_SUCCESS", $"Operation {request.Operation} completed", true);
                
                // Broadcast real-time metrics
                await _enhancementHub.Clients.All.SendAsync("SwarmOperationComplete", result);
                
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("⚠️ Swarm operation failed: {Operation}", request.Operation);
                return StatusCode(500, new { error = "Swarm operation failed", details = "AI Swarm Virtual Machine unavailable" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Error executing swarm operation: {Operation}", request.Operation);
            await _auditLogger.LogAsync("ENHANCEMENT_SWARM_ERROR", $"Error in {request.Operation}: {ex.Message}", false);
            return StatusCode(500, new { error = "Swarm execution failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Execute Quantum Consciousness Matrix operations
    /// </summary>
    [HttpPost("consciousness/coordinate")]
    public async Task<ActionResult<ConsciousnessCoordinationResult>> CoordinateConsciousness([FromBody] ConsciousnessRequest request)
    {
        try
        {
            _logger.LogInformation("🧠 Consciousness coordination requested: {Species}", request.SpeciesType);
            await _auditLogger.LogAsync("ENHANCEMENT_CONSCIOUSNESS_COORDINATION", $"Species: {request.SpeciesType}", true);

            // Forward to Quantum Consciousness Matrix service
            var consciousnessPayload = new
            {
                speciesType = request.SpeciesType,
                communicationType = request.CommunicationType,
                parameters = request.Parameters ?? new Dictionary<string, object>(),
                priority = request.Priority ?? "normal",
                timestamp = DateTime.UtcNow
            };

            var jsonContent = JsonSerializer.Serialize(consciousnessPayload);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            var enhancementPort = Environment.GetEnvironmentVariable("TF_ENHANCEMENT_PORT");
            if (string.IsNullOrEmpty(enhancementPort))
            {
                return BadRequest(new { error = "ANTI-HARDCODING: TF_ENHANCEMENT_PORT must be configured", message = "No hardcoded ports allowed in TerraFusion OS" });
            }
            var response = await _httpClient.PostAsync($"http://localhost:{enhancementPort}/api/enhancement/consciousness/coordinate", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<ConsciousnessCoordinationResult>(responseContent);
                
                await _auditLogger.LogAsync("ENHANCEMENT_CONSCIOUSNESS_SUCCESS", $"Coordination for {request.SpeciesType} completed", true);
                
                // Broadcast consciousness update
                await _enhancementHub.Clients.All.SendAsync("ConsciousnessUpdate", result);
                
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("⚠️ Consciousness coordination failed: {Species}", request.SpeciesType);
                return StatusCode(500, new { error = "Consciousness coordination failed", details = "Quantum Consciousness Matrix unavailable" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Error coordinating consciousness: {Species}", request.SpeciesType);
            await _auditLogger.LogAsync("ENHANCEMENT_CONSCIOUSNESS_ERROR", $"Error for {request.SpeciesType}: {ex.Message}", false);
            return StatusCode(500, new { error = "Consciousness coordination failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Execute Quantum Security Engine operations
    /// </summary>
    [HttpPost("security/audit")]
    public async Task<ActionResult<SecurityAuditResult>> ExecuteSecurityAudit([FromBody] SecurityAuditRequest request)
    {
        try
        {
            _logger.LogInformation("🔒 Security audit requested: {AuditType}", request.AuditType);
            await _auditLogger.LogAsync("ENHANCEMENT_SECURITY_AUDIT", $"Type: {request.AuditType}", true);

            // Forward to Quantum Security Engine service
            var securityPayload = new
            {
                auditType = request.AuditType,
                scope = request.Scope ?? "full",
                parameters = request.Parameters ?? new Dictionary<string, object>(),
                quantumLevel = request.QuantumLevel ?? "standard",
                timestamp = DateTime.UtcNow
            };

            var jsonContent = JsonSerializer.Serialize(securityPayload);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            var enhancementPort = Environment.GetEnvironmentVariable("TF_ENHANCEMENT_PORT");
            if (string.IsNullOrEmpty(enhancementPort))
            {
                return BadRequest(new { error = "ANTI-HARDCODING: TF_ENHANCEMENT_PORT must be configured", message = "No hardcoded ports allowed in TerraFusion OS" });
            }
            var response = await _httpClient.PostAsync($"http://localhost:{enhancementPort}/api/enhancement/security/audit", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<SecurityAuditResult>(responseContent);
                
                await _auditLogger.LogAsync("ENHANCEMENT_SECURITY_SUCCESS", $"Audit {request.AuditType} completed", true);
                
                // Broadcast security metrics
                await _enhancementHub.Clients.All.SendAsync("SecurityAuditComplete", result);
                
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("⚠️ Security audit failed: {AuditType}", request.AuditType);
                return StatusCode(500, new { error = "Security audit failed", details = "Quantum Security Engine unavailable" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Error executing security audit: {AuditType}", request.AuditType);
            await _auditLogger.LogAsync("ENHANCEMENT_SECURITY_ERROR", $"Error in {request.AuditType}: {ex.Message}", false);
            return StatusCode(500, new { error = "Security audit failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Execute Performance Intelligence Matrix operations
    /// </summary>
    [HttpPost("performance/optimize")]
    public async Task<ActionResult<PerformanceOptimizationResult>> OptimizePerformance([FromBody] PerformanceOptimizationRequest request)
    {
        try
        {
            _logger.LogInformation("⚡ Performance optimization requested: {Target}", request.Target);
            await _auditLogger.LogAsync("ENHANCEMENT_PERFORMANCE_OPTIMIZATION", $"Target: {request.Target}", true);

            // Forward to Performance Intelligence Matrix service
            var performancePayload = new
            {
                target = request.Target,
                optimizationType = request.OptimizationType ?? "adaptive",
                parameters = request.Parameters ?? new Dictionary<string, object>(),
                expectedGain = request.ExpectedGain ?? 100,
                timestamp = DateTime.UtcNow
            };

            var jsonContent = JsonSerializer.Serialize(performancePayload);
            var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

            var enhancementPort = Environment.GetEnvironmentVariable("TF_ENHANCEMENT_PORT");
            if (string.IsNullOrEmpty(enhancementPort))
            {
                return BadRequest(new { error = "ANTI-HARDCODING: TF_ENHANCEMENT_PORT must be configured", message = "No hardcoded ports allowed in TerraFusion OS" });
            }
            var response = await _httpClient.PostAsync($"http://localhost:{enhancementPort}/api/enhancement/performance/optimize", content);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<PerformanceOptimizationResult>(responseContent);
                
                await _auditLogger.LogAsync("ENHANCEMENT_PERFORMANCE_SUCCESS", $"Optimization for {request.Target} completed", true);
                
                // Broadcast performance metrics
                await _enhancementHub.Clients.All.SendAsync("PerformanceOptimizationComplete", result);
                
                return Ok(result);
            }
            else
            {
                _logger.LogWarning("⚠️ Performance optimization failed: {Target}", request.Target);
                return StatusCode(500, new { error = "Performance optimization failed", details = "Performance Intelligence Matrix unavailable" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Error optimizing performance: {Target}", request.Target);
            await _auditLogger.LogAsync("ENHANCEMENT_PERFORMANCE_ERROR", $"Error for {request.Target}: {ex.Message}", false);
            return StatusCode(500, new { error = "Performance optimization failed", details = ex.Message });
        }
    }

    /// <summary>
    /// Get real-time enhancement metrics
    /// </summary>
    [HttpGet("metrics")]
    public async Task<ActionResult<EnhancementMetrics>> GetEnhancementMetrics()
    {
        try
        {
            var metrics = await _enhancementService.GetEnhancementMetricsAsync();
            
            // Broadcast metrics update
            await _enhancementHub.Clients.All.SendAsync("EnhancementMetricsUpdate", metrics);
            
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Error getting enhancement metrics");
            return StatusCode(500, new { error = "Failed to get enhancement metrics", details = ex.Message });
        }
    }

    /// <summary>
    /// Execute unified enhancement coordination
    /// </summary>
    [HttpPost("coordinate")]
    public async Task<ActionResult<EnhancementCoordinationResult>> CoordinateEnhancements([FromBody] EnhancementCoordinationRequest request)
    {
        try
        {
            _logger.LogInformation("🎯 Enhancement coordination requested: {Phases}", string.Join(", ", request.Phases));
            await _auditLogger.LogAsync("ENHANCEMENT_COORDINATION", $"Phases: {string.Join(", ", request.Phases)}", true);

            var result = await _enhancementService.CoordinateEnhancementsAsync(request);
            
            await _auditLogger.LogAsync("ENHANCEMENT_COORDINATION_SUCCESS", $"Coordination completed for {request.Phases.Count} phases", true);
            
            // Broadcast coordination result
            await _enhancementHub.Clients.All.SendAsync("EnhancementCoordinationComplete", result);
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Error coordinating enhancements");
            await _auditLogger.LogAsync("ENHANCEMENT_COORDINATION_ERROR", $"Error: {ex.Message}", false);
            return StatusCode(500, new { error = "Enhancement coordination failed", details = ex.Message });
        }
    }
}

#region Request/Response Models

public class SwarmOperationRequest
{
    public string Operation { get; set; } = string.Empty;
    public Dictionary<string, object>? Parameters { get; set; }
    public int? AgentCount { get; set; }
    public string? Priority { get; set; }
}

public class ConsciousnessRequest
{
    public string SpeciesType { get; set; } = string.Empty;
    public string CommunicationType { get; set; } = string.Empty;
    public Dictionary<string, object>? Parameters { get; set; }
    public string? Priority { get; set; }
}

public class SecurityAuditRequest
{
    public string AuditType { get; set; } = string.Empty;
    public string? Scope { get; set; }
    public Dictionary<string, object>? Parameters { get; set; }
    public string? QuantumLevel { get; set; }
}

public class PerformanceOptimizationRequest
{
    public string Target { get; set; } = string.Empty;
    public string? OptimizationType { get; set; }
    public Dictionary<string, object>? Parameters { get; set; }
    public double? ExpectedGain { get; set; }
}

public class EnhancementCoordinationRequest
{
    public List<string> Phases { get; set; } = new();
    public Dictionary<string, object>? Parameters { get; set; }
    public string? Priority { get; set; }
}

#endregion

#region Result Models

public class SwarmExecutionResult
{
    public bool Success { get; set; }
    public string Operation { get; set; } = string.Empty;
    public int AgentsInvolved { get; set; }
    public double EfficiencyGain { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class ConsciousnessCoordinationResult
{
    public bool Success { get; set; }
    public string SpeciesType { get; set; } = string.Empty;
    public string CommunicationStatus { get; set; } = string.Empty;
    public double CoherenceLevel { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class SecurityAuditResult
{
    public bool Success { get; set; }
    public string AuditType { get; set; } = string.Empty;
    public string SecurityLevel { get; set; } = string.Empty;
    public List<string> Findings { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class PerformanceOptimizationResult
{
    public bool Success { get; set; }
    public string Target { get; set; } = string.Empty;
    public double PerformanceGain { get; set; }
    public string OptimizationLevel { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class EnhancementCoordinationResult
{
    public bool Success { get; set; }
    public List<string> CompletedPhases { get; set; } = new();
    public double OverallEfficiency { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class EnhancementStatus
{
    public string OverallStatus { get; set; } = string.Empty;
    public Dictionary<string, object> PhaseStatuses { get; set; } = new();
    public double OverallEfficiency { get; set; }
    public DateTime LastUpdated { get; set; }
}

public class EnhancementMetrics
{
    public Dictionary<string, double> PerformanceMetrics { get; set; } = new();
    public Dictionary<string, string> StatusMetrics { get; set; } = new();
    public DateTime Timestamp { get; set; }
}

#endregion
