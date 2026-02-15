using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using System.Net.NetworkInformation;

namespace TerraFusion.Core.HealthChecks;

// Phase 8: Removed duplicate DatabaseHealthCheck, RedisHealthCheck, ExternalApiHealthCheck
// (replaced by real implementations in TerraFusion.Core.Services.Monitoring.HealthChecks)

/// <summary>
/// Health check for system memory usage.
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

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
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
                return Task.FromResult(HealthCheckResult.Healthy($"Memory usage is {memoryUsedMB} MB", data));
            }
            else if (memoryUsed < _thresholdBytes * 1.5)
            {
                return Task.FromResult(HealthCheckResult.Degraded($"Memory usage is {memoryUsedMB} MB (above threshold)", null, data));
            }
            else
            {
                return Task.FromResult(HealthCheckResult.Unhealthy($"Memory usage is {memoryUsedMB} MB (critically high)", null, data));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Memory health check failed");
            return Task.FromResult(HealthCheckResult.Unhealthy("Memory health check failed", ex));
        }
    }
}

/// <summary>
/// Health check for disk space.
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

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var drive = new DriveInfo(_driveName);

            if (!drive.IsReady)
            {
                return Task.FromResult(HealthCheckResult.Unhealthy($"Drive {_driveName} is not ready"));
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
                return Task.FromResult(HealthCheckResult.Healthy($"Disk space is adequate: {freeSpaceGB} GB free", data));
            }
            else if (drive.AvailableFreeSpace > _minimumFreeBytesThreshold * 0.5)
            {
                return Task.FromResult(HealthCheckResult.Degraded($"Disk space is running low: {freeSpaceGB} GB free", null, data));
            }
            else
            {
                return Task.FromResult(HealthCheckResult.Unhealthy($"Disk space is critically low: {freeSpaceGB} GB free", null, data));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Disk space health check failed for drive {DriveName}", _driveName);
            return Task.FromResult(HealthCheckResult.Unhealthy($"Disk space health check failed for drive {_driveName}", ex));
        }
    }
}

/// <summary>
/// Health check for network connectivity.
/// </summary>
public class NetworkConnectivityHealthCheck : IHealthCheck
{
    private readonly ILogger<NetworkConnectivityHealthCheck> _logger;
    private readonly string _hostName;
    private readonly int _timeoutMs;

    public NetworkConnectivityHealthCheck(
        ILogger<NetworkConnectivityHealthCheck> logger,
        string hostName = "8.8.8.8",
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
                if (reply.RoundtripTime > 1000)
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
/// Health check for application startup dependencies.
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

    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var missingServices = new List<string>();
            var availableServices = new List<string>();

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
                return Task.FromResult(HealthCheckResult.Unhealthy($"Missing required services: {string.Join(", ", missingServices)}", null, data));
            }

            return Task.FromResult(HealthCheckResult.Healthy("All required services are available", data));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Startup health check failed");
            return Task.FromResult(HealthCheckResult.Unhealthy("Startup health check failed", ex));
        }
    }
}
