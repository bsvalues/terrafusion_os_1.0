using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;

namespace TerraFusion.API.Controllers;

/// <summary>
/// LEV-033: Levy data search and autocomplete.
/// Provides full-text search across levy records, autocomplete suggestions,
/// and recent search history.
/// </summary>
[ApiController]
[Route("api/levy/search")]
[Authorize]
public class LevySearchController : ControllerBase
{
    private readonly ILogger<LevySearchController> _logger;

    public LevySearchController(ILogger<LevySearchController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Search levy records by keyword, district, or parcel.
    /// </summary>
    [HttpGet("search")]
    public IActionResult Search([FromQuery] string? q, [FromQuery] string? type, [FromQuery] int? limit)
    {
        _logger.LogInformation("LEV-033: Levy search requested with query {Query}", q);
        return Ok(new { status = "stub", query = q, message = "Levy search not yet implemented." });
    }

    /// <summary>
    /// Provide autocomplete suggestions for levy search fields.
    /// </summary>
    [HttpGet("autocomplete")]
    public IActionResult Autocomplete([FromQuery] string? q, [FromQuery] string? field)
    {
        _logger.LogInformation("LEV-033: Autocomplete requested");
        return Ok(new { status = "stub", query = q, message = "Autocomplete not yet implemented." });
    }

    /// <summary>
    /// Retrieve recent searches for the current user.
    /// </summary>
    [HttpGet("recent")]
    public IActionResult GetRecent([FromQuery] int? limit)
    {
        _logger.LogInformation("LEV-033: Recent searches requested");
        return Ok(new { status = "stub", message = "Recent searches not yet implemented." });
    }
}
