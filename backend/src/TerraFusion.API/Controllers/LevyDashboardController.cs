using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-021: Levy operations dashboard.
/// Provides summary views, key metrics, and district overviews
/// for the levy management module.
/// </summary>
[ApiController]
[Route("api/levy/dashboard")]
[Authorize]
public class LevyDashboardController : ControllerBase
{
    private readonly ILogger<LevyDashboardController> _logger;

    public LevyDashboardController(ILogger<LevyDashboardController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Retrieve the levy dashboard summary for the current county.
    /// </summary>
    [HttpGet("summary")]
    public IActionResult Summary([FromQuery] int? year)
    {
        _logger.LogInformation("LEV-021: Dashboard summary requested");
        return Ok(new { status = "stub", message = "Dashboard summary not yet implemented." });
    }

    /// <summary>
    /// Retrieve key levy metrics (totals, averages, compliance rates).
    /// </summary>
    [HttpGet("metrics")]
    public IActionResult Metrics([FromQuery] int? year)
    {
        _logger.LogInformation("LEV-021: Dashboard metrics requested");
        return Ok(new { status = "stub", message = "Dashboard metrics not yet implemented." });
    }

    /// <summary>
    /// Retrieve an overview of all tax districts and their levy status.
    /// </summary>
    [HttpGet("districts-overview")]
    public IActionResult DistrictsOverview([FromQuery] int? year)
    {
        _logger.LogInformation("LEV-021: Districts overview requested");
        return Ok(new { status = "stub", message = "Districts overview not yet implemented." });
    }
}
