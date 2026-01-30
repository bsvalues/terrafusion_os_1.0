// =============================================================================
// Phase 42: Auto-Remediation Policy Engine - Enumerations
// =============================================================================
// POLICY SPEC LOCK v1.0.0
// These enums are FROZEN for Phase 42. Any change requires explicit justification.
// =============================================================================

namespace TerraFusion.Operations.Runbooks.Remediation;

/// <summary>
/// The kind of decision returned by the remediation policy engine.
/// POLICY SPEC LOCK v1.0.0
/// </summary>
public enum RemediationDecisionKind
{
    /// <summary>
    /// Step MAY be safely auto-executed under the matched policy rule.
    /// Future phases may act on this to skip human approval for safe steps.
    /// </summary>
    AllowAutoExecute = 0,

    /// <summary>
    /// Step MUST require human approval before execution.
    /// This is the default when no rule matches (conservative behavior).
    /// </summary>
    RequireHumanApproval = 1,

    /// <summary>
    /// Step MUST NEVER be auto-executed, even in future phases.
    /// Reserved for high-risk operations that always need human oversight.
    /// </summary>
    DenyAutoExecute = 2
}
