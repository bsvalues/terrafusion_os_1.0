// =============================================================================
// Phase 42: Auto-Remediation Policy Engine - Models
// =============================================================================
// POLICY SPEC LOCK v1.0.0
// These DTOs are FROZEN for Phase 42. Any change requires explicit justification.
// =============================================================================

using TerraFusion.Operations.Incidents;

namespace TerraFusion.Operations.Runbooks.Remediation;

/// <summary>
/// Represents a policy set for a given scope (e.g., county or global).
/// POLICY SPEC LOCK v1.0.0
/// </summary>
/// <param name="ScopeId">The scope identifier (e.g., "benton", "yakima", or "global").</param>
/// <param name="Rules">The ordered list of rules to evaluate.</param>
public sealed record RemediationPolicy(
    string ScopeId,
    IReadOnlyList<RemediationRule> Rules
);

/// <summary>
/// Represents a single matching rule within a policy.
/// POLICY SPEC LOCK v1.0.0
/// </summary>
/// <param name="RuleId">Unique identifier for the rule (e.g., "BENTON-ATLAS-DIAG-SAFE-AUTO").</param>
/// <param name="Decision">The decision to return if this rule matches.</param>
/// <param name="CountyId">County filter; null = any county.</param>
/// <param name="Component">Component filter (e.g., "Atlas", "Swarm"); null = any.</param>
/// <param name="StepKind">Step kind filter; null = any kind.</param>
/// <param name="SafetyLevel">Safety level filter; null = any.</param>
/// <param name="AlertNames">Alert name patterns; null/empty = any.</param>
/// <param name="MinSeverity">Minimum incident severity; null = any.</param>
/// <param name="MaxSeverity">Maximum incident severity; null = any.</param>
/// <param name="ActiveFromUtcOffset">Optional: start of active time window (UTC offset from midnight).</param>
/// <param name="ActiveToUtcOffset">Optional: end of active time window (UTC offset from midnight).</param>
/// <param name="Priority">Rule priority (higher = more precedence). Default = 0.</param>
public sealed record RemediationRule(
    string RuleId,
    RemediationDecisionKind Decision,
    string? CountyId = null,
    string? Component = null,
    RunbookStepKind? StepKind = null,
    RunbookSafetyLevel? SafetyLevel = null,
    IReadOnlyList<string>? AlertNames = null,
    IncidentSeverity? MinSeverity = null,
    IncidentSeverity? MaxSeverity = null,
    TimeSpan? ActiveFromUtcOffset = null,
    TimeSpan? ActiveToUtcOffset = null,
    int Priority = 0
);

/// <summary>
/// Represents the evaluation result for a specific step in context.
/// POLICY SPEC LOCK v1.0.0
/// </summary>
/// <param name="Kind">The decision kind.</param>
/// <param name="AppliedRuleId">The ID of the rule that was applied; null if default.</param>
/// <param name="ScopeId">The policy scope that was used.</param>
/// <param name="Reason">Human-readable reason for the decision.</param>
public sealed record RemediationDecision(
    RemediationDecisionKind Kind,
    string? AppliedRuleId,
    string ScopeId,
    string? Reason
)
{
    /// <summary>
    /// Creates the default decision (RequireHumanApproval) when no rule matches.
    /// </summary>
    public static RemediationDecision Default(string scopeId) => new(
        RemediationDecisionKind.RequireHumanApproval,
        AppliedRuleId: null,
        ScopeId: scopeId,
        Reason: "No matching rule found; defaulting to require human approval"
    );
}
