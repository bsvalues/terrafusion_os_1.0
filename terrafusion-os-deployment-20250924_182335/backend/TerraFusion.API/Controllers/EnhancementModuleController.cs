using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Enums;
using TerraFusion.API.Security;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Module Ecosystem Controller - API endpoints for 33+ module management
    /// Provides comprehensive orchestration control for TerraFusion OS module system
    /// </summary>
    [ApiController]
    [Route("api/ecosystem")]
    [Authorize]
    public class EnhancementModuleController : ControllerBase
    {
        private readonly ILogger<EnhancementModuleController> _logger;
        private readonly IModuleOrchestrationService _orchestrationService;
        private readonly IEnhancementModuleRegistrationService _enhancementModuleService;

        public EnhancementModuleController(
            ILogger<EnhancementModuleController> logger,
            IModuleOrchestrationService orchestrationService,
            IEnhancementModuleRegistrationService enhancementModuleService)
        {
            _logger = logger;
            _orchestrationService = orchestrationService;
            _enhancementModuleService = enhancementModuleService;
        }

        /// <summary>
        /// Get all registered enhancement modules
        /// </summary>
        [HttpGet("enhancement-modules")]
        [RequiresPermission("ecosystem:view")]
        public async Task<ActionResult<IEnumerable<Module>>> GetEnhancementModules()
        {
            _logger.LogInformation("🎯 API Request: Get Enhancement Modules");
            
            try
            {
                var enhancementModules = await _enhancementModuleService.GetEnhancementModulesAsync();
                
                _logger.LogInformation("✅ Retrieved {Count} enhancement modules", enhancementModules.Count());
                
                return Ok(enhancementModules);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to get enhancement modules");
                return StatusCode(500, new { error = "Failed to retrieve enhancement modules", details = ex.Message });
            }
        }

        /// <summary>
        /// Register all enhancement modules in the ecosystem
        /// </summary>
        [HttpPost("enhancement-modules/register")]
        [RequiresPermission("ecosystem:manage")]
        public async Task<ActionResult<ModuleRegistrationResponse>> RegisterEnhancementModules()
        {
            _logger.LogInformation("🚀 API Request: Register Enhancement Modules");
            
            try
            {
                var success = await _enhancementModuleService.RegisterEnhancementModulesAsync();
                
                var response = new ModuleRegistrationResponse
                {
                    ModuleId = "enhancement-modules",
                    Status = success ? ModuleStatus.Active : ModuleStatus.Inactive,
                    Success = success,
                    Message = success ? "Enhancement modules registered successfully" : "Enhancement module registration failed",
                    Timestamp = DateTime.UtcNow
                };
                
                if (success)
                {
                    _logger.LogInformation("✅ Enhancement modules registered successfully");
                    return Ok(response);
                }
                else
                {
                    _logger.LogWarning("⚠️ Enhancement module registration failed");
                    return BadRequest(response);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error registering enhancement modules");
                
                return StatusCode(500, new ModuleRegistrationResponse
                {
                    ModuleId = "enhancement-modules",
                    Status = ModuleStatus.Error,
                    Success = false,
                    Message = "Enhancement module registration failed",
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Get specific enhancement module details
        /// </summary>
        [HttpGet("enhancement-modules/{moduleName}")]
        [RequiresPermission("ecosystem:view")]
        public async Task<ActionResult<Module>> GetEnhancementModule(string moduleName)
        {
            _logger.LogInformation("🔍 API Request: Get Enhancement Module {ModuleName}", moduleName);
            
            try
            {
                var module = await _enhancementModuleService.GetEnhancementModuleAsync(moduleName);
                
                if (module == null)
                {
                    _logger.LogWarning("⚠️ Enhancement module not found: {ModuleName}", moduleName);
                    return NotFound(new { error = "Enhancement module not found", moduleName = moduleName });
                }
                
                _logger.LogInformation("✅ Retrieved enhancement module: {ModuleName}", moduleName);
                return Ok(module);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting enhancement module: {ModuleName}", moduleName);
                return StatusCode(500, new { error = "Failed to retrieve enhancement module", details = ex.Message });
            }
        }

        /// <summary>
        /// Validate enhancement module health
        /// </summary>
        [HttpGet("enhancement-modules/{moduleName}/health")]
        [RequiresPermission("ecosystem:view")]
        public async Task<ActionResult> ValidateEnhancementModuleHealth(string moduleName)
        {
            _logger.LogInformation("💚 API Request: Validate Enhancement Module Health {ModuleName}", moduleName);
            
            try
            {
                var isHealthy = await _enhancementModuleService.ValidateEnhancementModuleAsync(moduleName);
                
                var healthStatus = new
                {
                    moduleName = moduleName,
                    isHealthy = isHealthy,
                    status = isHealthy ? "Healthy" : "Unhealthy",
                    timestamp = DateTime.UtcNow,
                    message = isHealthy ? "Enhancement module is operational" : "Enhancement module is not responding"
                };
                
                if (isHealthy)
                {
                    _logger.LogInformation("✅ Enhancement module is healthy: {ModuleName}", moduleName);
                    return Ok(healthStatus);
                }
                else
                {
                    _logger.LogWarning("⚠️ Enhancement module is unhealthy: {ModuleName}", moduleName);
                    return BadRequest(healthStatus);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error validating enhancement module health: {ModuleName}", moduleName);
                return StatusCode(500, new { error = "Health validation failed", details = ex.Message });
            }
        }
    }

    public class ModuleRegistrationResponse
    {
        public string ModuleId { get; set; } = string.Empty;
        public TerraFusion.Core.Enums.ModuleStatus Status { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Error { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
