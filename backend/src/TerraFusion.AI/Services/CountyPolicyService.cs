// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ TerraFusion County Policy Service
// Phase 24: AI Policy Engine (v1) - County-scoped policy storage and retrieval
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Phase 24: Service interface for retrieving county-specific AI policies.
/// v1 uses in-memory defaults; future versions may use database/config storage.
/// </summary>
public interface ICountyPolicyService
{
    /// <summary>
    /// Get the AI policy for a specific county.
    /// </summary>
    /// <param name="countyId">County identifier.</param>
    /// <returns>Policy configuration for the county.</returns>
    Task<SystemGptPolicyDto> GetPolicyAsync(CountyId countyId);

    /// <summary>
    /// Get policies for all counties.
    /// </summary>
    /// <returns>Dictionary of county policies.</returns>
    Task<IReadOnlyDictionary<CountyId, SystemGptPolicyDto>> GetAllPoliciesAsync();
}

/// <summary>
/// Phase 24: In-memory implementation of county policy service.
/// Provides hardcoded defaults for v1; Benton is unrestricted, others are placeholders.
/// </summary>
public class InMemoryCountyPolicyService : ICountyPolicyService
{
    private readonly ILogger<InMemoryCountyPolicyService> _logger;
    private readonly IReadOnlyDictionary<CountyId, SystemGptPolicyDto> _policies;

    public InMemoryCountyPolicyService(ILogger<InMemoryCountyPolicyService> logger)
    {
        _logger = logger;
        _policies = InitializeDefaultPolicies();
        _logger.LogInformation("Phase 24: County Policy Service initialized with {Count} policies", _policies.Count);
    }

    /// <inheritdoc />
    public Task<SystemGptPolicyDto> GetPolicyAsync(CountyId countyId)
    {
        if (_policies.TryGetValue(countyId, out var policy))
        {
            _logger.LogDebug("Policy retrieved for {County}: AllowGpt={AllowGpt}, AllowRag={AllowRag}",
                countyId, policy.AllowGptSendMessage, policy.AllowRagQueries);
            return Task.FromResult(policy);
        }

        // Fallback to Benton policy if county not found
        _logger.LogWarning("No policy found for {County}, falling back to Benton", countyId);
        return Task.FromResult(_policies[CountyId.Benton]);
    }

    /// <inheritdoc />
    public Task<IReadOnlyDictionary<CountyId, SystemGptPolicyDto>> GetAllPoliciesAsync()
    {
        return Task.FromResult(_policies);
    }

    /// <summary>
    /// Initialize default policies for all counties.
    /// Phase 24 v1: Hardcoded defaults.
    /// </summary>
    private static IReadOnlyDictionary<CountyId, SystemGptPolicyDto> InitializeDefaultPolicies()
    {
        return new Dictionary<CountyId, SystemGptPolicyDto>
        {
            // ═══════════════════════════════════════════════════════════════════
            // Benton County - Production county, full access
            // ═══════════════════════════════════════════════════════════════════
            [CountyId.Benton] = new SystemGptPolicyDto
            {
                CountyId = "benton",
                CountyName = "Benton County",
                AllowGptSendMessage = true,
                AllowRagQueries = true,
                AllowEmbeddings = true,
                AllowExplainGpt = true,
                RequireExplainOnValuation = false,
                SanitizeOwnerNames = false,
                DenyPromptPatterns = Array.Empty<string>(),
                DenyContextIds = Array.Empty<string>(),
                LastUpdatedUtc = DateTimeOffset.UtcNow,
                PolicyVersion = "1.0",
                IsPlaceholder = false
            },

            // ═══════════════════════════════════════════════════════════════════
            // Yakima County - Placeholder with restrictive defaults
            // ═══════════════════════════════════════════════════════════════════
            [CountyId.Yakima] = new SystemGptPolicyDto
            {
                CountyId = "yakima",
                CountyName = "Yakima County",
                AllowGptSendMessage = false, // Not configured
                AllowRagQueries = false,     // Not configured
                AllowEmbeddings = false,     // Not configured
                AllowExplainGpt = true,      // Allow explanations
                RequireExplainOnValuation = true, // Conservative default
                SanitizeOwnerNames = true,   // Privacy protection
                DenyPromptPatterns = new[] { "(?i)delete|remove|modify" }, // Block destructive keywords
                DenyContextIds = new[] { "admin", "system-config" },       // Block admin contexts
                LastUpdatedUtc = DateTimeOffset.UtcNow,
                PolicyVersion = "1.0",
                IsPlaceholder = true
            },

            // ═══════════════════════════════════════════════════════════════════
            // Franklin County - Placeholder with restrictive defaults
            // ═══════════════════════════════════════════════════════════════════
            [CountyId.Franklin] = new SystemGptPolicyDto
            {
                CountyId = "franklin",
                CountyName = "Franklin County",
                AllowGptSendMessage = false, // Not configured
                AllowRagQueries = false,     // Not configured
                AllowEmbeddings = false,     // Not configured
                AllowExplainGpt = true,      // Allow explanations
                RequireExplainOnValuation = true, // Conservative default
                SanitizeOwnerNames = true,   // Privacy protection
                DenyPromptPatterns = new[] { "(?i)delete|remove|modify" }, // Block destructive keywords
                DenyContextIds = new[] { "admin", "system-config" },       // Block admin contexts
                LastUpdatedUtc = DateTimeOffset.UtcNow,
                PolicyVersion = "1.0",
                IsPlaceholder = true
            }
        };
    }
}
