namespace TerraFusion.Core.Services.Caching;

/// <summary>
/// Fallback implementation used when Redis is not configured/available.
/// All operations are no-ops: Get returns default, Set discards, locks fail to acquire, stats are empty.
/// Allows the rest of the system to run without Redis during dev/offline/test scenarios.
/// </summary>
public sealed class NoOpAdvancedCacheService : IAdvancedCacheService
{
    // ── ICacheService ─────────────────────────────────────────────────────

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
        => Task.FromResult(default(T));

    public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
        => Task.FromResult(false);

    public Task RefreshAsync(string key, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public async Task<T> GetOrSetAsync<T>(
        string key,
        Func<Task<T>> factory,
        TimeSpan? expiration = null,
        CancellationToken cancellationToken = default)
    {
        // No cache — always invoke the factory.
        return await factory();
    }

    // ── IAdvancedCacheService ────────────────────────────────────────────

    public Task<Dictionary<string, T?>> GetManyAsync<T>(
        IEnumerable<string> keys,
        CancellationToken cancellationToken = default)
        => Task.FromResult(keys.ToDictionary(k => k, _ => default(T)));

    public Task SetManyAsync<T>(
        Dictionary<string, T> keyValuePairs,
        TimeSpan? expiration = null,
        CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<long> IncrementAsync(
        string key,
        long value = 1,
        TimeSpan? expiration = null,
        CancellationToken cancellationToken = default)
        => Task.FromResult(0L);

    public Task<long> DecrementAsync(
        string key,
        long value = 1,
        TimeSpan? expiration = null,
        CancellationToken cancellationToken = default)
        => Task.FromResult(0L);

    public Task<bool> LockAsync(
        string lockKey,
        TimeSpan expiration,
        CancellationToken cancellationToken = default)
        => Task.FromResult(false);

    public Task ReleaseLockAsync(string lockKey, CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task<CacheStatistics> GetStatisticsAsync(CancellationToken cancellationToken = default)
        => Task.FromResult(new CacheStatistics { Timestamp = DateTime.UtcNow });
}
