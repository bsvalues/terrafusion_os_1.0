using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace PACSIntegration.Services
{
    public class TenantAnalyticsService : ITenantAnalyticsService
    {
        private readonly DatabaseContext _context;
        private readonly ILogger<TenantAnalyticsService> _logger;
        private readonly IDistributedCache _cache;

        public TenantAnalyticsService(
            DatabaseContext context,
            ILogger<TenantAnalyticsService> logger,
            IDistributedCache cache)
        {
            _context = context;
            _logger = logger;
            _cache = cache;
        }

        public async Task<TenantAnalytics> GetAnalyticsAsync(
            int tenantId,
            DateTime? startDate = null,
            DateTime? endDate = null)
        {
            try
            {
                startDate ??= DateTime.UtcNow.AddDays(-30);
                endDate ??= DateTime.UtcNow;

                var cacheKey = $"analytics:{tenantId}:{startDate:yyyyMMdd}:{endDate:yyyyMMdd}";
                var cachedAnalytics = await _cache.GetAsync<TenantAnalytics>(cacheKey);
                if (cachedAnalytics != null)
                    return cachedAnalytics;

                var analytics = new TenantAnalytics
                {
                    TenantId = tenantId,
                    StartDate = startDate.Value,
                    EndDate = endDate.Value,
                    
                    // File Processing Stats
                    FileImports = await GetFileImportStats(tenantId, startDate.Value, endDate.Value),
                    
                    // API Usage Stats
                    ApiUsage = await GetApiUsageStats(tenantId, startDate.Value, endDate.Value),
                    
                    // Property Stats
                    PropertyStats = await GetPropertyStats(tenantId),
                    
                    // Permit Stats
                    PermitStats = await GetPermitStats(tenantId, startDate.Value, endDate.Value),
                    
                    // Storage Usage
                    StorageUsage = await GetStorageUsage(tenantId)
                };

                await _cache.SetAsync(
                    cacheKey,
                    analytics,
                    TimeSpan.FromMinutes(15)
                );

                return analytics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting analytics for tenant {TenantId}", tenantId);
                throw;
            }
        }

        private async Task<FileImportStats> GetFileImportStats(
            int tenantId,
            DateTime startDate,
            DateTime endDate)
        {
            var imports = await _context.ImportLogs
                .Where(i => i.TenantID == tenantId &&
                           i.ImportedAt >= startDate &&
                           i.ImportedAt <= endDate)
                .ToListAsync();

            return new FileImportStats
            {
                TotalImports = imports.Count,
                SuccessfulImports = imports.Count(i => i.ErrorRows == 0),
                FailedImports = imports.Count(i => i.ErrorRows > 0),
                TotalRowsProcessed = imports.Sum(i => i.TotalRows),
                ErrorRows = imports.Sum(i => i.ErrorRows),
                AverageProcessingTime = imports.Any() 
                    ? TimeSpan.FromMilliseconds(imports.Average(i => i.ProcessingTimeMs))
                    : TimeSpan.Zero
            };
        }

        private async Task<ApiUsageStats> GetApiUsageStats(
            int tenantId,
            DateTime startDate,
            DateTime endDate)
        {
            var apiLogs = await _context.ApiLogs
                .Where(l => l.TenantID == tenantId &&
                           l.Timestamp >= startDate &&
                           l.Timestamp <= endDate)
                .ToListAsync();

            return new ApiUsageStats
            {
                TotalRequests = apiLogs.Count,
                SuccessfulRequests = apiLogs.Count(l => l.StatusCode >= 200 && l.StatusCode < 300),
                FailedRequests = apiLogs.Count(l => l.StatusCode >= 400),
                AverageResponseTime = apiLogs.Any()
                    ? TimeSpan.FromMilliseconds(apiLogs.Average(l => l.ResponseTimeMs))
                    : TimeSpan.Zero,
                EndpointUsage = apiLogs
                    .GroupBy(l => l.Endpoint)
                    .Select(g => new EndpointUsage
                    {
                        Endpoint = g.Key,
                        RequestCount = g.Count(),
                        AverageResponseTime = TimeSpan.FromMilliseconds(g.Average(l => l.ResponseTimeMs))
                    })
                    .ToList()
            };
        }

        private async Task<PropertyStats> GetPropertyStats(int tenantId)
        {
            var properties = await _context.Properties
                .Where(p => p.TenantID == tenantId)
                .ToListAsync();

            return new PropertyStats
            {
                TotalProperties = properties.Count,
                TotalValue = properties.Sum(p => p.AppraisedValue),
                AverageValue = properties.Any()
                    ? properties.Average(p => p.AppraisedValue)
                    : 0,
                PropertiesWithPermits = await _context.Properties
                    .Where(p => p.TenantID == tenantId &&
                               _context.BuildingPermits.Any(bp => bp.PropertyID == p.PropertyID))
                    .CountAsync()
            };
        }

        private async Task<PermitStats> GetPermitStats(
            int tenantId,
            DateTime startDate,
            DateTime endDate)
        {
            var permits = await _context.BuildingPermits
                .Where(bp => bp.TenantID == tenantId &&
                            bp.IssueDate >= startDate &&
                            bp.IssueDate <= endDate)
                .ToListAsync();

            return new PermitStats
            {
                TotalPermits = permits.Count,
                ActivePermits = permits.Count(p => p.Status == "Active"),
                ExpiredPermits = permits.Count(p => p.Status == "Expired"),
                AverageProcessingTime = permits
                    .Where(p => p.CompletedAt.HasValue)
                    .Average(p => (p.CompletedAt.Value - p.CreatedAt).TotalDays),
                TotalValue = permits.Sum(p => p.EstimatedValue)
            };
        }

        private async Task<StorageUsage> GetStorageUsage(int tenantId)
        {
            var usage = await _context.ImportLogs
                .Where(i => i.TenantID == tenantId)
                .SumAsync(i => i.FileSizeBytes);

            return new StorageUsage
            {
                TotalStorageBytes = usage,
                StorageLimit = GetStorageLimitForTenant(tenantId),
                UsagePercentage = (double)usage / GetStorageLimitForTenant(tenantId) * 100
            };
        }

        private long GetStorageLimitForTenant(int tenantId)
        {
            // Get tenant's plan and return appropriate storage limit
            return 10L * 1024 * 1024 * 1024; // 10GB default
        }
    }

    public static class DistributedCacheExtensions
    {
        public static async Task<T> GetAsync<T>(
            this IDistributedCache cache,
            string key) where T : class
        {
            var value = await cache.GetStringAsync(key);
            return value == null ? null : JsonSerializer.Deserialize<T>(value);
        }

        public static async Task SetAsync<T>(
            this IDistributedCache cache,
            string key,
            T value,
            TimeSpan expiration) where T : class
        {
            var json = JsonSerializer.Serialize(value);
            await cache.SetStringAsync(
                key,
                json,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = expiration
                }
            );
        }
    }
}
