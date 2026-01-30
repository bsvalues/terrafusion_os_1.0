using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Services;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatabaseController : ControllerBase
{
    private readonly IDatabaseInitializationService _databaseService;
    private readonly ILogger<DatabaseController> _logger;

    public DatabaseController(
        IDatabaseInitializationService databaseService,
        ILogger<DatabaseController> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    /// <summary>
    /// Get database connection and initialization status
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        try
        {
            var status = await _databaseService.GetStatusAsync();
            return Ok(new
            {
                database = status,
                timestamp = DateTime.UtcNow,
                server = "TerraFusion OS 1.0"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting database status");
            return StatusCode(500, new
            {
                error = "Failed to get database status",
                message = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Initialize database and seed production modules
    /// </summary>
    [HttpPost("initialize")]
    public async Task<IActionResult> Initialize()
    {
        try
        {
            _logger.LogInformation("Manual database initialization requested");
            await _databaseService.InitializeAsync();
            
            var status = await _databaseService.GetStatusAsync();
            return Ok(new
            {
                message = "Database initialized successfully",
                database = status,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Manual database initialization failed");
            return StatusCode(500, new
            {
                error = "Database initialization failed",
                message = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Seed production modules into database
    /// </summary>
    [HttpPost("seed-modules")]
    public async Task<IActionResult> SeedModules()
    {
        try
        {
            _logger.LogInformation("Manual module seeding requested");
            var success = await _databaseService.SeedProductionModulesAsync();
            
            if (success)
            {
                var status = await _databaseService.GetStatusAsync();
                return Ok(new
                {
                    message = "Production modules seeded successfully",
                    database = status,
                    timestamp = DateTime.UtcNow
                });
            }
            else
            {
                return StatusCode(500, new
                {
                    error = "Failed to seed production modules",
                    timestamp = DateTime.UtcNow
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Manual module seeding failed");
            return StatusCode(500, new
            {
                error = "Module seeding failed", 
                message = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }
}