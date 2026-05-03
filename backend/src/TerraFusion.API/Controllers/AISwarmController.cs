using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.API.Services.Telemetry;
using TerraFusion.Abstractions.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// TerraFusion AI Swarm Controller
    /// Governed proxy boundary for legacy swarm routes
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "OSCoreAccess")]
    public class AISwarmController : ControllerBase
    {
        private readonly ILogger<AISwarmController> _logger;
        private readonly IAuditLogger _auditLogger;
        private readonly IAgentTelemetryService _telemetry;

        public AISwarmController(
            ILogger<AISwarmController> logger,
            IAuditLogger auditLogger,
            IAgentTelemetryService telemetry)
        {
            _logger = logger;
            _auditLogger = auditLogger;
            _telemetry = telemetry;
        }

        /// <summary>
        /// Get AI swarm status
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetSwarmStatus()
        {
            _telemetry.Emit("Info", "ai-swarm-controller", "swarm.status.get", "GetSwarmStatus called", correlationId: HttpContext.TraceIdentifier);
            try
            {
                _logger.LogInformation("AI Swarm status requested");
                await _auditLogger.LogAsync("AI_SWARM_STATUS", "Status check requested", true);
                return SwarmUnavailable("status");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting AI swarm status");
                return StatusCode(500, new { error = "Failed to get AI swarm status", details = ex.Message });
            }
        }

        /// <summary>
        /// Execute county optimization using Gauge Theory AI agents
        /// </summary>
        [HttpPost("optimize/county")]
        public async Task<IActionResult> OptimizeCounty([FromBody] CountyOptimizationRequest request)
        {
            _telemetry.Emit("Info", "ai-swarm-controller", "swarm.county.optimize", "OptimizeCounty called", correlationId: HttpContext.TraceIdentifier);
            try
            {
                _logger.LogInformation("County optimization requested for {CountyId}", request.CountyId);
                await _auditLogger.LogAsync("AI_COUNTY_OPTIMIZATION", $"Optimization requested for {request.CountyId}", true);
                return SwarmUnavailable("optimize/county");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error optimizing county {CountyId}", request.CountyId);
                await _auditLogger.LogAsync("AI_OPTIMIZATION_ERROR", $"Error optimizing {request.CountyId}: {ex.Message}", false);
                return StatusCode(500, new { error = "Optimization failed", details = ex.Message });
            }
        }

        /// <summary>
        /// Execute AI workflow using Claude-Flow Integration
        /// </summary>
        [HttpPost("workflow/execute")]
        public async Task<IActionResult> ExecuteWorkflow([FromBody] WorkflowExecutionRequest request)
        {
            _telemetry.Emit("Info", "ai-swarm-controller", "swarm.workflow.execute", "ExecuteWorkflow called", correlationId: HttpContext.TraceIdentifier);
            try
            {
                _logger.LogInformation("Workflow execution requested: {WorkflowId}", request.WorkflowId);
                await _auditLogger.LogAsync("AI_WORKFLOW_EXECUTION", $"Workflow {request.WorkflowId} execution requested", true);
                return SwarmUnavailable("workflow/execute");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing workflow {WorkflowId}", request.WorkflowId);
                await _auditLogger.LogAsync("AI_WORKFLOW_ERROR", $"Error executing {request.WorkflowId}: {ex.Message}", false);
                return StatusCode(500, new { error = "Workflow execution failed", details = ex.Message });
            }
        }

        /// <summary>
        /// Get AI agent performance metrics
        /// </summary>
        [HttpGet("performance")]
        public async Task<IActionResult> GetPerformanceMetrics()
        {
            _telemetry.Emit("Info", "ai-swarm-controller", "swarm.performance.get", "GetPerformanceMetrics called", correlationId: HttpContext.TraceIdentifier);
            try
            {
                _logger.LogInformation("AI performance metrics requested");
                await Task.CompletedTask;
                return SwarmUnavailable("performance");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting performance metrics");
                return StatusCode(500, new { error = "Failed to get performance metrics", details = ex.Message });
            }
        }

        /// <summary>
        /// Get available AI workflows
        /// </summary>
        [HttpGet("workflows")]
        public async Task<IActionResult> GetAvailableWorkflows()
        {
            _telemetry.Emit("Info", "ai-swarm-controller", "swarm.workflows.list", "GetAvailableWorkflows called", correlationId: HttpContext.TraceIdentifier);
            try
            {
                await Task.CompletedTask;
                return SwarmUnavailable("workflows");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting workflows");
                return StatusCode(500, new { error = "Failed to get workflows", details = ex.Message });
            }
        }

        private IActionResult SwarmUnavailable(string operation)
        {
            return StatusCode(StatusCodes.Status501NotImplemented, new
            {
                status = "unavailable",
                operation,
                message = "The AI swarm proxy route is unavailable.",
                detail = "This controller previously proxied Claude-Flow and Gauge Theory Node services that expose hardcoded counts, in-memory workflow state, and randomized outputs. No governed evidence-backed execution plane is attached to this contract.",
                requestId = HttpContext.TraceIdentifier
            });
        }
    }

    /// <summary>
    /// County optimization request model
    /// </summary>
    public class CountyOptimizationRequest
    {
        [Required]
        public string CountyId { get; set; } = string.Empty;
        
        public Dictionary<string, object>? Parameters { get; set; }
    }

    /// <summary>
    /// Workflow execution request model
    /// </summary>
    public class WorkflowExecutionRequest
    {
        [Required]
        public string WorkflowId { get; set; } = string.Empty;
        
        public Dictionary<string, object>? Parameters { get; set; }
    }
}
