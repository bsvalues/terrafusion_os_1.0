using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Threading;
using System.Linq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using StackExchange.Redis;
using System.Text.Json;
using System.Text;

namespace TerraFusion.Core.Services
{
    public interface IRedisCacheService
    {
        Task<T> GetAsync<T>(string key);
        Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
        Task<bool> ExistsAsync(string key);
        Task RemoveAsync(string key);
        Task RemoveByPatternAsync(string pattern);
        Task<Dictionary<string, T>> GetMultipleAsync<T>(IEnumerable<string> keys);
        Task SetMultipleAsync<T>(Dictionary<string, T> keyValuePairs, TimeSpan? expiration = null);
        Task<long> IncrementAsync(string key, long value = 1);
        Task<double> IncrementAsync(string key, double value);
        Task<bool> SetIfNotExistsAsync<T>(string key, T value, TimeSpan? expiration = null);
        Task<TimeSpan?> GetTimeToLiveAsync(string key);
        Task<long> GetListLengthAsync(string key);
        Task AddToListAsync<T>(string key, T value);
        Task<List<T>> GetListAsync<T>(string key, long start = 0, long stop = -1);
        Task InvalidateTagAsync(string tag);
        Task<CacheStatistics> GetStatisticsAsync();
    }

    public class CacheStatistics
    {
        public long TotalKeys { get; set; }
        public long HitCount { get; set; }
        public long MissCount { get; set; }
        public double HitRatio => TotalRequests > 0 ? (double)HitCount / TotalRequests : 0;
        public long TotalRequests => HitCount + MissCount;
        public long MemoryUsage { get; set; }
        public int ConnectedClients { get; set; }
        public Dictionary<string, long> KeysByType { get; set; } = new Dictionary<string, long>();
    }

    public class RedisCacheService : IRedisCacheService, IDisposable
    {
        private readonly ILogger<RedisCacheService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IConnectionMultiplexer _redis;
        private readonly IDatabase _database;
        private readonly IServer _server;
        
        // Cache configuration
        private readonly string _keyPrefix;
        private readonly TimeSpan _defaultExpiration;
        private readonly bool _enableCompression;
        private readonly int _compressionThreshold;

        // Statistics tracking
        private long _hitCount = 0;
        private long _missCount = 0;

        public RedisCacheService(
            ILogger<RedisCacheService> logger,
            IConfiguration configuration,
            IConnectionMultiplexer redis)
        {
            _logger = logger;
            _configuration = configuration;
            _redis = redis;
            _database = _redis.GetDatabase();
            _server = _redis.GetServer(_redis.GetEndPoints()[0]);

            _keyPrefix = configuration["Cache:Redis:KeyPrefix"] ?? "terrafusion:";
            _defaultExpiration = TimeSpan.FromMinutes(configuration.GetValue<int>("Cache:Redis:DefaultExpirationMinutes", 30));
            _enableCompression = configuration.GetValue<bool>("Cache:Redis:EnableCompression", true);
            _compressionThreshold = configuration.GetValue<int>("Cache:Redis:CompressionThreshold", 1024);
        }

        public async Task<T> GetAsync<T>(string key)
        {
            try
            {
                var prefixedKey = GetPrefixedKey(key);
                var value = await _database.StringGetAsync(prefixedKey);
                
                if (!value.HasValue)
                {
                    Interlocked.Increment(ref _missCount);
                    _logger.LogDebug("Cache miss for key: {Key}", key);
                    return default(T)!; // By design: default value for cache misses
                }

                Interlocked.Increment(ref _hitCount);
                _logger.LogDebug("Cache hit for key: {Key}", key);

                var deserializedValue = DeserializeValue<T>(value);
                return deserializedValue;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving value from cache for key: {Key}", key);
                Interlocked.Increment(ref _missCount);
                return default(T)!; // By design: default value on error
            }
        }

        public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
        {
            try
            {
                var prefixedKey = GetPrefixedKey(key);
                var serializedValue = SerializeValue(value);
                var exp = expiration ?? _defaultExpiration;

                await _database.StringSetAsync(prefixedKey, serializedValue, exp);
                _logger.LogDebug("Cached value for key: {Key} with expiration: {Expiration}", key, exp);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting cache value for key: {Key}", key);
            }
        }

        public async Task<bool> ExistsAsync(string key)
        {
            try
            {
                var prefixedKey = GetPrefixedKey(key);
                return await _database.KeyExistsAsync(prefixedKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if key exists: {Key}", key);
                return false;
            }
        }

        public async Task RemoveAsync(string key)
        {
            try
            {
                var prefixedKey = GetPrefixedKey(key);
                await _database.KeyDeleteAsync(prefixedKey);
                _logger.LogDebug("Removed cache key: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing cache key: {Key}", key);
            }
        }

        public async Task RemoveByPatternAsync(string pattern)
        {
            try
            {
                var prefixedPattern = GetPrefixedKey(pattern);
                var keys = _server.Keys(pattern: prefixedPattern);
                
                var keyArray = keys.ToArray();
                if (keyArray.Length > 0)
                {
                    await _database.KeyDeleteAsync(keyArray);
                    _logger.LogInformation("Removed {Count} cache keys matching pattern: {Pattern}", keyArray.Length, pattern);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing cache keys by pattern: {Pattern}", pattern);
            }
        }

        public async Task<Dictionary<string, T>> GetMultipleAsync<T>(IEnumerable<string> keys)
        {
            try
            {
                var prefixedKeys = keys.Select(GetPrefixedKey).Select(k => (RedisKey)k).ToArray();
                var values = await _database.StringGetAsync(prefixedKeys);
                
                var result = new Dictionary<string, T>();
                var keyArray = keys.ToArray();
                
                for (int i = 0; i < values.Length; i++)
                {
                    if (values[i].HasValue)
                    {
                        var deserializedValue = DeserializeValue<T>(values[i]);
                        result[keyArray[i]] = deserializedValue;
                        Interlocked.Increment(ref _hitCount);
                    }
                    else
                    {
                        Interlocked.Increment(ref _missCount);
                    }
                }

                _logger.LogDebug("Retrieved {HitCount} of {TotalCount} keys from cache", result.Count, keyArray.Length);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving multiple values from cache");
                return new Dictionary<string, T>();
            }
        }

        public async Task SetMultipleAsync<T>(Dictionary<string, T> keyValuePairs, TimeSpan? expiration = null)
        {
            try
            {
                var exp = expiration ?? _defaultExpiration;
                var batch = _database.CreateBatch();
                var tasks = new List<Task>();

                foreach (var kvp in keyValuePairs)
                {
                    var prefixedKey = GetPrefixedKey(kvp.Key);
                    var serializedValue = SerializeValue(kvp.Value);
                    tasks.Add(batch.StringSetAsync(prefixedKey, serializedValue, exp));
                }

                batch.Execute();
                await Task.WhenAll(tasks);
                
                _logger.LogDebug("Cached {Count} key-value pairs with expiration: {Expiration}", keyValuePairs.Count, exp);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting multiple cache values");
            }
        }

        public async Task<long> IncrementAsync(string key, long value = 1)
        {
            try
            {
                var prefixedKey = GetPrefixedKey(key);
                var result = await _database.StringIncrementAsync(prefixedKey, value);
                _logger.LogDebug("Incremented key {Key} by {Value}, new value: {Result}", key, value, result);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing cache key: {Key}", key);
                return 0;
            }
        }

        public async Task<double> IncrementAsync(string key, double value)
        {
            try
            {
                var prefixedKey = GetPrefixedKey(key);
                var result = await _database.StringIncrementAsync(prefixedKey, value);
                _logger.LogDebug("Incremented key {Key} by {Value}, new value: {Result}", key, value, result);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error incrementing cache key: {Key}", key);
                return 0;
            }
        }

        public async Task<bool> SetIfNotExistsAsync<T>(string key, T value, TimeSpan? expiration = null)
        {
            try
            {
                var prefixedKey = GetPrefixedKey(key);
                var serializedValue = SerializeValue(value);
                var exp = expiration ?? _defaultExpiration;

                var result = await _database.StringSetAsync(prefixedKey, serializedValue, exp, When.NotExists);
                
                if (result)
                {
                    _logger.LogDebug("Set cache value for new key: {Key}", key);
                }
                else
                {
                    _logger.LogDebug("Key already exists, not setting: {Key}", key);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting cache value if not exists for key: {Key}", key);
                return false;
            }
        }

        public async Task<TimeSpan?> GetTimeToLiveAsync(string key)
        {
            try
            {
                var prefixedKey = GetPrefixedKey(key);
                return await _database.KeyTimeToLiveAsync(prefixedKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting TTL for key: {Key}", key);
                return null;
            }
        }

        public async Task<long> GetListLengthAsync(string key)
        {
            try
            {
                var prefixedKey = GetPrefixedKey(key);
                return await _database.ListLengthAsync(prefixedKey);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting list length for key: {Key}", key);
                return 0;
            }
        }

        public async Task AddToListAsync<T>(string key, T value)
        {
            try
            {
                var prefixedKey = GetPrefixedKey(key);
                var serializedValue = SerializeValue(value);
                await _database.ListRightPushAsync(prefixedKey, serializedValue);
                _logger.LogDebug("Added value to list: {Key}", key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding value to list: {Key}", key);
            }
        }

        public async Task<List<T>> GetListAsync<T>(string key, long start = 0, long stop = -1)
        {
            try
            {
                var prefixedKey = GetPrefixedKey(key);
                var values = await _database.ListRangeAsync(prefixedKey, start, stop);
                
                var result = new List<T>();
                foreach (var value in values)
                {
                    if (value.HasValue)
                    {
                        result.Add(DeserializeValue<T>(value));
                    }
                }

                _logger.LogDebug("Retrieved {Count} items from list: {Key}", result.Count, key);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting list values for key: {Key}", key);
                return new List<T>();
            }
        }

        public async Task InvalidateTagAsync(string tag)
        {
            try
            {
                var pattern = $"{_keyPrefix}tag:{tag}:*";
                await RemoveByPatternAsync(pattern);
                _logger.LogInformation("Invalidated cache entries with tag: {Tag}", tag);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error invalidating cache tag: {Tag}", tag);
            }
        }

        public async Task<CacheStatistics> GetStatisticsAsync()
        {
            try
            {
                var info = await _server.InfoAsync();
                var keyspaceInfo = info.FirstOrDefault(x => x.Key == "Keyspace");
                
                var stats = new CacheStatistics
                {
                    HitCount = _hitCount,
                    MissCount = _missCount,
                };

                // Connected clients parsing without null-conditionals on KeyValuePair
                string? connectedClientsStr = null;
                foreach (var section in info)
                {
                    if (section.Key == "Clients")
                    {
                        foreach (var pair in section)
                        {
                            if (pair.Key == "connected_clients")
                            {
                                connectedClientsStr = pair.Value;
                                break;
                            }
                        }
                        break;
                    }
                }
                if (int.TryParse(connectedClientsStr, out var connectedClients))
                {
                    stats.ConnectedClients = connectedClients;
                }

                // Parse keyspace information
                if (keyspaceInfo != null)
                {
                    foreach (var dbInfo in keyspaceInfo)
                    {
                        if (dbInfo.Key.StartsWith("db"))
                        {
                            var dbStats = dbInfo.Value.Split(',');
                            foreach (var stat in dbStats)
                            {
                                var parts = stat.Split('=');
                                if (parts.Length == 2 && parts[0] == "keys")
                                {
                                    if (long.TryParse(parts[1], out var keyCount))
                                    {
                                        stats.TotalKeys += keyCount;
                                    }
                                }
                            }
                        }
                    }
                }

                // Get memory usage without null-comparing KeyValuePair
                foreach (var section in info)
                {
                    if (section.Key == "Memory")
                    {
                        foreach (var pair in section)
                        {
                            if (pair.Key == "used_memory" && long.TryParse(pair.Value, out var memUsage))
                            {
                                stats.MemoryUsage = memUsage;
                                break;
                            }
                        }
                        break;
                    }
                }

                return stats;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cache statistics");
                return new CacheStatistics
                {
                    HitCount = _hitCount,
                    MissCount = _missCount
                };
            }
        }

        private string GetPrefixedKey(string key)
        {
            return $"{_keyPrefix}{key}";
        }

        private string? SerializeValue<T>(T value)
        {
            if (value == null) return null;
            
            var json = JsonSerializer.Serialize(value);
            
            // Apply compression if enabled and value exceeds threshold
            if (_enableCompression && json.Length > _compressionThreshold)
            {
                var bytes = Encoding.UTF8.GetBytes(json);
                using var input = new MemoryStream(bytes);
                using var output = new MemoryStream();
                using (var gzip = new System.IO.Compression.GZipStream(output, System.IO.Compression.CompressionMode.Compress, true))
                {
                    input.CopyTo(gzip);
                }
                var compressed = output.ToArray();
                return Convert.ToBase64String(compressed);
            }
            
            return json;
        }

        private T DeserializeValue<T>(string? value)
        {
            if (string.IsNullOrEmpty(value)) return default(T)!; // By design: default for null values
            
            try
            {
                // Check if value is compressed (base64 encoded)
                if (_enableCompression && IsBase64String(value))
                {
                    var compressedBytes = Convert.FromBase64String(value);
                    using var compressedStream = new MemoryStream(compressedBytes);
                    using var gzipStream = new System.IO.Compression.GZipStream(compressedStream, System.IO.Compression.CompressionMode.Decompress);
                    using var decompressedStream = new MemoryStream();
                    
                    gzipStream.CopyTo(decompressedStream);
                    var decompressedJson = Encoding.UTF8.GetString(decompressedStream.ToArray());
                    return JsonSerializer.Deserialize<T>(decompressedJson) ?? default(T)!;
                }
                
                return JsonSerializer.Deserialize<T>(value) ?? default(T)!;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deserializing cache value");
                return default(T)!; // By design: default on deserialization error
            }
        }

        private static bool IsBase64String(string value)
        {
            try
            {
                Convert.FromBase64String(value);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public void Dispose()
        {
            _redis?.Dispose();
        }
    }
}
