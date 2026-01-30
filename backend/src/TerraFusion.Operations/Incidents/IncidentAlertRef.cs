// =============================================================================
// Phase 39: Incident Triage Engine - Alert Reference Model
// =============================================================================
// TRIAGE SPEC LOCK v1.0.0
// Represents a reference to an alert that triggered or contributed to an incident.
// =============================================================================

namespace TerraFusion.Operations.Incidents;

/// <summary>
/// Represents a reference to an alert in the incident.
/// Captures the essential alert metadata for correlation and audit.
/// </summary>
/// <remarks>
/// This DTO is designed to be compatible with Alertmanager webhook payloads.
/// Labels are preserved as-is for traceability back to the source alert.
/// </remarks>
public record IncidentAlertRef
{
    /// <summary>
    /// The name of the alert (e.g., "AtlasForecastErrorRateHigh", "SwarmSafeModeTriggered").
    /// Maps to the 'alertname' label in Prometheus alerts.
    /// </summary>
    public required string AlertName { get; init; }

    /// <summary>
    /// Alert labels including countyId, severity, component, and any custom labels.
    /// Preserved exactly as received from Alertmanager for audit purposes.
    /// </summary>
    public required Dictionary<string, string> Labels { get; init; }

    /// <summary>
    /// When the alert started firing.
    /// </summary>
    public required DateTime StartsAt { get; init; }

    /// <summary>
    /// When the alert was resolved. Null if still active.
    /// </summary>
    public DateTime? EndsAt { get; init; }

    /// <summary>
    /// Unique fingerprint for the alert (typically a hash of alertname + labels).
    /// Used for deduplication and correlation.
    /// </summary>
    public required string Fingerprint { get; init; }

    /// <summary>
    /// Extracts the county ID from labels if present.
    /// Returns null if countyId label is missing or invalid.
    /// </summary>
    public Guid? GetCountyId()
    {
        if (Labels.TryGetValue("countyId", out var countyIdStr) &&
            Guid.TryParse(countyIdStr, out var countyId))
        {
            return countyId;
        }
        return null;
    }

    /// <summary>
    /// Extracts the component name from labels if present.
    /// </summary>
    public string? GetComponent()
    {
        return Labels.TryGetValue("component", out var component) ? component : null;
    }

    /// <summary>
    /// Extracts the alert severity from labels if present.
    /// </summary>
    public string? GetSeverity()
    {
        return Labels.TryGetValue("severity", out var severity) ? severity : null;
    }
}
