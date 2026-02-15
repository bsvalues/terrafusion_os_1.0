using System.Collections.Concurrent;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Thread-safe in-memory implementation of ICacheStatisticsService.
/// Phase 8: Replaces missing implementation to unblock DI resolution
/// and provide real cache observability counters.
/// </summary>
public sealed class InMemoryCacheStatisticsService : ICacheStatisticsService
{
    private long _cacheHits;
    private long _cacheMisses;
    private long _negativeCacheHits;
    private long _missSentinelsSet;
    private long _databaseQueriesPrevented;
    private long _cacheErrors;
    private long _cacheSets;
    private long _cacheInvalidations;
    private readonly DateTime _startTime = DateTime.UtcNow;

    private readonly ConcurrentDictionary<string, KeyStatistics> _perKeyStats = new();

    public void IncrementCacheHit() => Interlocked.Increment(ref _cacheHits);

    public void IncrementCacheMiss() => Interlocked.Increment(ref _cacheMisses);

    public void IncrementNegativeCacheHit() => Interlocked.Increment(ref _negativeCacheHits);

    public void IncrementMissSentinelSet() => Interlocked.Increment(ref _missSentinelsSet);

    public void IncrementDatabaseQueryPrevented() => Interlocked.Increment(ref _databaseQueriesPrevented);

    public NegativeCacheStatistics GetStatistics()
    {
        var totalRequests = Interlocked.Read(ref _cacheHits) + Interlocked.Read(ref _cacheMisses);
        return new NegativeCacheStatistics
        {
            TotalRequests = totalRequests,
            CacheHits = Interlocked.Read(ref _cacheHits),
            CacheMisses = Interlocked.Read(ref _cacheMisses),
            NegativeCacheHits = Interlocked.Read(ref _negativeCacheHits),
            MissSentinelsSet = Interlocked.Read(ref _missSentinelsSet),
            DatabaseQueriesPrevented = Interlocked.Read(ref _databaseQueriesPrevented),
            StartTime = _startTime,
            LastReset = _startTime
        };
    }

    public Task RecordCacheHitAsync(string key, TimeSpan duration)
    {
        IncrementCacheHit();
        GetOrCreateKeyStats(key).RecordHit(duration);
        return Task.CompletedTask;
    }

    public Task RecordCacheMissAsync(string key)
    {
        IncrementCacheMiss();
        GetOrCreateKeyStats(key).RecordMiss(TimeSpan.Zero);
        return Task.CompletedTask;
    }

    public Task RecordCacheMissAsync(string key, TimeSpan duration)
    {
        IncrementCacheMiss();
        GetOrCreateKeyStats(key).RecordMiss(duration);
        return Task.CompletedTask;
    }

    public Task RecordCacheErrorAsync(Exception ex)
    {
        Interlocked.Increment(ref _cacheErrors);
        return Task.CompletedTask;
    }

    public Task RecordCacheErrorAsync(string key, string errorMessage)
    {
        Interlocked.Increment(ref _cacheErrors);
        GetOrCreateKeyStats(key).RecordError();
        return Task.CompletedTask;
    }

    public Task RecordCacheSetAsync(string key)
    {
        Interlocked.Increment(ref _cacheSets);
        return Task.CompletedTask;
    }

    public Task RecordCacheSetAsync(string key, TimeSpan duration)
    {
        Interlocked.Increment(ref _cacheSets);
        return Task.CompletedTask;
    }

    public Task RecordMissSentinelSetAsync(string key)
    {
        IncrementMissSentinelSet();
        return Task.CompletedTask;
    }

    public Task RecordMissSentinelSetAsync(string key, TimeSpan duration)
    {
        IncrementMissSentinelSet();
        return Task.CompletedTask;
    }

    public Task RecordCacheInvalidationAsync(string key)
    {
        Interlocked.Increment(ref _cacheInvalidations);
        return Task.CompletedTask;
    }

    public Task RecordNegativeCacheHitAsync(string key, TimeSpan duration)
    {
        IncrementNegativeCacheHit();
        IncrementDatabaseQueryPrevented();
        GetOrCreateKeyStats(key).RecordNegativeHit(duration);
        return Task.CompletedTask;
    }

    public Task<NegativeCacheStatistics> GetStatisticsAsync()
    {
        return Task.FromResult(GetStatistics());
    }

    public Task<NegativeCacheStatistics> GetStatisticsAsync(string key)
    {
        if (_perKeyStats.TryGetValue(key, out var keyStats))
        {
            return Task.FromResult(new NegativeCacheStatistics
            {
                TotalRequests = keyStats.Hits + keyStats.Misses,
                CacheHits = keyStats.Hits,
                CacheMisses = keyStats.Misses,
                NegativeCacheHits = keyStats.NegativeHits,
                MissSentinelsSet = 0,
                DatabaseQueriesPrevented = keyStats.NegativeHits,
                StartTime = _startTime,
                LastReset = _startTime
            });
        }

        return Task.FromResult(new NegativeCacheStatistics
        {
            StartTime = _startTime,
            LastReset = _startTime
        });
    }

    private KeyStatistics GetOrCreateKeyStats(string key) =>
        _perKeyStats.GetOrAdd(key, _ => new KeyStatistics());

    /// <summary>
    /// Per-key statistics tracker with thread-safe counters.
    /// </summary>
    private sealed class KeyStatistics
    {
        private long _hits;
        private long _misses;
        private long _negativeHits;
        private long _errors;

        public long Hits => Interlocked.Read(ref _hits);
        public long Misses => Interlocked.Read(ref _misses);
        public long NegativeHits => Interlocked.Read(ref _negativeHits);

        public void RecordHit(TimeSpan duration) => Interlocked.Increment(ref _hits);
        public void RecordMiss(TimeSpan duration) => Interlocked.Increment(ref _misses);
        public void RecordNegativeHit(TimeSpan duration) => Interlocked.Increment(ref _negativeHits);
        public void RecordError() => Interlocked.Increment(ref _errors);
    }
}
