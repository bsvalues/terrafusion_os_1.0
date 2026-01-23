using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CacheController : ControllerBase
    {
        private readonly ILogger<CacheController> _logger;
        private readonly IRedisCacheService _cacheService;
        private readonly IAPIResponseCachingService _apiCacheService;
        private readonly ICDNIntegrationService _cdnService;

        public CacheController(
            ILogger<CacheController> logger,
            IRedisCacheService cacheService,
            IAPIResponseCachingService apiCacheService,
            ICDNIntegrationService cdnService)
        {
            _logger = logger;
            _cacheService = cacheService;
            _apiCacheService = apiCacheService;
            _cdnService = cdnService;
        }

        /// <summary>
        /// Get cache statistics and performance metrics
        /// </summary>
        [HttpGet("statistics")]
        [Authorize(Roles = "Admin,SystemMonitor")]
        public async Task<ActionResult<CacheStatisticsResponse>> GetStatistics()
        {
            try
            {
                var redisStats = await _cacheService.GetStatisticsAsync();
                var apiCacheMetrics = await _apiCacheService.GetCacheMetricsAsync();
                var cdnStats = await _cdnService.GetStatisticsAsync();

                var response = new CacheStatisticsResponse
                {
                    Redis = redisStats,
                    APICache = apiCacheMetrics,
                    CDN = cdnStats,
                    Timestamp = DateTime.UtcNow
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cache statistics");
                return StatusCode(500, new { error = "Failed to retrieve cache statistics" });
            }
        }

        /// <summary>
        /// Invalidate cache by key
        /// </summary>
        [HttpDelete("invalidate/{key}")]
        [Authorize(Roles = "Admin,CacheManager")]
        public async Task<ActionResult> InvalidateCache(string key)
        {
            try
            {
                await _cacheService.RemoveAsync(key);
                await _apiCacheService.InvalidateCacheAsync(key);
                
                _logger.LogInformation("Cache invalidated for key: {Key} by user: {User}", key, User.Identity?.Name ?? "anonymous");
                return Ok(new { message = $"Cache invalidated for key: {key}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating cache for key: {Key}", key);
                return StatusCode(500, new { error = "Failed to invalidate cache" });
            }
        }

        /// <summary>
        /// Invalidate cache by pattern
        /// </summary>
        [HttpDelete("invalidate/pattern")]
        [Authorize(Roles = "Admin,CacheManager")]
        public async Task<ActionResult> InvalidateCacheByPattern([FromBody] InvalidatePatternRequest request)
        {
            try
            {
                await _cacheService.RemoveByPatternAsync(request.Pattern);
                await _apiCacheService.InvalidateByPatternAsync(request.Pattern);
                
                _logger.LogInformation("Cache invalidated for pattern: {Pattern} by user: {User}", 
                    request.Pattern, User.Identity?.Name ?? "anonymous");
                
                return Ok(new { message = $"Cache invalidated for pattern: {request.Pattern}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating cache for pattern: {Pattern}", request.Pattern);
                return StatusCode(500, new { error = "Failed to invalidate cache by pattern" });
            }
        }

        /// <summary>
        /// Invalidate cache by tag
        /// </summary>
        [HttpDelete("invalidate/tag/{tag}")]
        [Authorize(Roles = "Admin,CacheManager")]
        public async Task<ActionResult> InvalidateCacheByTag(string tag)
        {
            try
            {
                await _cacheService.InvalidateTagAsync(tag);
                await _apiCacheService.InvalidateByTagAsync(tag);
                
                _logger.LogInformation("Cache invalidated for tag: {Tag} by user: {User}", tag, User.Identity?.Name ?? "anonymous");
                return Ok(new { message = $"Cache invalidated for tag: {tag}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating cache for tag: {Tag}", tag);
                return StatusCode(500, new { error = "Failed to invalidate cache by tag" });
            }
        }

        /// <summary>
        /// Warm up cache with predefined items
        /// </summary>
        [HttpPost("warmup")]
        [Authorize(Roles = "Admin,CacheManager")]
        public async Task<ActionResult> WarmupCache([FromBody] CacheWarmupRequest request)
        {
            try
            {
                await _apiCacheService.WarmupCacheAsync(request.Items);
                
                _logger.LogInformation("Cache warmup initiated for {Count} items by user: {User}", 
                    request.Items.Count, User.Identity?.Name ?? "anonymous");
                
                return Ok(new { message = $"Cache warmup initiated for {request.Items.Count} items" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during cache warmup");
                return StatusCode(500, new { error = "Failed to warmup cache" });
            }
        }

        /// <summary>
        /// Get cached items with optional filtering
        /// </summary>
        [HttpGet("items")]
        [Authorize(Roles = "Admin,SystemMonitor")]
        public async Task<ActionResult<List<CachedItem>>> GetCachedItems([FromQuery] string? pattern = null)
        {
            try
            {
                var items = await _apiCacheService.GetCachedItemsAsync(pattern);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cached items");
                return StatusCode(500, new { error = "Failed to retrieve cached items" });
            }
        }

        /// <summary>
        /// Set caching rules for specific paths
        /// </summary>
        [HttpPost("rules")]
        [Authorize(Roles = "Admin,CacheManager")]
        public async Task<ActionResult> SetCachingRules([FromBody] SetCachingRulesRequest request)
        {
            try
            {
                var rule = new CachingRule
                {
                    TTL = TimeSpan.FromSeconds(request.TTLSeconds),
                    FileExtensions = request.FileExtensions,
                    MimeTypes = request.MimeTypes,
                    EnableGzip = request.EnableGzip,
                    EnableBrotli = request.EnableBrotli,
                    CacheControl = request.CacheControl,
                    Headers = request.Headers
                };

                var success = await _cdnService.SetCachingRulesAsync(request.Path, rule);
                
                if (success)
                {
                    _logger.LogInformation("Caching rules set for path: {Path} by user: {User}", 
                        request.Path, User.Identity?.Name ?? "anonymous");
                    return Ok(new { message = $"Caching rules set for path: {request.Path}" });
                }
                else
                {
                    return StatusCode(500, new { error = "Failed to set caching rules" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting caching rules for path: {Path}", request.Path);
                return StatusCode(500, new { error = "Failed to set caching rules" });
            }
        }

        /// <summary>
        /// Get CDN edge locations
        /// </summary>
        [HttpGet("cdn/edge-locations")]
        [Authorize(Roles = "Admin,SystemMonitor")]
        public async Task<ActionResult<List<CDNEdgeLocation>>> GetEdgeLocations()
        {
            try
            {
                var locations = await _cdnService.GetEdgeLocationsAsync();
                return Ok(locations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving CDN edge locations");
                return StatusCode(500, new { error = "Failed to retrieve edge locations" });
            }
        }

        /// <summary>
        /// Get performance metrics for a specific path
        /// </summary>
        [HttpGet("cdn/performance")]
        [Authorize(Roles = "Admin,SystemMonitor")]
        public async Task<ActionResult<CDNPerformanceMetrics>> GetPerformanceMetrics(
            [FromQuery] string path, 
            [FromQuery] int periodHours = 24)
        {
            try
            {
                var period = TimeSpan.FromHours(periodHours);
                var metrics = await _cdnService.GetPerformanceMetricsAsync(path, period);
                return Ok(metrics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving performance metrics for path: {Path}", path);
                return StatusCode(500, new { error = "Failed to retrieve performance metrics" });
            }
        }

        /// <summary>
        /// Purge all CDN content (use with extreme caution)
        /// </summary>
        [HttpDelete("cdn/purge-all")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> PurgeAllCDN()
        {
            try
            {
                var success = await _cdnService.PurgeAllAsync();
                
                if (success)
                {
                    _logger.LogWarning("CDN purge all executed by user: {User}", User.Identity?.Name ?? "anonymous");
                    return Ok(new { message = "All CDN content purged successfully" });
                }
                else
                {
                    return StatusCode(500, new { error = "Failed to purge CDN content" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error purging all CDN content");
                return StatusCode(500, new { error = "Failed to purge CDN content" });
            }
        }

        /// <summary>
        /// Generate optimized CDN URL for an asset
        /// </summary>
        [HttpPost("cdn/optimize-url")]
        public async Task<ActionResult<OptimizedUrlResponse>> GetOptimizedUrl([FromBody] OptimizeUrlRequest request)
        {
            try
            {
                var options = new CDNOptimizationOptions
                {
                    Width = request.Width,
                    Height = request.Height,
                    Format = request.Format,
                    Quality = request.Quality,
                    AutoOptimize = request.AutoOptimize,
                    EnableWebP = request.EnableWebP,
                    EnableAVIF = request.EnableAVIF,
                    Crop = request.Crop,
                    CustomTransformations = request.CustomTransformations
                };

                var optimizedUrl = await _cdnService.GetOptimizedUrlAsync(request.AssetPath, options);
                
                return Ok(new OptimizedUrlResponse
                {
                    OriginalUrl = request.AssetPath,
                    OptimizedUrl = optimizedUrl,
                    Transformations = options
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating optimized URL for asset: {AssetPath}", request.AssetPath);
                return StatusCode(500, new { error = "Failed to generate optimized URL" });
            }
        }
    }

    // Request/Response DTOs
    public class CacheStatisticsResponse
    {
        public required CacheStatistics Redis { get; set; }
        public required CacheMetrics APICache { get; set; }
        public required CDNStatistics CDN { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class InvalidatePatternRequest
    {
        public required string Pattern { get; set; }
    }

    public class CacheWarmupRequest
    {
        public List<CacheWarmupItem> Items { get; set; } = new List<CacheWarmupItem>();
    }

    public class SetCachingRulesRequest
    {
        public required string Path { get; set; }
        public int TTLSeconds { get; set; }
        public required string[] FileExtensions { get; set; }
        public required string[] MimeTypes { get; set; }
        public bool EnableGzip { get; set; } = true;
        public bool EnableBrotli { get; set; } = true;
        public required string CacheControl { get; set; }
        public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();
    }

    public class OptimizeUrlRequest
    {
        public required string AssetPath { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public required string Format { get; set; }
        public int? Quality { get; set; }
        public bool AutoOptimize { get; set; } = true;
        public bool EnableWebP { get; set; } = true;
        public bool EnableAVIF { get; set; } = true;
        public required string Crop { get; set; }
        public Dictionary<string, string> CustomTransformations { get; set; } = new Dictionary<string, string>();
    }

    public class OptimizedUrlResponse
    {
        public required string OriginalUrl { get; set; }
        public required string OptimizedUrl { get; set; }
        public required CDNOptimizationOptions Transformations { get; set; }
    }
}
