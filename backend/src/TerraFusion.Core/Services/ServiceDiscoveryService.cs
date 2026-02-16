using Microsoft.Extensions.Logging;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Stub implementation of IServiceDiscoveryService.
/// Returns empty service discovery data for all operations.
/// </summary>
public sealed class ServiceDiscoveryService : IServiceDiscoveryService
{
    private readonly ILogger<ServiceDiscoveryService> _logger;

    public ServiceDiscoveryService(ILogger<ServiceDiscoveryService> logger)
    {
        _logger = logger;
    }

    public Task<IEnumerable<ServiceInfo>> GetAvailableServicesAsync()
    {
        _logger.LogDebug("GetAvailableServices (stub)");
        return Task.FromResult<IEnumerable<ServiceInfo>>(Array.Empty<ServiceInfo>());
    }

    public Task<ServiceInfo?> GetServiceAsync(string serviceName)
    {
        _logger.LogDebug("GetService: {ServiceName} (stub)", serviceName);
        return Task.FromResult<ServiceInfo?>(null);
    }

    public Task RegisterServiceAsync(ServiceInfo serviceInfo)
    {
        _logger.LogInformation("RegisterService: {ServiceName} (stub)", serviceInfo.Name);
        return Task.CompletedTask;
    }

    public Task DeregisterServiceAsync(string serviceId)
    {
        _logger.LogInformation("DeregisterService: {ServiceId} (stub)", serviceId);
        return Task.CompletedTask;
    }

    public Task<bool> IsServiceHealthyAsync(string serviceName)
    {
        _logger.LogDebug("IsServiceHealthy: {ServiceName} (stub)", serviceName);
        return Task.FromResult(true);
    }
}
