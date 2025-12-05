using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TerraFusion.Core.Services
{
    // Fallback when Redis is not configured/available
    public class NoOpRedisCacheService : IRedisCacheService
    {
        public Task<T?> GetAsync<T>(string key) => Task.FromResult(default(T));
        public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null) => Task.CompletedTask;
        public Task<bool> ExistsAsync(string key) => Task.FromResult(false);
        public Task RemoveAsync(string key) => Task.CompletedTask;
        public Task RemoveByPatternAsync(string pattern) => Task.CompletedTask;
        public Task<Dictionary<string, T>> GetMultipleAsync<T>(IEnumerable<string> keys) => Task.FromResult(new Dictionary<string, T>());
        public Task SetMultipleAsync<T>(Dictionary<string, T> keyValuePairs, TimeSpan? expiration = null) => Task.CompletedTask;
        public Task<long> IncrementAsync(string key, long value = 1) => Task.FromResult(0L);
        public Task<double> IncrementAsync(string key, double value) => Task.FromResult(0.0);
        public Task<bool> SetIfNotExistsAsync<T>(string key, T value, TimeSpan? expiration = null) => Task.FromResult(false);
        public Task<TimeSpan?> GetTimeToLiveAsync(string key) => Task.FromResult<TimeSpan?>(null);
        public Task<long> GetListLengthAsync(string key) => Task.FromResult(0L);
        public Task AddToListAsync<T>(string key, T value) => Task.CompletedTask;
        public Task<List<T>> GetListAsync<T>(string key, long start = 0, long stop = -1) => Task.FromResult(new List<T>());
        public Task InvalidateTagAsync(string tag) => Task.CompletedTask;
        public Task<CacheStatistics> GetStatisticsAsync() => Task.FromResult(new CacheStatistics());
    }
}
