// =============================================================================
// Phase 43: Controlled Auto-Remediation - Configuration Options
// =============================================================================
// WIRING SPEC LOCK v1.0.0
// Feature flags and configuration for controlled auto-remediation.
// =============================================================================

namespace TerraFusion.Operations.Runbooks.Execution;

/// <summary>
/// Configuration options for controlled auto-remediation.
/// WIRING SPEC LOCK v1.0.0
///
/// Design principles:
/// - Conservative defaults: All auto-remediation disabled by default
/// - Per-county opt-in: Counties must explicitly opt in
/// - Audit by default: All policy decisions logged
/// - Immutable: Use records with read-only collections
/// </summary>
public record AutoRemediationOptions
{
    /// <summary>
    /// Global kill switch for auto-remediation.
    /// DEFAULT: false (all auto-remediation disabled).
    ///
    /// When false:
    /// - AllowAutoExecute decisions still require human approval
    /// - Policy decisions are still evaluated and logged
    /// - RequireHumanApproval and DenyAutoExecute still apply
    ///
    /// When true:
    /// - AllowAutoExecute decisions may auto-execute (if county opted in)
    /// - RequireHumanApproval and DenyAutoExecute still apply (hard stops)
    /// </summary>
    public bool EnableAutoRemediation { get; init; } = false;

    /// <summary>
    /// Set of county IDs that have opted into auto-remediation.
    /// DEFAULT: empty set (no counties opted in).
    ///
    /// Even if EnableAutoRemediation=true, only counties in this set
    /// can have steps auto-executed when policy returns AllowAutoExecute.
    ///
    /// County ID matching is case-sensitive by default.
    /// Use StringComparer.OrdinalIgnoreCase when constructing the set
    /// if case-insensitive matching is desired.
    /// </summary>
    /// <example>
    /// // Case-sensitive (default):
    /// OptedInCounties = new HashSet&lt;string&gt; { "benton", "yakima" }
    ///
    /// // Case-insensitive:
    /// OptedInCounties = new HashSet&lt;string&gt;(StringComparer.OrdinalIgnoreCase) { "benton" }
    /// </example>
    public IReadOnlySet<string> OptedInCounties { get; init; } = new HashSet<string>();

    /// <summary>
    /// Whether to log policy decisions for ALL step executions.
    /// DEFAULT: true (audit everything).
    ///
    /// When true:
    /// - Every policy decision is logged at Information level
    /// - Denied decisions are logged at Warning level
    /// - All decisions are persisted on RunbookStepExecution
    ///
    /// This flag is primarily for development/debugging.
    /// In production, this should always be true for audit compliance.
    /// </summary>
    public bool AlwaysLogPolicyDecisions { get; init; } = true;

    // =========================================================================
    // Phase 44: Benton-Only Safe Diagnostics Auto-Remediation
    // ROLLOUT SPEC LOCK v1.0.0
    // =========================================================================

    /// <summary>
    /// Whether to allow auto-execution of Safe Diagnostic steps.
    /// DEFAULT: false (all diagnostics require human approval).
    ///
    /// When true AND EnableAutoRemediation=true:
    /// - Steps with Kind=Diagnostic AND SafetyLevel=InfoOnly/LowRisk
    ///   may auto-execute (if county is opted in and policy allows)
    ///
    /// When false:
    /// - All steps require human approval, regardless of kind/safety
    ///
    /// Phase 44 scope: Only Diagnostic steps at InfoOnly/LowRisk can auto-execute.
    /// </summary>
    public bool AllowSafeDiagnosticsAutoExecute { get; init; } = false;

    // =========================================================================
    // Phase 44 Kill Switch: Instant OFF Lever
    // ROLLOUT SPEC LOCK v1.0.1
    // =========================================================================

    /// <summary>
    /// Hard kill switch that short-circuits ALL auto-execution.
    /// DEFAULT: true (KILL SWITCH ON = all automation disabled).
    ///
    /// When true:
    /// - NO auto-execution ever occurs, regardless of any other flags
    /// - Short-circuits BEFORE policy eligibility is considered
    /// - Policy decisions still evaluated for audit/observability
    /// - Every step requires human approval
    ///
    /// When false:
    /// - Phase 44 eligibility checks proceed normally
    /// - EnableAutoRemediation, AllowSafeDiagnosticsAutoExecute, etc. apply
    /// - Auto-execution may occur for eligible steps
    ///
    /// This is the "single instant OFF lever" for county IT staff.
    /// Even if all other flags are misconfigured, this ensures
    /// no runbook step auto-executes without human approval.
    /// </summary>
    public bool AutoRemediationKillSwitchEnabled { get; init; } = true;
}
