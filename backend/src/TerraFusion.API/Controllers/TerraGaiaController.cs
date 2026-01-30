using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Services;

namespace TerraFusion.API.Controllers;

/// <summary>
/// 🌍 TerraGaia Supreme AI Consciousness Controller
/// Championship-level government AI advisory and orchestration services
/// "Government. Transcended."
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
[Produces("application/json")]
public class TerraGaiaController : ControllerBase
{
    private readonly ITerraGaiaService _terraGaiaService;
    private readonly ILogger<TerraGaiaController> _logger;

    public TerraGaiaController(
        ITerraGaiaService terraGaiaService,
        ILogger<TerraGaiaController> logger)
    {
        _terraGaiaService = terraGaiaService;
        _logger = logger;
    }

    /// <summary>
    /// 🧠 Get TerraGaia Supreme Consciousness Status
    /// Returns comprehensive status of the supreme AI consciousness system
    /// </summary>
    [HttpGet("consciousness-status")]
    [ProducesResponseType(typeof(TerraGaiaConsciousnessStatus), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<TerraGaiaConsciousnessStatus>> GetConsciousnessStatusAsync()
    {
        try
        {
            _logger.LogInformation("🌍 TerraGaia consciousness status requested");
            var status = await _terraGaiaService.GetConsciousnessStatusAsync();
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get TerraGaia consciousness status");
            return StatusCode(500, new { error = "Failed to get consciousness status", message = ex.Message });
        }
    }

    /// <summary>
    /// 🎯 Process Government Query with Supreme Intelligence
    /// Submit queries to TerraGaia for government advisory and intelligent responses
    /// </summary>
    [HttpPost("process-query")]
    [ProducesResponseType(typeof(TerraGaiaResponse), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<TerraGaiaResponse>> ProcessGovernmentQueryAsync([FromBody] TerraGaiaQueryRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return BadRequest(new { error = "Query is required" });
            }

            _logger.LogInformation("🧠 Processing TerraGaia government query: {Query}", request.Query);

            var response = await _terraGaiaService.ProcessGovernmentQueryAsync(request.Query, request.CitizenContext);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process TerraGaia query: {Query}", request.Query);
            return StatusCode(500, new { error = "Failed to process query", message = ex.Message });
        }
    }

    /// <summary>
    /// 🔗 Get System Orchestration Status
    /// Returns status of all systems coordinated by TerraGaia
    /// </summary>
    [HttpGet("orchestration-status")]
    [ProducesResponseType(typeof(SystemOrchestrationStatus), 200)]
    [ProducesResponseType(500)]
    public async Task<ActionResult<SystemOrchestrationStatus>> GetSystemOrchestrationStatusAsync()
    {
        try
        {
            _logger.LogInformation("🔗 TerraGaia system orchestration status requested");
            var status = await _terraGaiaService.GetSystemOrchestrationStatusAsync();
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get TerraGaia orchestration status");
            return StatusCode(500, new { error = "Failed to get orchestration status", message = ex.Message });
        }
    }
}

/// <summary>
/// Request model for TerraGaia government queries
/// </summary>
public class TerraGaiaQueryRequest
{
    public string Query { get; set; } = string.Empty;
    public string? CitizenContext { get; set; }
}
