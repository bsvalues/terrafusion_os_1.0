using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.API.Health;

namespace TerraFusion.API.Services;

public sealed class FileSystemModuleDiscovery : IFileSystemModuleDiscovery
{
    private readonly ILogger<FileSystemModuleDiscovery> _logger;
    private readonly string[] _modulePaths;

    public FileSystemModuleDiscovery(ILogger<FileSystemModuleDiscovery> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        
        // Dynamically discover module directories
        _modulePaths = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "..", "modules"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "ai-modules"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "government-modules")
        };
    }

    public async Task<IReadOnlyList<string>> ListNamesAsync(CancellationToken ct = default)
    {
        var moduleNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        
        await Task.Run(() =>
        {
            foreach (var modulePath in _modulePaths)
            {
                if (Directory.Exists(modulePath))
                {
                    _logger.LogDebug("Scanning module path: {Path}", modulePath);
                    
                    try
                    {
                        // Get all subdirectories (each is potentially a module)
                        var directories = Directory.GetDirectories(modulePath);
                        
                        foreach (var dir in directories)
                        {
                            var dirName = Path.GetFileName(dir);
                            
                            // Check if it's a valid module (has package.json or module.json or csproj)
                            if (IsValidModule(dir))
                            {
                                moduleNames.Add(dirName);
                                _logger.LogTrace("Found module: {Name} at {Path}", dirName, dir);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error scanning module path: {Path}", modulePath);
                    }
                }
                else
                {
                    _logger.LogTrace("Module path does not exist: {Path}", modulePath);
                }
            }
        }, ct);
        
        _logger.LogInformation("Discovered {Count} modules from filesystem", moduleNames.Count);
        return moduleNames.OrderBy(n => n).ToList();
    }
    
    private bool IsValidModule(string directoryPath)
    {
        // A directory is considered a module if it contains any of these files
        var moduleIndicators = new[]
        {
            "package.json",
            "module.json",
            "manifest.json",
            "*.csproj",
            "tsconfig.json",
            "index.ts",
            "index.js",
            "main.ts",
            "main.js"
        };
        
        foreach (var indicator in moduleIndicators)
        {
            if (indicator.Contains('*'))
            {
                // Handle wildcard patterns
                var pattern = indicator.Replace("*", "");
                var files = Directory.GetFiles(directoryPath)
                    .Where(f => Path.GetFileName(f).EndsWith(pattern, StringComparison.OrdinalIgnoreCase));
                if (files.Any())
                    return true;
            }
            else
            {
                // Check for exact file
                var filePath = Path.Combine(directoryPath, indicator);
                if (File.Exists(filePath))
                    return true;
            }
        }
        
        return false;
    }
}
