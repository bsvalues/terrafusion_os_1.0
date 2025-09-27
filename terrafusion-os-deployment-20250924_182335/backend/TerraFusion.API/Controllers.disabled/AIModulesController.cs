using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Services;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "OSCoreAccess")]
public class AIModulesController : ControllerBase
{
    private readonly IAIModuleOrchestrator _aiOrchestrator;
    private readonly ILogger<AIModulesController> _logger;

    public AIModulesController(
        IAIModuleOrchestrator aiOrchestrator,
        ILogger<AIModulesController> logger)
    {
        _aiOrchestrator = aiOrchestrator;
        _logger = logger;
    }

    /// <summary>
    /// Get overall AI swarm status including all 1,008 agents
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<AIModuleStatus>> GetAISwarmStatus()
    {
        try
        {
            _logger.LogInformation("Getting AI swarm status");
            var status = await _aiOrchestrator.GetAISwarmStatusAsync();
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting AI swarm status");
            return StatusCode(500, new { error = "Failed to get AI swarm status", details = ex.Message });
        }
    }

    /// <summary>
    /// Get all active AI modules (Command Brain, Swarm Orchestrator, Revenue Hunter)
    /// </summary>
    [HttpGet("modules")]
    public async Task<ActionResult<IEnumerable<AIModule>>> GetActiveModules()
    {
        try
        {
            _logger.LogInformation("Getting active AI modules");
            var modules = await _aiOrchestrator.GetActiveModulesAsync();
            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active AI modules");
            return StatusCode(500, new { error = "Failed to get AI modules", details = ex.Message });
        }
    }

    /// <summary>
    /// Execute AI command on specific module (ai-command-brain, ai-swarm, ai-advanced)
    /// </summary>
    [HttpPost("execute")]
    public async Task<ActionResult<AICommandResult>> ExecuteAICommand([FromBody] AICommandRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Module) || string.IsNullOrEmpty(request.Command))
            {
                return BadRequest(new { error = "Module and Command are required" });
            }

            _logger.LogInformation("Executing AI command {Command} on module {Module}", 
                request.Command, request.Module);

            var result = await _aiOrchestrator.ExecuteAICommandAsync(
                request.Module, 
                request.Command, 
                request.Parameters ?? new object());

            if (result.Success)
            {
                return Ok(result);
            }
            else
            {
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing AI command");
            return StatusCode(500, new { error = "Failed to execute AI command", details = ex.Message });
        }
    }

    /// <summary>
    /// Start specific AI module
    /// </summary>
    [HttpPost("{moduleName}/start")]
    public async Task<ActionResult> StartAIModule(string moduleName)
    {
        try
        {
            _logger.LogInformation("Starting AI module {ModuleName}", moduleName);
            var success = await _aiOrchestrator.StartAIModuleAsync(moduleName);
            
            if (success)
            {
                return Ok(new { message = $"AI module {moduleName} started successfully" });
            }
            else
            {
                return BadRequest(new { error = $"Failed to start AI module {moduleName}" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting AI module {ModuleName}", moduleName);
            return StatusCode(500, new { error = "Failed to start AI module", details = ex.Message });
        }
    }

    /// <summary>
    /// Stop specific AI module
    /// </summary>
    [HttpPost("{moduleName}/stop")]
    public async Task<ActionResult> StopAIModule(string moduleName)
    {
        try
        {
            _logger.LogInformation("Stopping AI module {ModuleName}", moduleName);
            var success = await _aiOrchestrator.StopAIModuleAsync(moduleName);
            
            if (success)
            {
                return Ok(new { message = $"AI module {moduleName} stopped successfully" });
            }
            else
            {
                return BadRequest(new { error = $"Failed to stop AI module {moduleName}" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping AI module {ModuleName}", moduleName);
            return StatusCode(500, new { error = "Failed to stop AI module", details = ex.Message });
        }
    }

    /// <summary>
    /// Execute revenue hunting operation with Enhanced Revenue Hunter
    /// </summary>
    [HttpPost("revenue/hunt")]
    public async Task<ActionResult<AICommandResult>> ExecuteRevenueHunt([FromBody] RevenueHuntRequest request)
    {
        try
        {
            _logger.LogInformation("Executing revenue hunt for county {CountyId}", request.CountyId);
            
            var result = await _aiOrchestrator.ExecuteAICommandAsync(
                "ai-advanced",
                "revenue/hunt",
                new 
                { 
                    countyId = request.CountyId,
                    scope = request.Scope ?? "full",
                    priority = request.Priority ?? "high",
                    targetROI = request.TargetROI ?? 47231
                });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing revenue hunt");
            return StatusCode(500, new { error = "Failed to execute revenue hunt", details = ex.Message });
        }
    }

    /// <summary>
    /// Execute MCP orchestration with multi-model coordination
    /// </summary>
    [HttpPost("mcp/orchestrate")]
    public async Task<ActionResult<AICommandResult>> ExecuteMCPOrchestration([FromBody] MCPOrchestrationRequest request)
    {
        try
        {
            _logger.LogInformation("Executing MCP orchestration with {ModelCount} models", 
                request.Models?.Length ?? 0);
            
            var result = await _aiOrchestrator.ExecuteAICommandAsync(
                "ai-advanced",
                "mcp/orchestrate",
                new 
                { 
                    models = request.Models ?? new[] { "claude", "gpt", "llama" },
                    task = request.Task,
                    priority = request.Priority ?? "normal",
                    timeout = request.TimeoutSeconds ?? 300
                });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing MCP orchestration");
            return StatusCode(500, new { error = "Failed to execute MCP orchestration", details = ex.Message });
        }
    }

    /// <summary>
    /// Get AI performance metrics from all modules
    /// </summary>
    [HttpGet("metrics")]
    public async Task<ActionResult<AIPerformanceMetrics>> GetAIPerformanceMetrics()
    {
        try
        {
            _logger.LogInformation("Getting AI performance metrics");
            
            var status = await _aiOrchestrator.GetAISwarmStatusAsync();
            var modules = await _aiOrchestrator.GetActiveModulesAsync();

            var metrics = new AIPerformanceMetrics
            {
                TotalAgents = status.TotalAgents,
                ActiveAgents = status.HealthyAgents,
                MCPTools = status.MCPTools,
                OverallHealth = status.OverallStatus,
                AverageResponseTime = modules.Where(m => m.ResponseTimeMs > 0).DefaultIfEmpty()
                    .Average(m => m?.ResponseTimeMs ?? 0),
                ModuleMetrics = modules.Select(m => new ModuleMetrics
                {
                    ModuleName = m.Name,
                    AgentCount = m.AgentCount,
                    Status = m.Status,
                    ResponseTimeMs = m.ResponseTimeMs,
                    LastHealthCheck = m.LastHealthCheck
                }).ToList(),
                Timestamp = DateTime.UtcNow
            };

            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting AI performance metrics");
            return StatusCode(500, new { error = "Failed to get AI metrics", details = ex.Message });
        }
    }
}

// Request DTOs
public class AICommandRequest
{
    public string Module { get; set; } = string.Empty;
    public string Command { get; set; } = string.Empty;
    public object? Parameters { get; set; }
}

public class RevenueHuntRequest
{
    public string CountyId { get; set; } = string.Empty;
    public string? Scope { get; set; }
    public string? Priority { get; set; }
    public decimal? TargetROI { get; set; }
}

public class MCPOrchestrationRequest
{
    public string[]? Models { get; set; }
    public string Task { get; set; } = string.Empty;
    public string? Priority { get; set; }
    public int? TimeoutSeconds { get; set; }
}

// Response DTOs
public class AIPerformanceMetrics
{
    public int TotalAgents { get; set; }
    public int ActiveAgents { get; set; }
    public int MCPTools { get; set; }
    public string OverallHealth { get; set; } = string.Empty;
    public double AverageResponseTime { get; set; }
    public List<ModuleMetrics> ModuleMetrics { get; set; } = new();
    public DateTime Timestamp { get; set; }
}

public class ModuleMetrics
{
    public string ModuleName { get; set; } = string.Empty;
    public int AgentCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public int ResponseTimeMs { get; set; }
    public DateTime LastHealthCheck { get; set; }
}