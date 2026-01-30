using Microsoft.Extensions.Hosting;
using System.Text.Json;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Enums;
using TerraFusion.API.Services.Telemetry;

namespace TerraFusion.API.Services;

public interface IModuleLoaderService
{
    System.Threading.Tasks.Task<IEnumerable<Module>> LoadActiveModulesAsync();
    System.Threading.Tasks.Task<Module?> LoadModuleAsync(string moduleName);
    System.Threading.Tasks.Task<bool> IsModuleAvailableAsync(string moduleName);
    System.Threading.Tasks.Task RefreshModulesAsync();
}

public class ModuleLoaderService : BackgroundService, IModuleLoaderService
{
    private readonly ILogger<ModuleLoaderService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IAgentTelemetryService _telemetry;
    private readonly Dictionary<string, ModuleManifest> _moduleCache = new();
    private readonly string _modulesPath;
    private readonly string _manifestFileName;
    private readonly string? _intentFilter;
    private const int RefreshIntervalMinutes = 5; // Refresh module cache every 5 minutes

    public ModuleLoaderService(
        ILogger<ModuleLoaderService> logger,
        IServiceProvider serviceProvider,
        IAgentTelemetryService telemetry)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _telemetry = telemetry;

        // Path to the modules directory - allow override and fallback to applications
        var currentDir = Directory.GetCurrentDirectory();
        var envPath = Environment.GetEnvironmentVariable("TF_MODULES_PATH")
                      ?? Environment.GetEnvironmentVariable("MODULES_PATH");

        if (!string.IsNullOrWhiteSpace(envPath))
        {
            _modulesPath = Path.GetFullPath(envPath);
        }
        else
        {
            _modulesPath = Path.Combine(currentDir, "modules");
            if (!Directory.Exists(_modulesPath))
            {
                // Try alternative paths for different deployment scenarios
                _modulesPath = Path.Combine(currentDir, "..", "..", "modules");
                if (!Directory.Exists(_modulesPath))
                {
                    _modulesPath = Path.Combine(currentDir, "..", "modules");
                }
            }
            _modulesPath = Path.GetFullPath(_modulesPath);
        }

        if (Directory.Exists(_modulesPath))
        {
            _manifestFileName = "module.manifest.json";
        }
        else
        {
            var applicationsPath = Path.Combine(currentDir, "applications");
            if (Directory.Exists(applicationsPath))
            {
                _modulesPath = Path.GetFullPath(applicationsPath);
                _manifestFileName = "terrafusion.app.json";
            }
            else
            {
                _modulesPath = Path.GetFullPath(_modulesPath);
                _manifestFileName = "module.manifest.json";
            }
        }

        _intentFilter = Environment.GetEnvironmentVariable("TF_MODULE_INTENT_FILTER");
    }

    protected override async System.Threading.Tasks.Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 Module Loader Service: Starting background module monitoring...");

        if (!Directory.Exists(_modulesPath))
        {
            _logger.LogError("Modules directory not found: {Path}", _modulesPath);
            // Keep service running even if modules directory doesn't exist yet
            await System.Threading.Tasks.Task.Delay(Timeout.Infinite, stoppingToken);
            return;
        }

        // Initial module load
        await RefreshModulesAsync();
        _logger.LogInformation("✅ Module Loader Service: Initial load complete. Loaded {Count} modules", _moduleCache.Count);

        // Background monitoring loop - refresh module cache periodically
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await System.Threading.Tasks.Task.Delay(TimeSpan.FromMinutes(RefreshIntervalMinutes), stoppingToken);

                if (!stoppingToken.IsCancellationRequested)
                {
                    _logger.LogDebug("🔄 Module Loader Service: Refreshing module cache...");
                    await RefreshModulesAsync();
                    _logger.LogDebug("✅ Module Loader Service: Cache refreshed. {Count} modules loaded", _moduleCache.Count);
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("⚠️ Module Loader Service: Background monitoring cancelled");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Module Loader Service: Error during background refresh");
                // Continue monitoring despite errors
            }
        }

        _logger.LogInformation("🛑 Module Loader Service: Background monitoring stopped");
    }

    public async System.Threading.Tasks.Task<IEnumerable<Module>> LoadActiveModulesAsync()
    {
        try
        {
            var modules = new List<Module>();
            
            // Load ALL modules from the cache instead of hardcoded list
            // This will properly use all 32 discovered modules
            _logger.LogInformation("Loading all active modules from cache...");
            
            foreach (var kvp in _moduleCache)
            {
                var moduleName = kvp.Key;
                var module = await LoadModuleAsync(moduleName);
                if (module != null)
                {
                    modules.Add(module);
                }
            }
            
            _logger.LogInformation("Loaded {Count} active modules", modules.Count);
            return modules.OrderBy(m => m.Priority);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading active modules");
            return Array.Empty<Module>();
        }
    }

    public async System.Threading.Tasks.Task<Module?> LoadModuleAsync(string moduleName)
    {
        try
        {
            var moduleDir = Path.Combine(_modulesPath, moduleName);
            var manifestPath = Path.Combine(moduleDir, _manifestFileName);

            if (!File.Exists(manifestPath))
            {
                _logger.LogWarning("Module manifest not found for {ModuleName}: {Path}", moduleName, manifestPath);
                return null;
            }

            var manifestContent = await File.ReadAllTextAsync(manifestPath);

            if (_manifestFileName == "module.manifest.json")
            {
                var manifest = JsonSerializer.Deserialize<ModuleManifest>(manifestContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (manifest == null)
                {
                    _logger.LogWarning("Failed to deserialize manifest for {ModuleName}", moduleName);
                    return null;
                }

                _moduleCache[moduleName] = manifest;

                return new Module
                {
                    Name = moduleName,
                    DisplayName = manifest.DisplayName ?? manifest.Name ?? moduleName,
                    Description = manifest.Description,
                    Version = manifest.Version ?? "1.0.0",
                    Status = ParseModuleStatus(manifest.Status),
                    Tier = ParseModuleTier(manifest.Tier),
                    LaunchPath = $"modules/{moduleName}/index.html",
                    Priority = GetModulePriority(moduleName),
                    IsCore = IsCoreTier(moduleName),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
            }

            var appManifest = JsonSerializer.Deserialize<AppManifest>(manifestContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (appManifest == null)
            {
                _logger.LogWarning("Failed to deserialize app manifest for {ModuleName}", moduleName);
                return null;
            }

            if (!MatchesIntentFilter(_intentFilter, appManifest.Intent))
            {
                _logger.LogDebug("Skipping module {ModuleName} due to intent filter {Filter}", moduleName, _intentFilter);
                return null;
            }

            _moduleCache[moduleName] = new ModuleManifest
            {
                Name = appManifest.Name ?? appManifest.Id ?? moduleName,
                DisplayName = appManifest.DisplayName ?? appManifest.Name ?? appManifest.Id ?? moduleName,
                Description = appManifest.Description,
                Version = appManifest.Version,
                Status = appManifest.Status,
                Tier = appManifest.Tier?.ToString()
            };

            var tier = ParseModuleTier(appManifest.Tier);
            return new Module
            {
                Name = appManifest.Id ?? moduleName,
                DisplayName = appManifest.DisplayName ?? appManifest.Name ?? moduleName,
                Description = appManifest.Description,
                Version = appManifest.Version ?? "1.0.0",
                Status = ParseModuleStatus(appManifest.Status),
                Tier = tier,
                LaunchPath = appManifest.Entry?.Url ?? $"applications/{moduleName}",
                Priority = GetModulePriority(moduleName),
                IsCore = IsCoreTier(moduleName),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading module {ModuleName}", moduleName);
            return null;
        }
    }

            public System.Threading.Tasks.Task<bool> IsModuleAvailableAsync(string moduleName)
    {
        try
        {
            var moduleDir = Path.Combine(_modulesPath, moduleName);
            var manifestPath = Path.Combine(moduleDir, _manifestFileName);

            return System.Threading.Tasks.Task.FromResult(Directory.Exists(moduleDir) && File.Exists(manifestPath));
        }
        catch
        {
            return System.Threading.Tasks.Task.FromResult(false);
        }
    }

    public async System.Threading.Tasks.Task RefreshModulesAsync()
    {
        try
        {
            _moduleCache.Clear();
            
            if (!Directory.Exists(_modulesPath))
            {
                _logger.LogWarning("Modules directory not found: {Path}", _modulesPath);
                return;
            }

            _telemetry.Emit("Info", "ModuleLoader", "Modules", "Scan started.");

            var moduleDirectories = Directory.GetDirectories(_modulesPath);
            var loadedCount = 0;
            var filteredCount = 0;

            foreach (var moduleDir in moduleDirectories)
            {
                var moduleName = Path.GetFileName(moduleDir);
                if (string.IsNullOrEmpty(moduleName)) continue;

                if (IsFilteredByIntent(moduleDir))
                {
                    filteredCount++;
                    continue;
                }

                var module = await LoadModuleAsync(moduleName);
                if (module != null)
                {
                    loadedCount++;
                }
            }

            _logger.LogInformation("Refreshed modules cache. Loaded {Count} modules from {Total} directories", 
                loadedCount, moduleDirectories.Length);

            _telemetry.Emit(
                "Info",
                "ModuleLoader",
                "Modules",
                "Manifests loaded.",
                new
                {
                    intentFilter = _intentFilter,
                    moduleCountTotal = moduleDirectories.Length,
                    moduleCountActive = loadedCount,
                    moduleCountFilteredOut = filteredCount
                });

            _telemetry.Emit(
                "Info",
                "ModuleLoader",
                "Health",
                "ModuleLoader healthy.",
                new { moduleCountActive = loadedCount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing modules");
        }
    }

    private ModuleStatus ParseModuleStatus(string? status)
    {
        return status?.ToLower() switch
        {
            "active" => ModuleStatus.Active,
            "production" => ModuleStatus.Active,
            "production-ready" => ModuleStatus.Active,
            "ready" => ModuleStatus.Active,
            "development" => ModuleStatus.Active,
            "inactive" => ModuleStatus.Inactive,
            _ => ModuleStatus.Active // Default for production modules
        };
    }

    private ModuleTier ParseModuleTier(string? tier)
    {
        return tier?.ToLower() switch
        {
            "tier 1 (core government)" => ModuleTier.Tier1,
            "tier1" => ModuleTier.Tier1,
            "core government" => ModuleTier.Tier1,
            "tier 2 (essential operations)" => ModuleTier.Tier2,
            "tier2" => ModuleTier.Tier2,
            "essential operations" => ModuleTier.Tier2,
            _ => ModuleTier.Tier1 // Default for production modules
        };
    }

    private ModuleTier ParseModuleTier(int? tier)
    {
        return tier switch
        {
            1 => ModuleTier.Tier1,
            2 => ModuleTier.Tier2,
            3 => ModuleTier.Tier3,
            _ => ModuleTier.Tier1
        };
    }

    private static bool MatchesIntentFilter(string? filter, string? manifestIntent)
    {
        if (string.IsNullOrWhiteSpace(filter))
        {
            return true;
        }

        var allowed = filter.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (allowed.Length == 0)
        {
            return true;
        }

        return allowed.Any(a => string.Equals(a, manifestIntent, StringComparison.OrdinalIgnoreCase));
    }

    private bool IsFilteredByIntent(string moduleDir)
    {
        if (string.IsNullOrWhiteSpace(_intentFilter))
        {
            return false;
        }

        if (_manifestFileName != "terrafusion.app.json")
        {
            return false;
        }

        var manifestPath = Path.Combine(moduleDir, _manifestFileName);
        if (!File.Exists(manifestPath))
        {
            return false;
        }

        try
        {
            var manifestContent = File.ReadAllText(manifestPath);
            var appManifest = JsonSerializer.Deserialize<AppManifest>(manifestContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (appManifest == null)
            {
                return false;
            }

            return !MatchesIntentFilter(_intentFilter, appManifest.Intent);
        }
        catch
        {
            return false;
        }
    }

    private bool IsCoreTier(string moduleName)
    {
        var coreTierModules = new[]
        {
            "government-edition",
            "costforge-ai-champion",
            "terra-collections", 
            "terra-levy",
            "terra-insight",
            "ai-command-brain",
            "ai-swarm",
            "ai-advanced"
        };
        
        return coreTierModules.Contains(moduleName);
    }

    private int GetModulePriority(string moduleName)
    {
        // Priority based on ACTIVE_MODULES.md specification
        var priorities = new Dictionary<string, int>
        {
            { "government-edition", 1 },
            { "costforge-ai-champion", 2 },
            { "terra-collections", 3 },
            { "terra-levy", 4 },
            { "terra-insight", 5 },
            { "ai-command-brain", 6 },
            { "ai-swarm", 7 },
            { "ai-advanced", 8 },
            { "testing-suite", 9 },
            { "development", 10 },
            { "commercial-suite", 11 },
            { "marketplace-champion", 12 },
            { "gispro", 13 },
            { "TerraFusion-PublicRecords", 14 },
            { "property-workbench", 15 }
        };

        return priorities.TryGetValue(moduleName, out var priority) ? priority : 999;
    }
}

// DTOs for module manifest deserialization
public class ModuleManifest
{
    public string? Name { get; set; }
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Version { get; set; }
    public string? Status { get; set; }
    public string? Tier { get; set; }
    public string? Category { get; set; }
    public string? Author { get; set; }
    public string[] Dependencies { get; set; } = Array.Empty<string>();
    public string[] Capabilities { get; set; } = Array.Empty<string>();
}

internal sealed class AppManifest
{
    public string? Id { get; set; }
    public string? Name { get; set; }
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Status { get; set; }
    public string? Version { get; set; }
    public int? Tier { get; set; }
    public string? Intent { get; set; }
    public AppManifestEntry? Entry { get; set; }
}

internal sealed class AppManifestEntry
{
    public string? Type { get; set; }
    public string? Url { get; set; }
}
