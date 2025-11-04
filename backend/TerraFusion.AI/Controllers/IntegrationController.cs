/**
 * IntegrationController - REST API for Multi-System Integration Orchestration
 *
 * Provides endpoints for integration status, system connectors, sync operations,
 * integration health, data mapping validation, and integration metrics.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 3 Day 1
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/integration")]
    [Produces("application/json")]
    public class IntegrationController : ControllerBase
    {
        private readonly IIntegrationOrchestrationService _integrationService;
        private readonly ILogger<IntegrationController> _logger;

        public IntegrationController(
            IIntegrationOrchestrationService integrationService,
            ILogger<IntegrationController> logger)
        {
            _integrationService = integrationService;
            _logger = logger;
        }

        /// <summary>
        /// Get integration status
        /// </summary>
        /// <returns>Complete integration status with system and sync metrics</returns>
        [HttpGet("status")]
        [ProducesResponseType(typeof(IntegrationStatus), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStatus()
        {
            try
            {
                var status = await _integrationService.GetIntegrationStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting integration status");
                return StatusCode(500, new { error = "Failed to get integration status" });
            }
        }

        /// <summary>
        /// Get system connectors
        /// </summary>
        /// <returns>List of all system connectors with connection details</returns>
        [HttpGet("connectors")]
        [ProducesResponseType(typeof(List<SystemConnector>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetConnectors()
        {
            try
            {
                var connectors = await _integrationService.GetSystemConnectorsAsync();
                return Ok(connectors);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system connectors");
                return StatusCode(500, new { error = "Failed to get system connectors" });
            }
        }

        /// <summary>
        /// Initiate sync operation
        /// </summary>
        /// <param name="request">Sync request with system ID and parameters</param>
        /// <returns>Sync operation with status and progress</returns>
        [HttpPost("sync")]
        [ProducesResponseType(typeof(SyncOperation), StatusCodes.Status200OK)]
        public async Task<IActionResult> InitiateSync([FromBody] SyncRequest request)
        {
            try
            {
                _logger.LogInformation("Initiating sync for system: {SystemId}", request.SystemId);
                var operation = await _integrationService.InitiateSyncAsync(request);
                return Ok(operation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating sync");
                return StatusCode(500, new { error = "Failed to initiate sync" });
            }
        }

        /// <summary>
        /// Get sync history
        /// </summary>
        /// <param name="systemId">Optional system ID to filter history</param>
        /// <returns>List of sync history records</returns>
        [HttpGet("sync/history")]
        [ProducesResponseType(typeof(List<SyncHistory>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSyncHistory([FromQuery] string? systemId = null)
        {
            try
            {
                var history = await _integrationService.GetSyncHistoryAsync(systemId ?? string.Empty);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sync history");
                return StatusCode(500, new { error = "Failed to get sync history" });
            }
        }

        /// <summary>
        /// Get integration health
        /// </summary>
        /// <returns>Comprehensive integration health metrics</returns>
        [HttpGet("health")]
        [ProducesResponseType(typeof(IntegrationHealth), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetHealth()
        {
            try
            {
                var health = await _integrationService.GetIntegrationHealthAsync();
                return Ok(health);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting integration health");
                return StatusCode(500, new { error = "Failed to get integration health" });
            }
        }

        /// <summary>
        /// Validate data mapping
        /// </summary>
        /// <param name="request">Data mapping request with field mappings</param>
        /// <returns>Validation result with compatibility score</returns>
        [HttpPost("mapping/validate")]
        [ProducesResponseType(typeof(DataMappingResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> ValidateMapping([FromBody] DataMappingRequest request)
        {
            try
            {
                _logger.LogInformation("Validating data mapping: {Source} -> {Target}",
                    request.SourceSystem, request.TargetSystem);
                var result = await _integrationService.ValidateDataMappingAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating data mapping");
                return StatusCode(500, new { error = "Failed to validate data mapping" });
            }
        }

        /// <summary>
        /// Get integration metrics
        /// </summary>
        /// <param name="timeRange">Time range (1h, 6h, 24h, 7d, 30d)</param>
        /// <returns>Integration metrics with trends</returns>
        [HttpGet("metrics")]
        [ProducesResponseType(typeof(List<IntegrationMetric>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMetrics([FromQuery] string timeRange = "24h")
        {
            try
            {
                var metrics = await _integrationService.GetIntegrationMetricsAsync(timeRange);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting integration metrics");
                return StatusCode(500, new { error = "Failed to get integration metrics" });
            }
        }
    }
}
