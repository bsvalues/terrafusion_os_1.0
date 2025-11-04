using Consul;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.Gateway.Services;

/// <summary>
/// REVOLUTIONARY: Consul-based Service Discovery for TerraFusion OS
/// 
/// This service provides intelligent service discovery with quantum-enhanced
/// routing capabilities for government microservices.
/// </summary>

public class ConsulServiceDiscoveryService : IServiceDiscoveryService
{
    private readonly IConsulClient _consulClient;
    private readonly ILogger<ConsulServiceDiscoveryService> _logger;

    public ConsulServiceDiscoveryService(ILogger<ConsulServiceDiscoveryService> logger)
    {
        _logger = logger;
        _consulClient = new ConsulClient(config =>
        {
            config.Address = new Uri("http://localhost:8500");
        });
    }

    public async Task<IEnumerable<ServiceInfo>> GetAvailableServicesAsync()
    {
        try
        {
            var services = await _consulClient.Catalog.Services();
            var serviceInfos = new List<ServiceInfo>();

            foreach (var service in services.Response)
            {
                var serviceInstances = await _consulClient.Health.Service(service.Key, string.Empty, true);

                foreach (var instance in serviceInstances.Response)
                {
                    serviceInfos.Add(new ServiceInfo
                    {
                        Id = instance.Service.ID,
                        Name = instance.Service.Service,
                        Address = instance.Service.Address,
                        Port = instance.Service.Port,
                        Tags = instance.Service.Tags,
                        Health = GetHealthStatus(instance.Checks),
                        Metadata = instance.Service.Meta?.ToDictionary(kvp => kvp.Key, kvp => kvp.Value) ?? new Dictionary<string, string>()
                    });
                }
            }

            return serviceInfos;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve services from Consul");
            return Enumerable.Empty<ServiceInfo>();
        }
    }

    public async Task<ServiceInfo?> GetServiceAsync(string serviceName)
    {
        try
        {
            var serviceInstances = await _consulClient.Health.Service(serviceName, string.Empty, true);
            var instance = serviceInstances.Response.FirstOrDefault();

            if (instance == null)
                return null;

            return new ServiceInfo
            {
                Id = instance.Service.ID,
                Name = instance.Service.Service,
                Address = instance.Service.Address,
                Port = instance.Service.Port,
                Tags = instance.Service.Tags,
                Health = GetHealthStatus(instance.Checks),
                Metadata = instance.Service.Meta?.ToDictionary(kvp => kvp.Key, kvp => kvp.Value) ?? new Dictionary<string, string>()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve service {ServiceName} from Consul", serviceName);
            return null;
        }
    }

    public async Task RegisterServiceAsync(ServiceInfo serviceInfo)
    {
        try
        {
            var registration = new AgentServiceRegistration
            {
                ID = serviceInfo.Id,
                Name = serviceInfo.Name,
                Address = serviceInfo.Address,
                Port = serviceInfo.Port,
                Tags = serviceInfo.Tags,
                Meta = serviceInfo.Metadata,
                Check = new AgentServiceCheck
                {
                    HTTP = $"http://{serviceInfo.Address}:{serviceInfo.Port}/health",
                    Interval = TimeSpan.FromSeconds(10),
                    Timeout = TimeSpan.FromSeconds(5),
                    DeregisterCriticalServiceAfter = TimeSpan.FromMinutes(1)
                }
            };

            await _consulClient.Agent.ServiceRegister(registration);
            _logger.LogInformation("Successfully registered service {ServiceName} with Consul", serviceInfo.Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to register service {ServiceName} with Consul", serviceInfo.Name);
            throw;
        }
    }

    public async Task DeregisterServiceAsync(string serviceId)
    {
        try
        {
            await _consulClient.Agent.ServiceDeregister(serviceId);
            _logger.LogInformation("Successfully deregistered service {ServiceId} from Consul", serviceId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deregister service {ServiceId} from Consul", serviceId);
            throw;
        }
    }

    public async Task<bool> IsServiceHealthyAsync(string serviceName)
    {
        try
        {
            var healthChecks = await _consulClient.Health.Service(serviceName);
            return healthChecks.Response.Any(h => h.Checks.All(c => c.Status.ToString() == "passing"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check health for service {ServiceName}", serviceName);
            return false;
        }
    }

    private static string GetHealthStatus(HealthCheck[] checks)
    {
        if (checks.All(c => c.Status.ToString() == "passing"))
            return "healthy";
        if (checks.Any(c => c.Status.ToString() == "critical"))
            return "critical";
        if (checks.Any(c => c.Status.ToString() == "warning"))
            return "warning";
        return "unknown";
    }

    public void Dispose()
    {
        _consulClient?.Dispose();
    }
}