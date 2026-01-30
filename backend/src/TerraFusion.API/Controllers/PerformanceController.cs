using Microsoft.AspNetCore.Mvc;
using TerraFusion.Core.Services.Performance;
using TerraFusion.Core.Services.Caching;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Performance monitoring and health check controller
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class PerformanceController : ControllerBase
{
    private readonly IPerformanceMonitoringService _performanceService;
    private readonly IAdvancedCacheService _cacheService;
    private readonly ILogger<PerformanceController> _logger;

    public PerformanceController(
        IPerformanceMonitoringService performanceService,
        IAdvancedCacheService cacheService,
        ILogger<PerformanceController> logger)
    {
        _performanceService = performanceService;
        _cacheService = cacheService;
        _logger = logger;
    }

    /// <summary>
    /// Get current system health status
    /// </summary>
    [HttpGet("health")]
    public async Task<ActionResult<HealthStatus>> GetHealthStatus()
    {
        try
        {
            var health = await _performanceService.GetHealthStatusAsync();
            return Ok(health);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving health status");
            return StatusCode(500, new { message = "Error retrieving health status" });
        }
    }

    /// <summary>
    /// Get current performance metrics
    /// </summary>
    [HttpGet("metrics")]
    public async Task<ActionResult<PerformanceMetrics>> GetCurrentMetrics()
    {
        try
        {
            var metrics = await _performanceService.GetCurrentMetricsAsync();
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving performance metrics");
            return StatusCode(500, new { message = "Error retrieving performance metrics" });
        }
    }

    /// <summary>
    /// Get performance metrics history
    /// </summary>
    [HttpGet("metrics/history")]
    public async Task<ActionResult<List<PerformanceMetrics>>> GetMetricsHistory(
        [FromQuery] int hours = 1)
    {
        try
        {
            var period = TimeSpan.FromHours(Math.Min(hours, 24)); // Max 24 hours
            var metrics = await _performanceService.GetMetricsHistoryAsync(period);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving metrics history");
            return StatusCode(500, new { message = "Error retrieving metrics history" });
        }
    }

    /// <summary>
    /// Get cache statistics
    /// </summary>
    [HttpGet("cache/stats")]
    public async Task<ActionResult<CacheStatistics>> GetCacheStatistics()
    {
        try
        {
            var stats = await _cacheService.GetStatisticsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cache statistics");
            return StatusCode(500, new { message = "Error retrieving cache statistics" });
        }
    }

    /// <summary>
    /// Clear cache (admin only)
    /// </summary>
    [HttpPost("cache/clear")]
    public async Task<ActionResult> ClearCache([FromQuery] string? pattern = null)
    {
        try
        {
            if (!string.IsNullOrEmpty(pattern))
            {
                await _cacheService.RemoveByPatternAsync(pattern);
                _logger.LogInformation("Cache cleared for pattern: {Pattern}", pattern);
            }
            else
            {
                // Note: Full cache clear would require Redis-specific implementation
                _logger.LogWarning("Full cache clear requested but not implemented");
                return BadRequest(new { message = "Full cache clear not implemented. Use pattern parameter." });
            }

            return Ok(new { message = "Cache cleared successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cache");
            return StatusCode(500, new { message = "Error clearing cache" });
        }
    }

    /// <summary>
    /// Performance test endpoint
    /// </summary>
    [HttpGet("test/load")]
    public async Task<ActionResult> LoadTest([FromQuery] int iterations = 100)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            var tasks = new List<Task>();
            
            for (int i = 0; i < Math.Min(iterations, 1000); i++) // Max 1000 iterations
            {
                tasks.Add(SimulateWork());
            }

            await Task.WhenAll(tasks);
            stopwatch.Stop();

            var result = new
            {
                iterations,
                totalTimeMs = stopwatch.ElapsedMilliseconds,
                averageTimeMs = stopwatch.ElapsedMilliseconds / (double)iterations,
                tasksPerSecond = iterations / stopwatch.Elapsed.TotalSeconds
            };

            _logger.LogInformation("Load test completed: {Result}", result);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during load test");
            return StatusCode(500, new { message = "Error during load test" });
        }
    }

    private async Task SimulateWork()
    {
        // Simulate some CPU and I/O work
        await Task.Delay(Random.Shared.Next(1, 10));
        
        // Simulate some computation
        var result = 0;
        for (int i = 0; i < 1000; i++)
        {
            result += i * i;
        }
    }
}
