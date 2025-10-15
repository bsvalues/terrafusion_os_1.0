using System.Net;
using System.Net.Sockets;
using System.Text.Json;

namespace TerraFusion.API.Services;

/// <summary>
/// Service registry for dynamic port allocation and service discovery.
/// No more hardcoded ports - services discover each other at runtime.
/// </summary>
public class ServiceRegistry
{
    private readonly string _registryPath;
    private readonly ILogger<ServiceRegistry> _logger;
    
    public ServiceRegistry(ILogger<ServiceRegistry> logger, IWebHostEnvironment env)
    {
        _logger = logger;
        // Registry file at workspace root
        _registryPath = Path.Combine(env.ContentRootPath, "..", "..", "service-registry.json");
        _logger.LogInformation("Service registry path: {Path}", _registryPath);
    }
    
    /// <summary>
    /// Get a free port from the OS. Port 0 means "OS, pick any available port".
    /// </summary>
    public static int GetAvailablePort()
    {
        using var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
        socket.Bind(new IPEndPoint(IPAddress.Loopback, 0)); // Port 0 = OS chooses
        socket.Listen(1);
        var port = ((IPEndPoint)socket.LocalEndPoint!).Port;
        return port;
    }
    
    /// <summary>
    /// Register this service in the registry with its actual running port.
    /// </summary>
    public async Task RegisterServiceAsync(string serviceName, int port, int pid)
    {
        try
        {
            var registryJson = await File.ReadAllTextAsync(_registryPath);
            var registry = JsonSerializer.Deserialize<ServiceRegistryModel>(registryJson) 
                ?? new ServiceRegistryModel();
            
            if (registry.Services.TryGetValue(serviceName, out var service))
            {
                service.Port = port;
                service.Url = $"http://localhost:{port}";
                service.Status = "running";
                service.Pid = pid;
                service.StartedAt = DateTime.UtcNow;
            }
            
            registry.LastUpdated = DateTime.UtcNow;
            
            var options = new JsonSerializerOptions { WriteIndented = true };
            var updatedJson = JsonSerializer.Serialize(registry, options);
            await File.WriteAllTextAsync(_registryPath, updatedJson);
            
            _logger.LogInformation("✅ Registered {Service} at port {Port} (PID: {Pid})", 
                serviceName, port, pid);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to register service {Service} in registry", serviceName);
        }
    }
    
    /// <summary>
    /// Get the URL of another service from the registry.
    /// </summary>
    public async Task<string?> GetServiceUrlAsync(string serviceName)
    {
        try
        {
            var registryJson = await File.ReadAllTextAsync(_registryPath);
            var registry = JsonSerializer.Deserialize<ServiceRegistryModel>(registryJson);
            
            if (registry?.Services.TryGetValue(serviceName, out var service) == true)
            {
                return service.Url;
            }
            
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get service URL for {Service}", serviceName);
            return null;
        }
    }
}

public class ServiceRegistryModel
{
    public DateTime? LastUpdated { get; set; }
    public Dictionary<string, ServiceInfo> Services { get; set; } = new();
}

public class ServiceInfo
{
    public string Name { get; set; } = "";
    public int? Port { get; set; }
    public string? Url { get; set; }
    public string Status { get; set; } = "stopped";
    public int? Pid { get; set; }
    public DateTime? StartedAt { get; set; }
}
