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
    /// Internal constructor for testing — accepts an explicit registry file path.
    /// </summary>
    internal ServiceRegistry(ILogger<ServiceRegistry> logger, string registryPath)
    {
        _logger = logger;
        _registryPath = registryPath;
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
    /// Seeds service-registry.json from platform.json if it does not already exist.
    /// Idempotent — returns immediately if the file is already present.
    /// </summary>
    /// <param name="platformJsonPath">
    /// Explicit path to platform.json. When null, derived as the sibling of _registryPath.
    /// </param>
    public async Task EnsureSeededAsync(string? platformJsonPath = null)
    {
        // Idempotent: do nothing if file already exists
        if (File.Exists(_registryPath))
            return;

        var platformPath = platformJsonPath
            ?? Path.Combine(Path.GetDirectoryName(_registryPath)!, "platform.json");

        if (!File.Exists(platformPath))
        {
            _logger.LogWarning(
                "platform.json not found at {Path} — skipping registry seed", platformPath);
            return;
        }

        try
        {
            var platformJson = await File.ReadAllTextAsync(platformPath);
            using var doc = JsonDocument.Parse(platformJson);

            var registry = new ServiceRegistryModel
            {
                LastUpdated = DateTime.UtcNow
            };

            if (doc.RootElement.TryGetProperty("ports", out var portsElement))
            {
                foreach (var port in portsElement.EnumerateObject())
                {
                    var serviceName = port.Name;
                    var defaultPort = port.Value.TryGetProperty("default", out var defVal)
                        ? defVal.GetInt32()
                        : (int?)null;

                    registry.Services[serviceName] = new ServiceInfo
                    {
                        Name = serviceName,
                        Port = defaultPort,
                        Url = defaultPort.HasValue ? $"http://localhost:{defaultPort}" : null,
                        Status = "stopped"
                    };
                }
            }

            // Ensure parent directory exists
            var dir = Path.GetDirectoryName(_registryPath);
            if (!string.IsNullOrEmpty(dir))
                Directory.CreateDirectory(dir);

            var options = new JsonSerializerOptions { WriteIndented = true };
            var json = JsonSerializer.Serialize(registry, options);
            await File.WriteAllTextAsync(_registryPath, json);

            _logger.LogInformation(
                "Service registry seeded with {Count} services from platform.json",
                registry.Services.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to seed service registry from platform.json");
        }
    }

    /// <summary>
    /// Register this service in the registry with its actual running port.
    /// Creates the file (empty registry) if it does not exist.
    /// Adds the service entry if it was not pre-seeded.
    /// </summary>
    public async Task RegisterServiceAsync(string serviceName, int port, int pid)
    {
        try
        {
            ServiceRegistryModel registry;

            try
            {
                var registryJson = await File.ReadAllTextAsync(_registryPath);
                registry = JsonSerializer.Deserialize<ServiceRegistryModel>(registryJson)
                    ?? new ServiceRegistryModel();
            }
            catch (FileNotFoundException)
            {
                // File doesn't exist yet — start with a fresh registry
                registry = new ServiceRegistryModel();
            }

            // Add or update the service entry
            if (!registry.Services.TryGetValue(serviceName, out var service))
            {
                service = new ServiceInfo { Name = serviceName };
                registry.Services[serviceName] = service;
            }

            service.Port = port;
            service.Url = $"http://localhost:{port}";
            service.Status = "running";
            service.Pid = pid;
            service.StartedAt = DateTime.UtcNow;

            registry.LastUpdated = DateTime.UtcNow;

            // Ensure parent directory exists before writing
            var dir = Path.GetDirectoryName(_registryPath);
            if (!string.IsNullOrEmpty(dir))
                Directory.CreateDirectory(dir);

            var options = new JsonSerializerOptions { WriteIndented = true };
            var updatedJson = JsonSerializer.Serialize(registry, options);
            await File.WriteAllTextAsync(_registryPath, updatedJson);

            _logger.LogInformation("Registered {Service} at port {Port} (PID: {Pid})",
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
        catch (FileNotFoundException)
        {
            // Registry not yet seeded — expected during early startup
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
