// =============================================================================
// Phase 39: Incident Triage Engine - Core Interface
// =============================================================================
// TRIAGE SPEC LOCK v1.0.0
// The primary interface for incident triage operations.
// =============================================================================

namespace TerraFusion.Operations.Incidents;

/// <summary>
/// Core interface for the incident triage engine.
/// Performs deterministic classification and grouping of alerts into incidents.
/// </summary>
/// <remarks>
/// Design principles:
/// - Pure service with no hidden dependencies
/// - Deterministic classification (same input = same output)
/// - County isolation enforced (alerts grouped by county)
/// - Auditable (all classification decisions logged)
///
/// The triage engine is the "brain" that:
/// 1. Groups related alerts (by time window, county, component)
/// 2. Determines overall severity
/// 3. Generates actionable recommendations
/// 4. Produces a structured IncidentSummary
///
/// LLM enrichment is handled separately by IIncidentExplanationService.
/// </remarks>
public interface IIncidentTriageEngine
{
    /// <summary>
    /// Performs AI-aware triage on incoming alerts and context.
    /// </summary>
    /// <param name="request">The triage request containing alerts and optional context.</param>
    /// <param name="cancellationToken">Cancellation token for the operation.</param>
    /// <returns>A structured incident summary with classification and recommendations.</returns>
    /// <exception cref="ArgumentNullException">If request is null.</exception>
    /// <exception cref="ArgumentException">If request contains no alerts.</exception>
    Task<IncidentSummary> TriageAsync(
        IncidentTriageRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets triage recommendations for a specific incident type.
    /// Useful for generating recommendations outside of full triage flow.
    /// </summary>
    /// <param name="alertNames">List of alert names to generate recommendations for.</param>
    /// <param name="severity">The severity level for context.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of recommendations for the given alert types.</returns>
    Task<List<IncidentRecommendation>> GetRecommendationsForAlertsAsync(
        IEnumerable<string> alertNames,
        IncidentSeverity severity,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates if the triage engine can handle the given alert types.
    /// </summary>
    /// <param name="alertNames">Alert names to validate.</param>
    /// <returns>True if all alerts are recognized, false otherwise.</returns>
    bool CanTriageAlerts(IEnumerable<string> alertNames);
}

/// <summary>
/// Configuration options for the incident triage engine.
/// </summary>
public class IncidentTriageOptions
{
    /// <summary>
    /// Configuration section name in appsettings.json.
    /// </summary>
    public const string SectionName = "IncidentTriage";

    /// <summary>
    /// Time window (in minutes) for grouping related alerts into a single incident.
    /// Default: 5 minutes.
    /// </summary>
    public int GroupingTimeWindowMinutes { get; set; } = 5;

    /// <summary>
    /// Whether to group alerts across different components.
    /// If false, Atlas and Swarm alerts are always separate incidents.
    /// Default: false (component isolation).
    /// </summary>
    public bool GroupAcrossComponents { get; set; } = false;

    /// <summary>
    /// Maximum number of alerts per incident.
    /// If exceeded, additional alerts create new incidents.
    /// Default: 50.
    /// </summary>
    public int MaxAlertsPerIncident { get; set; } = 50;

    /// <summary>
    /// Minimum recommendations to generate per incident.
    /// Default: 2.
    /// </summary>
    public int MinRecommendations { get; set; } = 2;

    /// <summary>
    /// Maximum recommendations to generate per incident.
    /// Default: 7.
    /// </summary>
    public int MaxRecommendations { get; set; } = 7;

    /// <summary>
    /// Whether to enable LLM explanation after deterministic triage.
    /// Default: false (opt-in).
    /// </summary>
    public bool EnableLlmExplanation { get; set; } = false;

    /// <summary>
    /// Triage engine version string for audit purposes.
    /// </summary>
    public string EngineVersion { get; set; } = "1.0.0-phase39";
}
