using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CountyDeploymentController : ControllerBase
    {
        private readonly ICountyDeploymentService _countyDeploymentService;
        private readonly ILogger<CountyDeploymentController> _logger;

        public CountyDeploymentController(ICountyDeploymentService countyDeploymentService, ILogger<CountyDeploymentController> logger)
        {
            _countyDeploymentService = countyDeploymentService;
            _logger = logger;
        }

        [HttpPost("deploy")]
        public async Task<ActionResult> DeployCounty([FromBody] CountyDeploymentRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _countyDeploymentService.DeployCountyAsync(request);

                if (result.Success)
                {
                    return Ok(new { 
                        success = true, 
                        message = result.Message,
                        countyId = result.CountyId,
                        deployedModules = result.DeployedModules
                    });
                }
                else
                {
                    return BadRequest(new { 
                        success = false, 
                        message = result.Message 
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deploying county: {CountyName}", request.CountyName);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("deployments")]
        public async Task<ActionResult> GetCountyDeployments()
        {
            try
            {
                var deployments = await _countyDeploymentService.GetCountyDeploymentsAsync();
                return Ok(new { deployments });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving county deployments");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("deployments/{countyId}")]
        public async Task<ActionResult> GetCountyDeployment(string countyId)
        {
            try
            {
                var deployment = await _countyDeploymentService.GetCountyDeploymentAsync(countyId);
                
                if (deployment == null)
                    return NotFound();

                return Ok(deployment);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving county deployment: {CountyId}", countyId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("deployments/{countyId}/configuration")]
        public async Task<ActionResult> UpdateCountyConfiguration(string countyId, [FromBody] CountyConfiguration config)
        {
            try
            {
                var success = await _countyDeploymentService.UpdateCountyConfigurationAsync(countyId, config);
                
                if (success)
                    return Ok(new { message = "County configuration updated successfully" });
                else
                    return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating county configuration: {CountyId}", countyId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("deployments/{countyId}/health")]
        public async Task<ActionResult> GetCountyHealth(string countyId)
        {
            try
            {
                var health = await _countyDeploymentService.GetCountyHealthAsync(countyId);
                return Ok(health);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving county health: {CountyId}", countyId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("deployments/{countyId}/validate")]
        public async Task<ActionResult> ValidateCountyData(string countyId)
        {
            try
            {
                var isValid = await _countyDeploymentService.ValidateCountyDataAsync(countyId);
                
                return Ok(new { 
                    countyId, 
                    isValid, 
                    message = isValid ? "County data validation passed" : "County data validation failed" 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating county data: {CountyId}", countyId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("templates")]
        public ActionResult GetDeploymentTemplates()
        {
            var templates = new[]
            {
                new { 
                    name = "Basic County", 
                    type = CountyDeploymentType.Basic,
                    modules = new[] { "GIS Core", "Property Assessment", "Tax Levy Management" },
                    description = "Essential modules for small counties"
                },
                new { 
                    name = "Professional County", 
                    type = CountyDeploymentType.Professional,
                    modules = new[] { "GIS Core", "Property Assessment", "Tax Levy Management", "Advanced Analytics", "Compliance Automation" },
                    description = "Complete solution for medium counties"
                },
                new { 
                    name = "Enterprise County", 
                    type = CountyDeploymentType.Enterprise,
                    modules = new[] { "GIS Core", "Property Assessment", "Tax Levy Management", "Advanced Analytics", "Compliance Automation", "AI Swarm", "Quantum Optimization", "Harris PACS Integration" },
                    description = "Full AI-powered solution for large counties"
                }
            };

            return Ok(new { templates });
        }
    }
}
