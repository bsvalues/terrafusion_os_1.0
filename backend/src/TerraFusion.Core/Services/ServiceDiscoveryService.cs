using System.Collections.Concurrent;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// In-memory service discovery with health checking for the TerraFusion OS service mesh.
/// Pre-registers the three core services (API, Gateway, Consciousness) and supports
/// dynamic registration/deregistration and cached health checks.
/// </summary>
public sealed class ServiceDiscoveryService : IServiceDiscoveryService
{
    private readonly ILogger<ServiceDiscoveryService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ConcurrentDictionary<string, ServiceInfo> _registry = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, (bool Healthy, DateTime CheckedAt)> _healthCache = new();

    private static readonly TimeSpan HealthCacheDuration = TimeSpan.FromSeconds(30);

    public ServiceDiscoveryService(
        ILogger<ServiceDiscoveryService> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;

        // Pre-register known TerraFusion OS core services
        var apiPort = configuration.GetValue("ServicePorts:Api", 5000);
        var gatewayPort = configuration.GetValue("ServicePorts:Gateway", 3002);
        var consciousnessPort = configuration.GetValue("ServicePorts:Consciousness", 3004);

        RegisterCoreService("api", "TerraFusion API (Kernel)", "localhost", apiPort, new[] { "kernel", "core", "rest" });
        RegisterCoreService("gateway", "TerraFusion Gateway (Shell)", "localhost", gatewayPort, new[] { "shell", "proxy", "routing" });
        RegisterCoreService("consciousness", "TerraFusion Consciousness", "localhost", consciousnessPort, new[] { "ai", "swarm", "signalr" });

        _logger.LogInformation("ServiceDiscoveryService initialized with {Count} core services", _registry.Count);
    }

    public Task<IEnumerable<ServiceInfo>> GetAvailableServicesAsync()
    {
        _logger.LogDebug("GetAvailableServices: returning {Count} services", _registry.Count);
        return Task.FromResult<IEnumerable<ServiceInfo>>(_registry.Values.ToList());
    }

    public Task<ServiceInfo?> GetServiceAsync(string serviceName)
    {
        _registry.TryGetValue(serviceName, out var service);
        if (service == null)
        {
            _logger.LogDebug("Service not found: {ServiceName}", serviceName);
        }
        return Task.FromResult(service);
    }

    public Task RegisterServiceAsync(ServiceInfo serviceInfo)
    {
        _registry[serviceInfo.Name] = serviceInfo;
        _logger.LogInformation("Registered service: {ServiceName} at {Address}:{Port}",
            serviceInfo.Name, serviceInfo.Address, serviceInfo.Port);
        return Task.CompletedTask;
    }

    public Task DeregisterServiceAsync(string serviceId)
    {
        // Find by ID and remove
        var entry = _registry.FirstOrDefault(kvp => kvp.Value.Id == serviceId);
        if (!string.IsNullOrEmpty(entry.Key))
        {
            _registry.TryRemove(entry.Key, out _);
            _healthCache.TryRemove(entry.Key, out _);
            _logger.LogInformation("Deregistered service: {ServiceId} ({ServiceName})", serviceId, entry.Key);
        }
        else
        {
            // Try by name as fallback
            if (_registry.TryRemove(serviceId, out _))
            {
                _healthCache.TryRemove(serviceId, out _);
                _logger.LogInformation("Deregistered service by name: {ServiceId}", serviceId);
            }
            else
            {
                _logger.LogWarning("Service not found for deregistration: {ServiceId}", serviceId);
            }
        }

        return Task.CompletedTask;
    }

    public async Task<bool> IsServiceHealthyAsync(string serviceName)
    {
        // Check cache first
        if (_healthCache.TryGetValue(serviceName, out var cached) &&
            DateTime.UtcNow - cached.CheckedAt < HealthCacheDuration)
        {
            return cached.Healthy;
        }

        if (!_registry.TryGetValue(serviceName, out var service))
        {
            _logger.LogDebug("Cannot check health - service not registered: {ServiceName}", serviceName);
            return false;
        }

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);

            var healthUrl = $"http://{service.Address}:{service.Port}/health";
            var response = await client.GetAsync(healthUrl);
            var healthy = response.IsSuccessStatusCode;

            service.Health = healthy ? "healthy" : "unhealthy";
            _healthCache[serviceName] = (healthy, DateTime.UtcNow);

            _logger.LogDebug("Health check for {ServiceName}: {Status}", serviceName, service.Health);
            return healthy;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Health check failed for {ServiceName}", serviceName);
            service.Health = "unhealthy";
            _healthCache[serviceName] = (false, DateTime.UtcNow);
            return false;
        }
    }

    private void RegisterCoreService(string name, string displayName, string address, int port, string[] tags)
    {
        _registry[name] = new ServiceInfo
        {
            Id = $"terrafusion-{name}-{port}",
            Name = name,
            Address = address,
            Port = port,
            Tags = tags,
            Health = "unknown",
            Metadata = new Dictionary<string, string>
            {
                ["displayName"] = displayName,
                ["registeredAt"] = DateTime.UtcNow.ToString("O"),
                ["source"] = "auto-discovery"
            }
        };
    }
}
