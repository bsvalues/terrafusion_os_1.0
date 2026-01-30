// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 PHASE 31: SystemGPT Atlas Anomaly Controller
// REST API endpoints for anomaly retrieval and summary
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers;

/// <summary>
/// API controller for Atlas anomaly detection and retrieval.
/// </summary>
[ApiController]
[Route("api/gpt/system/atlas/anomalies")]
public class SystemGptAtlasAnomalyController : ControllerBase
{
    private readonly ISystemGptAtlasAnomalyStore _store;
    private readonly ILogger<SystemGptAtlasAnomalyController> _logger;

    public SystemGptAtlasAnomalyController(
        ISystemGptAtlasAnomalyStore store,
        ILogger<SystemGptAtlasAnomalyController> logger)
    {
        _store = store;
        _logger = logger;
    }

    /// <summary>
    /// Gets recent anomalies with optional filters.
    /// </summary>
    /// <param name="countyId">Optional county ID filter.</param>
    /// <param name="since">Optional timestamp filter (anomalies after this time).</param>
    /// <param name="minSeverity">Optional minimum severity filter (Info, Warning, Critical).</param>
    /// <param name="limit">Optional limit on number of results.</param>
    /// <returns>List of anomaly events.</returns>
    [HttpGet]
    public async Task<ActionResult<IList<SystemGptAtlasAnomalyEventDto>>> GetAnomalies(
        [FromQuery] string? countyId = null,
        [FromQuery] DateTimeOffset? since = null,
        [FromQuery] string? minSeverity = null,
        [FromQuery] int? limit = null)
    {
        try
        {
            AtlasAnomalySeverity? severityFilter = null;
            if (!string.IsNullOrEmpty(minSeverity))
            {
                if (!Enum.TryParse<AtlasAnomalySeverity>(minSeverity, ignoreCase: true, out var parsed))
                {
                    return BadRequest(new { error = $"Invalid severity: {minSeverity}. Valid values: Info, Warning, Critical" });
                }
                severityFilter = parsed;
            }

            var anomalies = _store.GetRecent(countyId, since, severityFilter, limit);

            _logger.LogDebug(
                "Retrieved {Count} anomalies (countyId={CountyId}, since={Since}, minSeverity={MinSeverity}, limit={Limit})",
                anomalies.Count, countyId ?? "all", since?.ToString() ?? "any", minSeverity ?? "any", limit?.ToString() ?? "none");

            return await Task.FromResult(Ok(anomalies));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving anomalies");
            return StatusCode(500, new { error = "Failed to retrieve anomalies" });
        }
    }

    /// <summary>
    /// Gets summary statistics for all counties.
    /// </summary>
    /// <param name="since">Optional timestamp filter for summary calculation.</param>
    /// <returns>List of county anomaly summaries.</returns>
    [HttpGet("summary")]
    public async Task<ActionResult<IList<SystemGptAtlasAnomalySummaryDto>>> GetSummary(
        [FromQuery] DateTimeOffset? since = null)
    {
        try
        {
            var summaries = _store.GetSummary(since);

            _logger.LogDebug(
                "Retrieved summaries for {Count} counties (since={Since})",
                summaries.Count, since?.ToString() ?? "all time");

            return await Task.FromResult(Ok(summaries));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving anomaly summaries");
            return StatusCode(500, new { error = "Failed to retrieve anomaly summaries" });
        }
    }

    /// <summary>
    /// Gets summary statistics for a specific county.
    /// </summary>
    /// <param name="countyId">The county ID to get summary for.</param>
    /// <returns>County anomaly summary.</returns>
    [HttpGet("{countyId}/summary")]
    public async Task<ActionResult<SystemGptAtlasAnomalySummaryDto>> GetCountySummary(
        [FromRoute] string countyId)
    {
        try
        {
            var summary = _store.GetSummaryByCounty(countyId);

            _logger.LogDebug(
                "Retrieved summary for county {CountyId}: {TotalCount} anomalies",
                countyId, summary.TotalCount);

            return await Task.FromResult(Ok(summary));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving anomaly summary for county {CountyId}", countyId);
            return StatusCode(500, new { error = $"Failed to retrieve anomaly summary for county {countyId}" });
        }
    }
}
