using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.DTOs;
using TerraFusion.API.Services;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Government Module Integration Controller
/// Manages the 37-module ecosystem for TerraFusion OS Government Edition
/// Handles hot-swappable module loading, integration status, and government deployment readiness
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Government Module Integration")]
public class ModuleIntegrationController : ControllerBase
{
    private readonly ModuleIntegrationService _moduleService;
    private readonly ILogger<ModuleIntegrationController> _logger;

    public ModuleIntegrationController(
        ModuleIntegrationService moduleService,
        ILogger<ModuleIntegrationController> logger)
    {
        _moduleService = moduleService;
        _logger = logger;
    }

    /// <summary>
    /// Get all 37 government modules in the TerraFusion OS ecosystem
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ModuleInfo>>> GetAllModules()
    {
        try
        {
            var modules = await _moduleService.GetAllModulesAsync();
            _logger.LogInformation("Retrieved {Count} modules from ecosystem", modules.Count);
            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve modules");
            return StatusCode(500, new { error = "Failed to retrieve modules", details = ex.Message });
        }
    }

    /// <summary>
    /// Get specific module by ID
    /// </summary>
    [HttpGet("{moduleId}")]
    public async Task<ActionResult<ModuleInfo>> GetModule(string moduleId)
    {
        try
        {
            var module = await _moduleService.GetModuleAsync(moduleId);
            if (module == null)
                return NotFound(new { error = $"Module '{moduleId}' not found" });

            return Ok(module);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve module {ModuleId}", moduleId);
            return StatusCode(500, new { error = $"Failed to retrieve module {moduleId}", details = ex.Message });
        }
    }

    /// <summary>
    /// Get modules by tier (1=Core Government, 2=Operational, etc.)
    /// </summary>
    [HttpGet("tier/{tier:int}")]
    public async Task<ActionResult<List<ModuleInfo>>> GetModulesByTier(int tier)
    {
        try
        {
            if (tier < 1 || tier > 7)
                return BadRequest(new { error = "Tier must be between 1 and 7" });

            var modules = await _moduleService.GetModulesByTierAsync(tier);
            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve modules for tier {Tier}", tier);
            return StatusCode(500, new { error = $"Failed to retrieve tier {tier} modules", details = ex.Message });
        }
    }

    /// <summary>
    /// Get modules by government priority (critical, high, medium, low)
    /// </summary>
    [HttpGet("priority/{priority}")]
    public async Task<ActionResult<List<ModuleInfo>>> GetModulesByPriority(string priority)
    {
        try
        {
            var validPriorities = new[] { "critical", "high", "medium", "low" };
            if (!validPriorities.Contains(priority.ToLowerInvariant()))
                return BadRequest(new { error = "Priority must be: critical, high, medium, or low" });

            var modules = await _moduleService.GetModulesByPriorityAsync(priority);
            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve modules for priority {Priority}", priority);
            return StatusCode(500, new { error = $"Failed to retrieve {priority} priority modules", details = ex.Message });
        }
    }

    /// <summary>
    /// Get all fully integrated modules (production ready)
    /// </summary>
    [HttpGet("integrated")]
    public async Task<ActionResult<List<ModuleInfo>>> GetIntegratedModules()
    {
        try
        {
            var modules = await _moduleService.GetIntegratedModulesAsync();
            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve integrated modules");
            return StatusCode(500, new { error = "Failed to retrieve integrated modules", details = ex.Message });
        }
    }

    /// <summary>
    /// Get modules ready for integration
    /// </summary>
    [HttpGet("ready-to-integrate")]
    public async Task<ActionResult<List<ModuleInfo>>> GetReadyToIntegrateModules()
    {
        try
        {
            var modules = await _moduleService.GetReadyToIntegrateModulesAsync();
            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve ready-to-integrate modules");
            return StatusCode(500, new { error = "Failed to retrieve ready-to-integrate modules", details = ex.Message });
        }
    }

    /// <summary>
    /// Get comprehensive integration status report for government deployment
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<IntegrationStatusReport>> GetIntegrationStatus()
    {
        try
        {
            var report = await _moduleService.GetIntegrationStatusReportAsync();
            return Ok(report);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate integration status report");
            return StatusCode(500, new { error = "Failed to generate integration status report", details = ex.Message });
        }
    }

    /// <summary>
    /// Integrate a specific module into the government ecosystem
    /// </summary>
    [HttpPost("integrate/{moduleId}")]
    public async Task<ActionResult> IntegrateModule(string moduleId)
    {
        try
        {
            _logger.LogInformation("Starting integration of module {ModuleId}", moduleId);
            
            var success = await _moduleService.IntegrateModuleAsync(moduleId);
            if (success)
            {
                return Ok(new { 
                    message = $"Module '{moduleId}' integrated successfully",
                    moduleId = moduleId,
                    integratedAt = DateTime.UtcNow
                });
            }
            
            return BadRequest(new { 
                error = $"Failed to integrate module '{moduleId}'",
                moduleId = moduleId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to integrate module {ModuleId}", moduleId);
            return StatusCode(500, new { 
                error = $"Failed to integrate module '{moduleId}'", 
                details = ex.Message 
            });
        }
    }

    /// <summary>
    /// Integrate the next priority modules for government deployment
    /// </summary>
    [HttpPost("integrate-priority")]
    public async Task<ActionResult> IntegrateNextPriorityModules([FromQuery] int maxCount = 5)
    {
        try
        {
            if (maxCount < 1 || maxCount > 10)
                return BadRequest(new { error = "maxCount must be between 1 and 10" });

            _logger.LogInformation("Starting integration of next {MaxCount} priority modules", maxCount);
            
            var success = await _moduleService.IntegrateNextPriorityModulesAsync(maxCount);
            var report = await _moduleService.GetIntegrationStatusReportAsync();
            
            return Ok(new { 
                message = success ? 
                    "All priority modules integrated successfully" : 
                    "Some priority modules failed to integrate",
                success = success,
                integrationReport = report,
                integratedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to integrate priority modules");
            return StatusCode(500, new { 
                error = "Failed to integrate priority modules", 
                details = ex.Message 
            });
        }
    }

    /// <summary>
    /// Get real-time module statuses for government monitoring
    /// </summary>
    [HttpGet("module-statuses")]
    public ActionResult<Dictionary<string, ModuleStatus>> GetModuleStatuses()
    {
        try
        {
            var statuses = _moduleService.GetModuleStatuses();
            return Ok(statuses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve module statuses");
            return StatusCode(500, new { error = "Failed to retrieve module statuses", details = ex.Message });
        }
    }

    /// <summary>
    /// Government deployment readiness check for Benton County Washington
    /// </summary>
    [HttpGet("deployment-readiness")]
    public async Task<ActionResult> GetDeploymentReadiness()
    {
        try
        {
            var report = await _moduleService.GetIntegrationStatusReportAsync();
            var criticalModules = await _moduleService.GetModulesByPriorityAsync("critical");
            var integratedCritical = criticalModules.Where(m => m.IntegrationStatus == "fully_integrated").ToList();
            
            var readiness = new
            {
                deploymentReady = report.CriticalIntegrationPercentage >= 80,
                overallIntegration = report.IntegrationPercentage,
                criticalModulesReady = report.CriticalIntegrationPercentage,
                criticalModules = new
                {
                    total = criticalModules.Count,
                    integrated = integratedCritical.Count,
                    pending = criticalModules.Count - integratedCritical.Count
                },
                bentonCountyReadiness = new
                {
                    government_operations = integratedCritical.Any(m => m.Id == "government-edition"),
                    ai_coordination = integratedCritical.Any(m => m.Id == "ai-swarm"),
                    property_assessment = integratedCritical.Any(m => m.Id == "costforge-ai"),
                    data_synchronization = integratedCritical.Any(m => m.Id == "terra-fusion-sync")
                },
                nextActions = report.NextPriorityIntegrations.Take(3).ToList(),
                assessmentTimestamp = DateTime.UtcNow
            };

            return Ok(readiness);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to assess deployment readiness");
            return StatusCode(500, new { error = "Failed to assess deployment readiness", details = ex.Message });
        }
    }

    /// <summary>
    /// Health check endpoint for module integration service
    /// </summary>
    [HttpGet("health")]
    public async Task<ActionResult> HealthCheck()
    {
        try
        {
            var registry = await _moduleService.LoadComponentRegistryAsync();
            var report = await _moduleService.GetIntegrationStatusReportAsync();
            
            return Ok(new
            {
                status = "healthy",
                service = "ModuleIntegrationService",
                totalModules = report.TotalModules,
                integratedModules = report.FullyIntegrated,
                systemInfo = registry.SystemInfo,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed for module integration service");
            return StatusCode(503, new { 
                status = "unhealthy",
                service = "ModuleIntegrationService",
                error = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}