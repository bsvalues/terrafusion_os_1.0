using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text;
using System.Security.Cryptography;
using System.IO;



namespace TerraFusion.Core.Services
{
    public interface IAPIResponseCachingService
    {
        Task<T?> GetCachedResponseAsync<T>(string cacheKey);
        Task SetCachedResponseAsync<T>(string cacheKey, T response, TimeSpan? expiration = null, string[]? tags = null);
        Task InvalidateCacheAsync(string cacheKey);
        Task InvalidateByTagAsync(string tag);
        Task InvalidateByPatternAsync(string pattern);
        string GenerateCacheKey(HttpRequest request, object? parameters = null);
        Task<bool> ShouldCacheResponseAsync(HttpRequest request, IActionResult response);
        Task<CacheMetrics> GetCacheMetricsAsync();
        Task WarmupCacheAsync(IEnumerable<CacheWarmupItem> items);
        Task<List<CachedItem>> GetCachedItemsAsync(string? pattern = null);
    }

    public class CacheWarmupItem
    {
        public required string Endpoint { get; set; }
        public required Dictionary<string, object> Parameters { get; set; }
        public TimeSpan? TTL { get; set; }
        public required string[] Tags { get; set; }
    }

    public class CachedItem
    {
        public required string Key { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public long SizeBytes { get; set; }
        public int HitCount { get; set; }
        public required string[] Tags { get; set; }
        public required string ContentType { get; set; }
    }

    public class CacheMetrics
    {
        public long TotalRequests { get; set; }
        public long CacheHits { get; set; }
        public long CacheMisses { get; set; }
        public double HitRatio => TotalRequests > 0 ? (double)CacheHits / TotalRequests : 0;
        public long TotalCachedItems { get; set; }
        public long TotalCacheSize { get; set; }
        public Dictionary<string, long> HitsByEndpoint { get; set; } = new Dictionary<string, long>();
        public Dictionary<string, double> AverageResponseTimesByEndpoint { get; set; } = new Dictionary<string, double>();
        public Dictionary<string, long> CacheSizeByTag { get; set; } = new Dictionary<string, long>();
        public TimeSpan AverageCacheAge { get; set; }
    }

    public class APIResponseCachingService : IAPIResponseCachingService
    {
        private readonly ILogger<APIResponseCachingService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IRedisCacheService _cacheService;

        // Cache configuration
        private readonly TimeSpan _defaultTTL;
        private readonly bool _enableCaching;
        private readonly string[] _cacheableContentTypes;
        private readonly string[] _nonCacheableEndpoints;
        private readonly int _maxCacheSize;
        private readonly bool _enableCompression;

        // Metrics tracking
        private long _totalRequests = 0;
        private long _cacheHits = 0;
        private long _cacheMisses = 0;
        private readonly Dictionary<string, long> _endpointHits = new Dictionary<string, long>();
        private readonly Dictionary<string, List<double>> _responseTimesbyEndpoint = new Dictionary<string, List<double>>();

        public APIResponseCachingService(
            ILogger<APIResponseCachingService> logger,
            IConfiguration configuration,
            IRedisCacheService cacheService)
        {
            _logger = logger;
            _configuration = configuration;
            _cacheService = cacheService;

            _defaultTTL = TimeSpan.FromMinutes(configuration.GetValue<int>("Cache:API:DefaultTTLMinutes", 15));
            _enableCaching = configuration.GetValue<bool>("Cache:API:Enabled", true);
            _maxCacheSize = configuration.GetValue<int>("Cache:API:MaxSizeMB", 100) * 1024 * 1024;
            _enableCompression = configuration.GetValue<bool>("Cache:API:EnableCompression", true);

            _cacheableContentTypes = configuration.GetSection("Cache:API:CacheableContentTypes")
                .Get<string[]>() ?? new[] { "application/json", "text/json", "application/xml", "text/xml" };

            _nonCacheableEndpoints = configuration.GetSection("Cache:API:NonCacheableEndpoints")
                .Get<string[]>() ?? new[] { "/api/auth", "/api/security", "/api/realtime" };
        }

        public async Task<T?> GetCachedResponseAsync<T>(string cacheKey)
        {
            if (!_enableCaching)
            {
                Interlocked.Increment(ref _cacheMisses);
                return default(T);
            }

            try
            {
                Interlocked.Increment(ref _totalRequests);

                var cachedResponse = await _cacheService.GetAsync<CachedResponse>(cacheKey);

                if (cachedResponse != null)
                {
                    Interlocked.Increment(ref _cacheHits);

                    // Update hit count for the cached item
                    var hitCountKey = $"{cacheKey}:hits";
                    await _cacheService.IncrementAsync(hitCountKey);

                    _logger.LogDebug("Cache hit for key: {CacheKey}", cacheKey);

                    // Deserialize the response data
                    var responseData = JsonSerializer.Deserialize<T>(cachedResponse.Data);
                    return responseData;
                }

                Interlocked.Increment(ref _cacheMisses);
                _logger.LogDebug("Cache miss for key: {CacheKey}", cacheKey);
                return default(T);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cached response for key: {CacheKey}", cacheKey);
                Interlocked.Increment(ref _cacheMisses);
                return default(T);
            }
        }

        public async Task SetCachedResponseAsync<T>(string cacheKey, T response, TimeSpan? expiration = null, string[]? tags = null)
        {
            if (!_enableCaching || response == null)
                return;

            try
            {
                var responseJson = JsonSerializer.Serialize(response);
                var responseSize = Encoding.UTF8.GetByteCount(responseJson);

                // Check cache size limits
                if (responseSize > _maxCacheSize / 10) // Don't cache items larger than 10% of max cache size
                {
                    _logger.LogWarning("Response too large to cache: {Size} bytes for key: {CacheKey}", responseSize, cacheKey);
                    return;
                }

                var cachedResponse = new CachedResponse
                {
                    Data = responseJson,
                    CreatedAt = DateTime.UtcNow,
                    SizeBytes = responseSize,
                    Tags = tags ?? Array.Empty<string>(),
                    ContentType = "application/json"
                };

                var ttl = expiration ?? _defaultTTL;
                await _cacheService.SetAsync(cacheKey, cachedResponse, ttl);

                // Store metadata for analytics
                var metadataKey = $"{cacheKey}:metadata";
                var metadata = new CacheItemMetadata
                {
                    CreatedAt = cachedResponse.CreatedAt,
                    ExpiresAt = cachedResponse.CreatedAt.Add(ttl),
                    SizeBytes = responseSize,
                    Tags = tags ?? Array.Empty<string>(),
                    ContentType = cachedResponse.ContentType
                };
                await _cacheService.SetAsync(metadataKey, metadata, ttl.Add(TimeSpan.FromHours(1))); // Keep metadata slightly longer

                // Tag-based indexing for invalidation
                if (tags != null)
                {
                    foreach (var tag in tags)
                    {
                        var tagKey = $"tag:{tag}";
                        await _cacheService.AddToListAsync(tagKey, cacheKey);
                    }
                }

                _logger.LogDebug("Cached response for key: {CacheKey}, Size: {Size} bytes, TTL: {TTL}",
                    cacheKey, responseSize, ttl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error caching response for key: {CacheKey}", cacheKey);
            }
        }

        public async Task InvalidateCacheAsync(string cacheKey)
        {
            try
            {
                await _cacheService.RemoveAsync(cacheKey);
                await _cacheService.RemoveAsync($"{cacheKey}:metadata");
                await _cacheService.RemoveAsync($"{cacheKey}:hits");

                _logger.LogInformation("Invalidated cache for key: {CacheKey}", cacheKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating cache for key: {CacheKey}", cacheKey);
            }
        }

        public async Task InvalidateByTagAsync(string tag)
        {
            try
            {
                var tagKey = $"tag:{tag}";
                var cachedKeys = await _cacheService.GetListAsync<string>(tagKey);

                var invalidationTasks = cachedKeys.Select(InvalidateCacheAsync);
                await Task.WhenAll(invalidationTasks);

                // Remove the tag list itself
                await _cacheService.RemoveAsync(tagKey);

                _logger.LogInformation("Invalidated {Count} cache entries with tag: {Tag}", cachedKeys.Count, tag);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating cache by tag: {Tag}", tag);
            }
        }

        public async Task InvalidateByPatternAsync(string pattern)
        {
            try
            {
                await _cacheService.RemoveByPatternAsync(pattern);
                _logger.LogInformation("Invalidated cache entries matching pattern: {Pattern}", pattern);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating cache by pattern: {Pattern}", pattern);
            }
        }

        public string GenerateCacheKey(HttpRequest request, object? parameters = null)
        {
            try
            {
                var keyBuilder = new StringBuilder();
                keyBuilder.Append($"api:{request.Method}:{request.Path}");

                // Include query parameters
                if (request.Query.Count > 0)
                {
                    var sortedQuery = request.Query.OrderBy(q => q.Key);
                    foreach (var query in sortedQuery)
                    {
                        keyBuilder.Append($":{query.Key}={query.Value}");
                    }
                }

                // Include additional parameters
                if (parameters != null)
                {
                    var parametersJson = JsonSerializer.Serialize(parameters);
                    var parametersHash = ComputeHash(parametersJson);
                    keyBuilder.Append($":params={parametersHash}");
                }

                // Include user context if available
                if (request.HttpContext.User?.Identity?.IsAuthenticated == true)
                {
                    var userId = request.HttpContext.User.FindFirst("sub")?.Value ??
                                request.HttpContext.User.FindFirst("id")?.Value;
                    if (!string.IsNullOrEmpty(userId))
                    {
                        keyBuilder.Append($":user={userId}");
                    }
                }

                var cacheKey = keyBuilder.ToString();
                _logger.LogDebug("Generated cache key: {CacheKey}", cacheKey);
                return cacheKey;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating cache key for request: {Path}", request.Path);
                return $"api:fallback:{Guid.NewGuid()}";
            }
        }

        public async Task<bool> ShouldCacheResponseAsync(HttpRequest request, IActionResult response)
        {
            try
            {
                // Check if caching is enabled
                if (!_enableCaching)
                    return false;

                // Check HTTP method - only cache GET requests
                if (!string.Equals(request.Method, "GET", StringComparison.OrdinalIgnoreCase))
                    return false;

                // Check if endpoint is in non-cacheable list
                var path = request.Path.Value?.ToLowerInvariant();
                if (_nonCacheableEndpoints.Any(endpoint => path?.StartsWith(endpoint.ToLowerInvariant()) == true))
                    return false;

                // Check response type
                if (response is ObjectResult objectResult)
                {
                    // Don't cache error responses
                    if (objectResult.StatusCode >= 400)
                        return false;

                    // Check content type
                    var contentType = objectResult.ContentTypes?.FirstOrDefault();
                    if (!string.IsNullOrEmpty(contentType) &&
                        !_cacheableContentTypes.Any(ct => contentType.StartsWith(ct, StringComparison.OrdinalIgnoreCase)))
                    {
                        return false;
                    }
                }

                // Check for cache control headers
                if (request.Headers.ContainsKey("Cache-Control"))
                {
                    var cacheControl = request.Headers["Cache-Control"].ToString();
                    if (cacheControl.Contains("no-cache") || cacheControl.Contains("no-store"))
                        return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error determining if response should be cached");
                return false;
            }
        }

        public async Task<CacheMetrics> GetCacheMetricsAsync()
        {
            try
            {
                var cacheStats = await _cacheService.GetStatisticsAsync();

                var metrics = new CacheMetrics
                {
                    TotalRequests = _totalRequests,
                    CacheHits = _cacheHits,
                    CacheMisses = _cacheMisses,
                    TotalCachedItems = cacheStats.TotalKeys,
                    TotalCacheSize = cacheStats.MemoryUsage,
                    HitsByEndpoint = new Dictionary<string, long>(_endpointHits)
                };

                // Calculate average response times by endpoint
                foreach (var kvp in _responseTimesbyEndpoint)
                {
                    if (kvp.Value.Count > 0)
                    {
                        metrics.AverageResponseTimesByEndpoint[kvp.Key] = kvp.Value.Average();
                    }
                }

                return metrics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cache metrics");
                return new CacheMetrics
                {
                    TotalRequests = _totalRequests,
                    CacheHits = _cacheHits,
                    CacheMisses = _cacheMisses
                };
            }
        }

        public async Task WarmupCacheAsync(IEnumerable<CacheWarmupItem> items)
        {
            try
            {
                var warmupTasks = items.Select(async item =>
                {
                    try
                    {
                        // This would typically make HTTP requests to the endpoints
                        // For now, we'll just log the warmup attempt
                        _logger.LogInformation("Warming up cache for endpoint: {Endpoint}", item.Endpoint);

                        // In a real implementation, you would:
                        // 1. Make HTTP request to the endpoint with parameters
                        // 2. Cache the response with specified TTL and tags
                        // 3. Handle any errors gracefully

                        await Task.Delay(100); // Simulate warmup delay
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error warming up cache for endpoint: {Endpoint}", item.Endpoint);
                    }
                });

                await Task.WhenAll(warmupTasks);
                _logger.LogInformation("Cache warmup completed for {Count} items", items.Count());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during cache warmup");
            }
        }

        public async Task<List<CachedItem>> GetCachedItemsAsync(string? pattern = null)
        {
            try
            {
                var items = new List<CachedItem>();

                // This is a simplified implementation
                // In a real scenario, you'd iterate through Redis keys matching the pattern
                // and retrieve metadata for each cached item

                _logger.LogDebug("Retrieved cached items with pattern: {Pattern}", pattern ?? "all");
                return items;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cached items");
                return new List<CachedItem>();
            }
        }

        private static string ComputeHash(string input)
        {
            using var sha256 = SHA256.Create();
            var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(hash).ToLowerInvariant()[..16]; // Use first 16 characters
        }

        private class CachedResponse
        {
            public required string Data { get; set; }
            public DateTime CreatedAt { get; set; }
            public long SizeBytes { get; set; }
            public required string[] Tags { get; set; }
            public required string ContentType { get; set; }
        }

        private class CacheItemMetadata
        {
            public DateTime CreatedAt { get; set; }
            public DateTime ExpiresAt { get; set; }
            public long SizeBytes { get; set; }
            public required string[] Tags { get; set; }
            public required string ContentType { get; set; }
        }
    }
}
