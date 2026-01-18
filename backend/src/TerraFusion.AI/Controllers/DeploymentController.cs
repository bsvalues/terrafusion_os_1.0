/*
 * DeploymentController - REST API for Production Deployment
 *
 * Provides endpoints for automated deployment, health monitoring,
 * rollback operations, and deployment history tracking.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 1 Day 1
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/deployment")]
    [Produces("application/json")]
    public class DeploymentController : ControllerBase
    {
        private readonly IProductionDeploymentService _deploymentService;
        private readonly ILogger<DeploymentController> _logger;

        public DeploymentController(
            IProductionDeploymentService deploymentService,
            ILogger<DeploymentController> logger)
        {
            _deploymentService = deploymentService;
            _logger = logger;
        }

        /// <summary>
        /// Deploy to environment
        /// </summary>
        /// <param name="request">Deployment configuration</param>
        /// <returns>Deployment result with status tracking ID</returns>
        [HttpPost]
        [ProducesResponseType(typeof(DeploymentResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Deploy([FromBody] DeploymentRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Environment))
                {
                    return BadRequest(new { error = "Environment is required" });
                }

                _logger.LogInformation(
                    "Deployment request received for environment: {Environment} with strategy: {Strategy}",
                    request.Environment, request.Strategy);

                var result = await _deploymentService.DeployAsync(request);

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    return Ok(result); // Return 200 even on failure so client gets full error details
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing deployment request");
                return StatusCode(500, new
                {
                    error = "Failed to process deployment",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// Get deployment status
        /// </summary>
        /// <param name="deploymentId">Deployment ID</param>
        /// <returns>Current deployment status</returns>
        [HttpGet("{deploymentId}/status")]
        [ProducesResponseType(typeof(DeploymentStatus), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetStatus(string deploymentId)
        {
            try
            {
                var status = await _deploymentService.GetDeploymentStatusAsync(deploymentId);
                return Ok(status);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = $"Deployment {deploymentId} not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting deployment status");
                return StatusCode(500, new { error = "Failed to get deployment status" });
            }
        }

        /// <summary>
        /// Rollback deployment
        /// </summary>
        /// <param name="deploymentId">Deployment ID to rollback</param>
        /// <returns>Rollback result</returns>
        [HttpPost("{deploymentId}/rollback")]
        [ProducesResponseType(typeof(RollbackResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Rollback(string deploymentId)
        {
            try
            {
                _logger.LogWarning("Rollback requested for deployment {DeploymentId}", deploymentId);

                var result = await _deploymentService.RollbackAsync(deploymentId);

                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    return NotFound(new { error = result.Error });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rolling back deployment");
                return StatusCode(500, new { error = "Failed to rollback deployment" });
            }
        }

        /// <summary>
        /// Validate deployment before execution
        /// </summary>
        /// <param name="request">Deployment request to validate</param>
        /// <returns>Validation results</returns>
        [HttpPost("validate")]
        [ProducesResponseType(typeof(PreDeploymentValidation), StatusCodes.Status200OK)]
        public async Task<IActionResult> Validate([FromBody] DeploymentRequest request)
        {
            try
            {
                var validation = await _deploymentService.ValidateDeploymentAsync(request);
                return Ok(validation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating deployment");
                return StatusCode(500, new { error = "Failed to validate deployment" });
            }
        }

        /// <summary>
        /// Get deployment history
        /// </summary>
        /// <param name="environment">Filter by environment (optional)</param>
        /// <returns>List of recent deployments</returns>
        [HttpGet("history")]
        [ProducesResponseType(typeof(List<DeploymentHistory>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetHistory([FromQuery] string? environment = null)
        {
            try
            {
                var history = await _deploymentService.GetDeploymentHistoryAsync(environment ?? string.Empty);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting deployment history");
                return StatusCode(500, new { error = "Failed to get deployment history" });
            }
        }

        /// <summary>
        /// Perform environment health check
        /// </summary>
        /// <param name="environment">Environment to check</param>
        /// <returns>Health check results</returns>
        [HttpGet("health/{environment}")]
        [ProducesResponseType(typeof(HealthCheckResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> HealthCheck(string environment)
        {
            try
            {
                var health = await _deploymentService.PerformHealthCheckAsync(environment);
                return Ok(health);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing health check");
                return StatusCode(500, new { error = "Failed to perform health check" });
            }
        }
    }
}
