// =============================================================================
// Phase 42: Auto-Remediation Policy Engine - Context
// =============================================================================
// POLICY SPEC LOCK v1.0.0
// This DTO is FROZEN for Phase 42. Any change requires explicit justification.
// =============================================================================

using TerraFusion.Operations.Incidents;

namespace TerraFusion.Operations.Runbooks.Remediation;

/// <summary>
/// Encapsulates all context needed for a remediation policy decision.
/// POLICY SPEC LOCK v1.0.0
/// </summary>
/// <param name="CountyId">The county identifier for scope resolution.</param>
/// <param name="Severity">The incident severity level.</param>
/// <param name="Plan">The runbook plan containing the step.</param>
/// <param name="Step">The specific step being evaluated.</param>
/// <param name="Timestamp">The current timestamp for time-window evaluation.</param>
/// <param name="AlertNames">Optional: related alert names for pattern matching.</param>
public sealed record RemediationPolicyContext(
    string CountyId,
    IncidentSeverity Severity,
    RunbookPlan Plan,
    RunbookStep Step,
    DateTimeOffset Timestamp,
    IReadOnlyList<string>? AlertNames = null
);
