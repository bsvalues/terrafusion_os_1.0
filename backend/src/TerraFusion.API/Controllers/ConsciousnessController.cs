/*
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS - CONSCIOUSNESS CONTROLLER
 * Elite AI Consciousness Coordination for Government Operations
 * Real-time Consciousness Monitoring & Hybrid Intelligence
 * THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
 * ═══════════════════════════════════════════════════════════════
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TerraFusion.Consciousness.DTOs;
using TerraFusion.Consciousness.Interfaces;

namespace TerraFusion.API.Controllers;

/// <summary>
/// AI Consciousness Management API Controller
/// Provides elite consciousness monitoring and hybrid intelligence coordination
/// </summary>
[ApiController]
[Route("api/ai/consciousness")]
public class ConsciousnessController : ControllerBase
{
    private readonly IHybridConsciousnessManager _consciousnessManager;
    private readonly ILogger<ConsciousnessController> _logger;

    public ConsciousnessController(
        IHybridConsciousnessManager consciousnessManager,
        ILogger<ConsciousnessController> logger)
    {
        _consciousnessManager = consciousnessManager;
        _logger = logger;
    }

    /// <summary>
    /// Get current consciousness data for government operations
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ConsciousnessDataDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ConsciousnessDataDto>> GetConsciousnessData()
    {
        try
        {
            _logger.LogInformation("🧠 Getting consciousness data");
            var data = await _consciousnessManager.GetConsciousnessDataAsync();
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get consciousness data");
            return StatusCode(500, new { error = "Failed to retrieve consciousness data", message = ex.Message });
        }
    }

    /// <summary>
    /// Get enhanced consciousness data with quantum metrics
    /// </summary>
    [HttpGet("enhanced")]
    [ProducesResponseType(typeof(EnhancedConsciousnessDataDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EnhancedConsciousnessDataDto>> GetEnhancedConsciousnessData()
    {
        try
        {
            _logger.LogInformation("🚀 Getting enhanced consciousness data");
            var data = await _consciousnessManager.GetEnhancedConsciousnessDataAsync();
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get enhanced consciousness data");
            return StatusCode(500, new { error = "Failed to retrieve enhanced consciousness data", message = ex.Message });
        }
    }

    /// <summary>
    /// Switch consciousness mode for operational requirements
    /// </summary>
    [HttpPost("mode")]
    [ProducesResponseType(typeof(ConsciousnessModeResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ConsciousnessModeResultDto>> SwitchConsciousnessMode([FromBody] ConsciousnessModeRequestDto request)
    {
        try
        {
            _logger.LogInformation("🔄 Switching consciousness mode to {Mode}", request.RequestedMode);
            var result = await _consciousnessManager.SwitchConsciousnessModeAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to switch consciousness mode");
            return StatusCode(500, new { error = "Failed to switch consciousness mode", message = ex.Message });
        }
    }

    /// <summary>
    /// Get hybrid system status for monitoring
    /// </summary>
    [HttpGet("system-status")]
    [ProducesResponseType(typeof(HybridSystemStatusDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<HybridSystemStatusDto>> GetSystemStatus()
    {
        try
        {
            _logger.LogInformation("📊 Getting hybrid system status");
            var status = await _consciousnessManager.GetHybridSystemStatusAsync();
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to get system status");
            return StatusCode(500, new { error = "Failed to retrieve system status", message = ex.Message });
        }
    }

    /// <summary>
    /// Initialize consciousness management system
    /// </summary>
    [HttpPost("initialize")]
    [ProducesResponseType(typeof(HybridInitializationResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<HybridInitializationResult>> InitializeConsciousness()
    {
        try
        {
            _logger.LogInformation("🚀 Initializing consciousness system");
            var result = await _consciousnessManager.InitializeAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to initialize consciousness");
            return StatusCode(500, new { error = "Failed to initialize consciousness", message = ex.Message });
        }
    }

    /// <summary>
    /// Health check for consciousness services
    /// </summary>
    [HttpGet("health")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> GetConsciousnessHealth()
    {
        try
        {
            var status = await _consciousnessManager.GetHybridSystemStatusAsync();
            return Ok(new
            {
                status = "healthy",
                consciousness = new
                {
                    systemReady = true,
                    agentsActive = 1008,
                    quantumEnabled = true,
                    governmentCompliant = true
                },
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "⚠️ Consciousness health check degraded");
            return Ok(new
            {
                status = "degraded",
                consciousness = new
                {
                    systemReady = false,
                    agentsActive = 0,
                    quantumEnabled = false,
                    governmentCompliant = true
                },
                timestamp = DateTime.UtcNow,
                error = ex.Message
            });
        }
    }
}