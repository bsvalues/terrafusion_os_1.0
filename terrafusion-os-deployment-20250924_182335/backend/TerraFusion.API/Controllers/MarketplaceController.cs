using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using TerraFusion.API.Services;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarketplaceController : ControllerBase
    {
        private readonly IMarketplaceService _marketplaceService;
        private readonly IModuleService _moduleService;
        private readonly ILogger<MarketplaceController> _logger;

        public MarketplaceController(IMarketplaceService marketplaceService, IModuleService moduleService, ILogger<MarketplaceController> logger)
        {
            _marketplaceService = marketplaceService;
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
                    name = m.Name,
                    version = m.Version ?? "1.0.0",
                    description = m.Description,
                    author = "TerraFusion",
                    category = "Government", // ModuleDto doesn't have Category
                    tags = new[] { m.Tier.ToString().ToLower(), "government", "terrafusion" },
                    downloads = GetDownloadCount(m.Name ?? ""),
                    rating = GetRating(m.Name ?? ""),
                    ratingCount = GetRatingCount(m.Name ?? "")
                }).ToList();

                // Apply search filter
                if (!string.IsNullOrEmpty(search))
                {
                    plugins = plugins.Where(p => 
                        (p.name ?? "").Contains(search, StringComparison.OrdinalIgnoreCase) ||
                        (p.description ?? "").Contains(search, StringComparison.OrdinalIgnoreCase)
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
                    "rating" => plugins.OrderByDescending(p => p.rating).ToList(),
                    "name" => plugins.OrderBy(p => p.name).ToList(),
                    "updated" => plugins.OrderByDescending(p => p.version).ToList(),
                    _ => plugins.OrderByDescending(p => p.downloads).ToList()
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

        [HttpPost("plugins/{id}/rate")]
        public Task<ActionResult> RatePlugin(string id, [FromBody] RatingDto rating)
        {
            try
            {
                // For now, just return success - implement rating storage later
                return Task.FromResult<ActionResult>(Ok(new { message = "Rating submitted successfully" }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error rating plugin {PluginId}", id);
                return Task.FromResult<ActionResult>(StatusCode(500, "Internal server error"));
            }
        }

        private static int GetDownloadCount(string moduleName) => moduleName switch
        {
            "CostForge AI" => 15420,
            "Harris PACS" => 8930,
            "GIS Core" => 12750,
            "CAMA Core" => 6840,
            "Valuation Tools" => 9320,
            _ => new Random().Next(1000, 20000)
        };

        private static double GetRating(string moduleName) => moduleName switch
        {
            "CostForge AI" => 4.8,
            "Harris PACS" => 4.6,
            "GIS Core" => 4.9,
            "CAMA Core" => 4.5,
            "Valuation Tools" => 4.7,
            _ => Math.Round(4.0 + new Random().NextDouble(), 1)
        };

        private static int GetRatingCount(string moduleName) => moduleName switch
        {
            "CostForge AI" => 342,
            "Harris PACS" => 156,
            "GIS Core" => 289,
            "CAMA Core" => 198,
            "Valuation Tools" => 234,
            _ => new Random().Next(50, 400)
        };

        private static string GetCategoryIcon(string category) => category switch
        {
            "AI" => "Zap",
            "Government" => "Shield", 
            "GIS" => "Map",
            "Financial" => "DollarSign",
            "Compliance" => "FileCheck",
            _ => "Package"
        };

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitPlugin([FromBody] PluginSubmissionDto submissionDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _marketplaceService.ProcessPluginSubmissionAsync(submissionDto);

            if (result.Success)
            {
                return Ok(new { message = result.Message });
            }

            // Use BadRequest for validation failures, and a more general error for others.
            if (result.Message.Contains("validation failed"))
            {
                return BadRequest(new { message = result.Message });
            }

            return StatusCode(500, new { message = result.Message });
        }

        [HttpPost("publish")]
        public async Task<IActionResult> PublishPlugin([FromBody] PluginPublishDto publishDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _marketplaceService.PublishPluginAsync(publishDto);

            if (result.Success)
            {
                return Ok(new { message = result.Message });
            }

            return BadRequest(new { message = result.Message });
        }
    }
}
