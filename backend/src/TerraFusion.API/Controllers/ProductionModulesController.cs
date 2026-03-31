using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = "OSCoreAccess")]
public class ProductionModulesController : ControllerBase
{
    private readonly IModuleLoaderService _moduleLoader;
    private readonly ILogger<ProductionModulesController> _logger;

    public ProductionModulesController(
        IModuleLoaderService moduleLoader,
        ILogger<ProductionModulesController> logger)
    {
        _moduleLoader = moduleLoader;
        _logger = logger;
    }

    /// <summary>
    /// Get the unified runtime module catalog, including invalid module folders.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Module>>> GetActiveModules()
    {
        try
        {
            _logger.LogInformation("Loading production modules from runtime catalog");
            var modules = await _moduleLoader.LoadDiscoveredModulesAsync();
            return Ok(modules);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active modules");
            return StatusCode(500, new { error = "Failed to load active modules", details = ex.Message });
        }
    }

    /// <summary>
    /// Get specific module by name
    /// </summary>
    [HttpGet("{moduleName}")]
    public async Task<ActionResult<Module>> GetModule(string moduleName)
    {
        try
        {
            _logger.LogInformation("Loading module {ModuleName}", moduleName);
            var module = await _moduleLoader.LoadModuleAsync(moduleName);
            
            if (module == null)
            {
                return NotFound(new { error = $"Module '{moduleName}' not found" });
            }

            return Ok(module);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting module {ModuleName}", moduleName);
            return StatusCode(500, new { error = "Failed to load module", details = ex.Message });
        }
    }

    /// <summary>
    /// Check if a module is available in the filesystem
    /// </summary>
    [HttpGet("{moduleName}/available")]
    public async Task<ActionResult<bool>> IsModuleAvailable(string moduleName)
    {
        try
        {
            var available = await _moduleLoader.IsModuleAvailableAsync(moduleName);
            return Ok(new { moduleName, available });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking module availability {ModuleName}", moduleName);
            return StatusCode(500, new { error = "Failed to check module availability", details = ex.Message });
        }
    }

    /// <summary>
    /// Refresh module cache (reload all modules from filesystem)
    /// </summary>
    [HttpPost("refresh")]
    public async Task<ActionResult> RefreshModules()
    {
        try
        {
            _logger.LogInformation("Refreshing module cache");
            await _moduleLoader.RefreshModulesAsync();
            return Ok(new { message = "Module cache refreshed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing modules");
            return StatusCode(500, new { error = "Failed to refresh modules", details = ex.Message });
        }
    }

    /// <summary>
    /// Get module statistics and summary
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<ModuleStats>> GetModuleStats()
    {
        try
        {
            _logger.LogInformation("Getting module statistics");
            var modules = await _moduleLoader.LoadDiscoveredModulesAsync();
            var modulesList = modules.ToList();

            var stats = new ModuleStats
            {
                TotalModules = modulesList.Count,
                ActiveModules = modulesList.Count(m => m.Status == Core.Enums.ModuleStatus.Active),
                Tier1Modules = modulesList.Count(m => m.Tier == Core.Enums.ModuleTier.Tier1),
                Tier2Modules = modulesList.Count(m => m.Tier == Core.Enums.ModuleTier.Tier2),
                CoreModules = modulesList.Count(m => m.IsCore),
                ModulesByStatus = modulesList.GroupBy(m => m.Status)
                    .ToDictionary(g => g.Key.ToString(), g => g.Count()),
                LastUpdated = DateTime.UtcNow
            };

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting module statistics");
            return StatusCode(500, new { error = "Failed to get module statistics", details = ex.Message });
        }
    }

    /// <summary>
    /// Launch a specific module (for frontend integration)
    /// </summary>
    [HttpPost("{moduleName}/launch")]
    public async Task<ActionResult<ModuleLaunchResult>> LaunchModule(string moduleName)
    {
        try
        {
            _logger.LogInformation("Launching module {ModuleName}", moduleName);
            
            var module = await _moduleLoader.LoadModuleAsync(moduleName);
            if (module == null)
            {
                return NotFound(new { error = $"Module '{moduleName}' not found" });
            }

            if (module.Status != Core.Enums.ModuleStatus.Active)
            {
                return BadRequest(new { error = $"Module '{moduleName}' is not active (status: {module.Status})" });
            }

            var launchResult = new ModuleLaunchResult
            {
                ModuleName = moduleName,
                DisplayName = module.DisplayName,
                LaunchPath = module.LaunchPath ?? $"modules/{moduleName}/index.html",
                Status = "launched",
                Timestamp = DateTime.UtcNow,
                Success = true
            };

            // In a real implementation, you might track launches in database
            _logger.LogInformation("Module {ModuleName} launched successfully", moduleName);

            return Ok(launchResult);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error launching module {ModuleName}", moduleName);
            return StatusCode(500, new { error = "Failed to launch module", details = ex.Message });
        }
    }
}

// DTOs for API responses
public class ModuleStats
{
    public int TotalModules { get; set; }
    public int ActiveModules { get; set; }
    public int Tier1Modules { get; set; }
    public int Tier2Modules { get; set; }
    public int CoreModules { get; set; }
    public Dictionary<string, int> ModulesByStatus { get; set; } = new();
    public DateTime LastUpdated { get; set; }
}

public class ModuleLaunchResult
{
    public string ModuleName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string LaunchPath { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool Success { get; set; }
    public DateTime Timestamp { get; set; }
    public string? ErrorMessage { get; set; }
}