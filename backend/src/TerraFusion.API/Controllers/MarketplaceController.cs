using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Services;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,SystemAdmin")]
    public class MarketplaceController : ControllerBase
    {
        private readonly IModuleService _moduleService;
        private readonly ILogger<MarketplaceController> _logger;

        public MarketplaceController(IModuleService moduleService, ILogger<MarketplaceController> logger)
        {
            _moduleService = moduleService;
            _logger = logger;
        }

        [HttpGet("plugins")]
        public async Task<ActionResult> GetPlugins([FromQuery] string? search = null, [FromQuery] string? category = null, [FromQuery] string sort = "downloads")
        {
            try
            {
                var modules = await _moduleService.GetAllModulesAsync();

                // Transform modules to marketplace plugin format
                var plugins = modules.Select(m => new
                {
                    id = m.Name?.ToLower().Replace(" ", "-"),
                    name = string.IsNullOrWhiteSpace(m.DisplayName) ? m.Name : m.DisplayName,
                    version = m.Version ?? "1.0.0",
                    description = m.Description,
                    author = "TerraFusion",
                    category = m.IsCore ? "Core" : m.Tier.ToString(),
                    tags = new[] { m.Tier.ToString().ToLower(), "government", "terrafusion" },
                    metricsAvailable = false
                }).ToList();

                // Apply search filter
                if (!string.IsNullOrEmpty(search))
                {
                    plugins = plugins.Where(p =>
                        (p.name?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false) ||
                        (p.description?.Contains(search, StringComparison.OrdinalIgnoreCase) ?? false)
                    ).ToList();
                }

                // Apply category filter
                if (!string.IsNullOrEmpty(category))
                {
                    plugins = plugins.Where(p => p.category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
                }

                // Apply sorting
                plugins = sort switch
                {
                    "name" => plugins.OrderBy(p => p.name).ToList(),
                    _ => plugins.OrderByDescending(p => p.version).ToList()
                };

                return Ok(new { plugins });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving marketplace plugins");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("categories")]
        public async Task<ActionResult> GetCategories()
        {
            try
            {
                var modules = await _moduleService.GetAllModulesAsync();

                var categories = new[]
                {
                    new { name = "Government", count = modules.Count(), icon = GetCategoryIcon("Government") },
                    new { name = "Core", count = modules.Count(m => m.IsCore), icon = GetCategoryIcon("Core") },
                    new { name = "Tier1", count = modules.Count(m => m.Tier == TerraFusion.Core.Enums.ModuleTier.Tier1), icon = GetCategoryIcon("Tier1") },
                    new { name = "Tier2", count = modules.Count(m => m.Tier == TerraFusion.Core.Enums.ModuleTier.Tier2), icon = GetCategoryIcon("Tier2") },
                    new { name = "Tier3", count = modules.Count(m => m.Tier == TerraFusion.Core.Enums.ModuleTier.Tier3), icon = GetCategoryIcon("Tier3") }
                };

                return Ok(categories);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving marketplace categories");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("plugins/{id}/download")]
        public async Task<ActionResult> DownloadPlugin(string id)
        {
            try
            {
                // Convert plugin id back to module name
                var moduleName = id.Replace("-", " ");
                var module = await _moduleService.GetModuleByNameAsync(moduleName);

                if (module == null)
                    return NotFound();

                // Launch the module
                var result = await _moduleService.LaunchModuleAsync(module.Id);

                if (result)
                    return Ok(new { message = $"Installing {module.Name}..." });
                else
                    return BadRequest(new { message = "Failed to install plugin" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading plugin {PluginId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        private static string GetCategoryIcon(string category) => category switch
        {
            "AI" => "Zap",
            "Government" => "Shield",
            "GIS" => "Map",
            "Financial" => "DollarSign",
            "Compliance" => "FileCheck",
            _ => "Package"
        };

    }
}
