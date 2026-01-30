// =============================================================================
// Phase 40A: AI-Driven Incident Runbook Engine - Data Models
// =============================================================================
// RUNBOOK SPEC LOCK v1.0.0
// These DTOs are FROZEN for Phase 40A. Any change requires explicit justification.
// =============================================================================

using TerraFusion.Operations.Incidents;

namespace TerraFusion.Operations.Runbooks;

/// <summary>
/// A single step in a runbook plan.
/// SPEC LOCK v1.0.0 - Do not modify without justification.
/// </summary>
public record RunbookStep
{
    /// <summary>Unique identifier for this step. Format: STEP-{6-digit}</summary>
    public required string StepId { get; init; }

    /// <summary>Execution order within the runbook (1-based).</summary>
    public required int Order { get; init; }

    /// <summary>Short title for the step.</summary>
    public required string Title { get; init; }

    /// <summary>Detailed description of what to do. MAY be enhanced by LLM.</summary>
    public required string Description { get; init; }

    /// <summary>Classification of the step type.</summary>
    public required RunbookStepKind Kind { get; init; }

    /// <summary>Risk level of executing this step.</summary>
    public required RunbookSafetyLevel SafetyLevel { get; init; }

    /// <summary>Whether human approval is required. ALWAYS true in Phase 40A.</summary>
    public required bool RequiresHumanApproval { get; init; }

    /// <summary>Whether this step could be automated in future phases. ALWAYS false in Phase 40A.</summary>
    public bool CanBeSuggestedForAutomation { get; init; } = false;

    /// <summary>Suggested role/team to execute this step.</summary>
    public string? SuggestedOwnerRole { get; init; }

    /// <summary>Alert names that triggered this step.</summary>
    public List<string> RelatedAlertNames { get; init; } = new();

    /// <summary>Metric names relevant to this step.</summary>
    public List<string> RelatedMetricNames { get; init; } = new();

    /// <summary>Estimated duration in minutes (optional).</summary>
    public int? EstimatedDurationMinutes { get; init; }
}

/// <summary>
/// A complete runbook plan for an incident.
/// SPEC LOCK v1.0.0 - Do not modify without justification.
/// </summary>
public record RunbookPlan
{
    /// <summary>Unique identifier for this plan. Format: PLAN-{guid}</summary>
    public required string PlanId { get; init; }

    /// <summary>The incident this runbook addresses.</summary>
    public required Guid IncidentId { get; init; }

    /// <summary>Short title for the runbook. MAY be refined by LLM.</summary>
    public required string Title { get; init; }

    /// <summary>Description of the overall recovery approach. MAY be refined by LLM.</summary>
    public required string Description { get; init; }

    /// <summary>Severity inherited from the incident.</summary>
    public required IncidentSeverity OverallSeverity { get; init; }

    /// <summary>Counties impacted (inherited from incident).</summary>
    public required List<Guid> ImpactedCountyIds { get; init; }

    /// <summary>Ordered list of steps to execute.</summary>
    public required List<RunbookStep> Steps { get; init; }

    /// <summary>When this plan was generated.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>Spec version for compatibility tracking.</summary>
    public string PlanVersion { get; init; } = "runbook-spec-v1.0.0";

    /// <summary>Audit information for compliance.</summary>
    public RunbookAuditInfo? AuditInfo { get; init; }
}

/// <summary>
/// Audit trail for runbook generation.
/// </summary>
public record RunbookAuditInfo
{
    /// <summary>Version of the runbook engine.</summary>
    public required string EngineVersion { get; init; }

    /// <summary>Time taken to generate the plan in milliseconds.</summary>
    public required long GenerationDurationMs { get; init; }

    /// <summary>List of template names applied during generation.</summary>
    public List<string> AppliedTemplates { get; init; } = new();

    /// <summary>Whether LLM enrichment was used.</summary>
    public bool LlmEnrichmentUsed { get; init; } = false;
}

/// <summary>
/// Configuration options for runbook generation.
/// </summary>
public record RunbookOptions
{
    /// <summary>Include steps for low-severity items (default: true).</summary>
    public bool IncludeLowSeveritySteps { get; init; } = true;

    /// <summary>Enable LLM explanation enrichment (default: false).</summary>
    public bool EnableLlmExplanation { get; init; } = false;

    /// <summary>Maximum time allowed for generation.</summary>
    public TimeSpan MaxGenerationTime { get; init; } = TimeSpan.FromSeconds(30);

    /// <summary>Target audience for descriptions.</summary>
    public string AudienceHint { get; init; } = "County IT operations staff";
}

/// <summary>
/// Configuration for the runbook engine.
/// </summary>
public class RunbookEngineOptions
{
    /// <summary>Engine version string.</summary>
    public string EngineVersion { get; set; } = "1.0.0";

    /// <summary>Default options for runbook generation.</summary>
    public RunbookOptions DefaultOptions { get; set; } = new();
}
