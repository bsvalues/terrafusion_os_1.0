/*
 * AutoScalingController - REST API for Auto-Scaling and Workload Distribution
 *
 * Provides comprehensive endpoints for:
 * - Auto-scaling status and operations
 * - Workload distribution management
 * - Capacity forecasting
 * - Cost optimization
 * - Scaling policy management
 * - Node health monitoring
 * - Workload rebalancing
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 4.0.0 - Phase 4 Week 2 Day 1-3
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/auto-scaling")]
    [Produces("application/json")]
    public class AutoScalingController : ControllerBase
    {
        private readonly IAutoScalingEngine _autoScalingEngine;
        private readonly IWorkloadDistributionService _workloadDistribution;
        private readonly ILogger<AutoScalingController> _logger;

        public AutoScalingController(
            IAutoScalingEngine autoScalingEngine,
            IWorkloadDistributionService workloadDistribution,
            ILogger<AutoScalingController> logger)
        {
            _autoScalingEngine = autoScalingEngine;
            _workloadDistribution = workloadDistribution;
            _logger = logger;
        }

        /// <summary>
        /// Get auto-scaling status
        /// </summary>
        /// <returns>Complete auto-scaling status with metrics and configurations</returns>
        [HttpGet("status")]
        [ProducesResponseType(typeof(AutoScalingStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAutoScalingStatus()
        {
            try
            {
                var status = await _autoScalingEngine.GetAutoScalingStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting auto-scaling status");
                return StatusCode(500, new { error = "Failed to get auto-scaling status" });
            }
        }

        /// <summary>
        /// Make scaling decision for a subsystem
        /// </summary>
        /// <param name="subsystemId">ID of the subsystem to evaluate</param>
        /// <returns>Scaling decision with confidence and recommendation</returns>
        [HttpGet("decision/{subsystemId}")]
        [ProducesResponseType(typeof(ScalingDecision), StatusCodes.Status200OK)]
        public async Task<IActionResult> MakeScalingDecision(string subsystemId)
        {
            try
            {
                _logger.LogInformation("Making scaling decision for subsystem: {SubsystemId}", subsystemId);
                var decision = await _autoScalingEngine.MakeScalingDecisionAsync(subsystemId);
                return Ok(decision);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error making scaling decision");
                return StatusCode(500, new { error = "Failed to make scaling decision" });
            }
        }

        /// <summary>
        /// Execute scaling action
        /// </summary>
        /// <param name="action">Scaling action to execute</param>
        /// <returns>Scaling result with execution details</returns>
        [HttpPost("execute")]
        [ProducesResponseType(typeof(ScalingResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> ExecuteScalingAction([FromBody] ScalingAction action)
        {
            try
            {
                _logger.LogWarning("Executing scaling action: {SubsystemId}, {Action}, {CurrentInstances} → {TargetInstances}",
                    action.SubsystemId, action.Action, action.CurrentInstances, action.TargetInstances);
                var result = await _autoScalingEngine.ExecuteScalingActionAsync(action);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing scaling action");
                return StatusCode(500, new { error = "Failed to execute scaling action" });
            }
        }

        /// <summary>
        /// Get capacity forecast
        /// </summary>
        /// <param name="subsystemId">ID of the subsystem to forecast</param>
        /// <param name="hoursAhead">Number of hours ahead to forecast (default: 4)</param>
        /// <returns>Capacity forecast with predicted utilization</returns>
        [HttpGet("forecast/{subsystemId}")]
        [ProducesResponseType(typeof(CapacityForecast), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCapacityForecast(string subsystemId, [FromQuery] int hoursAhead = 4)
        {
            try
            {
                var forecast = await _autoScalingEngine.GetCapacityForecastAsync(subsystemId, hoursAhead);
                return Ok(forecast);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting capacity forecast");
                return StatusCode(500, new { error = "Failed to get capacity forecast" });
            }
        }

        /// <summary>
        /// Analyze traffic pattern
        /// </summary>
        /// <param name="subsystemId">ID of the subsystem to analyze</param>
        /// <returns>Traffic pattern analysis with peak hours and seasonality</returns>
        [HttpGet("traffic-pattern/{subsystemId}")]
        [ProducesResponseType(typeof(TrafficPattern), StatusCodes.Status200OK)]
        public async Task<IActionResult> AnalyzeTrafficPattern(string subsystemId)
        {
            try
            {
                var pattern = await _autoScalingEngine.AnalyzeTrafficPatternAsync(subsystemId);
                return Ok(pattern);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing traffic pattern");
                return StatusCode(500, new { error = "Failed to analyze traffic pattern" });
            }
        }

        /// <summary>
        /// Get cost optimization report
        /// </summary>
        /// <returns>Cost optimization report with savings opportunities</returns>
        [HttpGet("cost-optimization")]
        [ProducesResponseType(typeof(CostOptimizationReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCostOptimizationReport()
        {
            try
            {
                var report = await _autoScalingEngine.GetCostOptimizationReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cost optimization report");
                return StatusCode(500, new { error = "Failed to get cost optimization report" });
            }
        }

        /// <summary>
        /// Get scaling policy recommendation
        /// </summary>
        /// <param name="subsystemId">ID of the subsystem</param>
        /// <returns>Recommended scaling policy with thresholds and configuration</returns>
        [HttpGet("policy-recommendation/{subsystemId}")]
        [ProducesResponseType(typeof(ScalingPolicyRecommendation), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetScalingPolicyRecommendation(string subsystemId)
        {
            try
            {
                var recommendation = await _autoScalingEngine.GetScalingPolicyRecommendationAsync(subsystemId);
                return Ok(recommendation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting scaling policy recommendation");
                return StatusCode(500, new { error = "Failed to get scaling policy recommendation" });
            }
        }

        /// <summary>
        /// Get workload distribution status
        /// </summary>
        /// <returns>Complete distribution status with node utilization</returns>
        [HttpGet("workload/status")]
        [ProducesResponseType(typeof(DistributionStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDistributionStatus()
        {
            try
            {
                var status = await _workloadDistribution.GetDistributionStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting distribution status");
                return StatusCode(500, new { error = "Failed to get distribution status" });
            }
        }

        /// <summary>
        /// Assign workload to optimal node
        /// </summary>
        /// <param name="request">Workload request with requirements and preferences</param>
        /// <returns>Node assignment with selected node details</returns>
        [HttpPost("workload/assign")]
        [ProducesResponseType(typeof(NodeAssignment), StatusCodes.Status200OK)]
        public async Task<IActionResult> AssignWorkload([FromBody] WorkloadRequest request)
        {
            try
            {
                _logger.LogInformation("Assigning workload: {WorkloadType}, priority: {Priority}",
                    request.WorkloadType, request.Priority);
                var assignment = await _workloadDistribution.AssignWorkloadAsync(request);
                return Ok(assignment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error assigning workload");
                return StatusCode(500, new { error = "Failed to assign workload" });
            }
        }

        /// <summary>
        /// Rebalance workloads across nodes
        /// </summary>
        /// <returns>Rebalancing result with migrations performed</returns>
        [HttpPost("workload/rebalance")]
        [ProducesResponseType(typeof(RebalancingResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> RebalanceWorkloads()
        {
            try
            {
                _logger.LogWarning("Initiating workload rebalancing operation");
                var result = await _workloadDistribution.RebalanceWorkloadsAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rebalancing workloads");
                return StatusCode(500, new { error = "Failed to rebalance workloads" });
            }
        }

        /// <summary>
        /// Get node health map
        /// </summary>
        /// <returns>Node health map with regional distribution</returns>
        [HttpGet("workload/nodes/health")]
        [ProducesResponseType(typeof(NodeHealthMap), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetNodeHealthMap()
        {
            try
            {
                var healthMap = await _workloadDistribution.GetNodeHealthMapAsync();
                return Ok(healthMap);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting node health map");
                return StatusCode(500, new { error = "Failed to get node health map" });
            }
        }

        /// <summary>
        /// Get workload analytics
        /// </summary>
        /// <returns>Workload analytics with distribution by type, priority, and region</returns>
        [HttpGet("workload/analytics")]
        [ProducesResponseType(typeof(WorkloadAnalytics), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetWorkloadAnalytics()
        {
            try
            {
                var analytics = await _workloadDistribution.GetWorkloadAnalyticsAsync();
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting workload analytics");
                return StatusCode(500, new { error = "Failed to get workload analytics" });
            }
        }

        /// <summary>
        /// Get distribution policy
        /// </summary>
        /// <param name="workloadType">Type of workload</param>
        /// <returns>Distribution policy for the workload type</returns>
        [HttpGet("workload/policy/{workloadType}")]
        [ProducesResponseType(typeof(DistributionPolicy), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetDistributionPolicy(string workloadType)
        {
            try
            {
                var policy = await _workloadDistribution.GetDistributionPolicyAsync(workloadType);
                return Ok(policy);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting distribution policy");
                return StatusCode(500, new { error = "Failed to get distribution policy" });
            }
        }

        /// <summary>
        /// Get fair share report
        /// </summary>
        /// <returns>Fair share report with tenant allocations and utilization</returns>
        [HttpGet("workload/fair-share")]
        [ProducesResponseType(typeof(FairShareReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFairShareReport()
        {
            try
            {
                var report = await _workloadDistribution.GetFairShareReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fair share report");
                return StatusCode(500, new { error = "Failed to get fair share report" });
            }
        }
    }
}
