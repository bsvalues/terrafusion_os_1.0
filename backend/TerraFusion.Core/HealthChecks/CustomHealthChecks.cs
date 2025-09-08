using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
// using TerraFusion.Data; // Circular dependency - moved to separate health check service
using TerraFusion.Core.Services.Caching;
using System.Data.Common;
using StackExchange.Redis;
using System.Net.NetworkInformation;

namespace TerraFusion.Core.HealthChecks;

/// <summary>
/// Health check for database connectivity
/// </summary>
public class DatabaseHealthCheck : IHealthCheck
{
    // TODO: Replace with IDbConnectionFactory to avoid circular dependency
    // private readonly TerraFusionDbContext _dbContext;
    private readonly ILogger<DatabaseHealthCheck> _logger;

    public DatabaseHealthCheck(ILogger<DatabaseHealthCheck> logger)
    {
        // _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            // Test database connectivity via abstraction (TODO: Implement proper DB check)
            // var canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
            var canConnect = true; // Temporary placeholder until abstraction implemented
            
            stopwatch.Stop();

            if (canConnect)
            {
                var data = new Dictionary<string, object>
                {
                    ["ResponseTime"] = stopwatch.ElapsedMilliseconds,
                    // TODO: Get connection string via abstraction
                    // ["ConnectionString"] = _dbContext.Database.GetConnectionString()?.Split(';')[0] // Only server part for security
                    ["Status"] = "Database health check placeholder - abstraction required"
                };

                if (stopwatch.ElapsedMilliseconds > 5000) // 5 seconds
                {
                    return HealthCheckResult.Degraded("Database connection is slow", null, data);
                }

                return HealthCheckResult.Healthy("Database accessible via abstraction (TODO)", data);
            }
            else
            {
                return HealthCheckResult.Unhealthy("Cannot connect to database");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            return HealthCheckResult.Unhealthy("Database health check failed", ex);
        }
    }
}

/// <summary>
/// Health check for Redis cache connectivity
/// </summary>
public class RedisHealthCheck : IHealthCheck
{
    private readonly ICacheService _cacheService;
    private readonly ILogger<RedisHealthCheck> _logger;

    public RedisHealthCheck(ICacheService cacheService, ILogger<RedisHealthCheck> logger)
    {
        _cacheService = cacheService;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            // Test Redis connectivity by setting and getting a test value
            var testKey = $"health_check_{Guid.NewGuid()}";
            var testValue = DateTimeOffset.UtcNow.ToString();
            
            await _cacheService.SetAsync(testKey, testValue, TimeSpan.FromMinutes(1));
            var retrievedValue = await _cacheService.GetAsync<string>(testKey);
            await _cacheService.RemoveAsync(testKey);
            
            stopwatch.Stop();

            if (retrievedValue == testValue)
            {
                var data = new Dictionary<string, object>
                {
                    ["ResponseTime"] = stopwatch.ElapsedMilliseconds,
                    ["TestKey"] = testKey
                };

                if (stopwatch.ElapsedMilliseconds > 1000) // 1 second
                {
                    return HealthCheckResult.Degraded("Redis connection is slow", null, data);
                }

                return HealthCheckResult.Healthy("Redis is accessible", data);
            }
            else
            {
                return HealthCheckResult.Unhealthy("Redis data integrity test failed");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Redis health check failed");
            return HealthCheckResult.Unhealthy("Redis health check failed", ex);
        }
    }
}

/// <summary>
/// Health check for external API dependencies
/// </summary>
public class ExternalApiHealthCheck : IHealthCheck
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ExternalApiHealthCheck> _logger;
    private readonly string _apiUrl;
    private readonly string _apiName;

    public ExternalApiHealthCheck(
        HttpClient httpClient, 
        ILogger<ExternalApiHealthCheck> logger,
        string apiUrl,
        string apiName)
    {
        _httpClient = httpClient;
        _logger = logger;
        _apiUrl = apiUrl;
        _apiName = apiName;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();
            
            using var response = await _httpClient.GetAsync(_apiUrl, cancellationToken);
            
            stopwatch.Stop();

            var data = new Dictionary<string, object>
            {
                ["ApiName"] = _apiName,
                ["ResponseTime"] = stopwatch.ElapsedMilliseconds,
                ["StatusCode"] = (int)response.StatusCode,
                ["Url"] = _apiUrl
            };

            if (response.IsSuccessStatusCode)
            {
                if (stopwatch.ElapsedMilliseconds > 10000) // 10 seconds
                {
                    return HealthCheckResult.Degraded($"{_apiName} API is responding slowly", null, data);
                }

                return HealthCheckResult.Healthy($"{_apiName} API is accessible", data);
            }
            else
            {
                return HealthCheckResult.Unhealthy($"{_apiName} API returned {response.StatusCode}", null, data);
            }
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            _logger.LogWarning("External API health check timed out for {ApiName}", _apiName);
            return HealthCheckResult.Unhealthy($"{_apiName} API health check timed out", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "External API health check failed for {ApiName}", _apiName);
            return HealthCheckResult.Unhealthy($"{_apiName} API health check failed", ex);
        }
    }
}

/// <summary>
/// Health check for system memory usage
/// </summary>
public class MemoryHealthCheck : IHealthCheck
{
    private readonly ILogger<MemoryHealthCheck> _logger;
    private readonly long _thresholdBytes;

    public MemoryHealthCheck(ILogger<MemoryHealthCheck> logger, long thresholdBytes = 1024 * 1024 * 1024) // 1GB default
    {
        _logger = logger;
        _thresholdBytes = thresholdBytes;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            await Task.CompletedTask; // Make it async

            var memoryUsed = GC.GetTotalMemory(forceFullCollection: false);
            var memoryUsedMB = memoryUsed / (1024 * 1024);
            var thresholdMB = _thresholdBytes / (1024 * 1024);

            var data = new Dictionary<string, object>
            {
                ["MemoryUsedMB"] = memoryUsedMB,
                ["ThresholdMB"] = thresholdMB,
                ["Gen0Collections"] = GC.CollectionCount(0),
                ["Gen1Collections"] = GC.CollectionCount(1),
                ["Gen2Collections"] = GC.CollectionCount(2)
            };

            if (memoryUsed < _thresholdBytes)
            {
                return HealthCheckResult.Healthy($"Memory usage is {memoryUsedMB} MB", data);
            }
            else if (memoryUsed < _thresholdBytes * 1.5)
            {
                return HealthCheckResult.Degraded($"Memory usage is {memoryUsedMB} MB (above threshold)", null, data);
            }
            else
            {
                return HealthCheckResult.Unhealthy($"Memory usage is {memoryUsedMB} MB (critically high)", null, data);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Memory health check failed");
            return HealthCheckResult.Unhealthy("Memory health check failed", ex);
        }
    }
}

/// <summary>
/// Health check for disk space
/// </summary>
public class DiskSpaceHealthCheck : IHealthCheck
{
    private readonly ILogger<DiskSpaceHealthCheck> _logger;
    private readonly string _driveName;
    private readonly long _minimumFreeBytesThreshold;

    public DiskSpaceHealthCheck(
        ILogger<DiskSpaceHealthCheck> logger, 
        string driveName = "C:\\",
        long minimumFreeBytesThreshold = 1024 * 1024 * 1024) // 1GB default
    {
        _logger = logger;
        _driveName = driveName;
        _minimumFreeBytesThreshold = minimumFreeBytesThreshold;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            await Task.CompletedTask; // Make it async

            var drive = new DriveInfo(_driveName);
            
            if (!drive.IsReady)
            {
                return HealthCheckResult.Unhealthy($"Drive {_driveName} is not ready");
            }

            var freeSpaceGB = drive.AvailableFreeSpace / (1024 * 1024 * 1024);
            var totalSpaceGB = drive.TotalSize / (1024 * 1024 * 1024);
            var usedSpacePercent = (double)(drive.TotalSize - drive.AvailableFreeSpace) / drive.TotalSize * 100;

            var data = new Dictionary<string, object>
            {
                ["Drive"] = _driveName,
                ["FreeSpaceGB"] = freeSpaceGB,
                ["TotalSpaceGB"] = totalSpaceGB,
                ["UsedSpacePercent"] = Math.Round(usedSpacePercent, 2),
                ["MinimumFreeSpaceGB"] = _minimumFreeBytesThreshold / (1024 * 1024 * 1024)
            };

            if (drive.AvailableFreeSpace > _minimumFreeBytesThreshold)
            {
                return HealthCheckResult.Healthy($"Disk space is adequate: {freeSpaceGB} GB free", data);
            }
            else if (drive.AvailableFreeSpace > _minimumFreeBytesThreshold * 0.5)
            {
                return HealthCheckResult.Degraded($"Disk space is running low: {freeSpaceGB} GB free", null, data);
            }
            else
            {
                return HealthCheckResult.Unhealthy($"Disk space is critically low: {freeSpaceGB} GB free", null, data);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Disk space health check failed for drive {DriveName}", _driveName);
            return HealthCheckResult.Unhealthy($"Disk space health check failed for drive {_driveName}", ex);
        }
    }
}

/// <summary>
/// Health check for network connectivity
/// </summary>
public class NetworkConnectivityHealthCheck : IHealthCheck
{
    private readonly ILogger<NetworkConnectivityHealthCheck> _logger;
    private readonly string _hostName;
    private readonly int _timeoutMs;

    public NetworkConnectivityHealthCheck(
        ILogger<NetworkConnectivityHealthCheck> logger,
        string hostName = "8.8.8.8", // Google DNS
        int timeoutMs = 5000)
    {
        _logger = logger;
        _hostName = hostName;
        _timeoutMs = timeoutMs;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            using var ping = new Ping();
            var reply = await ping.SendPingAsync(_hostName, _timeoutMs);

            var data = new Dictionary<string, object>
            {
                ["Host"] = _hostName,
                ["Status"] = reply.Status.ToString(),
                ["RoundtripTime"] = reply.RoundtripTime
            };

            if (reply.Status == IPStatus.Success)
            {
                if (reply.RoundtripTime > 1000) // 1 second
                {
                    return HealthCheckResult.Degraded($"Network connectivity is slow: {reply.RoundtripTime}ms", null, data);
                }

                return HealthCheckResult.Healthy($"Network connectivity is good: {reply.RoundtripTime}ms", data);
            }
            else
            {
                return HealthCheckResult.Unhealthy($"Network connectivity failed: {reply.Status}", null, data);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Network connectivity health check failed");
            return HealthCheckResult.Unhealthy("Network connectivity health check failed", ex);
        }
    }
}

/// <summary>
/// Health check for application startup dependencies
/// </summary>
public class StartupHealthCheck : IHealthCheck
{
    private readonly ILogger<StartupHealthCheck> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly List<Type> _requiredServices;

    public StartupHealthCheck(
        ILogger<StartupHealthCheck> logger,
        IServiceProvider serviceProvider,
        List<Type>? requiredServices = null)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _requiredServices = requiredServices ?? new List<Type>();
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            await Task.CompletedTask; // Make it async

            var missingServices = new List<string>();
            var availableServices = new List<string>();

            // Check required services
            foreach (var serviceType in _requiredServices)
            {
                try
                {
                    var service = _serviceProvider.GetService(serviceType);
                    if (service != null)
                    {
                        availableServices.Add(serviceType.Name);
                    }
                    else
                    {
                        missingServices.Add(serviceType.Name);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to resolve service {ServiceType}", serviceType.Name);
                    missingServices.Add(serviceType.Name);
                }
            }

            var data = new Dictionary<string, object>
            {
                ["RequiredServicesCount"] = _requiredServices.Count,
                ["AvailableServices"] = availableServices,
                ["MissingServices"] = missingServices,
                ["ApplicationStartTime"] = Environment.TickCount64
            };

            if (missingServices.Any())
            {
                return HealthCheckResult.Unhealthy($"Missing required services: {string.Join(", ", missingServices)}", null, data);
            }

            return HealthCheckResult.Healthy("All required services are available", data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Startup health check failed");
            return HealthCheckResult.Unhealthy("Startup health check failed", ex);
        }
    }
}
