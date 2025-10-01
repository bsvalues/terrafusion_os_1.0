using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using TerraFusion.Core.Interfaces;
using TerraFusion.API.Services;

namespace TerraFusion.API.Health;

public interface IFileSystemModuleDiscovery
{
    Task<IReadOnlyList<string>> ListNamesAsync(CancellationToken ct = default);
}

public interface IOrchestratorView
{
    Task<IReadOnlyList<string>> GetEnabledNamesAsync(CancellationToken ct = default);
}

public sealed class ModuleConsistencyHealthCheck : IHealthCheck
{
    private readonly IModuleCatalog _catalog;
    private readonly IFileSystemModuleDiscovery _fileSystem;
    private readonly IOrchestratorView _orchestrator;
    private readonly ILogger<ModuleConsistencyHealthCheck> _logger;

    public ModuleConsistencyHealthCheck(
        IModuleCatalog catalog,
        IFileSystemModuleDiscovery fileSystem,
        IOrchestratorView orchestrator,
        ILogger<ModuleConsistencyHealthCheck> logger)
    {
        _catalog = catalog ?? throw new ArgumentNullException(nameof(catalog));
        _fileSystem = fileSystem ?? throw new ArgumentNullException(nameof(fileSystem));
        _orchestrator = orchestrator ?? throw new ArgumentNullException(nameof(orchestrator));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default)
    {
        try
        {
            // Get module names from all three sources
            var dbModulesTask = _catalog.GetAllAsync(ct);
            var fsNamesTask = _fileSystem.ListNamesAsync(ct);
            var orchNamesTask = _orchestrator.GetEnabledNamesAsync(ct);
            
            await Task.WhenAll(dbModulesTask, fsNamesTask, orchNamesTask);
            
            var dbNames = dbModulesTask.Result.Select(m => m.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var fsNames = fsNamesTask.Result.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var orchNames = orchNamesTask.Result.ToHashSet(StringComparer.OrdinalIgnoreCase);
            
            // Find discrepancies
            var onlyInDb = dbNames.Except(fsNames).Union(dbNames.Except(orchNames)).ToArray();
            var onlyInFs = fsNames.Except(dbNames).ToArray();
            var onlyInOrch = orchNames.Except(dbNames).ToArray();
            
            var data = new Dictionary<string, object>
            {
                ["db_count"] = dbNames.Count,
                ["fs_count"] = fsNames.Count,
                ["orch_count"] = orchNames.Count,
                ["timestamp"] = DateTime.UtcNow
            };
            
            // All consistent - healthy!
            if (!onlyInDb.Any() && !onlyInFs.Any() && !onlyInOrch.Any())
            {
                _logger.LogDebug("Module consistency check passed: {Count} modules across all systems", dbNames.Count);
                return HealthCheckResult.Healthy(
                    $"Modules consistent across all systems: {dbNames.Count} modules", 
                    data);
            }
            
            // Some discrepancies - degraded
            data["db_only"] = onlyInDb;
            data["fs_only"] = onlyInFs;
            data["orch_only"] = onlyInOrch;
            data["discrepancy_count"] = onlyInDb.Length + onlyInFs.Length + onlyInOrch.Length;
            
            var message = $"Module inconsistency detected: DB={dbNames.Count}, FS={fsNames.Count}, Orch={orchNames.Count}";
            _logger.LogWarning(message);
            
            // If discrepancies are minor, consider it degraded
            // If major discrepancies (>5 or >20% difference), consider unhealthy
            var maxCount = Math.Max(Math.Max(dbNames.Count, fsNames.Count), orchNames.Count);
            var minCount = Math.Min(Math.Min(dbNames.Count, fsNames.Count), orchNames.Count);
            var difference = maxCount - minCount;
            
            if (difference > 5 || (maxCount > 0 && (double)difference / maxCount > 0.2))
            {
                return HealthCheckResult.Unhealthy(message, null, data);
            }
            
            return HealthCheckResult.Degraded(message, null, data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during module consistency check");
            return HealthCheckResult.Unhealthy(
                "Module consistency check failed", 
                ex,
                new Dictionary<string, object> { ["error"] = ex.Message });
        }
    }
}
