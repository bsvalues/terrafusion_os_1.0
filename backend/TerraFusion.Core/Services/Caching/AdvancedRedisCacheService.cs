using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using System.Text.Json;

namespace TerraFusion.Core.Services.Caching;

/// <summary>
/// Advanced Redis cache service with pattern-based operations and performance monitoring
/// </summary>
public interface IAdvancedCacheService : ICacheService
{
    Task<Dictionary<string, T?>> GetManyAsync<T>(IEnumerable<string> keys, CancellationToken cancellationToken = default);
    Task SetManyAsync<T>(Dictionary<string, T> keyValuePairs, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task<long> IncrementAsync(string key, long value = 1, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task<long> DecrementAsync(string key, long value = 1, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task<bool> LockAsync(string lockKey, TimeSpan expiration, CancellationToken cancellationToken = default);
    Task ReleaseLockAsync(string lockKey, CancellationToken cancellationToken = default);
    Task<CacheStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default);
}

public class AdvancedRedisCacheService : RedisCacheService, IAdvancedCacheService
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly IDatabase _database;
    private readonly ILogger<AdvancedRedisCacheService> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    public AdvancedRedisCacheService(
        IDistributedCache distributedCache,
        IConnectionMultiplexer connectionMultiplexer,
        ILogger<AdvancedRedisCacheService> logger)
        : base(distributedCache, logger)
    {
        _connectionMultiplexer = connectionMultiplexer;
        _database = connectionMultiplexer.GetDatabase();
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };
    }

    public async Task<Dictionary<string, T?>> GetManyAsync<T>(IEnumerable<string> keys, CancellationToken cancellationToken = default)
    {
        try
        {
            var redisKeys = keys.Select(k => (RedisKey)k).ToArray();
            var values = await _database.StringGetAsync(redisKeys);
            
            var result = new Dictionary<string, T?>();
            for (int i = 0; i < redisKeys.Length; i++)
            {
                var key = redisKeys[i].ToString();
                if (values[i].HasValue)
                {
                    try
                    {
                        var jsonValue = values[i].ToString();
                        if (!string.IsNullOrEmpty(jsonValue))
                        {
                            result[key] = JsonSerializer.Deserialize<T>(jsonValue, _jsonOptions);
                        }
                        else
                        {
                            result[key] = default;
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error deserializing cache value for key: {Key}", key);
                        result[key] = default;
                    }
                }
                else
                {
                    result[key] = default;
                }
            }

            _logger.LogDebug("Retrieved {Count} keys from cache", keys.Count());
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving multiple cache values");
            return keys.ToDictionary(k => k, _ => default(T));
        }
    }

    public async Task SetManyAsync<T>(Dictionary<string, T> keyValuePairs, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var tasks = keyValuePairs.Select(async kvp =>
            {
                var serializedValue = JsonSerializer.Serialize(kvp.Value, _jsonOptions);
                var exp = expiration ?? TimeSpan.FromHours(1);
                await _database.StringSetAsync(kvp.Key, serializedValue, exp);
            });

            await Task.WhenAll(tasks);
            _logger.LogDebug("Set {Count} keys in cache", keyValuePairs.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting multiple cache values");
        }
    }

    public async Task<long> IncrementAsync(string key, long value = 1, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _database.StringIncrementAsync(key, value);
            
            if (expiration.HasValue)
            {
                await _database.KeyExpireAsync(key, expiration.Value);
            }

            _logger.LogDebug("Incremented key {Key} by {Value}, new value: {Result}", key, value, result);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing cache value for key: {Key}", key);
            return 0;
        }
    }

    public async Task<long> DecrementAsync(string key, long value = 1, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _database.StringDecrementAsync(key, value);
            
            if (expiration.HasValue)
            {
                await _database.KeyExpireAsync(key, expiration.Value);
            }

            _logger.LogDebug("Decremented key {Key} by {Value}, new value: {Result}", key, value, result);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error decrementing cache value for key: {Key}", key);
            return 0;
        }
    }

    public async Task<bool> LockAsync(string lockKey, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        try
        {
            var lockValue = Environment.MachineName + ":" + Thread.CurrentThread.ManagedThreadId;
            var acquired = await _database.StringSetAsync($"lock:{lockKey}", lockValue, expiration, When.NotExists);
            
            if (acquired)
            {
                _logger.LogDebug("Acquired lock for key: {LockKey}", lockKey);
            }
            else
            {
                _logger.LogDebug("Failed to acquire lock for key: {LockKey}", lockKey);
            }

            return acquired;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error acquiring lock for key: {LockKey}", lockKey);
            return false;
        }
    }

    public async Task ReleaseLockAsync(string lockKey, CancellationToken cancellationToken = default)
    {
        try
        {
            await _database.KeyDeleteAsync($"lock:{lockKey}");
            _logger.LogDebug("Released lock for key: {LockKey}", lockKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error releasing lock for key: {LockKey}", lockKey);
        }
    }

    public async Task<CacheStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var server = _connectionMultiplexer.GetServer(_connectionMultiplexer.GetEndPoints().First());
            var info = await server.InfoAsync("memory");
            var stats = await server.InfoAsync("stats");

            var usedMemory = ExtractInfoValue(info.SelectMany(g => g).ToArray(), "used_memory");
            var maxMemory = ExtractInfoValue(info.SelectMany(g => g).ToArray(), "maxmemory");
            var keyspaceHits = ExtractInfoValue(stats.SelectMany(g => g).ToArray(), "keyspace_hits");
            var keyspaceMisses = ExtractInfoValue(stats.SelectMany(g => g).ToArray(), "keyspace_misses");

            return new CacheStatistics
            {
                UsedMemory = long.TryParse(usedMemory, out var used) ? used : 0,
                MaxMemory = long.TryParse(maxMemory, out var max) ? max : 0,
                KeyspaceHits = long.TryParse(keyspaceHits, out var hits) ? hits : 0,
                KeyspaceMisses = long.TryParse(keyspaceMisses, out var misses) ? misses : 0,
                HitRatio = CalculateHitRatio(keyspaceHits, keyspaceMisses),
                Timestamp = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cache statistics");
            return new CacheStatistics { Timestamp = DateTime.UtcNow };
        }
    }

    private static string ExtractInfoValue(KeyValuePair<string, string>[] info, string key)
    {
        return info
            .FirstOrDefault(entry => entry.Key == key)
            .Value ?? string.Empty;
    }

    private static double CalculateHitRatio(string hits, string misses)
    {
        if (long.TryParse(hits, out var h) && long.TryParse(misses, out var m))
        {
            var total = h + m;
            return total > 0 ? (double)h / total * 100 : 0;
        }
        return 0;
    }
}

/// <summary>
/// Cache performance statistics
/// </summary>
public class CacheStatistics
{
    public long UsedMemory { get; set; }
    public long MaxMemory { get; set; }
    public long KeyspaceHits { get; set; }
    public long KeyspaceMisses { get; set; }
    public double HitRatio { get; set; }
    public DateTime Timestamp { get; set; }
    
    public double MemoryUsagePercentage => MaxMemory > 0 ? (double)UsedMemory / MaxMemory * 100 : 0;
}
