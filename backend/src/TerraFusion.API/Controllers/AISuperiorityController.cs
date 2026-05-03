using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.API.Services;
using TerraFusion.Core.Models;
using TerraFusion.Core.DTOs;
// Use TerraFusion.Core.Interfaces for core AI orchestration services (avoids ambiguity with TerraFusion.API.Services)
using CoreAIOrchestrator = TerraFusion.Core.Interfaces.IAdvancedAIAgentOrchestrator;
using CorePerformanceMonitor = TerraFusion.Core.Interfaces.IElitePerformanceMonitoringService;
namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// AI evaluation controller.
    /// Comparison claims must come from governed benchmark evidence.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AISuperiorityController : ControllerBase
    {
        private readonly IAISuperiorityDemonstrationService _demonstrationService;
        private readonly ILogger<AISuperiorityController> _logger;
        private readonly CoreAIOrchestrator _aiOrchestrator;
        private readonly CorePerformanceMonitor _performanceMonitor;

        public AISuperiorityController(
            IAISuperiorityDemonstrationService demonstrationService,
            ILogger<AISuperiorityController> logger,
            CoreAIOrchestrator aiOrchestrator,
            CorePerformanceMonitor performanceMonitor)
        {
            _demonstrationService = demonstrationService;
            _logger = logger;
            _aiOrchestrator = aiOrchestrator;
            _performanceMonitor = performanceMonitor;
        }

        /// <summary>
        /// Launch comprehensive AI evaluation.
        /// POST /api/aisuperiority/launch
        /// </summary>
        [HttpPost("launch")]
        public async Task<ActionResult<TerraFusion.Core.DTOs.AISuperiorityDemoResult>> LaunchSupremacyDemonstration(
            [FromBody] TerraFusion.API.Models.AIDemo.SuperiorityDemoRequest request)
        {
            try
            {
                _logger.LogInformation("Launching AI evaluation for jurisdiction: {Jurisdiction}", request.Jurisdiction);

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                await Task.CompletedTask;
                return StatusCode(503, new
                {
                    error = "Governed AI benchmark execution is unavailable",
                    jurisdiction = request.Jurisdiction,
                    requestId = HttpContext.TraceIdentifier
                });
            }
            catch (AISuperiorityException ex)
            {
                _logger.LogError(ex, "AI evaluation launch failed");
                return BadRequest(new { error = "Evaluation launch failed", details = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during evaluation launch");
                return StatusCode(500, new { error = "Internal server error", requestId = HttpContext.TraceIdentifier });
            }
        }

        /// <summary>
        /// Get real-time evaluation dashboard data.
        /// GET /api/aisuperiority/demo/{demoId}/dashboard
        /// </summary>
        [HttpGet("demo/{demoId}/dashboard")]
        public async Task<ActionResult<TerraFusion.Core.DTOs.AIDemoDashboardData>> GetDemoDashboard(string demoId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(demoId))
                {
                    return BadRequest(new { error = "Demo ID is required" });
                }

                var dashboardData = await _demonstrationService.GetDemoDashboardAsync(demoId);

                return Ok(dashboardData);
            }
            catch (DemoNotFoundException ex)
            {
                _logger.LogWarning($"📊 Demo not found: {demoId}");
                return NotFound(new { error = ex.Message, demoId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dashboard for run: {DemoId}", demoId);
                return StatusCode(500, new { error = "Failed to retrieve dashboard data", requestId = HttpContext.TraceIdentifier });
            }
        }

        /// <summary>
        /// Stop active evaluation.
        /// POST /api/aisuperiority/demo/{demoId}/stop
        /// </summary>
        [HttpPost("demo/{demoId}/stop")]
        public async Task<ActionResult> StopDemonstration(string demoId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(demoId))
                {
                    return BadRequest(new { error = "Demo ID is required" });
                }

                var result = await _demonstrationService.StopDemonstrationAsync(demoId);

                if (!result.Success)
                {
                    return NotFound(new { error = "Demo not found or already stopped", demoId });
                }

                _logger.LogInformation("AI evaluation stopped: {DemoId}", demoId);

                return Ok(new { message = "Evaluation stopped successfully", demoId, timestamp = DateTime.UtcNow });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping evaluation: {DemoId}", demoId);
                return StatusCode(500, new { error = "Failed to stop evaluation", requestId = HttpContext.TraceIdentifier });
            }
        }

        /// <summary>
        /// Get current AI swarm status and agent deployment metrics
        /// GET /api/aisuperiority/swarm/status
        /// </summary>
        [HttpGet("swarm/status")]
        public async Task<ActionResult<TerraFusion.Core.DTOs.AISwarmStatus>> GetSwarmStatus()
        {
            try
            {
                var swarmStatus = await _aiOrchestrator.GetCurrentSwarmStatusAsync();

                return Ok(new TerraFusion.Core.DTOs.AISwarmStatus
                {
                    TotalAgents = swarmStatus.ActiveAgents,
                    DeployedSwarms = swarmStatus.ActiveSwarms,
                    AverageResponseTime = (decimal)swarmStatus.AverageResponseTime,
                    TotalProcessedRequests = swarmStatus.TotalProcessedRequests,
                    QuantumOptimizationEnabled = swarmStatus.QuantumOptimized,
                    ConsciousnessLevel = swarmStatus.ConsciousnessLevel.ToString(),
                    PerformanceRating = (decimal)swarmStatus.PerformanceRating,
                    LastUpdated = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving AI swarm status");
                return StatusCode(500, new { error = "Failed to retrieve swarm status", requestId = HttpContext.TraceIdentifier });
            }
        }

        /// <summary>
        /// Get performance metrics comparison when governed benchmark evidence exists.
        /// GET /api/aisuperiority/performance/comparison
        /// </summary>
        [HttpGet("performance/comparison")]
        public async Task<ActionResult<TerraFusion.Core.DTOs.PerformanceComparison>> GetPerformanceComparison(string? countyCode = null)
        {
            try
            {
                await _performanceMonitor.GetCurrentMetricsAsync();
                return StatusCode(503, new
                {
                    error = "Governed benchmark baseline evidence is unavailable",
                    countyCode = countyCode ?? "all",
                    requestId = HttpContext.TraceIdentifier
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error generating performance comparison");
                return StatusCode(500, new { error = "Failed to generate performance comparison", requestId = HttpContext.TraceIdentifier });
            }
        }

        /// <summary>
        /// Get available evaluation scenarios.
        /// GET /api/aisuperiority/scenarios
        /// </summary>
        [HttpGet("scenarios")]
        public ActionResult<List<TerraFusion.Core.DTOs.DemonstrationScenario>> GetAvailableScenarios()
        {
            try
            {
                var scenarios = new List<TerraFusion.Core.DTOs.DemonstrationScenario>();

                return Ok(scenarios);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving evaluation scenarios");
                return StatusCode(500, new { error = "Failed to retrieve scenarios", requestId = HttpContext.TraceIdentifier });
            }
        }

        /// <summary>
        /// Get AI agent battalion deployment status
        /// GET /api/aisuperiority/battalions
        /// </summary>
        [HttpGet("battalions")]
        public async Task<ActionResult<List<TerraFusion.Core.DTOs.BattalionStatus>>> GetBattalionStatus()
        {
            try
            {
                var battalions = await _aiOrchestrator.GetBattalionStatusAsync();

                var battalionStatuses = battalions.Select(b => new TerraFusion.Core.DTOs.BattalionStatus
                {
                    BattalionId = b.Id,
                    Name = b.Name,
                    AgentCount = b.ActiveAgents,
                    Specialization = b.Specialization,
                    PerformanceRating = (decimal)b.PerformanceRating,
                    DeploymentStatus = b.Status,
                    QuantumEnhanced = b.QuantumOptimized,
                    ConsciousnessLevel = b.ConsciousnessLevel.ToString(),
                    LastActivity = b.LastActivityTime
                }).ToList();

                return Ok(battalionStatuses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error retrieving battalion status");
                return StatusCode(500, new { error = "Failed to retrieve battalion status", requestId = HttpContext.TraceIdentifier });
            }
        }
    }

    #region API Models - Using Core DTOs

    // All models now using TerraFusion.Core.DTOs for government-grade consistency
    // See: TerraFusion.Core.DTOs.AISuperiorityDTOs for evaluation data models

    #endregion
}
