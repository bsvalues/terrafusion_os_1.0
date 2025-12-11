// =============================================================================
// Phase 39: Incident Triage Engine - Enumerations
// =============================================================================
// TRIAGE SPEC LOCK v1.0.0
// These enums are FROZEN for Phase 39. Any change requires explicit justification.
// =============================================================================

namespace TerraFusion.Operations.Incidents;

/// <summary>
/// Severity level for an incident.
/// Maps to Prometheus alert severities and determines escalation priority.
/// </summary>
public enum IncidentSeverity
{
    /// <summary>
    /// Informational incident - no immediate action required.
    /// Typically from info-level alerts or minor anomalies.
    /// </summary>
    Info = 0,

    /// <summary>
    /// Warning-level incident - attention required but not critical.
    /// Service degradation detected but not yet impacting citizens.
    /// </summary>
    Warning = 1,

    /// <summary>
    /// Critical incident - immediate action required.
    /// Service outage or severe degradation affecting citizen services.
    /// </summary>
    Critical = 2
}

/// <summary>
/// Lifecycle status of an incident.
/// Follows standard incident management workflows.
/// </summary>
public enum IncidentStatus
{
    /// <summary>
    /// Incident newly created by triage engine.
    /// </summary>
    New = 0,

    /// <summary>
    /// Incident acknowledged by on-call engineer.
    /// </summary>
    Acknowledged = 1,

    /// <summary>
    /// Incident actively being worked on.
    /// </summary>
    InProgress = 2,

    /// <summary>
    /// Incident resolved - service restored.
    /// </summary>
    Resolved = 3,

    /// <summary>
    /// Incident closed after postmortem review.
    /// </summary>
    Closed = 4
}

/// <summary>
/// Category of recommendation for incident response.
/// Maps to known TerraFusion components and action types.
/// </summary>
public enum RecommendationCategory
{
    /// <summary>
    /// Capacity-related recommendation (scale up/down, resource allocation).
    /// </summary>
    Capacity = 0,

    /// <summary>
    /// Configuration-related recommendation (settings, feature flags).
    /// </summary>
    Configuration = 1,

    /// <summary>
    /// Swarm subsystem recommendation (predictive policy, cooldown).
    /// </summary>
    Swarm = 2,

    /// <summary>
    /// Guardrails recommendation (safety limits, circuit breakers).
    /// </summary>
    Guardrails = 3,

    /// <summary>
    /// Atlas subsystem recommendation (forecasting, orchestration).
    /// </summary>
    Atlas = 4,

    /// <summary>
    /// External dependency recommendation (database, cache, third-party).
    /// </summary>
    ExternalDependency = 5,

    /// <summary>
    /// Unknown or unclassified recommendation.
    /// </summary>
    Unknown = 99
}

/// <summary>
/// Confidence level for a recommendation.
/// Based on correlation strength and historical accuracy.
/// </summary>
public enum ConfidenceLevel
{
    /// <summary>
    /// Low confidence - recommendation is speculative.
    /// Based on limited data or weak correlation.
    /// </summary>
    Low = 0,

    /// <summary>
    /// Medium confidence - recommendation is reasonable.
    /// Based on moderate correlation and typical patterns.
    /// </summary>
    Medium = 1,

    /// <summary>
    /// High confidence - recommendation is strongly supported.
    /// Based on strong correlation and known failure modes.
    /// </summary>
    High = 2
}
