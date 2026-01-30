using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Interfaces;
using TerraFusion.Abstractions.DTOs.Responses;
using System.Text.Json;

namespace TerraFusion.API.Controllers;

/// <summary>
/// TerraFusion Sync Controller - Multi-Tenant Government Data Synchronization API
/// Provides REST endpoints for the foundational TerraFusion Sync orchestration service
/// This exposes comprehensive synchronization capabilities across multiple legacy systems
/// for Washington State counties including Harris PACS, Tyler, Aumentum, and other government systems
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TerraFusionSyncController : ControllerBase
{
    private readonly ITerraFusionSyncService _terraFusionSyncService;
    private readonly ILogger<TerraFusionSyncController> _logger;

    public TerraFusionSyncController(
        ITerraFusionSyncService terraFusionSyncService,
        ILogger<TerraFusionSyncController> logger)
    {
        _terraFusionSyncService = terraFusionSyncService;
        _logger = logger;
    }

    /// <summary>
    /// Starts real-time synchronization for all counties or a specific county
    /// </summary>
    /// <param name="countyName">Optional county name to sync, or omit for all counties</param>
    /// <returns>Synchronization result with comprehensive metrics</returns>
    [HttpPost("start")]
    [ProducesResponseType(typeof(SyncResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SyncResult>> StartSynchronization([FromQuery] string? countyName = null)
    {
        try
        {
            _logger.LogInformation("🚀 Starting TerraFusion Sync for {County}", countyName ?? "all counties");

            var result = await _terraFusionSyncService.StartSynchronizationAsync(countyName);

            if (result.Success)
            {
                _logger.LogInformation("✅ TerraFusion Sync started successfully for {County}",
                    countyName ?? "all counties");
                return Ok(result);
            }
            else
            {
                _logger.LogError("❌ TerraFusion Sync failed for {County}: {Errors}",
                    countyName ?? "all counties", string.Join(", ", result.Errors));
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception starting TerraFusion Sync for {County}", countyName ?? "all counties");
            return StatusCode(500, new SyncResult
            {
                Success = false,
                Errors = new List<string> { ex.Message },
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Stops all active synchronization operations
    /// </summary>
    /// <returns>Result of the stop operation</returns>
    [HttpPost("stop")]
    [ProducesResponseType(typeof(SyncResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SyncResult>> StopSynchronization()
    {
        try
        {
            _logger.LogInformation("🛑 Stopping TerraFusion Sync");

            var result = await _terraFusionSyncService.StopSynchronizationAsync();

            _logger.LogInformation("✅ TerraFusion Sync stopped successfully");
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception stopping TerraFusion Sync");
            return StatusCode(500, new SyncResult
            {
                Success = false,
                Errors = new List<string> { ex.Message },
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Gets the current synchronization status and metrics
    /// </summary>
    /// <returns>Current sync status with active operations and performance metrics</returns>
    [HttpGet("status")]
    [ProducesResponseType(typeof(SyncStatus), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<SyncStatus>> GetSyncStatus()
    {
        try
        {
            var status = await _terraFusionSyncService.GetSyncStatusAsync();
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception getting TerraFusion Sync status");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    /// <summary>
    /// Checks if synchronization is currently active
    /// </summary>
    /// <returns>True if sync is active, false otherwise</returns>
    [HttpGet("active")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> IsSyncActive()
    {
        try
        {
            var isActive = await _terraFusionSyncService.IsSyncActiveAsync();
            return Ok(isActive);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception checking TerraFusion Sync active status");
            return Ok(false);
        }
    }

    /// <summary>
    /// Gets all registered legacy systems (Harris PACS, Tyler, Aumentum, etc.)
    /// </summary>
    /// <returns>Collection of available legacy systems with health status</returns>
    [HttpGet("systems")]
    [ProducesResponseType(typeof(IEnumerable<LegacySystemInfo>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<LegacySystemInfo>>> GetAvailableLegacySystems()
    {
        try
        {
            var systems = await _terraFusionSyncService.GetAvailableLegacySystemsAsync();
            return Ok(systems);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception getting available legacy systems");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    /// <summary>
    /// Registers a new legacy system for synchronization
    /// </summary>
    /// <param name="config">Configuration for the legacy system</param>
    /// <returns>True if registration successful, false otherwise</returns>
    [HttpPost("systems")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<bool>> RegisterLegacySystem([FromBody] LegacySystemConfig config)
    {
        try
        {
            if (string.IsNullOrEmpty(config.SystemId) || string.IsNullOrEmpty(config.SystemName))
            {
                return BadRequest("SystemId and SystemName are required");
            }

            var result = await _terraFusionSyncService.RegisterLegacySystemAsync(config);

            if (result)
            {
                _logger.LogInformation("✅ Legacy system {SystemName} registered successfully", config.SystemName);
                return Ok(true);
            }
            else
            {
                _logger.LogWarning("⚠️ Failed to register legacy system {SystemName}", config.SystemName);
                return BadRequest(false);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception registering legacy system {SystemName}", config.SystemName);
            return StatusCode(500, false);
        }
    }

    /// <summary>
    /// Unregisters a legacy system
    /// </summary>
    /// <param name="systemId">System identifier to unregister</param>
    /// <returns>True if unregistration successful, false otherwise</returns>
    [HttpDelete("systems/{systemId}")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<bool>> UnregisterLegacySystem(string systemId)
    {
        try
        {
            var result = await _terraFusionSyncService.UnregisterLegacySystemAsync(systemId);

            if (result)
            {
                _logger.LogInformation("✅ Legacy system {SystemId} unregistered successfully", systemId);
                return Ok(true);
            }
            else
            {
                _logger.LogWarning("⚠️ Legacy system {SystemId} not found", systemId);
                return NotFound(false);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception unregistering legacy system {SystemId}", systemId);
            return StatusCode(500, false);
        }
    }

    /// <summary>
    /// Gets health status for a specific legacy system
    /// </summary>
    /// <param name="systemId">System identifier</param>
    /// <returns>Health status information with performance metrics</returns>
    [HttpGet("systems/{systemId}/health")]
    [ProducesResponseType(typeof(LegacySystemHealth), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LegacySystemHealth>> GetLegacySystemHealth(string systemId)
    {
        try
        {
            var health = await _terraFusionSyncService.GetLegacySystemHealthAsync(systemId);

            if (health.IsOnline || health.SystemId == systemId)
            {
                return Ok(health);
            }
            else
            {
                return NotFound(health);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception getting legacy system health for {SystemId}", systemId);
            return StatusCode(500, new LegacySystemHealth
            {
                SystemId = systemId,
                IsOnline = false,
                IsHealthy = false,
                Status = "Error",
                Issues = new List<string> { ex.Message }
            });
        }
    }

    /// <summary>
    /// Synchronizes data for a specific county with options
    /// </summary>
    /// <param name="countyName">County name to synchronize</param>
    /// <param name="options">Optional sync parameters</param>
    /// <returns>County-specific sync result with detailed metrics</returns>
    [HttpPost("counties/{countyName}/sync")]
    [ProducesResponseType(typeof(CountySyncResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CountySyncResult>> SyncCountyData(
        string countyName,
        [FromBody] SyncOptions? options = null)
    {
        try
        {
            _logger.LogInformation("🔄 Starting county sync for {County}", countyName);

            var result = await _terraFusionSyncService.SyncCountyDataAsync(countyName, options);

            if (result.Success)
            {
                _logger.LogInformation("✅ County {County} sync completed successfully. Records: {Records}",
                    countyName, result.RecordsProcessed);
                return Ok(result);
            }
            else
            {
                _logger.LogError("❌ County {County} sync failed: {Errors}",
                    countyName, string.Join(", ", result.Errors));
                return BadRequest(result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception syncing county {County}", countyName);
            return StatusCode(500, new CountySyncResult
            {
                CountyName = countyName,
                Success = false,
                Errors = new List<string> { ex.Message },
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Gets all configured counties
    /// </summary>
    /// <returns>Collection of county configurations with status</returns>
    [HttpGet("counties")]
    [ProducesResponseType(typeof(IEnumerable<CountyInfo>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CountyInfo>>> GetConfiguredCounties()
    {
        try
        {
            var counties = await _terraFusionSyncService.GetConfiguredCountiesAsync();
            return Ok(counties);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception getting configured counties");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    /// <summary>
    /// Configures a county for synchronization
    /// </summary>
    /// <param name="config">County configuration</param>
    /// <returns>True if configuration successful, false otherwise</returns>
    [HttpPost("counties")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<bool>> ConfigureCounty([FromBody] CountyConfig config)
    {
        try
        {
            if (string.IsNullOrEmpty(config.CountyName) || string.IsNullOrEmpty(config.State))
            {
                return BadRequest("CountyName and State are required");
            }

            var result = await _terraFusionSyncService.ConfigureCountyAsync(config);

            if (result)
            {
                _logger.LogInformation("✅ County {County}, {State} configured successfully",
                    config.CountyName, config.State);
                return Ok(true);
            }
            else
            {
                _logger.LogWarning("⚠️ Failed to configure county {County}, {State}",
                    config.CountyName, config.State);
                return BadRequest(false);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception configuring county {County}", config.CountyName);
            return StatusCode(500, false);
        }
    }

    /// <summary>
    /// Gets comprehensive synchronization metrics and performance data
    /// </summary>
    /// <returns>Detailed metrics including throughput, success rates, and system performance</returns>
    [HttpGet("metrics")]
    [ProducesResponseType(typeof(SyncMetrics), StatusCodes.Status200OK)]
    public async Task<ActionResult<SyncMetrics>> GetSyncMetrics()
    {
        try
        {
            var metrics = await _terraFusionSyncService.GetSyncMetricsAsync();
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception getting sync metrics");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    /// <summary>
    /// Gets recent synchronization events for monitoring and debugging
    /// </summary>
    /// <param name="count">Number of events to retrieve (default 50, max 1000)</param>
    /// <returns>Collection of recent sync events with detailed information</returns>
    [HttpGet("events")]
    [ProducesResponseType(typeof(IEnumerable<SyncEvent>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<SyncEvent>>> GetRecentSyncEvents([FromQuery] int count = 50)
    {
        try
        {
            // Cap the maximum count to prevent performance issues
            count = Math.Min(Math.Max(count, 1), 1000);

            var events = await _terraFusionSyncService.GetRecentSyncEventsAsync(count);
            return Ok(events);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception getting recent sync events");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    /// <summary>
    /// Gets the current orchestration status for all systems
    /// </summary>
    /// <returns>Overall orchestration status including performance metrics and system health</returns>
    [HttpGet("orchestration")]
    [ProducesResponseType(typeof(OrchestrationStatus), StatusCodes.Status200OK)]
    public async Task<ActionResult<OrchestrationStatus>> GetOrchestrationStatus()
    {
        try
        {
            var status = await _terraFusionSyncService.GetOrchestrationStatusAsync();
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception getting orchestration status");
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    /// <summary>
    /// Restarts the synchronization orchestration engine
    /// </summary>
    /// <returns>True if restart successful, false otherwise</returns>
    [HttpPost("orchestration/restart")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<bool>> RestartOrchestration()
    {
        try
        {
            _logger.LogInformation("🔄 Restarting TerraFusion Sync orchestration");

            var result = await _terraFusionSyncService.RestartOrchestrationAsync();

            if (result)
            {
                _logger.LogInformation("✅ TerraFusion Sync orchestration restarted successfully");
                return Ok(true);
            }
            else
            {
                _logger.LogError("❌ Failed to restart TerraFusion Sync orchestration");
                return StatusCode(500, false);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception restarting orchestration");
            return StatusCode(500, false);
        }
    }

    /// <summary>
    /// Gets a comprehensive health check of the entire TerraFusion Sync system
    /// </summary>
    /// <returns>System health report including all components</returns>
    [HttpGet("health")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult> GetSystemHealth()
    {
        try
        {
            var isActive = await _terraFusionSyncService.IsSyncActiveAsync();
            var status = await _terraFusionSyncService.GetSyncStatusAsync();
            var systems = await _terraFusionSyncService.GetAvailableLegacySystemsAsync();
            var counties = await _terraFusionSyncService.GetConfiguredCountiesAsync();

            var healthReport = new
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                ServiceVersion = "TerraFusionSync v3.0.0",
                IsActive = isActive,
                ActiveConnections = status.ActiveConnections,
                RegisteredSystems = systems.Count(),
                ConfiguredCounties = counties.Count(),
                SystemStatus = systems.Select(s => new
                {
                    SystemId = s.SystemId,
                    SystemName = s.SystemName,
                    IsAvailable = s.IsAvailable,
                    LastHealthCheck = s.LastHealthCheck
                }),
                CountyStatus = counties.Select(c => new
                {
                    CountyName = c.CountyName,
                    IsActive = c.IsActive,
                    LastSync = c.LastSync,
                    TotalParcels = c.TotalParcels
                })
            };

            var allSystemsHealthy = systems.All(s => s.IsAvailable);
            var statusCode = allSystemsHealthy ? 200 : 503;

            return StatusCode(statusCode, healthReport);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Exception during health check");
            return StatusCode(503, new
            {
                Status = "Unhealthy",
                Error = ex.Message,
                Timestamp = DateTime.UtcNow
            });
        }
    }
}