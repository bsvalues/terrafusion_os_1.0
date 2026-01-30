// =============================================================================
// Phase 42: Auto-Remediation Policy Engine - Options
// =============================================================================
// POLICY SPEC LOCK v1.0.0
// Configuration options for the remediation policy engine.
// =============================================================================

namespace TerraFusion.Operations.Runbooks.Remediation;

/// <summary>
/// Configuration options for the remediation policy engine.
/// POLICY SPEC LOCK v1.0.0
/// </summary>
public sealed record RemediationPolicyOptions
{
    /// <summary>
    /// Configuration section name for binding.
    /// </summary>
    public const string SectionName = "RemediationPolicy";

    /// <summary>
    /// Whether the policy engine is enabled.
    /// Default: true (advisory mode - evaluation only, no behavior change).
    /// </summary>
    public bool Enabled { get; init; } = true;

    /// <summary>
    /// Whether to log all policy evaluations.
    /// Default: true for audit trail.
    /// </summary>
    public bool LogEvaluations { get; init; } = true;

    /// <summary>
    /// The global policy to use when no county-specific policy exists.
    /// </summary>
    public RemediationPolicy? GlobalPolicy { get; init; }

    /// <summary>
    /// County-specific policies keyed by county ID.
    /// </summary>
    public Dictionary<string, RemediationPolicy> CountyPolicies { get; init; } = new();

    /// <summary>
    /// The scope ID to use for global fallback.
    /// </summary>
    public string GlobalScopeId { get; init; } = "global";
}
