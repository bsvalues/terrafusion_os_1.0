/*
 * PredictiveMaintenanceController - REST API for Predictive Maintenance
 *
 * Provides endpoints for ML-driven predictive maintenance operations:
 * - Maintenance reports and status
 * - Resource exhaustion predictions
 * - Performance degradation predictions
 * - Integration health predictions
 * - Preventive maintenance scheduling
 * - Prediction accuracy reports
 * - Preventive action execution
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 4.0.0 - Phase 4 Week 1 Day 3-4
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/predictive-maintenance")]
    [Produces("application/json")]
    public class PredictiveMaintenanceController : ControllerBase
    {
        private readonly IPredictiveMaintenanceService _maintenanceService;
        private readonly ILogger<PredictiveMaintenanceController> _logger;

        public PredictiveMaintenanceController(
            IPredictiveMaintenanceService maintenanceService,
            ILogger<PredictiveMaintenanceController> logger)
        {
            _maintenanceService = maintenanceService;
            _logger = logger;
        }

        /// <summary>
        /// Get predictive maintenance report
        /// </summary>
        /// <returns>Comprehensive maintenance report with predictions and metrics</returns>
        [HttpGet("report")]
        [ProducesResponseType(typeof(PredictiveMaintenanceReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMaintenanceReport()
        {
            try
            {
                var report = await _maintenanceService.GetMaintenanceReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting maintenance report");
                return StatusCode(500, new { error = "Failed to get maintenance report" });
            }
        }

        /// <summary>
        /// Get resource exhaustion predictions
        /// </summary>
        /// <returns>List of resource exhaustion predictions with timeframes</returns>
        [HttpGet("predictions/resources")]
        [ProducesResponseType(typeof(List<ResourceExhaustionPrediction>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetResourcePredictions()
        {
            try
            {
                var predictions = await _maintenanceService.GetResourcePredictionsAsync();
                return Ok(predictions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting resource predictions");
                return StatusCode(500, new { error = "Failed to get resource predictions" });
            }
        }

        /// <summary>
        /// Get performance degradation predictions
        /// </summary>
        /// <returns>List of performance degradation predictions</returns>
        [HttpGet("predictions/performance")]
        [ProducesResponseType(typeof(List<PerformanceDegradationPrediction>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPerformancePredictions()
        {
            try
            {
                var predictions = await _maintenanceService.GetPerformancePredictionsAsync();
                return Ok(predictions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting performance predictions");
                return StatusCode(500, new { error = "Failed to get performance predictions" });
            }
        }

        /// <summary>
        /// Get integration health predictions
        /// </summary>
        /// <returns>List of integration health predictions</returns>
        [HttpGet("predictions/integration")]
        [ProducesResponseType(typeof(List<IntegrationHealthPrediction>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetIntegrationPredictions()
        {
            try
            {
                var predictions = await _maintenanceService.GetIntegrationPredictionsAsync();
                return Ok(predictions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting integration predictions");
                return StatusCode(500, new { error = "Failed to get integration predictions" });
            }
        }

        /// <summary>
        /// Get preventive maintenance schedule
        /// </summary>
        /// <returns>Scheduled maintenance actions with priorities</returns>
        [HttpGet("schedule")]
        [ProducesResponseType(typeof(PreventiveMaintenanceSchedule), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMaintenanceSchedule()
        {
            try
            {
                var schedule = await _maintenanceService.GetMaintenanceScheduleAsync();
                return Ok(schedule);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting maintenance schedule");
                return StatusCode(500, new { error = "Failed to get maintenance schedule" });
            }
        }

        /// <summary>
        /// Get prediction accuracy report
        /// </summary>
        /// <returns>Accuracy metrics for ML models and predictions</returns>
        [HttpGet("accuracy")]
        [ProducesResponseType(typeof(PredictionAccuracyReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAccuracyReport()
        {
            try
            {
                var report = await _maintenanceService.GetAccuracyReportAsync();
                return Ok(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting accuracy report");
                return StatusCode(500, new { error = "Failed to get accuracy report" });
            }
        }

        /// <summary>
        /// Execute preventive action
        /// </summary>
        /// <param name="action">Preventive action to execute</param>
        /// <returns>Action result with steps and impact</returns>
        [HttpPost("actions/execute")]
        [ProducesResponseType(typeof(PreventiveActionResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> ExecutePreventiveAction([FromBody] PreventiveAction action)
        {
            try
            {
                _logger.LogInformation("Executing preventive action: {ActionType} for {TargetId}",
                    action.ActionType, action.TargetId);
                var result = await _maintenanceService.ExecutePreventiveActionAsync(action);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing preventive action");
                return StatusCode(500, new { error = "Failed to execute preventive action" });
            }
        }
    }
}
