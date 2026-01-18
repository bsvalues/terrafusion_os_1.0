/*
 * MultiCountyDeploymentController - REST API for Multi-County Deployment
 *
 * Provides endpoints for multi-county deployment orchestration,
 * county-specific status tracking, and coordinated rollback operations.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 3.0.0 - Phase 3 Week 1 Day 2
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers
{
    [ApiController]
    [Route("api/multi-county")]
    [Produces("application/json")]
    public class MultiCountyDeploymentController : ControllerBase
    {
        private readonly IMultiCountyDeploymentService _multiCountyService;
        private readonly ILogger<MultiCountyDeploymentController> _logger;

        public MultiCountyDeploymentController(
            IMultiCountyDeploymentService multiCountyService,
            ILogger<MultiCountyDeploymentController> logger)
        {
            _multiCountyService = multiCountyService;
            _logger = logger;
        }

        /// <summary>
        /// Deploy to multiple counties
        /// </summary>
        /// <param name="request">Multi-county deployment configuration</param>
        /// <returns>Multi-county deployment result</returns>
        [HttpPost("deploy")]
        [ProducesResponseType(typeof(MultiCountyDeploymentResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeployToCounties([FromBody] MultiCountyDeploymentRequest request)
        {
            try
            {
                if (request.Counties == null || !request.Counties.Any())
                {
                    return BadRequest(new { error = "At least one county is required" });
                }

                _logger.LogInformation(
                    "Multi-county deployment request for {Count} counties using {Strategy} strategy",
                    request.Counties.Count, request.RolloutStrategy);

                var result = await _multiCountyService.DeployToCountiesAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing multi-county deployment");
                return StatusCode(500, new
                {
                    error = "Failed to process multi-county deployment",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// Get county deployment status
        /// </summary>
        /// <param name="deploymentId">Deployment ID</param>
        /// <param name="countyCode">County code</param>
        /// <returns>County deployment status</returns>
        [HttpGet("{deploymentId}/county/{countyCode}")]
        [ProducesResponseType(typeof(CountyDeploymentStatus), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetCountyStatus(string deploymentId, string countyCode)
        {
            try
            {
                var status = await _multiCountyService.GetCountyDeploymentStatusAsync(deploymentId, countyCode);
                return Ok(status);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new
                {
                    error = $"County deployment not found: {deploymentId}/{countyCode}"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting county deployment status");
                return StatusCode(500, new { error = "Failed to get county deployment status" });
            }
        }

        /// <summary>
        /// Get available counties
        /// </summary>
        /// <returns>List of available counties</returns>
        [HttpGet("counties")]
        [ProducesResponseType(typeof(List<CountyConfiguration>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAvailableCounties()
        {
            try
            {
                var counties = await _multiCountyService.GetAvailableCountiesAsync();
                return Ok(counties);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available counties");
                return StatusCode(500, new { error = "Failed to get available counties" });
            }
        }

        /// <summary>
        /// Validate county compliance
        /// </summary>
        /// <param name="countyCode">County code to validate</param>
        /// <param name="request">Deployment request for validation</param>
        /// <returns>Compliance validation result</returns>
        [HttpPost("validate/{countyCode}")]
        [ProducesResponseType(typeof(CountyComplianceValidation), StatusCodes.Status200OK)]
        public async Task<IActionResult> ValidateCountyCompliance(
            string countyCode,
            [FromBody] DeploymentRequest request)
        {
            try
            {
                var validation = await _multiCountyService.ValidateCountyComplianceAsync(
                    countyCode,
                    request);

                return Ok(validation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating county compliance");
                return StatusCode(500, new { error = "Failed to validate county compliance" });
            }
        }

        /// <summary>
        /// Rollback multiple counties
        /// </summary>
        /// <param name="deploymentId">Deployment ID</param>
        /// <param name="request">Counties to rollback</param>
        /// <returns>Multi-county rollback result</returns>
        [HttpPost("{deploymentId}/rollback")]
        [ProducesResponseType(typeof(MultiCountyRollbackResult), StatusCodes.Status200OK)]
        public async Task<IActionResult> RollbackCounties(
            string deploymentId,
            [FromBody] RollbackCountiesRequest request)
        {
            try
            {
                _logger.LogWarning(
                    "Multi-county rollback requested for deployment {DeploymentId} - {Count} counties",
                    deploymentId, request.CountyCodes.Count);

                var result = await _multiCountyService.RollbackCountiesAsync(
                    deploymentId,
                    request.CountyCodes);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rolling back counties");
                return StatusCode(500, new { error = "Failed to rollback counties" });
            }
        }
    }

    // ==================== REQUEST MODELS ====================

    public class RollbackCountiesRequest
    {
        public List<string> CountyCodes { get; set; } = new();
    }
}
