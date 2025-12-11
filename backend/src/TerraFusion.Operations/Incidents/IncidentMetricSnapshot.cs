// =============================================================================
// Phase 39: Incident Triage Engine - Metric Snapshot Model
// =============================================================================
// TRIAGE SPEC LOCK v1.0.0
// Represents a metric snapshot captured at triage time for correlation.
// =============================================================================

namespace TerraFusion.Operations.Incidents;

/// <summary>
/// Represents a metric snapshot for correlation with the incident.
/// Captures point-in-time metric values from Phase 35 Prometheus metrics.
/// </summary>
/// <remarks>
/// Metric names should match Phase 35 definitions:
/// - atlas_forecast_*
/// - swarm_predictive_*
/// - atlas_anomaly_*
/// - atlas_telemetry_*
/// </remarks>
public record IncidentMetricSnapshot
{
    /// <summary>
    /// The county ID associated with this metric value.
    /// Required for county isolation compliance.
    /// </summary>
    public required Guid CountyId { get; init; }

    /// <summary>
    /// The name of the metric (e.g., "atlas_forecast_engine_errors_total").
    /// Should match a Phase 35 Prometheus metric name.
    /// </summary>
    public required string MetricName { get; init; }

    /// <summary>
    /// The metric value at snapshot time.
    /// </summary>
    public required double Value { get; init; }

    /// <summary>
    /// Optional unit for the metric value (e.g., "seconds", "requests", "percent").
    /// </summary>
    public string? Unit { get; init; }

    /// <summary>
    /// When this metric snapshot was captured.
    /// </summary>
    public required DateTime Timestamp { get; init; }

    /// <summary>
    /// Optional additional labels for the metric (beyond countyId).
    /// </summary>
    public Dictionary<string, string>? AdditionalLabels { get; init; }
}
