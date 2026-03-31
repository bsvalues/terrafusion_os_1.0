using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using TerraFusion.API.Contracts.Health;
using TerraFusion.API.Services;
using TerraFusion.Core.Enums;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/system")]
public class SystemHealthController : ControllerBase
{
    private readonly IUnifiedOrchestrationService _orchestrationService;
    private readonly IModuleLoaderService _moduleLoader;
    private readonly ILogger<SystemHealthController> _logger;

    public SystemHealthController(
        IUnifiedOrchestrationService orchestrationService,
        IModuleLoaderService moduleLoader,
        ILogger<SystemHealthController> logger)
    {
        _orchestrationService = orchestrationService;
        _moduleLoader = moduleLoader;
        _logger = logger;
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<ActionResult<SystemHealthResponse>> GetSystemHealth()
    {
        try
        {
            var health = await _orchestrationService.GetSystemHealthAsync();
            var modules = await _moduleLoader.LoadDiscoveredModulesAsync();
            var moduleList = modules.ToList();
            var unhealthyComponents = health.SystemComponents
                .Where(kv => kv.Value == false)
                .Select(kv => kv.Key)
                .ToList();
            var intentFilter = Environment.GetEnvironmentVariable("TF_MODULE_INTENT_FILTER");
            var totalDiscovered = moduleList.Count;
            var activeLoaded = moduleList.Count(module => module.Status == ModuleStatus.Active);

            var response = new SystemHealthResponse
            {
                Status = health.IsHealthy ? "Healthy" : "Degraded",
                IntentFilter = intentFilter,
                ModuleCountTotal = totalDiscovered,
                ModuleCountActive = activeLoaded,
                ModuleCountFilteredOut = 0,
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
}
