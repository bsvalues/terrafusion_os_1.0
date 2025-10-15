using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;
using System.IO;
using TerraFusion.API.Hubs;

namespace TerraFusion.API.Services
{
    public sealed class PluginHotReloadService : BackgroundService
    {
        private readonly ILogger<PluginHotReloadService> _logger;
        private readonly IHubContext<OSCoreHub> _hubContext;
        private FileSystemWatcher? _watcher;

        public PluginHotReloadService(
            ILogger<PluginHotReloadService> logger,
            IHubContext<OSCoreHub> hubContext)
        {
            _logger = logger;
            _hubContext = hubContext;
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Watch the modules directory where our 15 production modules are located
            var modulesPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "modules");
            var absoluteModulesPath = Path.GetFullPath(modulesPath);
            
            if (!Directory.Exists(absoluteModulesPath))
            {
                _logger.LogWarning("Modules directory not found: {Path}", absoluteModulesPath);
                return Task.CompletedTask;
            }

            _watcher = new FileSystemWatcher
            {
                Path = absoluteModulesPath,
                Filter = "module.manifest.json", // Our modules use module.manifest.json
                NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.FileName,
                IncludeSubdirectories = true
            };

            _watcher.Changed += async (sender, e) => await HandlePluginChange(e.FullPath, "changed");
            _watcher.Created += async (sender, e) => await HandlePluginChange(e.FullPath, "created");
            _watcher.Deleted += async (sender, e) => await HandlePluginChange(e.FullPath, "deleted");

            _watcher.EnableRaisingEvents = true;
            
            _logger.LogInformation("Module hot-reload service started, watching: {Path}", absoluteModulesPath);
            _logger.LogInformation("Entering infinite delay to keep service alive...");
            
            // Keep the service running until cancellation is requested
            return Task.Delay(Timeout.Infinite, stoppingToken);
        }

        private async Task HandlePluginChange(string filePath, string changeType)
        {
            try
            {
                var pluginName = ExtractPluginName(filePath);
                if (string.IsNullOrEmpty(pluginName))
                {
                    return;
                }

                _logger.LogInformation("Plugin {Name} {ChangeType}: {Path}", pluginName, changeType, filePath);

                // Notify all connected clients about plugin change
                await _hubContext.Clients.All.SendAsync("PluginHotReload", new
                {
                    PluginName = pluginName,
                    ChangeType = changeType,
                    Timestamp = DateTimeOffset.UtcNow,
                    FilePath = filePath
                });

                // If it's a manifest change, validate the new manifest
                if (changeType != "deleted" && File.Exists(filePath))
                {
                    await ValidateManifest(filePath, pluginName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling plugin change: {Path}", filePath);
            }
        }

        private string? ExtractPluginName(string filePath)
        {
            try
            {
                var directory = Path.GetDirectoryName(filePath);
                return Path.GetFileName(directory);
            }
            catch
            {
                return null;
            }
        }

        private async Task ValidateManifest(string manifestPath, string pluginName)
        {
            try
            {
                var manifestContent = await File.ReadAllTextAsync(manifestPath);
                // Basic validation - in production, use PluginManifestValidator
                if (manifestContent.Contains($"\"name\": \"{pluginName}\""))
                {
                    _logger.LogInformation("Plugin {Name} manifest validated successfully", pluginName);
                }
                else
                {
                    _logger.LogWarning("Plugin {Name} manifest validation failed - name mismatch", pluginName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating manifest for plugin {Name}", pluginName);
            }
        }

        public override void Dispose()
        {
            _watcher?.Dispose();
            base.Dispose();
        }
    }
}
