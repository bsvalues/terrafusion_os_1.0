// =============================================================================
// Phase 40A: AI-Driven Incident Runbook Engine - LLM Explanation Interface
// =============================================================================
// RUNBOOK SPEC LOCK v1.0.0
// Optional LLM-based enrichment for runbook plans.
// LLM is narrator only - cannot modify safety properties.
// =============================================================================

using TerraFusion.Operations.Incidents;

namespace TerraFusion.Operations.Runbooks;

/// <summary>
/// Optional LLM-based enrichment for runbook plans.
/// SPEC LOCK v1.0.0 - LLM is narrator only, cannot modify safety properties.
/// </summary>
/// <remarks>
/// CRITICAL CONSTRAINTS (enforced by implementation):
/// - MUST NOT modify Step.SafetyLevel
/// - MUST NOT modify Step.RequiresHumanApproval
/// - MUST NOT add steps with CanBeSuggestedForAutomation = true
/// - MUST NOT remove steps
/// - MAY modify Title, Description, Step.Description text only
///
/// If LLM fails, original plan is returned unchanged.
/// </remarks>
public interface IRunbookExplanationService
{
    /// <summary>
    /// Enriches a runbook plan with LLM-generated explanations.
    /// </summary>
    /// <param name="plan">The deterministic plan to enrich.</param>
    /// <param name="incident">The original incident for context.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The plan with enriched descriptions, or original if LLM unavailable.</returns>
    Task<RunbookPlan> EnrichWithExplanationAsync(
        RunbookPlan plan,
        IncidentSummary incident,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if the LLM service is available.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if LLM service is available and can be used.</returns>
    Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// No-op implementation of IRunbookExplanationService.
/// Returns the plan unchanged - used when LLM is disabled or unavailable.
/// </summary>
public class NullRunbookExplanationService : IRunbookExplanationService
{
    /// <inheritdoc />
    public Task<RunbookPlan> EnrichWithExplanationAsync(
        RunbookPlan plan,
        IncidentSummary incident,
        CancellationToken cancellationToken = default)
    {
        // Return plan unchanged - LLM is not available
        return Task.FromResult(plan);
    }

    /// <inheritdoc />
    public Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
    {
        // NullService is never "available" for enrichment
        return Task.FromResult(false);
    }
}
