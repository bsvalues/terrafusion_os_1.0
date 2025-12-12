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
    /// Generates an LLM explanation for an incident without modifying it.
    /// </summary>
    /// <param name="incident">The incident to explain.</param>
    /// <param name="options">Optional configuration for the explanation request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Generated explanation or null if LLM is unavailable.</returns>
    Task<IncidentExplanation?> GenerateExplanationAsync(
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

    /// <inheritdoc />
    public Task<IncidentExplanation?> GenerateExplanationAsync(
        IncidentSummary incident,
        IncidentExplanationOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        // No-op: return null explanation
        return Task.FromResult<IncidentExplanation?>(null);
    }
}

/// <summary>
/// LLM-generated explanation for an incident.
/// Optional enrichment layer added after deterministic triage.
/// </summary>
public record IncidentExplanation
{
    /// <summary>
    /// High-level summary of what happened.
    /// </summary>
    public string Summary { get; init; } = string.Empty;

    /// <summary>
    /// Hypothesis about the root cause of the incident.
    /// </summary>
    public string RootCauseHypothesis { get; init; } = string.Empty;

    /// <summary>
    /// Assessment of the impact on county operations.
    /// </summary>
    public string ImpactAssessment { get; init; } = string.Empty;

    /// <summary>
    /// Ordered list of remediation steps to resolve the incident.
    /// </summary>
    public List<string> RemediationSteps { get; init; } = new();

    /// <summary>
    /// Confidence level of the LLM in its explanation.
    /// </summary>
    public ConfidenceLevel Confidence { get; init; } = ConfidenceLevel.Medium;

    /// <summary>
    /// When this explanation was generated.
    /// </summary>
    public DateTime GeneratedAt { get; init; } = DateTime.UtcNow;
}
