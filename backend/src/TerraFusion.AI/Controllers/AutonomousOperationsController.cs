/*
 * AutonomousOperationsController - REST API for Autonomous Operations
 *
 * Provides endpoints for autonomous operations monitoring and management:
 * - Autonomous operations status
 * - Anomaly detection reports
 * - Failure prediction reports
 * - Self-healing reports
 * - Auto-scaling status
 * - Manual recovery triggers
 * - Health checks
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 4.0.0 - Phase 4 Week 1
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/autonomous")]
    [Produces("application/json")]
    public class AutonomousOperationsController : ControllerBase
    {
        private readonly IAutonomousOperationsService _autonomousService;
        private readonly ILogger<AutonomousOperationsController> _logger;

        public AutonomousOperationsController(
            IAutonomousOperationsService autonomousService,
            ILogger<AutonomousOperationsController> logger)
        {
            _autonomousService = autonomousService;
            _logger = logger;
        }

        /// <summary>
        /// Get autonomous operations status
        /// </summary>
        /// <returns>Complete autonomous operations status with metrics</returns>
        [HttpGet("status")]
        [ProducesResponseType(typeof(AutonomousOperationsStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStatus()
        {
            try
            {
                var status = await _autonomousService.GetStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting autonomous operations status");
                return StatusCode(500, new { error = "Failed to get autonomous operations status" });
            }
        }

        /// <summary>
        /// Get anomaly detection report
        /// </summary>
        /// <returns>Comprehensive anomaly detection report with trends</returns>
        [HttpGet("anomalies")]
        [ProducesResponseType(typeof(AnomalyDetectionReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAnomalyDetectionReport()
        {
            try
            {
                var report = await _autonomousService.GetAnomalyDetectionReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting anomaly detection report");
                return StatusCode(500, new { error = "Failed to get anomaly detection report" });
            }
        }

        /// <summary>
        /// Get failure prediction report
        /// </summary>
        /// <returns>Failure prediction report with confidence scores</returns>
        [HttpGet("predictions")]
        [ProducesResponseType(typeof(FailurePredictionReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFailurePredictionReport()
        {
            try
            {
                var report = await _autonomousService.GetFailurePredictionReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting failure prediction report");
                return StatusCode(500, new { error = "Failed to get failure prediction report" });
            }
        }

        /// <summary>
        /// Get self-healing report
        /// </summary>
        /// <returns>Self-healing report with recovery metrics</returns>
        [HttpGet("self-healing")]
        [ProducesResponseType(typeof(SelfHealingReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSelfHealingReport()
        {
            try
            {
                var report = await _autonomousService.GetSelfHealingReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting self-healing report");
                return StatusCode(500, new { error = "Failed to get self-healing report" });
            }
        }

        /// <summary>
        /// Get auto-scaling status
        /// </summary>
        /// <returns>Auto-scaling status with scaling history and predictions</returns>
        [HttpGet("auto-scaling")]
        [ProducesResponseType(typeof(AutoScalingStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAutoScalingStatus()
        {
            try
            {
                var status = await _autonomousService.GetAutoScalingStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting auto-scaling status");
                return StatusCode(500, new { error = "Failed to get auto-scaling status" });
            }
        }

        /// <summary>
        /// Trigger manual recovery
        /// </summary>
        /// <param name="trigger">Recovery trigger with subsystem and reason</param>
        /// <returns>Recovery result with steps and health improvement</returns>
        [HttpPost("recover")]
        [ProducesResponseType(typeof(RecoveryResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> TriggerRecovery([FromBody] RecoveryTrigger trigger)
        {
            try
            {
                _logger.LogInformation("Manual recovery triggered for subsystem: {SubsystemId}", trigger.SubsystemId);
                var result = await _autonomousService.TriggerRecoveryAsync(trigger);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error triggering recovery");
                return StatusCode(500, new { error = "Failed to trigger recovery" });
            }
        }

        /// <summary>
        /// Perform comprehensive health check
        /// </summary>
        /// <returns>Health check result for all subsystems</returns>
        [HttpPost("health-check")]
        [ProducesResponseType(typeof(HealthCheckResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> PerformHealthCheck()
        {
            try
            {
                _logger.LogInformation("Performing comprehensive health check");
                var result = await _autonomousService.PerformHealthCheckAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing health check");
                return StatusCode(500, new { error = "Failed to perform health check" });
            }
        }
    }
}
