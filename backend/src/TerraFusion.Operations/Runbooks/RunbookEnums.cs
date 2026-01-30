// =============================================================================
// Phase 40A: AI-Driven Incident Runbook Engine - Enumerations
// =============================================================================
// RUNBOOK SPEC LOCK v1.0.0
// These enums are FROZEN for Phase 40A. Any change requires explicit justification.
// =============================================================================

namespace TerraFusion.Operations.Runbooks;

/// <summary>
/// Classification of runbook step types.
/// SPEC LOCK v1.0.0
/// </summary>
public enum RunbookStepKind
{
    /// <summary>Gather information (logs, metrics, status).</summary>
    Diagnostic = 0,

    /// <summary>Review or validate configuration.</summary>
    ConfigCheck = 1,

    /// <summary>Restart a service or component.</summary>
    RestartService = 2,

    /// <summary>Scale out resources (add capacity).</summary>
    ScaleOut = 3,

    /// <summary>Failover to backup/secondary.</summary>
    Failover = 4,

    /// <summary>Send notification or escalation.</summary>
    Notification = 5,

    /// <summary>Manual investigation required.</summary>
    ManualInvestigation = 6,

    /// <summary>Validate data integrity.</summary>
    DataValidation = 7,

    /// <summary>Rollback a recent change.</summary>
    Rollback = 8,

    /// <summary>Other/uncategorized step.</summary>
    Other = 99
}

/// <summary>
/// Risk level for runbook steps.
/// SPEC LOCK v1.0.0
/// </summary>
public enum RunbookSafetyLevel
{
    /// <summary>Read-only, no risk (viewing dashboards, logs).</summary>
    InfoOnly = 0,

    /// <summary>Low risk (minor config review, non-destructive).</summary>
    LowRisk = 1,

    /// <summary>Medium risk (service restart, cache clear).</summary>
    MediumRisk = 2,

    /// <summary>High risk (failover, data modification, production change).</summary>
    HighRisk = 3
}
