using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;

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
}
