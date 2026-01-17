/*
 * SystemOrchestrationController - REST API for System Orchestration
 *
 * Provides endpoints for unified system status, subsystem health, system metrics,
 * cross-system analysis, optimization opportunities, coordination, diagnostics, and recovery.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 4
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/system")]
    [Produces("application/json")]
    public class SystemOrchestrationController : ControllerBase
    {
        private readonly ISystemOrchestrationService _systemService;
        private readonly ILogger<SystemOrchestrationController> _logger;

        public SystemOrchestrationController(
            ISystemOrchestrationService systemService,
            ILogger<SystemOrchestrationController> logger)
        {
            _systemService = systemService;
            _logger = logger;
        }

        /// <summary>
        /// Get comprehensive system status
        /// </summary>
        /// <returns>Complete system status with all subsystems and metrics</returns>
        [HttpGet("status")]
        [ProducesResponseType(typeof(SystemStatusReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSystemStatus()
        {
            try
            {
                var status = await _systemService.GetSystemStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system status");
                return StatusCode(500, new { error = "Failed to get system status" });
            }
        }

        /// <summary>
        /// Get subsystem health report
        /// </summary>
        /// <returns>Detailed health information for all subsystems</returns>
        [HttpGet("health")]
        [ProducesResponseType(typeof(SubsystemHealthReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSubsystemHealth()
        {
            try
            {
                var health = await _systemService.GetSubsystemHealthAsync();
                return Ok(health);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting subsystem health");
                return StatusCode(500, new { error = "Failed to get subsystem health" });
            }
        }

        /// <summary>
        /// Get system-wide metrics
        /// </summary>
        /// <returns>Comprehensive metrics across all subsystems</returns>
        [HttpGet("metrics")]
        [ProducesResponseType(typeof(SystemMetricsReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetSystemMetrics()
        {
            try
            {
                var metrics = await _systemService.GetSystemMetricsAsync();
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting system metrics");
                return StatusCode(500, new { error = "Failed to get system metrics" });
            }
        }

        /// <summary>
        /// Get cross-system analysis
        /// </summary>
        /// <returns>Analysis of correlations, bottlenecks, and optimization paths</returns>
        [HttpGet("analysis")]
        [ProducesResponseType(typeof(CrossSystemAnalysisReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCrossSystemAnalysis()
        {
            try
            {
                var analysis = await _systemService.GetCrossSystemAnalysisAsync();
                return Ok(analysis);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cross-system analysis");
                return StatusCode(500, new { error = "Failed to get cross-system analysis" });
            }
        }

        /// <summary>
        /// Get optimization opportunities
        /// </summary>
        /// <returns>System-wide optimization opportunities with ROI analysis</returns>
        [HttpGet("optimization")]
        [ProducesResponseType(typeof(SystemOptimizationReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOptimizationOpportunities()
        {
            try
            {
                var optimization = await _systemService.GetOptimizationOpportunitiesAsync();
                return Ok(optimization);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting optimization opportunities");
                return StatusCode(500, new { error = "Failed to get optimization opportunities" });
            }
        }

        /// <summary>
        /// Coordinate system operations
        /// </summary>
        /// <param name="request">Coordination request with operation type and subsystems</param>
        /// <returns>Coordination result with execution steps</returns>
        [HttpPost("coordinate")]
        [ProducesResponseType(typeof(SystemCoordinationResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> CoordinateSystemOperations([FromBody] CoordinationRequest request)
        {
            try
            {
                _logger.LogInformation("Coordinating system operation: {OperationType}", request.OperationType);
                var result = await _systemService.CoordinateSystemOperationsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error coordinating system operations");
                return StatusCode(500, new { error = "Failed to coordinate system operations" });
            }
        }

        /// <summary>
        /// Run system diagnostics
        /// </summary>
        /// <returns>Comprehensive diagnostics report with test results</returns>
        [HttpPost("diagnostics")]
        [ProducesResponseType(typeof(SystemDiagnosticsReport), StatusCodes.Status200OK)]
        public async Task<IActionResult> RunSystemDiagnostics()
        {
            try
            {
                _logger.LogInformation("Running system diagnostics");
                var diagnostics = await _systemService.RunSystemDiagnosticsAsync();
                return Ok(diagnostics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error running system diagnostics");
                return StatusCode(500, new { error = "Failed to run system diagnostics" });
            }
        }

        /// <summary>
        /// Initiate system recovery
        /// </summary>
        /// <param name="request">Recovery request with subsystem and recovery type</param>
        /// <returns>Recovery result with steps and health improvement</returns>
        [HttpPost("recovery")]
        [ProducesResponseType(typeof(SystemRecoveryResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> InitiateSystemRecovery([FromBody] SystemOrchestrationRecoveryRequest request)
        {
            try
            {
                _logger.LogWarning("Initiating system recovery for: {SubsystemId}", request.SubsystemId);
                var result = await _systemService.InitiateSystemRecoveryAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating system recovery");
                return StatusCode(500, new { error = "Failed to initiate system recovery" });
            }
        }
    }
}
