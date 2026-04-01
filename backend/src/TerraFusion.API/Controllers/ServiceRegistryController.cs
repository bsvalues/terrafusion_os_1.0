using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Serves the service registry so the OS shell can discover native app URLs.
/// The shell reads this to know where to iframe each native app (CostForge, TerraLevy, etc.).
/// </summary>
[ApiController]
[Route("api/service-registry")]
[AllowAnonymous]
public class ServiceRegistryController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<ServiceRegistryController> _logger;

    // Path relative to the backend project root
    private static readonly string RegistryPath = Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", "..", "..", "service-registry.json"
    );

    public ServiceRegistryController(IWebHostEnvironment env, ILogger<ServiceRegistryController> logger)
    {
        _env = env;
        _logger = logger;
    }

    [HttpGet]
    public IActionResult GetRegistry()
    {
        try
        {
            var fullPath = Path.GetFullPath(RegistryPath);
            if (!System.IO.File.Exists(fullPath))
            {
                _logger.LogWarning("Service registry not found at {Path}", fullPath);
                return Ok(new { LastUpdated = DateTime.UtcNow, Services = new { } });
            }

            var json = System.IO.File.ReadAllText(fullPath);
            return Content(json, "application/json");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read service registry");
            return StatusCode(500, "Could not read service registry");
        }
    }
}
