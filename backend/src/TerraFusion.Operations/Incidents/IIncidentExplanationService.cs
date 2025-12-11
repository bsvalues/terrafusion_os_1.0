// =============================================================================
// Phase 39: Incident Triage Engine - LLM Explanation Interface
// =============================================================================
// TRIAGE SPEC LOCK v1.0.0
// Optional interface for LLM-powered incident explanation.
// =============================================================================

namespace TerraFusion.Operations.Incidents;

/// <summary>
/// Interface for the LLM-powered incident explanation service.
/// Enriches deterministic incident summaries with AI-generated explanations.
/// </summary>
/// <remarks>
/// DESIGN PRINCIPLE: Deterministic classification + LLM-as-explainer
///
/// The LLM layer sits AFTER the deterministic triage engine and:
/// - MAY refine: title, description, recommendations
/// - MUST NOT change: incidentId, severity, impactedCountyIds, alerts, metrics
///
/// Implementations:
/// - NullIncidentExplanationService: No-op, returns incident unchanged
/// - SystemGptIncidentExplanationService: Uses SystemGPT for explanation
///
/// Safety guarantees:
/// - Graceful fallback if LLM fails (returns original incident)
/// - Timeout protection
/// - Immutability constraints enforced
/// </remarks>
public interface IIncidentExplanationService
{
    /// <summary>
    /// Enriches an incident summary with LLM-generated explanations.
    /// </summary>
    /// <param name="incident">The deterministic incident summary to enrich.</param>
    /// <param name="options">Optional configuration for the explanation request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>
    /// An enriched incident summary with refined title, description, and recommendations.
    /// If LLM fails, returns the original incident unchanged.
    /// </returns>
    /// <remarks>
    /// IMMUTABILITY CONTRACT:
    /// The returned IncidentSummary MUST have the same values for:
    /// - IncidentId
    /// - OverallSeverity
    /// - ImpactedCountyIds
    /// - Alerts
    /// - Metrics
    ///
    /// Only the following fields MAY be modified:
    /// - Title (refined for clarity)
    /// - Description (expanded with explanation)
    /// - Recommendations (enhanced with details/priorities)
    /// - LlmEnriched (set to true)
    /// - AuditInfo.LlmModelUsed
    /// - AuditInfo.LlmExplanationDurationMs
    /// </remarks>
    Task<IncidentSummary> EnrichWithExplanationAsync(
        IncidentSummary incident,
        IncidentExplanationOptions? options = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if the explanation service is available and configured.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if LLM explanation is available.</returns>
    Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// No-op implementation of IIncidentExplanationService.
/// Returns incidents unchanged. Used when LLM explanation is disabled.
/// </summary>
public class NullIncidentExplanationService : IIncidentExplanationService
{
    /// <inheritdoc />
    public Task<IncidentSummary> EnrichWithExplanationAsync(
        IncidentSummary incident,
        IncidentExplanationOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        // No-op: return incident unchanged
        return Task.FromResult(incident);
    }

    /// <inheritdoc />
    public Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default)
    {
        // Always "available" but does nothing
        return Task.FromResult(false);
    }
}
