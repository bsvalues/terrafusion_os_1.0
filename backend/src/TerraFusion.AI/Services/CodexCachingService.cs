using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using TerraFusion.AI.DTOs;

namespace TerraFusion.AI.Services;

/// <summary>
/// Codex 3-6-9 Framework - High-Performance Caching Service
///
/// Performance Optimization Architecture:
/// - Distributed caching with Redis for multi-instance deployments
/// - In-memory caching for single-instance scenarios
/// - Intelligent cache invalidation on metric updates
/// - Sliding expiration for frequently accessed data
/// - Absolute expiration for time-sensitive metrics
///
/// Cache Strategy:
/// - Foundation Metrics: 5-minute sliding window (frequently changing)
/// - Amplification Metrics: 10-minute sliding window (computed values)
/// - Ultimate Power Score: 2-minute sliding window (critical real-time metric)
/// - System-Wide Status: 1-minute absolute expiration (dashboard queries)
/// - Alert History: 15-minute sliding window (audit queries)
///
/// THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
/// </summary>
public interface ICodexCachingService
{
    Task<Codex369StatusDto?> GetCachedSystemWideStatusAsync(string? countyId = null);
    Task SetCachedSystemWideStatusAsync(Codex369StatusDto status, string? countyId = null);

    Task<List<FoundationMetric>?> GetCachedFoundationMetricsAsync(string? countyId = null);
    Task SetCachedFoundationMetricsAsync(List<FoundationMetric> metrics, string? countyId = null);

    Task<List<AmplificationMetric>?> GetCachedAmplificationMetricsAsync(string? countyId = null);
    Task SetCachedAmplificationMetricsAsync(List<AmplificationMetric> metrics, string? countyId = null);

    Task<UltimatePowerMetric?> GetCachedUltimatePowerAsync(string? countyId = null);
    Task SetCachedUltimatePowerAsync(UltimatePowerMetric metric, string? countyId = null);

    Task<List<CodexAlertDto>?> GetCachedAlertsAsync(string? countyId = null);
    Task SetCachedAlertsAsync(List<CodexAlertDto> alerts, string? countyId = null);

    Task InvalidateAllCachesAsync(string? countyId = null);
    Task InvalidateCacheByKeyAsync(string cacheKey);

    Task<CacheStatisticsDto> GetCacheStatisticsAsync();
}

public class CodexCachingService : ICodexCachingService
{
    private readonly IDistributedCache _distributedCache;
    private readonly ILogger<CodexCachingService> _logger;

    // Cache key prefixes
    private const string CACHE_PREFIX = "codex:";
    private const string SYSTEM_WIDE_KEY = "system-wide";
    private const string FOUNDATION_KEY = "foundation";
    private const string AMPLIFICATION_KEY = "amplification";
    private const string ULTIMATE_POWER_KEY = "ultimate-power";
    private const string ALERTS_KEY = "alerts";

    // Cache expiration settings (in seconds)
    private readonly TimeSpan _systemWideExpiration = TimeSpan.FromMinutes(1);      // 1 minute absolute
    private readonly TimeSpan _foundationExpiration = TimeSpan.FromMinutes(5);      // 5 minutes sliding
    private readonly TimeSpan _amplificationExpiration = TimeSpan.FromMinutes(10);  // 10 minutes sliding
    private readonly TimeSpan _ultimatePowerExpiration = TimeSpan.FromMinutes(2);   // 2 minutes sliding
    private readonly TimeSpan _alertsExpiration = TimeSpan.FromMinutes(15);         // 15 minutes sliding

    // Cache statistics (in-memory counters)
    private long _cacheHits = 0;
    private long _cacheMisses = 0;
    private long _cacheWrites = 0;
    private long _cacheInvalidations = 0;

    public CodexCachingService(
        IDistributedCache distributedCache,
        ILogger<CodexCachingService> logger)
    {
        _distributedCache = distributedCache;
        _logger = logger;
    }

    // ============================================================================
    // SYSTEM-WIDE STATUS CACHING
    // ============================================================================

    public async Task<Codex369StatusDto?> GetCachedSystemWideStatusAsync(string? countyId = null)
    {
        var cacheKey = BuildCacheKey(SYSTEM_WIDE_KEY, countyId);

        try
        {
            var cachedData = await _distributedCache.GetStringAsync(cacheKey);

            if (cachedData != null)
            {
                Interlocked.Increment(ref _cacheHits);
                _logger.LogDebug("Cache HIT for {CacheKey}", cacheKey);
                return JsonSerializer.Deserialize<Codex369StatusDto>(cachedData);
            }

            Interlocked.Increment(ref _cacheMisses);
            _logger.LogDebug("Cache MISS for {CacheKey}", cacheKey);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve from cache: {CacheKey}", cacheKey);
            return null;
        }
    }

    public async Task SetCachedSystemWideStatusAsync(Codex369StatusDto status, string? countyId = null)
    {
        var cacheKey = BuildCacheKey(SYSTEM_WIDE_KEY, countyId);

        try
        {
            var serializedData = JsonSerializer.Serialize(status);

            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = _systemWideExpiration
            };

            await _distributedCache.SetStringAsync(cacheKey, serializedData, options);

            Interlocked.Increment(ref _cacheWrites);
            _logger.LogDebug("Cache SET for {CacheKey} (expires in {Expiration})", cacheKey, _systemWideExpiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set cache: {CacheKey}", cacheKey);
        }
    }

    // ============================================================================
    // FOUNDATION METRICS CACHING
    // ============================================================================

    public async Task<List<FoundationMetric>?> GetCachedFoundationMetricsAsync(string? countyId = null)
    {
        var cacheKey = BuildCacheKey(FOUNDATION_KEY, countyId);

        try
        {
            var cachedData = await _distributedCache.GetStringAsync(cacheKey);

            if (cachedData != null)
            {
                Interlocked.Increment(ref _cacheHits);
                _logger.LogDebug("Cache HIT for {CacheKey}", cacheKey);
                return JsonSerializer.Deserialize<List<FoundationMetric>>(cachedData);
            }

            Interlocked.Increment(ref _cacheMisses);
            _logger.LogDebug("Cache MISS for {CacheKey}", cacheKey);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve from cache: {CacheKey}", cacheKey);
            return null;
        }
    }

    public async Task SetCachedFoundationMetricsAsync(List<FoundationMetric> metrics, string? countyId = null)
    {
        var cacheKey = BuildCacheKey(FOUNDATION_KEY, countyId);

        try
        {
            var serializedData = JsonSerializer.Serialize(metrics);

            var options = new DistributedCacheEntryOptions
            {
                SlidingExpiration = _foundationExpiration
            };

            await _distributedCache.SetStringAsync(cacheKey, serializedData, options);

            Interlocked.Increment(ref _cacheWrites);
            _logger.LogDebug("Cache SET for {CacheKey} (sliding {Expiration})", cacheKey, _foundationExpiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set cache: {CacheKey}", cacheKey);
        }
    }

    // ============================================================================
    // AMPLIFICATION METRICS CACHING
    // ============================================================================

    public async Task<List<AmplificationMetric>?> GetCachedAmplificationMetricsAsync(string? countyId = null)
    {
        var cacheKey = BuildCacheKey(AMPLIFICATION_KEY, countyId);

        try
        {
            var cachedData = await _distributedCache.GetStringAsync(cacheKey);

            if (cachedData != null)
            {
                Interlocked.Increment(ref _cacheHits);
                _logger.LogDebug("Cache HIT for {CacheKey}", cacheKey);
                return JsonSerializer.Deserialize<List<AmplificationMetric>>(cachedData);
            }

            Interlocked.Increment(ref _cacheMisses);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve from cache: {CacheKey}", cacheKey);
            return null;
        }
    }

    public async Task SetCachedAmplificationMetricsAsync(List<AmplificationMetric> metrics, string? countyId = null)
    {
        var cacheKey = BuildCacheKey(AMPLIFICATION_KEY, countyId);

        try
        {
            var serializedData = JsonSerializer.Serialize(metrics);

            var options = new DistributedCacheEntryOptions
            {
                SlidingExpiration = _amplificationExpiration
            };

            await _distributedCache.SetStringAsync(cacheKey, serializedData, options);

            Interlocked.Increment(ref _cacheWrites);
            _logger.LogDebug("Cache SET for {CacheKey} (sliding {Expiration})", cacheKey, _amplificationExpiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set cache: {CacheKey}", cacheKey);
        }
    }

    // ============================================================================
    // ULTIMATE POWER CACHING
    // ============================================================================

    public async Task<UltimatePowerMetric?> GetCachedUltimatePowerAsync(string? countyId = null)
    {
        var cacheKey = BuildCacheKey(ULTIMATE_POWER_KEY, countyId);

        try
        {
            var cachedData = await _distributedCache.GetStringAsync(cacheKey);

            if (cachedData != null)
            {
                Interlocked.Increment(ref _cacheHits);
                return JsonSerializer.Deserialize<UltimatePowerMetric>(cachedData);
            }

            Interlocked.Increment(ref _cacheMisses);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve from cache: {CacheKey}", cacheKey);
            return null;
        }
    }

    public async Task SetCachedUltimatePowerAsync(UltimatePowerMetric metric, string? countyId = null)
    {
        var cacheKey = BuildCacheKey(ULTIMATE_POWER_KEY, countyId);

        try
        {
            var serializedData = JsonSerializer.Serialize(metric);

            var options = new DistributedCacheEntryOptions
            {
                SlidingExpiration = _ultimatePowerExpiration
            };

            await _distributedCache.SetStringAsync(cacheKey, serializedData, options);

            Interlocked.Increment(ref _cacheWrites);
            _logger.LogDebug("Cache SET for {CacheKey} (sliding {Expiration})", cacheKey, _ultimatePowerExpiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set cache: {CacheKey}", cacheKey);
        }
    }

    // ============================================================================
    // ALERTS CACHING
    // ============================================================================

    public async Task<List<CodexAlertDto>?> GetCachedAlertsAsync(string? countyId = null)
    {
        var cacheKey = BuildCacheKey(ALERTS_KEY, countyId);

        try
        {
            var cachedData = await _distributedCache.GetStringAsync(cacheKey);

            if (cachedData != null)
            {
                Interlocked.Increment(ref _cacheHits);
                return JsonSerializer.Deserialize<List<CodexAlertDto>>(cachedData);
            }

            Interlocked.Increment(ref _cacheMisses);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve from cache: {CacheKey}", cacheKey);
            return null;
        }
    }

    public async Task SetCachedAlertsAsync(List<CodexAlertDto> alerts, string? countyId = null)
    {
        var cacheKey = BuildCacheKey(ALERTS_KEY, countyId);

        try
        {
            var serializedData = JsonSerializer.Serialize(alerts);

            var options = new DistributedCacheEntryOptions
            {
                SlidingExpiration = _alertsExpiration
            };

            await _distributedCache.SetStringAsync(cacheKey, serializedData, options);

            Interlocked.Increment(ref _cacheWrites);
            _logger.LogDebug("Cache SET for {CacheKey} (sliding {Expiration})", cacheKey, _alertsExpiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set cache: {CacheKey}", cacheKey);
        }
    }

    // ============================================================================
    // CACHE INVALIDATION
    // ============================================================================

    public async Task InvalidateAllCachesAsync(string? countyId = null)
    {
        try
        {
            _logger.LogInformation("Invalidating all Codex caches for county: {County}", countyId ?? "System-Wide");

            var keysToInvalidate = new[]
            {
                BuildCacheKey(SYSTEM_WIDE_KEY, countyId),
                BuildCacheKey(FOUNDATION_KEY, countyId),
                BuildCacheKey(AMPLIFICATION_KEY, countyId),
                BuildCacheKey(ULTIMATE_POWER_KEY, countyId),
                BuildCacheKey(ALERTS_KEY, countyId),
            };

            foreach (var key in keysToInvalidate)
            {
                await _distributedCache.RemoveAsync(key);
                Interlocked.Increment(ref _cacheInvalidations);
            }

            _logger.LogInformation("Invalidated {Count} cache keys", keysToInvalidate.Length);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to invalidate caches for county: {County}", countyId);
            throw;
        }
    }

    public async Task InvalidateCacheByKeyAsync(string cacheKey)
    {
        try
        {
            await _distributedCache.RemoveAsync(cacheKey);
            Interlocked.Increment(ref _cacheInvalidations);
            _logger.LogDebug("Cache INVALIDATED for {CacheKey}", cacheKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to invalidate cache: {CacheKey}", cacheKey);
            throw;
        }
    }

    // ============================================================================
    // CACHE STATISTICS
    // ============================================================================

    public async Task<CacheStatisticsDto> GetCacheStatisticsAsync()
    {
        var totalRequests = _cacheHits + _cacheMisses;
        var hitRate = totalRequests > 0 ? (double)_cacheHits / totalRequests * 100 : 0;

        return new CacheStatisticsDto
        {
            CacheHits = _cacheHits,
            CacheMisses = _cacheMisses,
            CacheWrites = _cacheWrites,
            CacheInvalidations = _cacheInvalidations,
            TotalRequests = totalRequests,
            HitRate = hitRate,
            MissRate = 100 - hitRate,
            Timestamp = DateTime.UtcNow
        };
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    private string BuildCacheKey(string keyType, string? countyId = null)
    {
        var county = string.IsNullOrWhiteSpace(countyId) ? "system" : countyId.ToLowerInvariant();
        return $"{CACHE_PREFIX}{county}:{keyType}";
    }
}

/// <summary>
/// Cache statistics DTO for monitoring and performance analysis
/// </summary>
public class CacheStatisticsDto
{
    public long CacheHits { get; set; }
    public long CacheMisses { get; set; }
    public long CacheWrites { get; set; }
    public long CacheInvalidations { get; set; }
    public long TotalRequests { get; set; }
    public double HitRate { get; set; }
    public double MissRate { get; set; }
    public DateTime Timestamp { get; set; }
}
