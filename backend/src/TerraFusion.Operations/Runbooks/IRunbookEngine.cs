// =============================================================================
// Phase 40A: AI-Driven Incident Runbook Engine - Core Interface
// =============================================================================
// RUNBOOK SPEC LOCK v1.0.0
// The primary interface for runbook generation operations.
// =============================================================================

using TerraFusion.Operations.Incidents;

namespace TerraFusion.Operations.Runbooks;

/// <summary>
/// Core interface for runbook generation.
/// SPEC LOCK v1.0.0
/// </summary>
/// <remarks>
/// Design principles:
/// - Deterministic: Same incident always produces same runbook
/// - Safety-first: All steps require human approval in Phase 40A
/// - Auditable: All generation decisions logged
/// - Government-compliant: FISMA-High requirements met
///
/// The runbook engine transforms an IncidentSummary (from Phase 39 triage)
/// into an ordered, safety-aware RunbookPlan that county IT staff can follow.
/// </remarks>
public interface IRunbookEngine
{
    /// <summary>
    /// Generates a runbook plan for the given incident.
    /// </summary>
    /// <param name="incident">The triaged incident summary from Phase 39.</param>
    /// <param name="options">Optional configuration for generation.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A deterministic runbook plan with ordered steps.</returns>
    /// <exception cref="ArgumentNullException">If incident is null.</exception>
    Task<RunbookPlan> GenerateRunbookAsync(
        IncidentSummary incident,
        RunbookOptions? options = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the list of alert names this engine can handle.
    /// </summary>
    IReadOnlyList<string> SupportedAlertNames { get; }

    /// <summary>
    /// Validates if the engine can generate a runbook for the given incident.
    /// </summary>
    /// <param name="incident">The incident to validate.</param>
    /// <returns>True if the engine can handle all alerts in the incident.</returns>
    bool CanHandleIncident(IncidentSummary incident);
}
