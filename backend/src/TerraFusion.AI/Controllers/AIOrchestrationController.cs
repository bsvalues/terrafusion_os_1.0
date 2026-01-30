/*
 * AIOrchestrationController - REST API for AI Swarm Orchestration
 *
 * Provides endpoints for orchestration status, agent performance, task distribution,
 * load balancing, swarm optimization, and coordination management.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 2 Day 3
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;
using TerraFusion.Core.DTOs;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/ai/orchestration")]
    [Produces("application/json")]
    public class AIOrchestrationController : ControllerBase
    {
        private readonly IAIOrchestrationService _orchestrationService;
        private readonly ILogger<AIOrchestrationController> _logger;

        public AIOrchestrationController(
            IAIOrchestrationService orchestrationService,
            ILogger<AIOrchestrationController> logger)
        {
            _orchestrationService = orchestrationService;
            _logger = logger;
        }

        /// <summary>
        /// Get orchestration status
        /// </summary>
        /// <returns>Complete orchestration status with agent and task metrics</returns>
        [HttpGet("status")]
        [ProducesResponseType(typeof(TerraFusion.Core.DTOs.OrchestrationStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStatus()
        {
            try
            {
                var status = await _orchestrationService.GetOrchestrationStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting orchestration status");
                return StatusCode(500, new { error = "Failed to get orchestration status" });
            }
        }

        /// <summary>
        /// Get agent performance metrics
        /// </summary>
        /// <returns>Performance metrics for all agents</returns>
        [HttpGet("agents/performance")]
        [ProducesResponseType(typeof(List<TerraFusion.Core.DTOs.AgentPerformance>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAgentPerformance()
        {
            try
            {
                var performance = await _orchestrationService.GetAgentPerformanceAsync();
                return Ok(performance);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting agent performance");
                return StatusCode(500, new { error = "Failed to get agent performance" });
            }
        }

        /// <summary>
        /// Distribute task to optimal agent
        /// </summary>
        /// <param name="task">Task to distribute</param>
        /// <returns>Task distribution result with assigned agent</returns>
        [HttpPost("tasks/distribute")]
        [ProducesResponseType(typeof(TerraFusion.Core.DTOs.TaskDistributionResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> DistributeTask([FromBody] TerraFusion.Core.DTOs.TaskRequest task)
        {
            try
            {
                _logger.LogInformation("Distributing task: {TaskId}", task.TaskId);
                var result = await _orchestrationService.DistributeTaskAsync(task);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error distributing task");
                return StatusCode(500, new { error = "Failed to distribute task" });
            }
        }

        /// <summary>
        /// Get load balancing metrics
        /// </summary>
        /// <returns>Load balancing metrics and recommendations</returns>
        [HttpGet("load-balancing")]
        [ProducesResponseType(typeof(TerraFusion.Core.DTOs.LoadBalancingMetrics), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetLoadBalancing()
        {
            try
            {
                var metrics = await _orchestrationService.GetLoadBalancingMetricsAsync();
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting load balancing metrics");
                return StatusCode(500, new { error = "Failed to get load balancing metrics" });
            }
        }

        /// <summary>
        /// Optimize AI swarm
        /// </summary>
        /// <param name="config">Optimization configuration</param>
        /// <returns>Optimization report with improvements and changes</returns>
        [HttpPost("optimize")]
        [ProducesResponseType(typeof(TerraFusion.Core.DTOs.SwarmOptimizationReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> OptimizeSwarm([FromBody] TerraFusion.Core.DTOs.OptimizationConfig config)
        {
            try
            {
                _logger.LogInformation("Running swarm optimization: {Strategy}", config.Strategy);
                var report = await _orchestrationService.OptimizeSwarmAsync(config);
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error optimizing swarm");
                return StatusCode(500, new { error = "Failed to optimize swarm" });
            }
        }

        /// <summary>
        /// Get coordination status
        /// </summary>
        /// <returns>Agent coordination status with hierarchy metrics</returns>
        [HttpGet("coordination")]
        [ProducesResponseType(typeof(TerraFusion.Core.DTOs.AgentCoordinationStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCoordination()
        {
            try
            {
                var status = await _orchestrationService.GetCoordinationStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting coordination status");
                return StatusCode(500, new { error = "Failed to get coordination status" });
            }
        }

        /// <summary>
        /// Get swarm intelligence metrics
        /// </summary>
        /// <returns>Swarm intelligence metrics with trends</returns>
        [HttpGet("intelligence")]
        [ProducesResponseType(typeof(List<TerraFusion.Core.DTOs.SwarmIntelligenceMetric>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetIntelligence()
        {
            try
            {
                var metrics = await _orchestrationService.GetSwarmIntelligenceMetricsAsync();
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting swarm intelligence metrics");
                return StatusCode(500, new { error = "Failed to get swarm intelligence metrics" });
            }
        }
    }
}
