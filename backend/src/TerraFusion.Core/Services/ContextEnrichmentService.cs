using System.Runtime.InteropServices;
using Microsoft.Extensions.Logging;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Context enrichment service that augments request context with system metadata,
/// service health information, and configurable enrichment rules.
/// </summary>
public sealed class ContextEnrichmentService : IContextEnrichmentService
{
    private readonly ILogger<ContextEnrichmentService> _logger;
    private readonly IServiceDiscoveryService _serviceDiscovery;
    private EnrichmentRules _currentRules = new();

    public ContextEnrichmentService(
        ILogger<ContextEnrichmentService> logger,
        IServiceDiscoveryService serviceDiscovery)
    {
        _logger = logger;
        _serviceDiscovery = serviceDiscovery;
    }

    public async Task<EnrichedContext> EnrichContextAsync(RequestContext context)
    {
        var enrichmentData = new Dictionary<string, object>
        {
            ["enriched"] = true,
            ["serviceName"] = "TerraFusion.API",
            ["timestamp"] = DateTime.UtcNow.ToString("O")
        };

        // Add system information
        enrichmentData["systemInfo"] = new Dictionary<string, object>
        {
            ["osDescription"] = RuntimeInformation.OSDescription,
            ["frameworkDescription"] = RuntimeInformation.FrameworkDescription,
            ["processArchitecture"] = RuntimeInformation.ProcessArchitecture.ToString(),
            ["machineName"] = Environment.MachineName
        };

        // Add service health summary
        try
        {
            var services = await _serviceDiscovery.GetAvailableServicesAsync();
            var serviceList = services.ToList();
            var healthSummary = new Dictionary<string, object>
            {
                ["registeredServices"] = serviceList.Count,
                ["serviceNames"] = serviceList.Select(s => s.Name).ToArray()
            };

            foreach (var service in serviceList)
            {
                healthSummary[$"{service.Name}_health"] = service.Health;
            }

            enrichmentData["serviceHealth"] = healthSummary;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve service health during context enrichment");
            enrichmentData["serviceHealth"] = new Dictionary<string, object> { ["error"] = "unavailable" };
        }

        // Apply enrichment rules if active
        var appliedRules = new List<string>();
        if (_currentRules.IsActive)
        {
            appliedRules.Add(_currentRules.RuleSetId);

            foreach (var rule in _currentRules.Rules)
            {
                enrichmentData[$"rule_{rule.Key}"] = rule.Value;
            }
        }

        var enriched = new EnrichedContext
        {
            BaseContext = context,
            EnrichmentTimestamp = DateTime.UtcNow,
            AppliedRules = appliedRules.ToArray(),
            EnrichmentData = enrichmentData
        };

        _logger.LogDebug("Enriched context for request {RequestId} with {DataCount} entries",
            context.RequestId, enrichmentData.Count);

        return enriched;
    }

    public Task<bool> UpdateEnrichmentRulesAsync(EnrichmentRules rules)
    {
        _currentRules = rules;
        _logger.LogInformation("Updated enrichment rules: {RuleSetId}, Active: {IsActive}, Rules: {RuleCount}",
            rules.RuleSetId, rules.IsActive, rules.Rules.Count);
        return Task.FromResult(true);
    }
}
