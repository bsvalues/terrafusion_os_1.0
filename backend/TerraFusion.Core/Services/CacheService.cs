using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Text.Json;
using System.Collections.Concurrent;

namespace TerraFusion.Core.Services;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
    Task RemoveByPatternAsync(string pattern);
    Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> getItem, TimeSpan? expiration = null);
    Task InvalidateTagAsync(string tag);
    Task SetWithTagAsync<T>(string key, T value, string[] tags, TimeSpan? expiration = null);
    void ClearMemoryCache();
    Task<bool> ExistsAsync(string key);
    Task<long> IncrementAsync(string key, long value = 1, TimeSpan? expiration = null);
}

public class OptimizedCacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly IDatabase? _redisDatabase;
    private readonly ILogger<OptimizedCacheService> _logger;
    private readonly CacheConfiguration _configuration;
    private readonly ConcurrentDictionary<string, HashSet<string>> _tagMapping;
    private readonly SemaphoreSlim _semaphore;

    public OptimizedCacheService(
        IMemoryCache memoryCache,
        IDistributedCache distributedCache,
        IConnectionMultiplexer? redis,
        ILogger<OptimizedCacheService> logger,
        IConfiguration configuration)
    {
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        _redisDatabase = redis?.GetDatabase();
        _logger = logger;
        _configuration = configuration.GetSection("Cache").Get<CacheConfiguration>() ?? new CacheConfiguration();
        _tagMapping = new ConcurrentDictionary<string, HashSet<string>>();
        _semaphore = new SemaphoreSlim(10, 10); // Limit concurrent operations
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        if (string.IsNullOrEmpty(key))
            return default;

        var startTime = DateTime.UtcNow;

        try
        {
            // Level 1: Memory Cache (Ultra-fast - Nanosecond access)
            if (_memoryCache.TryGetValue(key, out T? memoryCachedItem))
            {
                LogCacheHit("Memory", key, startTime);
                return memoryCachedItem;
            }

            // Level 2: Distributed Cache (Redis - Microsecond access)
            var cachedValue = await _distributedCache.GetStringAsync(key);
            if (cachedValue != null)
            {
                var deserializedValue = JsonSerializer.Deserialize<T>(cachedValue);
                
                // Populate memory cache for next access
                if (deserializedValue != null)
                {
                    _memoryCache.Set(key, deserializedValue, TimeSpan.FromMinutes(_configuration.MemoryCacheExpirationMinutes));
                }

                LogCacheHit("Distributed", key, startTime);
                return deserializedValue;
            }

            LogCacheMiss(key, startTime);
            return default;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving from cache: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        if (string.IsNullOrEmpty(key) || value == null)
            return;

        await _semaphore.WaitAsync();

        try
        {
            var defaultExpiration = TimeSpan.FromMinutes(_configuration.DefaultExpirationMinutes);
            var cacheExpiration = expiration ?? defaultExpiration;

            // Set in memory cache (Level 1)
            var memoryExpiration = TimeSpan.FromMinutes(Math.Min(
                _configuration.MemoryCacheExpirationMinutes, 
                cacheExpiration.TotalMinutes));
            
            _memoryCache.Set(key, value, memoryExpiration);

            // Set in distributed cache (Level 2)
            var serializedValue = JsonSerializer.Serialize(value, new JsonSerializerOptions
            {
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            });

            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = cacheExpiration
            };

            await _distributedCache.SetStringAsync(key, serializedValue, options);

            _logger.LogDebug("Cache set: {Key} with expiration {Expiration}", key, cacheExpiration);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cache: {Key}", key);
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task RemoveAsync(string key)
    {
        if (string.IsNullOrEmpty(key))
            return;

        try
        {
            // Remove from memory cache
            _memoryCache.Remove(key);

            // Remove from distributed cache
            await _distributedCache.RemoveAsync(key);

            _logger.LogDebug("Cache removed: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing from cache: {Key}", key);
        }
    }

    public async Task RemoveByPatternAsync(string pattern)
    {
        if (string.IsNullOrEmpty(pattern))
            return;

        try
        {
            if (_redisDatabase != null)
            {
                // Use Redis pattern-based deletion
                var server = ((IConnectionMultiplexer)_redisDatabase.Multiplexer).GetServer(
                    _redisDatabase.Multiplexer.GetEndPoints().First());
                
                var keys = server.Keys(pattern: pattern);
                
                foreach (var key in keys)
                {
                    await _redisDatabase.KeyDeleteAsync(key);
                    
                    // Also remove from memory cache if exists
                    _memoryCache.Remove(key.ToString());
                }

                _logger.LogDebug("Cache pattern removed: {Pattern}", pattern);
            }
            else
            {
                _logger.LogWarning("Pattern-based cache removal requires Redis connection");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache pattern: {Pattern}", pattern);
        }
    }

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> getItem, TimeSpan? expiration = null)
    {
        // Try to get from cache first
        var cachedItem = await GetAsync<T>(key);
        if (cachedItem != null)
        {
            return cachedItem;
        }

        // Use semaphore to prevent cache stampede
        await _semaphore.WaitAsync();

        try
        {
            // Double-check pattern
            cachedItem = await GetAsync<T>(key);
            if (cachedItem != null)
            {
                return cachedItem;
            }

            // Get fresh data and cache it
            var freshItem = await getItem();
            if (freshItem != null)
            {
                await SetAsync(key, freshItem, expiration);
            }

            return freshItem;
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task SetWithTagAsync<T>(string key, T value, string[] tags, TimeSpan? expiration = null)
    {
        await SetAsync(key, value, expiration);

        // Maintain tag-to-key mappings
        foreach (var tag in tags)
        {
            _tagMapping.AddOrUpdate(tag, 
                new HashSet<string> { key }, 
                (tagKey, existingKeys) =>
                {
                    existingKeys.Add(key);
                    return existingKeys;
                });
        }

        _logger.LogDebug("Cache set with tags: {Key} -> {Tags}", key, string.Join(", ", tags));
    }

    public async Task InvalidateTagAsync(string tag)
    {
        if (_tagMapping.TryGetValue(tag, out var keys))
        {
            var tasks = keys.Select(key => RemoveAsync(key));
            await Task.WhenAll(tasks);

            _tagMapping.TryRemove(tag, out _);

            _logger.LogInformation("Invalidated cache tag: {Tag} ({KeyCount} keys)", tag, keys.Count);
        }
    }

    public void ClearMemoryCache()
    {
        try
        {
            if (_memoryCache is MemoryCache mc)
            {
                mc.Compact(1.0); // Remove all entries
            }

            _logger.LogInformation("Memory cache cleared");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing memory cache");
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        if (string.IsNullOrEmpty(key))
            return false;

        try
        {
            // Check memory cache first
            if (_memoryCache.TryGetValue(key, out _))
            {
                return true;
            }

            // Check distributed cache
            if (_redisDatabase != null)
            {
                return await _redisDatabase.KeyExistsAsync(key);
            }

            // Fallback to string check
            var value = await _distributedCache.GetStringAsync(key);
            return value != null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking cache existence: {Key}", key);
            return false;
        }
    }

    public async Task<long> IncrementAsync(string key, long value = 1, TimeSpan? expiration = null)
    {
        try
        {
            if (_redisDatabase != null)
            {
                var result = await _redisDatabase.StringIncrementAsync(key, value);
                
                if (expiration.HasValue)
                {
                    await _redisDatabase.KeyExpireAsync(key, expiration.Value);
                }

                return result;
            }

            // Fallback implementation for non-Redis scenarios
            var currentValue = await GetAsync<long?>(key.ToString()) ?? 0;
            var newValue = currentValue + value;
            await SetAsync(key, newValue, expiration);
            return newValue;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing cache value: {Key}", key);
            return 0;
        }
    }

    private void LogCacheHit(string cacheType, string key, DateTime startTime)
    {
        var duration = DateTime.UtcNow - startTime;
        _logger.LogDebug("Cache HIT ({CacheType}): {Key} in {Duration}ms", 
            cacheType, key, duration.TotalMilliseconds);
    }

    private void LogCacheMiss(string key, DateTime startTime)
    {
        var duration = DateTime.UtcNow - startTime;
        _logger.LogDebug("Cache MISS: {Key} in {Duration}ms", key, duration.TotalMilliseconds);
    }
}

// Government-specific cache service with additional compliance features
public class GovernmentCacheService : OptimizedCacheService
{
    private readonly ILogger<GovernmentCacheService> _govLogger;
    private readonly IAuditService _auditService;

    public GovernmentCacheService(
        IMemoryCache memoryCache,
        IDistributedCache distributedCache,
        IConnectionMultiplexer redis,
        ILogger<GovernmentCacheService> logger,
        IConfiguration configuration,
        IAuditService auditService) 
        : base(memoryCache, distributedCache, redis, logger, configuration)
    {
        _govLogger = logger;
        _auditService = auditService;
    }

    public async Task<T?> GetSensitiveDataAsync<T>(string key, string userId)
    {
        // Audit access to sensitive data
        await _auditService.LogDataAccessAsync("CacheAccess", key, userId);
        
        return await base.GetAsync<T>(key);
    }

    public async Task SetSensitiveDataAsync<T>(string key, T value, string userId, TimeSpan? expiration = null)
    {
        // Audit sensitive data caching
        await _auditService.LogDataModificationAsync("CacheSet", key, userId);
        
        // Use shorter expiration for sensitive data
        var sensitiveExpiration = expiration ?? TimeSpan.FromMinutes(15);
        
        await base.SetAsync(key, value, sensitiveExpiration);
    }

    public async Task InvalidateSensitiveDataAsync(string pattern, string reason, string userId)
    {
        // Audit sensitive data invalidation
        await _auditService.LogDataModificationAsync("CacheInvalidation", pattern, userId, reason);
        
        await base.RemoveByPatternAsync(pattern);
        
        _govLogger.LogWarning("Sensitive cache data invalidated: Pattern={Pattern}, Reason={Reason}, User={UserId}", 
            pattern, reason, userId);
    }
}

public interface IAuditService
{
    Task LogDataAccessAsync(string action, string resource, string userId);
    Task LogDataModificationAsync(string action, string resource, string userId, string? reason = null);
}

public class CacheConfiguration
{
    public int DefaultExpirationMinutes { get; set; } = 30;
    public int MemoryCacheExpirationMinutes { get; set; } = 10;
    public bool EnableCompression { get; set; } = true;
    public bool EnablePatternInvalidation { get; set; } = true;
    public int MaxMemoryCacheSizeMB { get; set; } = 512;
    public int RedisDatabase { get; set; } = 0;
    public string RedisKeyPrefix { get; set; } = "terrafusion:";
}

// Cache key builders for consistency
public static class CacheKeys
{
    public const string PropertyPrefix = "property";
    public const string CountyPrefix = "county";
    public const string AssessmentPrefix = "assessment";
    public const string UserPrefix = "user";
    public const string StatisticsPrefix = "stats";

    public static string Property(Guid id) => $"{PropertyPrefix}:{id}";
    public static string PropertyByParcel(Guid countyId, string parcelId) => $"{PropertyPrefix}:parcel:{countyId}:{parcelId}";
    public static string CountyProperties(Guid countyId, int page, int pageSize) => $"{PropertyPrefix}:county:{countyId}:page:{page}:size:{pageSize}";
    public static string CountyStatistics(Guid countyId) => $"{StatisticsPrefix}:county:{countyId}";
    public static string Assessment(Guid propertyId, int year) => $"{AssessmentPrefix}:{propertyId}:{year}";
    public static string UserSession(string sessionId) => $"{UserPrefix}:session:{sessionId}";
    public static string PropertySearch(string searchHash) => $"{PropertyPrefix}:search:{searchHash}";
    
    // Cache tags for invalidation
    public static class Tags
    {
        public static string County(Guid countyId) => $"county:{countyId}";
        public static string Property(Guid propertyId) => $"property:{propertyId}";
        public static string Assessment(int year) => $"assessment:{year}";
        public static string User(string userId) => $"user:{userId}";
    }
}