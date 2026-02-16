using Microsoft.Extensions.Logging;
using TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.Core.Services;

/// <summary>
/// Stub implementation of IContextEnrichmentService.
/// Enriches request context with default metadata.
/// </summary>
public sealed class ContextEnrichmentService : IContextEnrichmentService
{
    private readonly ILogger<ContextEnrichmentService> _logger;
    private EnrichmentRules _currentRules = new();

    public ContextEnrichmentService(ILogger<ContextEnrichmentService> logger)
    {
        _logger = logger;
    }

    public Task<EnrichedContext> EnrichContextAsync(RequestContext context)
    {
        var enriched = new EnrichedContext
        {
            BaseContext = context,
            EnrichmentTimestamp = DateTime.UtcNow,
            AppliedRules = _currentRules.IsActive
                ? new[] { _currentRules.RuleSetId }
                : Array.Empty<string>(),
            EnrichmentData = new Dictionary<string, object>
            {
                ["enriched"] = true,
                ["serviceName"] = "TerraFusion.API",
                ["timestamp"] = DateTime.UtcNow.ToString("O")
            }
        };

        _logger.LogDebug("Enriched context for request {RequestId}", context.RequestId);
        return Task.FromResult(enriched);
    }

    public Task<bool> UpdateEnrichmentRulesAsync(EnrichmentRules rules)
    {
        _currentRules = rules;
        _logger.LogInformation("Updated enrichment rules: {RuleSetId}, Active: {IsActive}",
            rules.RuleSetId, rules.IsActive);
        return Task.FromResult(true);
    }
}
