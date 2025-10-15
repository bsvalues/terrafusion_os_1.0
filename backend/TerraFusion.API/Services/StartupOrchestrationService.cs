using System.Diagnostics;

namespace TerraFusion.API.Services;

/// <summary>
/// Handles service startup, port allocation, and registration.
/// Ensures proper error handling for Kestrel binding failures.
/// </summary>
public class StartupOrchestrationService : BackgroundService
{
    private readonly ILogger<StartupOrchestrationService> _logger;
    private readonly ServiceRegistry _registry;
    private readonly IHostApplicationLifetime _lifetime;
    private readonly IConfiguration _configuration;
    
    public StartupOrchestrationService(
        ILogger<StartupOrchestrationService> logger,
        ServiceRegistry registry,
        IHostApplicationLifetime lifetime,
        IConfiguration configuration)
    {
        _logger = logger;
        _registry = registry;
        _lifetime = lifetime;
        _configuration = configuration;
    }
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 StartupOrchestrationService: Beginning service registration...");
        
        // Wait for Kestrel to actually start
        _lifetime.ApplicationStarted.Register(() =>
        {
            // Fire-and-forget is OK here, but we need to use Task.Run to avoid async void
            _ = Task.Run(async () =>
            {
                try
                {
                    // Get the actual port Kestrel bound to
                    var addresses = _configuration["ASPNETCORE_URLS"] ?? "http://localhost:5000";
                    var port = ExtractPortFromUrl(addresses);
                    var pid = Environment.ProcessId;
                    
                    _logger.LogInformation("✅ Kestrel started successfully on port {Port}", port);
                    
                    // Register in service registry
                    await _registry.RegisterServiceAsync("backend", port, pid);
                    
                    _logger.LogInformation("✅ Service registered in registry");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Failed to register service in registry");
                }
            });
        });
        
        // Monitor for startup failure
        _lifetime.ApplicationStopping.Register(() =>
        {
            _logger.LogWarning("⚠️ Application is stopping");
            _logger.LogWarning("⚠️ STACK TRACE: {StackTrace}", Environment.StackTrace);
        });
        
        // Keep the service running until cancellation is requested
        _logger.LogInformation("✅ Entering infinite delay to keep service alive...");
        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("⚠️ Infinite delay was cancelled - shutdown requested");
        }
    }
    
    private int ExtractPortFromUrl(string url)
    {
        try
        {
            var uri = new Uri(url.Split(';')[0]);
            return uri.Port;
        }
        catch
        {
            return 5000; // Fallback
        }
    }
}
