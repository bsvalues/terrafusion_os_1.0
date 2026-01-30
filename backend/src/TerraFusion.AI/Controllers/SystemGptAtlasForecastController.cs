// ═══════════════════════════════════════════════════════════════════════════════
// 🔮 PHASE 32: SystemGPT Atlas Forecast Controller
// REST API for forecast queries
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers;

/// <summary>
/// Phase 32: REST API controller for Atlas forecast queries.
/// Provides endpoints for retrieving forecasts and summaries.
/// </summary>
[ApiController]
[Route("api/gpt/system/atlas/forecasts")]
public class SystemGptAtlasForecastController : ControllerBase
{
    private readonly ISystemGptAtlasForecastStore _store;
    private readonly ILogger<SystemGptAtlasForecastController> _logger;

    public SystemGptAtlasForecastController(
        ISystemGptAtlasForecastStore store,
        ILogger<SystemGptAtlasForecastController> logger)
    {
        _store = store;
        _logger = logger;
    }

    /// <summary>
    /// Gets recent forecasts with optional filtering.
    /// </summary>
    /// <param name="countyId">Optional county filter.</param>
    /// <param name="since">Optional time filter (return forecasts since this time).</param>
    /// <param name="limit">Maximum number of forecasts to return (default 100).</param>
    /// <returns>List of forecast records.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AtlasForecastRecord>), 200)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetForecasts(
        [FromQuery] string? countyId = null,
        [FromQuery] DateTimeOffset? since = null,
        [FromQuery] int limit = 100)
    {
        try
        {
            _logger.LogDebug("Getting forecasts: countyId={CountyId}, since={Since}, limit={Limit}",
                countyId, since, limit);

            var forecasts = await _store.GetRecentAsync(countyId, since, limit);
            return Ok(forecasts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving forecasts");
            return StatusCode(500, new { error = "Failed to retrieve forecasts", message = ex.Message });
        }
    }

    /// <summary>
    /// Gets a summary of the latest forecast per county.
    /// </summary>
    /// <returns>List of forecast summaries.</returns>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(IEnumerable<AtlasForecastSummary>), 200)]
    [ProducesResponseType(500)]
    public async Task<IActionResult> GetSummary()
    {
        try
        {
            _logger.LogDebug("Getting forecast summaries");

            var summaries = await _store.GetSummaryAsync();
            return Ok(summaries);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving forecast summaries");
            return StatusCode(500, new { error = "Failed to retrieve summaries", message = ex.Message });
        }
    }
}
