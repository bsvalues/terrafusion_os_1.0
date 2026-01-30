using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using TerraFusion.API.Contracts.Health;
using TerraFusion.API.Services;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/system")]
public class SystemHealthController : ControllerBase
{
    private readonly IUnifiedOrchestrationService _orchestrationService;
    private readonly ILogger<SystemHealthController> _logger;

    public SystemHealthController(
        IUnifiedOrchestrationService orchestrationService,
        ILogger<SystemHealthController> logger)
    {
        _orchestrationService = orchestrationService;
        _logger = logger;
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<ActionResult<SystemHealthResponse>> GetSystemHealth()
    {
        try
        {
            var health = await _orchestrationService.GetSystemHealthAsync();
            var unhealthyComponents = health.SystemComponents
                .Where(kv => kv.Value == false)
                .Select(kv => kv.Key)
                .ToList();
            var intentFilter = Environment.GetEnvironmentVariable("TF_MODULE_INTENT_FILTER");
            var (totalDiscovered, activeLoaded) = GetManifestCounts(intentFilter);
            var filteredOut = Math.Max(0, totalDiscovered - activeLoaded);

            var response = new SystemHealthResponse
            {
                Status = health.IsHealthy ? "Healthy" : "Degraded",
                IntentFilter = intentFilter,
                ModuleCountTotal = totalDiscovered,
                ModuleCountActive = activeLoaded,
                ModuleCountFilteredOut = filteredOut,
                ModuleCount = health.ModuleCount,
                HealthyModules = health.HealthyModules,
                SystemComponents = health.SystemComponents,
                Warnings = health.IsHealthy
                    ? new List<string>()
                    : new List<string>
                    {
                        health.ErrorMessage ?? "One or more components are unhealthy",
                        unhealthyComponents.Count > 0
                            ? $"Unhealthy components: {string.Join(", ", unhealthyComponents)}"
                            : "No component detail available"
                    }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get system health");
            return Ok(new SystemHealthResponse
            {
                Status = "Degraded",
                IntentFilter = Environment.GetEnvironmentVariable("TF_MODULE_INTENT_FILTER"),
                ModuleCountTotal = 0,
                ModuleCountActive = 0,
                ModuleCountFilteredOut = 0,
                ModuleCount = 0,
                HealthyModules = 0,
                SystemComponents = new Dictionary<string, bool>(),
                Warnings = new List<string> { "Health probe exception", ex.Message }
            });
        }
    }

    private static (int totalDiscovered, int activeLoaded) GetManifestCounts(string? intentFilter)
    {
        try
        {
            var root = Environment.GetEnvironmentVariable("TF_MODULES_PATH")
                       ?? Environment.GetEnvironmentVariable("MODULES_PATH");

            if (string.IsNullOrWhiteSpace(root))
            {
                if (Directory.Exists("/app/applications"))
                {
                    root = "/app/applications";
                }
                else if (Directory.Exists("/app/modules"))
                {
                    root = "/app/modules";
                }
                else
                {
                    root = Directory.GetCurrentDirectory();
                }
            }

            root = Path.GetFullPath(root);
            var manifestFileName = Directory.Exists(Path.Combine(root))
                ? (Directory.Exists(root) && root.EndsWith("applications", StringComparison.OrdinalIgnoreCase)
                    ? "terrafusion.app.json"
                    : "module.manifest.json")
                : "module.manifest.json";

            var total = 0;
            var active = 0;

            foreach (var dir in Directory.GetDirectories(root))
            {
                var manifestPath = Path.Combine(dir, manifestFileName);
                if (!System.IO.File.Exists(manifestPath))
                {
                    continue;
                }

                total++;

                if (string.IsNullOrWhiteSpace(intentFilter))
                {
                    active++;
                    continue;
                }

                var intent = ReadIntent(manifestPath);
                if (MatchesIntentFilter(intentFilter, intent))
                {
                    active++;
                }
            }

            return (total, active);
        }
        catch
        {
            return (0, 0);
        }
    }

    private static string? ReadIntent(string manifestPath)
    {
        try
        {
            using var doc = JsonDocument.Parse(System.IO.File.ReadAllText(manifestPath));
            if (doc.RootElement.TryGetProperty("intent", out var intentProp) &&
                intentProp.ValueKind == JsonValueKind.String)
            {
                return intentProp.GetString();
            }
        }
        catch
        {
            // ignore
        }

        return null;
    }

    private static bool MatchesIntentFilter(string filter, string? manifestIntent)
    {
        var allowed = filter.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (allowed.Length == 0)
        {
            return true;
        }

        return allowed.Any(a => string.Equals(a, manifestIntent, StringComparison.OrdinalIgnoreCase));
    }
}
