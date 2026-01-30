using TerraFusion.Core.Services;

namespace TerraFusion.Core.Interfaces;

public interface ICacheStatisticsService
{
    void IncrementCacheHit();
    void IncrementCacheMiss();
    void IncrementNegativeCacheHit();
    void IncrementMissSentinelSet();
    void IncrementDatabaseQueryPrevented();
    NegativeCacheStatistics GetStatistics();
    
    Task RecordCacheHitAsync(string key, TimeSpan duration);
    Task RecordCacheMissAsync(string key);
    Task RecordCacheMissAsync(string key, TimeSpan duration);
    Task RecordCacheErrorAsync(Exception ex);
    Task RecordCacheErrorAsync(string key, string errorMessage);
    Task RecordCacheSetAsync(string key);
    Task RecordCacheSetAsync(string key, TimeSpan duration);
    Task RecordMissSentinelSetAsync(string key);
    Task RecordMissSentinelSetAsync(string key, TimeSpan duration);
    Task RecordCacheInvalidationAsync(string key);
    Task RecordNegativeCacheHitAsync(string key, TimeSpan duration);
    Task<NegativeCacheStatistics> GetStatisticsAsync();
    Task<NegativeCacheStatistics> GetStatisticsAsync(string key);
}