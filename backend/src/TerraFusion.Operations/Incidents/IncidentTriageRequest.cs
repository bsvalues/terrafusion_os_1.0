// =============================================================================
// Phase 39: Incident Triage Engine - Triage Request Model
// =============================================================================
// TRIAGE SPEC LOCK v1.0.0
// Input DTO for the IIncidentTriageEngine.TriageAsync method.
// =============================================================================

namespace TerraFusion.Operations.Incidents;

/// <summary>
/// Request payload for incident triage.
/// Contains alerts and optional context (metrics, traces) for correlation.
/// </summary>
/// <remarks>
/// This DTO is designed to accept:
/// - Alertmanager webhook payloads (converted to IncidentAlertRef list)
/// - Manual triage requests with context
/// - Automated polling results from metrics/traces
/// </remarks>
public record IncidentTriageRequest
{
    /// <summary>
    /// List of alerts to triage. At least one alert is required.
    /// Alerts are grouped and classified into incidents.
    /// </summary>
    public required List<IncidentAlertRef> Alerts { get; init; }

    /// <summary>
    /// Optional metric snapshots for correlation.
    /// Provides context for classification and recommendations.
    /// </summary>
    public List<IncidentMetricSnapshot>? MetricSnapshots { get; init; }

    /// <summary>
    /// Optional trace IDs for correlation.
    /// Links to Phase 36 distributed traces for debugging.
    /// </summary>
    public List<string>? TraceIds { get; init; }

    /// <summary>
    /// Optional county ID filter. If specified, triage focuses on this county.
    /// Used for county-scoped triage requests.
    /// </summary>
    public Guid? RequestedByCountyId { get; init; }

    /// <summary>
    /// Optional request metadata for audit purposes.
    /// </summary>
    public TriageRequestMetadata? Metadata { get; init; }

    /// <summary>
    /// Validates the request. Returns true if valid.
    /// </summary>
    public bool IsValid(out string? errorMessage)
    {
        if (Alerts == null || Alerts.Count == 0)
        {
            errorMessage = "At least one alert is required for triage.";
            return false;
        }

        errorMessage = null;
        return true;
    }
}

/// <summary>
/// Optional metadata for triage requests.
/// Used for audit trail and debugging.
/// </summary>
public record TriageRequestMetadata
{
    /// <summary>
    /// Source of the triage request (e.g., "alertmanager", "manual", "scheduled").
    /// </summary>
    public string? Source { get; init; }

    /// <summary>
    /// Correlation ID for distributed tracing.
    /// </summary>
    public string? CorrelationId { get; init; }

    /// <summary>
    /// User or service that initiated the request.
    /// </summary>
    public string? RequestedBy { get; init; }

    /// <summary>
    /// Timestamp when the request was created.
    /// </summary>
    public DateTime? RequestedAt { get; init; }
}
