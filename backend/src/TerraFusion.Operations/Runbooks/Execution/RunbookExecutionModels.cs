// =============================================================================
// Phase 41: Runbook Execution Engine - Data Models
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0
// These DTOs are FROZEN for Phase 41. Any change requires explicit justification.
// =============================================================================

using TerraFusion.Operations.Incidents;

namespace TerraFusion.Operations.Runbooks.Execution;

/// <summary>
/// Tracks execution of a complete runbook plan.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
/// <remarks>
/// Immutability constraints:
/// - The underlying RunbookPlan MUST NOT be modified.
/// - Once created, only status and timestamp fields should change.
/// </remarks>
public record RunbookExecution
{
    /// <summary>Unique identifier for this execution. Format: EXEC-{guid}</summary>
    public required string ExecutionId { get; init; }

    /// <summary>Reference to the plan being executed.</summary>
    public required string PlanId { get; init; }

    /// <summary>Reference to the incident this execution addresses.</summary>
    public required Guid IncidentId { get; init; }

    /// <summary>Severity inherited from the incident.</summary>
    public required IncidentSeverity Severity { get; init; }

    /// <summary>Current status of the execution.</summary>
    public required RunbookExecutionStatus Status { get; init; }

    /// <summary>When this execution was created.</summary>
    public required DateTimeOffset CreatedAt { get; init; }

    /// <summary>When execution started (null if not yet started).</summary>
    public DateTimeOffset? StartedAt { get; init; }

    /// <summary>When execution completed/failed/cancelled.</summary>
    public DateTimeOffset? CompletedAt { get; init; }

    /// <summary>Individual step execution states.</summary>
    public required IReadOnlyList<RunbookStepExecution> Steps { get; init; }

    /// <summary>Who initiated this execution (user/system id).</summary>
    public string? StartedBy { get; init; }

    /// <summary>Notes or reason for execution.</summary>
    public string? Notes { get; init; }

    /// <summary>Whether this is a dry run (no real actions).</summary>
    public bool IsDryRun { get; init; }

    /// <summary>Spec version for compatibility tracking.</summary>
    public string ExecutionVersion { get; init; } = "execution-spec-v1.0.0";
}

/// <summary>
/// Tracks execution of a single runbook step.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
public record RunbookStepExecution
{
    /// <summary>Matches RunbookStep.StepId from the plan.</summary>
    public required string StepId { get; init; }

    /// <summary>Step order from the plan.</summary>
    public required int Order { get; init; }

    /// <summary>Current execution status of this step.</summary>
    public required RunbookStepExecutionStatus Status { get; init; }

    /// <summary>When this step started execution.</summary>
    public DateTimeOffset? StartedAt { get; init; }

    /// <summary>When this step completed/failed.</summary>
    public DateTimeOffset? CompletedAt { get; init; }

    /// <summary>Error message if step failed.</summary>
    public string? ErrorMessage { get; init; }

    /// <summary>Who approved this step (required for RequiresHumanApproval steps).</summary>
    public string? ApprovedBy { get; init; }

    /// <summary>When approval was granted.</summary>
    public DateTimeOffset? ApprovedAt { get; init; }

    /// <summary>Result output from the action provider (if any).</summary>
    public string? ActionOutput { get; init; }
}

/// <summary>
/// Configuration options for runbook execution.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
public record RunbookExecutionOptions
{
    /// <summary>If true, no real actions are executed (simulation mode). DEFAULT: true for Phase 41.</summary>
    public bool DryRun { get; init; } = true;

    /// <summary>If true, Safe steps may auto-execute without approval. DEFAULT: false for Phase 41.</summary>
    public bool AllowSafeAutoExecution { get; init; } = false;

    /// <summary>Maximum time allowed per step. DEFAULT: 5 minutes.</summary>
    public TimeSpan StepTimeout { get; init; } = TimeSpan.FromMinutes(5);

    /// <summary>Maximum concurrent steps (for future parallelism). DEFAULT: 1 (sequential).</summary>
    public int MaxConcurrentSteps { get; init; } = 1;

    /// <summary>Notes or reason for this execution.</summary>
    public string? ExecutionNotes { get; init; }

    /// <summary>User or system initiating the execution.</summary>
    public string? InitiatedBy { get; init; }
}

/// <summary>
/// Result of executing a single runbook step action.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
public record RunbookStepResult
{
    /// <summary>Whether the action succeeded.</summary>
    public required bool Success { get; init; }

    /// <summary>Error message if the action failed.</summary>
    public string? ErrorMessage { get; init; }

    /// <summary>Output from the action (logs, results, etc.).</summary>
    public string? Output { get; init; }

    /// <summary>Duration of the action execution.</summary>
    public TimeSpan? Duration { get; init; }

    /// <summary>Creates a successful result.</summary>
    public static RunbookStepResult Succeeded(string? output = null, TimeSpan? duration = null)
        => new() { Success = true, Output = output, Duration = duration };

    /// <summary>Creates a failed result.</summary>
    public static RunbookStepResult Failed(string errorMessage, string? output = null, TimeSpan? duration = null)
        => new() { Success = false, ErrorMessage = errorMessage, Output = output, Duration = duration };
}
