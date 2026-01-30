using System.Threading.Tasks;

namespace TerraFusion.Abstractions.Interfaces;

/// <summary>
/// Service Discovery Interface for TerraFusion OS
/// Provides intelligent service discovery with quantum-enhanced routing capabilities
/// </summary>
public interface IServiceDiscoveryService
{
    /// <summary>
    /// Gets all available services in the TerraFusion mesh
    /// </summary>
    /// <returns>Collection of available services</returns>
    Task<IEnumerable<ServiceInfo>> GetAvailableServicesAsync();

    /// <summary>
    /// Gets specific service information by name
    /// </summary>
    /// <param name="serviceName">Name of the service to find</param>
    /// <returns>Service information if found</returns>
    Task<ServiceInfo?> GetServiceAsync(string serviceName);

    /// <summary>
    /// Registers a new service in the discovery system
    /// </summary>
    /// <param name="serviceInfo">Service information to register</param>
    /// <returns>Registration task</returns>
    Task RegisterServiceAsync(ServiceInfo serviceInfo);

    /// <summary>
    /// Deregisters a service from the discovery system
    /// </summary>
    /// <param name="serviceId">Service ID to deregister</param>
    /// <returns>Deregistration task</returns>
    Task DeregisterServiceAsync(string serviceId);

    /// <summary>
    /// Checks if a service is healthy and available
    /// </summary>
    /// <param name="serviceName">Service name to check</param>
    /// <returns>Health status</returns>
    Task<bool> IsServiceHealthyAsync(string serviceName);
}

/// <summary>
/// Service information data transfer object
/// </summary>
public class ServiceInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int Port { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public string Health { get; set; } = "unknown";
    public Dictionary<string, string> Metadata { get; set; } = new();
}