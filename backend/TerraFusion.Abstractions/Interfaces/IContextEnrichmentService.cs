using System.Threading.Tasks;

namespace TerraFusion.Abstractions.Interfaces;

/// <summary>
/// Context Enrichment Service Interface
/// Provides context enrichment capabilities for requests
/// </summary>
public interface IContextEnrichmentService
{
    /// <summary>
    /// Enriches request context with additional information
    /// </summary>
    /// <param name="context">Base request context</param>
    /// <returns>Enriched context</returns>
    Task<EnrichedContext> EnrichContextAsync(RequestContext context);

    /// <summary>
    /// Updates context enrichment rules
    /// </summary>
    /// <param name="rules">Enrichment rules</param>
    /// <returns>Success indicator</returns>
    Task<bool> UpdateEnrichmentRulesAsync(EnrichmentRules rules);
}

/// <summary>
/// Enriched context information
/// </summary>
public class EnrichedContext
{
    public RequestContext BaseContext { get; set; } = new();
    public Dictionary<string, object> EnrichmentData { get; set; } = new();
    public string[] AppliedRules { get; set; } = Array.Empty<string>();
    public DateTime EnrichmentTimestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Context enrichment rules
/// </summary>
public class EnrichmentRules
{
    public string RuleSetId { get; set; } = string.Empty;
    public Dictionary<string, object> Rules { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}