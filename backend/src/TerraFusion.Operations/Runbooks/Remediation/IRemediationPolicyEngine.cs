// =============================================================================
// Phase 42: Auto-Remediation Policy Engine - Interface
// =============================================================================
// POLICY SPEC LOCK v1.0.0
// This interface is FROZEN for Phase 42. Any change requires explicit justification.
// =============================================================================

namespace TerraFusion.Operations.Runbooks.Remediation;

/// <summary>
/// Evaluates remediation policy rules to determine whether a runbook step
/// may be auto-executed, requires human approval, or must never be auto-executed.
///
/// POLICY SPEC LOCK v1.0.0
///
/// Phase 42 is ADVISORY ONLY:
/// - This engine returns decisions but does NOT change RunbookExecutor behavior.
/// - Decisions are logged and exposed via API for visibility.
/// - Phase 43+ may wire decisions into RunbookExecutor for controlled auto-remediation.
/// </summary>
public interface IRemediationPolicyEngine
{
    /// <summary>
    /// Evaluates the policy rules for the given context and returns a decision.
    /// </summary>
    /// <param name="context">The evaluation context containing step, plan, and incident info.</param>
    /// <returns>The remediation decision.</returns>
    /// <remarks>
    /// INVARIANTS:
    /// - This method MUST NOT mutate the context or any of its nested objects.
    /// - This method MUST be deterministic (same input → same output).
    /// - If no rule matches, returns RequireHumanApproval (conservative default).
    /// </remarks>
    RemediationDecision Evaluate(RemediationPolicyContext context);

    /// <summary>
    /// Evaluates policy rules for all steps in a plan.
    /// </summary>
    /// <param name="countyId">The county identifier.</param>
    /// <param name="severity">The incident severity.</param>
    /// <param name="plan">The runbook plan to evaluate.</param>
    /// <param name="timestamp">The current timestamp.</param>
    /// <param name="alertNames">Optional: related alert names.</param>
    /// <returns>A dictionary mapping step IDs to their decisions.</returns>
    IReadOnlyDictionary<string, RemediationDecision> EvaluatePlan(
        string countyId,
        Incidents.IncidentSeverity severity,
        RunbookPlan plan,
        DateTimeOffset timestamp,
        IReadOnlyList<string>? alertNames = null);
}
