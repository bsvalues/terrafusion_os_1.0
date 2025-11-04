using Microsoft.Extensions.Caching.Distributed;
using System.Threading.RateLimiting;

namespace PACSIntegration.Infrastructure.RateLimiting
{
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RateLimitingMiddleware> _logger;
        private readonly IDistributedCache _cache;
        private readonly TokenBucketRateLimiter _rateLimiter;

        public RateLimitingMiddleware(
            RequestDelegate next,
            ILogger<RateLimitingMiddleware> logger,
            IDistributedCache cache)
        {
            _next = next;
            _logger = logger;
            _cache = cache;
            
            // Configure token bucket rate limiter
            var options = new TokenBucketRateLimiterOptions
            {
                TokenLimit = 100,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                ReplenishmentPeriod = TimeSpan.FromSeconds(1),
                TokensPerPeriod = 10,
                AutoReplenishment = true
            };
            
            _rateLimiter = new TokenBucketRateLimiter(options);
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var tenantId = context.Items["TenantID"] as int?;
            if (!tenantId.HasValue)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Unauthorized: Missing tenant ID");
                return;
            }

            var plan = await GetTenantPlan(tenantId.Value);
            var (limit, window) = GetRateLimits(plan);
            var key = $"ratelimit:{tenantId}:{DateTime.UtcNow.ToString("yyyyMMddHH")}";

            try
            {
                var currentCount = await _cache.GetAsync<int>(key);
                if (currentCount >= limit)
                {
                    var retryAfter = await CalculateRetryAfter(window);
                    context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                    context.Response.Headers.Add("Retry-After", retryAfter.ToString());
                    await context.Response.WriteAsync("Rate limit exceeded. Please try again later.");
                    return;
                }

                using var lease = await _rateLimiter.AcquireAsync();
                if (!lease.IsAcquired)
                {
                    context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                    await context.Response.WriteAsync("Too many requests. Please try again later.");
                    return;
                }

                await IncrementCounter(key, window);
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in rate limiting middleware for tenant {TenantId}", tenantId);
                throw;
            }
        }

        private async Task<string> GetTenantPlan(int tenantId)
        {
            var cacheKey = $"tenant:plan:{tenantId}";
            var plan = await _cache.GetStringAsync(cacheKey);
            
            if (string.IsNullOrEmpty(plan))
            {
                using var scope = new ServiceScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<DatabaseContext>();
                var tenant = await dbContext.Tenants
                    .Include(t => t.BillingInfo)
                    .FirstOrDefaultAsync(t => t.TenantID == tenantId);

                plan = tenant?.BillingInfo?.Plan ?? "basic";
                await _cache.SetStringAsync(cacheKey, plan, new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
                });
            }

            return plan;
        }

        private (int Limit, TimeSpan Window) GetRateLimits(string plan)
        {
            return plan.ToLower() switch
            {
                "enterprise" => (10000, TimeSpan.FromHours(1)),
                "professional" => (5000, TimeSpan.FromHours(1)),
                _ => (1000, TimeSpan.FromHours(1))
            };
        }

        private async Task<int> CalculateRetryAfter(TimeSpan window)
        {
            return (int)window.TotalSeconds;
        }

        private async Task IncrementCounter(string key, TimeSpan window)
        {
            await _cache.IncrementCounterAsync(key, 1, window);
        }
    }

    public static class DistributedCacheExtensions
    {
        public static async Task<T> GetAsync<T>(this IDistributedCache cache, string key)
        {
            var value = await cache.GetStringAsync(key);
            return value == null ? default : JsonSerializer.Deserialize<T>(value);
        }

        public static async Task IncrementCounterAsync(
            this IDistributedCache cache,
            string key,
            int increment,
            TimeSpan expiry)
        {
            var value = await cache.GetStringAsync(key);
            var count = value == null ? 0 : int.Parse(value);
            count += increment;

            await cache.SetStringAsync(
                key,
                count.ToString(),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = expiry }
            );
        }
    }
}
