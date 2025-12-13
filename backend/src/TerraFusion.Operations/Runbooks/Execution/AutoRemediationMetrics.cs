// =============================================================================
// Phase 45: Auto-Remediation Metrics
// =============================================================================
// METRIC SPEC LOCK v1.0.0
// Prometheus metrics for auto-remediation observability and governance.
// =============================================================================

using System.Diagnostics.Metrics;
using System.Collections.Concurrent;

namespace TerraFusion.Operations.Runbooks.Execution;

/// <summary>
/// Phase 45 metrics for auto-remediation observability.
/// METRIC SPEC LOCK v1.0.0
///
/// Exposed metrics:
/// - tf_runbook_autoexec_attempt_total{county_id, step_kind, safety_level, dry_run}
/// - tf_runbook_autoexec_real_total{county_id, step_kind, safety_level}
/// - tf_runbook_autoexec_simulated_total{county_id, step_kind, safety_level}
/// - tf_runbook_autoexec_block_total{county_id, reason}
/// - tf_runbook_killswitch_enabled{county_id}
/// - tf_runbook_autoexec_invariant_violation_total{county_id, invariant}
///
/// BANNED LABELS (high cardinality):
/// - step_id, execution_id, plan_id, user_id, incident_id
/// </summary>
public sealed class AutoRemediationMetrics
{
    private static readonly Meter s_meter = new("TerraFusion.Operations.AutoRemediation", "1.0.0");

    // Counters
    private static readonly Counter<long> s_attemptCounter;
    private static readonly Counter<long> s_realCounter;
    private static readonly Counter<long> s_simulatedCounter;
    private static readonly Counter<long> s_blockCounter;
    private static readonly Counter<long> s_invariantViolationCounter;

    // Gauges (observable)
    private static readonly ConcurrentDictionary<string, int> s_killSwitchStates = new();

    static AutoRemediationMetrics()
    {
        // Attempt counter (all auto-exec attempts, real or simulated)
        s_attemptCounter = s_meter.CreateCounter<long>(
            name: "tf_runbook_autoexec_attempt_total",
            unit: "{attempts}",
            description: "Total auto-execution attempts (real or DryRun)");

        // Real execution counter
        s_realCounter = s_meter.CreateCounter<long>(
            name: "tf_runbook_autoexec_real_total",
            unit: "{executions}",
            description: "Total real auto-executions (not DryRun)");

        // Simulated (DryRun) counter
        s_simulatedCounter = s_meter.CreateCounter<long>(
            name: "tf_runbook_autoexec_simulated_total",
            unit: "{simulations}",
            description: "Total simulated auto-executions (DryRun)");

        // Block counter by reason
        s_blockCounter = s_meter.CreateCounter<long>(
            name: "tf_runbook_autoexec_block_total",
            unit: "{blocks}",
            description: "Total auto-execution blocks by reason");

        // Invariant violation counter
        s_invariantViolationCounter = s_meter.CreateCounter<long>(
            name: "tf_runbook_autoexec_invariant_violation_total",
            unit: "{violations}",
            description: "Total Phase 44/45 invariant violations detected");

        // Kill switch gauge (observable)
        s_meter.CreateObservableGauge(
            name: "tf_runbook_killswitch_enabled",
            observeValues: ObserveKillSwitchStates,
            unit: "{state}",
            description: "Kill switch state per county (1=ON/blocked, 0=OFF/enabled)");
    }

    #region Public API

    /// <summary>
    /// Records an auto-execution attempt.
    /// </summary>
    public static void RecordAttempt(string countyId, string stepKind, string safetyLevel, bool dryRun)
    {
        s_attemptCounter.Add(1,
            new KeyValuePair<string, object?>("county_id", SanitizeLabel(countyId)),
            new KeyValuePair<string, object?>("step_kind", SanitizeLabel(stepKind)),
            new KeyValuePair<string, object?>("safety_level", SanitizeLabel(safetyLevel)),
            new KeyValuePair<string, object?>("dry_run", dryRun.ToString().ToLowerInvariant()));

        if (dryRun)
        {
            RecordSimulated(countyId, stepKind, safetyLevel);
        }
        else
        {
            RecordReal(countyId, stepKind, safetyLevel);
        }
    }

    /// <summary>
    /// Records a real (non-DryRun) auto-execution.
    /// </summary>
    public static void RecordReal(string countyId, string stepKind, string safetyLevel)
    {
        s_realCounter.Add(1,
            new KeyValuePair<string, object?>("county_id", SanitizeLabel(countyId)),
            new KeyValuePair<string, object?>("step_kind", SanitizeLabel(stepKind)),
            new KeyValuePair<string, object?>("safety_level", SanitizeLabel(safetyLevel)));
    }

    /// <summary>
    /// Records a simulated (DryRun) auto-execution.
    /// </summary>
    public static void RecordSimulated(string countyId, string stepKind, string safetyLevel)
    {
        s_simulatedCounter.Add(1,
            new KeyValuePair<string, object?>("county_id", SanitizeLabel(countyId)),
            new KeyValuePair<string, object?>("step_kind", SanitizeLabel(stepKind)),
            new KeyValuePair<string, object?>("safety_level", SanitizeLabel(safetyLevel)));
    }

    /// <summary>
    /// Records an auto-execution block with reason.
    /// </summary>
    /// <param name="countyId">County ID</param>
    /// <param name="reason">Block reason: killswitch, flags, policy, county, safety, kind, dryrun</param>
    public static void RecordBlock(string countyId, AutoExecBlockReason reason)
    {
        s_blockCounter.Add(1,
            new KeyValuePair<string, object?>("county_id", SanitizeLabel(countyId)),
            new KeyValuePair<string, object?>("reason", reason.ToString().ToLowerInvariant()));
    }

    /// <summary>
    /// Records an invariant violation.
    /// </summary>
    /// <param name="countyId">County ID where violation occurred</param>
    /// <param name="invariant">Invariant code: benton_only, safe_only, diagnostics_only, dryrun_no_exec</param>
    public static void RecordInvariantViolation(string countyId, AutoExecInvariant invariant)
    {
        s_invariantViolationCounter.Add(1,
            new KeyValuePair<string, object?>("county_id", SanitizeLabel(countyId)),
            new KeyValuePair<string, object?>("invariant", invariant.ToString().ToLowerInvariant()));
    }

    /// <summary>
    /// Updates the kill switch state for a county.
    /// </summary>
    /// <param name="countyId">County ID</param>
    /// <param name="enabled">True if kill switch is ON (blocking), false if OFF (allowing)</param>
    public static void SetKillSwitchState(string countyId, bool enabled)
    {
        s_killSwitchStates[SanitizeLabel(countyId)] = enabled ? 1 : 0;
    }

    #endregion

    #region Private Helpers

    private static IEnumerable<Measurement<int>> ObserveKillSwitchStates()
    {
        foreach (var kvp in s_killSwitchStates)
        {
            yield return new Measurement<int>(
                kvp.Value,
                new KeyValuePair<string, object?>("county_id", kvp.Key));
        }
    }

    /// <summary>
    /// Sanitizes a label value to prevent high-cardinality issues.
    /// </summary>
    private static string SanitizeLabel(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "unknown";

        // Truncate to prevent unbounded cardinality
        if (value.Length > 64)
            value = value[..64];

        // Replace any problematic characters
        return value.ToLowerInvariant().Replace(' ', '_');
    }

    #endregion
}

/// <summary>
/// Reasons for blocking auto-execution.
/// METRIC SPEC LOCK v1.0.0
/// </summary>
public enum AutoExecBlockReason
{
    /// <summary>Hard kill switch is ON.</summary>
    KillSwitch,

    /// <summary>Feature flags disabled (EnableAutoRemediation, AllowSafeDiagnosticsAutoExecute).</summary>
    Flags,

    /// <summary>Policy returned RequireHumanApproval or DenyAutoExecute.</summary>
    Policy,

    /// <summary>County not in OptedInCounties.</summary>
    County,

    /// <summary>Step safety level not eligible (MediumRisk, HighRisk).</summary>
    Safety,

    /// <summary>Step kind not eligible (non-Diagnostic).</summary>
    Kind,

    /// <summary>DryRun mode prevented real execution.</summary>
    DryRun
}

/// <summary>
/// Phase 44/45 invariant codes for violation tracking.
/// METRIC SPEC LOCK v1.0.0
/// </summary>
public enum AutoExecInvariant
{
    /// <summary>Non-Benton county auto-exec attempted.</summary>
    BentonOnly,

    /// <summary>MediumRisk or HighRisk step auto-exec attempted.</summary>
    SafeOnly,

    /// <summary>Non-Diagnostic step auto-exec attempted.</summary>
    DiagnosticsOnly,

    /// <summary>DryRun flag was ignored (step actually executed).</summary>
    DryRunNoExec
}
