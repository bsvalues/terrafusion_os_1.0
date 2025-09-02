using Microsoft.Extensions.Hosting;
using System.Text.Json;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Enums;

namespace TerraFusion.API.Services;

public interface IModuleLoaderService
{
    System.Threading.Tasks.Task<IEnumerable<Module>> LoadActiveModulesAsync();
    System.Threading.Tasks.Task<Module?> LoadModuleAsync(string moduleName);
    System.Threading.Tasks.Task<bool> IsModuleAvailableAsync(string moduleName);
    System.Threading.Tasks.Task RefreshModulesAsync();
}

public class ModuleLoaderService : IModuleLoaderService, IHostedService
{
    private readonly ILogger<ModuleLoaderService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly Dictionary<string, ModuleManifest> _moduleCache = new();
    private readonly string _modulesPath;

    public ModuleLoaderService(
        ILogger<ModuleLoaderService> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        
        // Path to the modules directory - fix the path resolution
        var currentDir = Directory.GetCurrentDirectory();
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

    public async System.Threading.Tasks.Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting Module Loader Service...");
        
        if (!Directory.Exists(_modulesPath))
        {
            _logger.LogError("Modules directory not found: {Path}", _modulesPath);
            return;
        }

        await RefreshModulesAsync();
        _logger.LogInformation("Module Loader Service started. Loaded {Count} modules", _moduleCache.Count);
    }

    public System.Threading.Tasks.Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Module Loader Service stopped");
        return System.Threading.Tasks.Task.CompletedTask;
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
            var manifestPath = Path.Combine(moduleDir, "module.manifest.json");

            if (!File.Exists(manifestPath))
            {
                _logger.LogWarning("Module manifest not found for {ModuleName}: {Path}", moduleName, manifestPath);
                return null;
            }

            var manifestContent = await File.ReadAllTextAsync(manifestPath);
            var manifest = JsonSerializer.Deserialize<ModuleManifest>(manifestContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (manifest == null)
            {
                _logger.LogWarning("Failed to deserialize manifest for {ModuleName}", moduleName);
                return null;
            }

            // Cache the manifest
            _moduleCache[moduleName] = manifest;

            // Convert manifest to Module entity
            var module = new Module
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

            return module;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading module {ModuleName}", moduleName);
            return null;
        }
    }

            public async System.Threading.Tasks.Task<bool> IsModuleAvailableAsync(string moduleName)
    {
        try
        {
            var moduleDir = Path.Combine(_modulesPath, moduleName);
            var manifestPath = Path.Combine(moduleDir, "module.manifest.json");
            
            return Directory.Exists(moduleDir) && File.Exists(manifestPath);
        }
        catch
        {
            return false;
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

            var moduleDirectories = Directory.GetDirectories(_modulesPath);
            var loadedCount = 0;

            foreach (var moduleDir in moduleDirectories)
            {
                var moduleName = Path.GetFileName(moduleDir);
                if (string.IsNullOrEmpty(moduleName)) continue;

                var module = await LoadModuleAsync(moduleName);
                if (module != null)
                {
                    loadedCount++;
                }
            }

            _logger.LogInformation("Refreshed modules cache. Loaded {Count} modules from {Total} directories", 
                loadedCount, moduleDirectories.Length);
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