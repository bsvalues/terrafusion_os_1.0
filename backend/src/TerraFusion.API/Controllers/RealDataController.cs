using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Services;
using TerraFusion.Core.DTOs;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RealDataController : ControllerBase
{
    private readonly IRealDatabaseService _realDatabaseService;
    private readonly ILogger<RealDataController> _logger;

    public RealDataController(IRealDatabaseService realDatabaseService, ILogger<RealDataController> logger)
    {
        _realDatabaseService = realDatabaseService;
        _logger = logger;
    }

    /// <summary>
    /// Get real-time connection status for all databases
    /// </summary>
    [HttpGet("connection-status")]
    public async Task<ActionResult<DatabaseConnectionStatus>> GetConnectionStatus()
    {
        try
        {
            var status = await _realDatabaseService.GetConnectionStatusAsync();
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting database connection status");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get real property statistics from Benton County databases
    /// </summary>
    [HttpGet("property-stats")]
    public async Task<ActionResult<PropertyStatsDto>> GetRealPropertyStats()
    {
        try
        {
            var stats = await _realDatabaseService.GetRealPropertyStatsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting real property stats");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get real properties with pagination and search
    /// </summary>
    [HttpGet("properties")]
    public async Task<ActionResult<List<RealPropertyDto>>> GetRealProperties(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        [FromQuery] string? search = null)
    {
        try
        {
            if (pageSize > 500) pageSize = 500; // Limit max page size
            
            var properties = await _realDatabaseService.GetRealPropertiesAsync(page, pageSize, search);
            return Ok(properties);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting real properties");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get specific property by parcel ID
    /// </summary>
    [HttpGet("properties/{parcelId}")]
    public async Task<ActionResult<RealPropertyDto>> GetRealPropertyByParcel(string parcelId)
    {
        try
        {
            var property = await _realDatabaseService.GetRealPropertyByParcelAsync(parcelId);
            if (property == null)
                return NotFound($"Property with parcel ID '{parcelId}' not found");

            return Ok(property);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting property {ParcelId}", parcelId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get real permits with pagination
    /// </summary>
    [HttpGet("permits")]
    public async Task<ActionResult<List<RealPermitDto>>> GetRealPermits(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            if (pageSize > 500) pageSize = 500; // Limit max page size
            
            var permits = await _realDatabaseService.GetRealPermitsAsync(page, pageSize);
            return Ok(permits);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting real permits");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get assessments for a specific property
    /// </summary>
    [HttpGet("properties/{parcelId}/assessments")]
    public async Task<ActionResult<List<RealAssessmentDto>>> GetRealAssessments(string parcelId)
    {
        try
        {
            var assessments = await _realDatabaseService.GetRealAssessmentsAsync(parcelId);
            return Ok(assessments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assessments for {ParcelId}", parcelId);
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Get comprehensive database health information
    /// </summary>
    [HttpGet("database-health")]
    public async Task<ActionResult<DatabaseHealthDto>> GetDatabaseHealth()
    {
        try
        {
            var health = await _realDatabaseService.GetDatabaseHealthAsync();
            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting database health");
            return StatusCode(500, "Internal server error");
        }
    }

    /// <summary>
    /// Quick health check endpoint
    /// </summary>
    [HttpGet("health")]
    public async Task<ActionResult> HealthCheck()
    {
        try
        {
            var connectionStatus = await _realDatabaseService.GetConnectionStatusAsync();
            
            if (connectionStatus.RealPacsConnected && connectionStatus.TerrafusionSyncConnected)
            {
                return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
            }
            else
            {
                return StatusCode(503, new { 
                    status = "unhealthy", 
                    errors = connectionStatus.Errors,
                    timestamp = DateTime.UtcNow 
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health check failed");
            return StatusCode(503, new { 
                status = "unhealthy", 
                error = ex.Message,
                timestamp = DateTime.UtcNow 
            });
        }
    }
}