using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.AI.Services;

namespace TerraFusion.API.Controllers;

/// <summary>
/// Codex 3-6-9 Framework - Performance Monitoring and Optimization Controller
///
/// High-Performance API Endpoints:
/// - Optimized data retrieval with cache-first strategy
/// - Performance metrics and analytics
/// - Cache warming and invalidation controls
/// - Real-time performance monitoring
///
/// Government Operations:
/// - Sub-100ms response times for cached queries (99th percentile)
/// - >80% cache hit rate under normal load
/// - Automatic cache invalidation on metric updates
/// - Performance SLA monitoring and reporting
///
/// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
/// </summary>
[ApiController]
[Route("api/codex/performance")]
[Authorize]
public class CodexPerformanceController : ControllerBase
{
    private readonly ICodexPerformanceOptimizationService _performanceService;
    private readonly ICodexCachingService _cachingService;
    private readonly ILogger<CodexPerformanceController> _logger;

    public CodexPerformanceController(
        ICodexPerformanceOptimizationService performanceService,
        ICodexCachingService cachingService,
        ILogger<CodexPerformanceController> logger)
    {
        _performanceService = performanceService;
        _cachingService = cachingService;
        _logger = logger;
    }

    /// <summary>
    /// Get optimized system-wide status (cache-first)
    /// High-performance endpoint with sub-100ms target for cached queries
    /// </summary>
    [HttpGet("system-wide")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOptimizedSystemWideStatus([FromQuery] string? countyId)
    {
        try
        {
            var status = await _performanceService.GetOptimizedSystemWideStatusAsync(countyId);
            return Ok(status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get optimized system-wide status");
            return StatusCode(500, new { error = "Failed to retrieve system-wide status" });
        }
    }

    /// <summary>
    /// Get optimized foundation metrics (cache-first)
    /// </summary>
    [HttpGet("foundation")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOptimizedFoundationMetrics([FromQuery] string? countyId)
    {
        try
        {
            var metrics = await _performanceService.GetOptimizedFoundationMetricsAsync(countyId);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get optimized foundation metrics");
            return StatusCode(500, new { error = "Failed to retrieve foundation metrics" });
        }
    }

    /// <summary>
    /// Get optimized amplification metrics (cache-first)
    /// </summary>
    [HttpGet("amplification")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOptimizedAmplificationMetrics([FromQuery] string? countyId)
    {
        try
        {
            var metrics = await _performanceService.GetOptimizedAmplificationMetricsAsync(countyId);
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get optimized amplification metrics");
            return StatusCode(500, new { error = "Failed to retrieve amplification metrics" });
        }
    }

    /// <summary>
    /// Get optimized ultimate power score (cache-first)
    /// </summary>
    [HttpGet("ultimate-power")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOptimizedUltimatePower([FromQuery] string? countyId)
    {
        try
        {
            var metric = await _performanceService.GetOptimizedUltimatePowerAsync(countyId);
            return Ok(metric);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get optimized ultimate power");
            return StatusCode(500, new { error = "Failed to retrieve ultimate power" });
        }
    }

    /// <summary>
    /// Get optimized alerts (cache-first)
    /// </summary>
    [HttpGet("alerts")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOptimizedAlerts([FromQuery] string? countyId)
    {
        try
        {
            var alerts = await _performanceService.GetOptimizedAlertsAsync(countyId);
            return Ok(alerts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get optimized alerts");
            return StatusCode(500, new { error = "Failed to retrieve alerts" });
        }
    }

    /// <summary>
    /// Get performance metrics and cache statistics
    /// Returns detailed performance analytics for monitoring and optimization
    /// </summary>
    [HttpGet("metrics")]
    [Authorize(Roles = "Admin,SystemAdministrator,PerformanceAnalyst")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPerformanceMetrics()
    {
        try
        {
            var metrics = await _performanceService.GetPerformanceMetricsAsync();
            return Ok(metrics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get performance metrics");
            return StatusCode(500, new { error = "Failed to retrieve performance metrics" });
        }
    }

    /// <summary>
    /// Get cache statistics
    /// Returns cache hit/miss rates, total operations, and efficiency metrics
    /// </summary>
    [HttpGet("cache/statistics")]
    [Authorize(Roles = "Admin,SystemAdministrator,PerformanceAnalyst")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCacheStatistics()
    {
        try
        {
            var stats = await _cachingService.GetCacheStatisticsAsync();
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get cache statistics");
            return StatusCode(500, new { error = "Failed to retrieve cache statistics" });
        }
    }

    /// <summary>
    /// Warm cache for specified county
    /// Pre-loads all Codex metrics into cache for optimal performance
    /// </summary>
    [HttpPost("cache/warm")]
    [Authorize(Roles = "Admin,SystemAdministrator")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> WarmCache([FromQuery] string? countyId)
    {
        try
        {
            _logger.LogInformation("Cache warming requested for county: {County}", countyId ?? "System-Wide");

            await _performanceService.WarmCacheAsync(countyId);

            return Ok(new
            {
                message = "Cache warmed successfully",
                countyId = countyId ?? "System-Wide",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to warm cache");
            return StatusCode(500, new { error = "Failed to warm cache" });
        }
    }

    /// <summary>
    /// Invalidate all caches for specified county
    /// Forces fresh database queries on next request
    /// </summary>
    [HttpPost("cache/invalidate")]
    [Authorize(Roles = "Admin,SystemAdministrator")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> InvalidateCache([FromQuery] string? countyId)
    {
        try
        {
            _logger.LogInformation("Cache invalidation requested for county: {County}", countyId ?? "System-Wide");

            await _cachingService.InvalidateAllCachesAsync(countyId);

            return Ok(new
            {
                message = "Cache invalidated successfully",
                countyId = countyId ?? "System-Wide",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to invalidate cache");
            return StatusCode(500, new { error = "Failed to invalidate cache" });
        }
    }

    /// <summary>
    /// Performance health check
    /// Returns OK if performance targets are met, otherwise returns detailed issues
    /// </summary>
    [HttpGet("health")]
    [Authorize(Roles = "Admin,SystemAdministrator,PerformanceAnalyst")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPerformanceHealth()
    {
        try
        {
            var metrics = await _performanceService.GetPerformanceMetricsAsync();
            var cacheStats = await _cachingService.GetCacheStatisticsAsync();

            var issues = new List<string>();

            // Performance target: >80% cache hit rate
            if (cacheStats.HitRate < 80.0 && cacheStats.TotalRequests > 100)
            {
                issues.Add($"Cache hit rate ({cacheStats.HitRate:F1}%) below target (80%)");
            }

            // Performance target: Average cached query < 100ms
            if (metrics.PerformanceBreakdown.AverageCachedQueryTime > 100.0)
            {
                issues.Add($"Average cached query time ({metrics.PerformanceBreakdown.AverageCachedQueryTime:F1}ms) above target (100ms)");
            }

            // Performance target: Average database query < 500ms
            if (metrics.PerformanceBreakdown.AverageDatabaseQueryTime > 500.0)
            {
                issues.Add($"Average database query time ({metrics.PerformanceBreakdown.AverageDatabaseQueryTime:F1}ms) above target (500ms)");
            }

            var isHealthy = issues.Count == 0;

            return Ok(new
            {
                healthy = isHealthy,
                cacheHitRate = cacheStats.HitRate,
                averageCachedQueryTime = metrics.PerformanceBreakdown.AverageCachedQueryTime,
                averageDatabaseQueryTime = metrics.PerformanceBreakdown.AverageDatabaseQueryTime,
                totalQueries = metrics.TotalQueries,
                issues = issues,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check performance health");
            return StatusCode(500, new { error = "Failed to check performance health" });
        }
    }
}
