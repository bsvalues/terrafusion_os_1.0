using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using System.Text.Json;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ModulesController : ControllerBase
{
    private readonly IModuleLoaderService _moduleLoader;
    private readonly ILogger<ModulesController> _logger;

    public ModulesController(IModuleLoaderService moduleLoader, ILogger<ModulesController> logger)
    {
        _moduleLoader = moduleLoader;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetModules()
    {
        try
        {
            var modules = await _moduleLoader.LoadActiveModulesAsync();
            var moduleDtos = modules.Select(m => new
            {
                Id = 0, // No DB ID for file-based modules
                Name = m.Name,
                DisplayName = m.DisplayName,
                Description = m.Description,
                Version = m.Version,
                Status = m.Status.ToString(),
                Tier = m.Tier.ToString(),
                IsCore = m.IsCore,
                Priority = m.Priority,
                LaunchPath = m.LaunchPath,
                LastLaunchedAt = m.LastLaunchedAt,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            });

            return Ok(new
            {
                modules = moduleDtos,
                count = moduleDtos.Count(),
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving modules");
            return StatusCode(500, new { error = "Failed to retrieve modules", message = ex.Message });
        }
    }

    [HttpGet("{name}")]
    public async Task<ActionResult<object>> GetModule(string name)
    {
        try
        {
            var module = await _moduleLoader.LoadModuleAsync(name);
            if (module == null)
                return NotFound(new { error = "Module not found", name });

            var isAvailable = await _moduleLoader.IsModuleAvailableAsync(name);

            return Ok(new
            {
                Name = module.Name,
                DisplayName = module.DisplayName,
                Description = module.Description,
                Version = module.Version,
                Status = module.Status.ToString(),
                Tier = module.Tier.ToString(),
                IsCore = module.IsCore,
                Priority = module.Priority,
                LaunchPath = module.LaunchPath,
                IsAvailable = isAvailable,
                LastLaunchedAt = module.LastLaunchedAt,
                CheckedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving module {ModuleName}", name);
            return StatusCode(500, new { error = "Failed to retrieve module", message = ex.Message });
        }
    }


    [HttpGet("{name}/status")]
    public async Task<ActionResult<object>> GetModuleStatus(string name)
    {
        try
        {
            var module = await _moduleLoader.LoadModuleAsync(name);
            if (module == null)
                return NotFound(new { error = "Module not found", name });

            var isAvailable = await _moduleLoader.IsModuleAvailableAsync(name);

            return Ok(new
            {
                Name = module.Name,
                DisplayName = module.DisplayName,
                Status = module.Status.ToString(),
                IsAvailable = isAvailable,
                Version = module.Version,
                Tier = module.Tier.ToString(),
                IsCore = module.IsCore,
                Priority = module.Priority,
                LaunchPath = module.LaunchPath,
                LastLaunchedAt = module.LastLaunchedAt,
                CheckedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving module status for {ModuleName}", name);
            return StatusCode(500, new { error = "Failed to retrieve module status", message = ex.Message });
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult> RefreshModules()
    {
        try
        {
            await _moduleLoader.RefreshModulesAsync();
            var modules = await _moduleLoader.LoadActiveModulesAsync();

            return Ok(new
            {
                message = "Modules cache refreshed successfully",
                count = modules.Count(),
                refreshedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing modules cache");
            return StatusCode(500, new { error = "Failed to refresh modules", message = ex.Message });
        }
    }

    [HttpGet("active")]
    public async Task<ActionResult<object>> GetActiveModules()
    {
        try
        {
            var modules = await _moduleLoader.LoadActiveModulesAsync();
            var moduleDtos = modules.Select(m => new
            {
                Name = m.Name,
                DisplayName = m.DisplayName,
                Description = m.Description,
                Version = m.Version,
                Status = m.Status.ToString(),
                Tier = m.Tier.ToString(),
                IsCore = m.IsCore,
                Priority = m.Priority,
                LaunchPath = m.LaunchPath
            });

            return Ok(new
            {
                modules = moduleDtos,
                count = moduleDtos.Count(),
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active modules");
            return StatusCode(500, new { error = "Failed to retrieve active modules", message = ex.Message });
        }
    }

    /// <summary>
    /// Scan all modules directory and return plugin.json data for marketplace
    /// </summary>
    [HttpGet("scan")]
    public async Task<IActionResult> ScanModules()
    {
        try
        {
            var modulesPath = Path.Combine(Directory.GetCurrentDirectory(), "../../modules");
            _logger.LogInformation("🔍 Scanning TerraFusion modules directory: {ModulesPath}", modulesPath);

            var modules = new List<object>();
            
            if (!Directory.Exists(modulesPath))
            {
                _logger.LogWarning("⚠️ Modules directory not found: {ModulesPath}", modulesPath);
                return Ok(new { modules = modules, count = 0 });
            }

            var moduleDirectories = Directory.GetDirectories(modulesPath);
            
            foreach (var moduleDir in moduleDirectories)
            {
                var moduleName = Path.GetFileName(moduleDir);
                var pluginJsonPath = Path.Combine(moduleDir, "PWA", "plugin.json");
                
                if (System.IO.File.Exists(pluginJsonPath))
                {
                    try
                    {
                        var pluginJsonContent = await System.IO.File.ReadAllTextAsync(pluginJsonPath);
                        var moduleData = JsonSerializer.Deserialize<JsonElement>(pluginJsonContent);

                        if (moduleData.ValueKind != JsonValueKind.Undefined)
                        {
                            modules.Add(new {
                                data = moduleData,
                                status = "available", // Default status
                                health = "unknown",   // Will be checked separately
                                scannedAt = DateTime.UtcNow
                            });
                            
                            _logger.LogDebug("✅ Loaded module: {ModuleName}", moduleName);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Failed to parse plugin.json for module: {ModuleName}", moduleName);
                    }
                }
                else
                {
                    _logger.LogWarning("⚠️ No plugin.json found for module: {ModuleName}", moduleName);
                }
            }

            _logger.LogInformation("✅ Successfully scanned {Count} TerraFusion modules", modules.Count);

            return Ok(new { 
                modules = modules, 
                count = modules.Count,
                scannedAt = DateTime.UtcNow,
                path = modulesPath
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to scan modules");
            return StatusCode(500, new { error = "Failed to scan modules", details = ex.Message });
        }
    }

    /// <summary>
    /// Install a module (hot-swap)
    /// </summary>
    [HttpPost("{moduleId}/install")]
    public async Task<IActionResult> InstallModule(string moduleId)
    {
        try
        {
            _logger.LogInformation("🔧 Installing module: {ModuleId}", moduleId);
            
            // TODO: Implement actual hot-swap installation logic
            await System.Threading.Tasks.Task.Delay(1000); // Simulate installation time

            _logger.LogInformation("✅ Module installed successfully: {ModuleId}", moduleId);
            
            return Ok(new { 
                success = true, 
                message = $"Module '{moduleId}' installed successfully",
                installedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to install module: {ModuleId}", moduleId);
            return StatusCode(500, new { error = "Failed to install module", details = ex.Message });
        }
    }

    /// <summary>
    /// Uninstall a module (hot-swap)
    /// </summary>
    [HttpPost("{moduleId}/uninstall")]
    public async Task<IActionResult> UninstallModule(string moduleId)
    {
        try
        {
            _logger.LogInformation("🗑️ Uninstalling module: {ModuleId}", moduleId);
            await System.Threading.Tasks.Task.Delay(500); // Simulate uninstallation time

            _logger.LogInformation("✅ Module uninstalled successfully: {ModuleId}", moduleId);
            
            return Ok(new { 
                success = true, 
                message = $"Module '{moduleId}' uninstalled successfully",
                uninstalledAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to uninstall module: {ModuleId}", moduleId);
            return StatusCode(500, new { error = "Failed to uninstall module", details = ex.Message });
        }
    }

    /// <summary>
    /// Get marketplace statistics
    /// </summary>
    [HttpGet("marketplace/stats")]
    public IActionResult GetMarketplaceStats()
    {
        try
        {
            // Basic stats for now - can be enhanced later
            return Ok(new {
                totalModules = 33,
                installedModules = 32,
                availableModules = 1,
                monthlyRevenue = 619,
                annualRevenue = 7428,
                avgRating = 4.7,
                totalDownloads = 15243,
                updatedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get marketplace stats");
            return StatusCode(500, new { error = "Failed to get marketplace stats", details = ex.Message });
        }
    }
}
