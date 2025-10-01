using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Services;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Deployment Pipeline API Controller
    /// One-click deployment to production counties with AI orchestration
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class DeploymentController : ControllerBase
    {
        private readonly ILogger<DeploymentController> _logger;
        private readonly IDeploymentPipelineService _deploymentService;

        public DeploymentController(
            ILogger<DeploymentController> logger,
            IDeploymentPipelineService deploymentService)
        {
            _logger = logger;
            _deploymentService = deploymentService;
        }

        /// <summary>
        /// Deploy module to county with full AI orchestration
        /// </summary>
        [HttpPost("deploy")]
        public async Task<ActionResult<DeploymentResult>> DeployToCounty([FromBody] DeploymentRequest request)
        {
            try
            {
                var result = await _deploymentService.DeployToCountyAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Deployment failed");
                return StatusCode(500, new { error = "Deployment failed" });
            }
        }

        /// <summary>
        /// Run automated tests for module
        /// </summary>
        [HttpPost("test/{*modulePath}")]
        public async Task<ActionResult<TestResult>> RunTests(string modulePath)
        {
            try
            {
                var result = await _deploymentService.RunAutomatedTestsAsync(modulePath);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Testing failed");
                return StatusCode(500, new { error = "Testing failed" });
            }
        }

        /// <summary>
        /// Rollback deployment
        /// </summary>
        [HttpPost("rollback/{deploymentId}")]
        public async Task<ActionResult<RollbackResult>> RollbackDeployment(string deploymentId)
        {
            try
            {
                var result = await _deploymentService.RollbackDeploymentAsync(deploymentId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Rollback failed");
                return StatusCode(500, new { error = "Rollback failed" });
            }
        }

        /// <summary>
        /// Get deployment status
        /// </summary>
        [HttpGet("status/{deploymentId}")]
        public async Task<ActionResult<DeploymentStatus>> GetDeploymentStatus(string deploymentId)
        {
            try
            {
                var status = await _deploymentService.GetDeploymentStatusAsync(deploymentId);
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get deployment status");
                return StatusCode(500, new { error = "Failed to get deployment status" });
            }
        }

        /// <summary>
        /// Get available counties for deployment
        /// </summary>
        [HttpGet("counties")]
        public async Task<ActionResult<CountyEnvironment[]>> GetAvailableCounties()
        {
            try
            {
                var counties = await _deploymentService.GetAvailableCountiesAsync();
                return Ok(counties);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get available counties");
                return StatusCode(500, new { error = "Failed to get counties" });
            }
        }

        /// <summary>
        /// Get deployment history
        /// </summary>
        [HttpGet("history/{moduleId}")]
        public async Task<ActionResult<DeploymentHistory[]>> GetDeploymentHistory(string moduleId)
        {
            try
            {
                var history = await _deploymentService.GetDeploymentHistoryAsync(moduleId);
                return Ok(history);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get deployment history");
                return StatusCode(500, new { error = "Failed to get deployment history" });
            }
        }
    }
}
