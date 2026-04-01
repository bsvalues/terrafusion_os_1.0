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
    /// Dev stub: returns one placeholder BudgetCategory so the TerraLevy
    /// frontend can clear isSampleData on mount without a real CAMA integration.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("summary")]
    public IActionResult Summary([FromQuery] int? year)
    {
        _logger.LogInformation("LEV-021: Dashboard summary requested");
        return Ok(new object[]
        {
            new
            {
                id = "dev-levy-stub",
                name = "General Fund",
                allocated = 0,
                spent = 0,
                projected = 0,
                department = "Benton County",
                priority = "low",
                fiscalYear = DateTime.UtcNow.Year.ToString(),
                lastUpdated = DateTime.UtcNow,
                subCategories = Array.Empty<object>(),
                complianceStatus = (object?)null,
                aiRecommendations = Array.Empty<object>(),
                historicalData = Array.Empty<object>(),
                responsibleOfficer = "dev-stub",
                approvalStatus = "approved",
            }
        });
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
