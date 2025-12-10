// ═══════════════════════════════════════════════════════════════════════════════
// 🐝 PHASE 30: SystemGPT Swarm Controller
// API endpoints for Swarm state retrieval
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;
using TerraFusion.AI.Services;

namespace TerraFusion.AI.Controllers;

/// <summary>
/// Phase 30: Controller for Swarm state API.
/// GET /api/gpt/system/swarm/state - All county states
/// GET /api/gpt/system/swarm/state/{countyId} - Specific county state
/// </summary>
[ApiController]
[Route("api/gpt/system/swarm")]
public class SystemGptSwarmController : ControllerBase
{
    private readonly ISystemGptSwarmStateStore _stateStore;
    private readonly ILogger<SystemGptSwarmController> _logger;

    public SystemGptSwarmController(
        ISystemGptSwarmStateStore stateStore,
        ILogger<SystemGptSwarmController> logger)
    {
        _stateStore = stateStore;
        _logger = logger;
    }

    /// <summary>
    /// Get Swarm state for all counties.
    /// </summary>
    /// <returns>Response containing all county Swarm states.</returns>
    [HttpGet("state")]
    [ProducesResponseType(typeof(SwarmStateResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetSwarmState()
    {
        try
        {
            _logger.LogDebug("Retrieving Swarm state for all counties");

            var states = _stateStore.GetAllStates();

            var response = new SwarmStateResponseDto
            {
                Version = "1.0",
                GeneratedAt = DateTimeOffset.UtcNow,
                Counties = states
            };

            _logger.LogDebug("Returning Swarm state for {Count} counties", states.Count);

            return await Task.FromResult(Ok(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Swarm state");
            return StatusCode(500, new { error = "Failed to retrieve Swarm state", message = ex.Message });
        }
    }

    /// <summary>
    /// Get Swarm state for a specific county.
    /// </summary>
    /// <param name="countyId">The county identifier.</param>
    /// <returns>Swarm state for the specified county.</returns>
    [HttpGet("state/{countyId}")]
    [ProducesResponseType(typeof(SwarmStateSnapshot), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetSwarmStateByCounty(string countyId)
    {
        if (string.IsNullOrWhiteSpace(countyId))
        {
            return BadRequest(new { error = "County ID is required" });
        }

        try
        {
            _logger.LogDebug("Retrieving Swarm state for county {CountyId}", countyId);

            var state = _stateStore.GetState(countyId);

            return await Task.FromResult(Ok(state));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving Swarm state for county {CountyId}", countyId);
            return StatusCode(500, new { error = "Failed to retrieve Swarm state", message = ex.Message });
        }
    }
}
