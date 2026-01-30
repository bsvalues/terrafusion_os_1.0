// =============================================================================
// Phase 41: Runbook Execution Engine - Enumerations
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0
// These enums are FROZEN for Phase 41. Any change requires explicit justification.
// =============================================================================

namespace TerraFusion.Operations.Runbooks.Execution;

/// <summary>
/// Status of a runbook execution.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
public enum RunbookExecutionStatus
{
    /// <summary>Execution created but not yet started.</summary>
    Pending = 0,

    /// <summary>Execution is currently running.</summary>
    Running = 1,

    /// <summary>All steps completed successfully.</summary>
    Completed = 2,

    /// <summary>Execution failed (at least one step failed).</summary>
    Failed = 3,

    /// <summary>Execution was cancelled by user or system.</summary>
    Cancelled = 4,

    /// <summary>Some steps completed, some remain (e.g., manual pause).</summary>
    PartiallyCompleted = 5
}

/// <summary>
/// Status of a single step execution.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
public enum RunbookStepExecutionStatus
{
    /// <summary>Step has not started.</summary>
    Pending = 0,

    /// <summary>Step requires human approval before execution.</summary>
    AwaitingApproval = 1,

    /// <summary>Step is currently being executed.</summary>
    InProgress = 2,

    /// <summary>Step completed successfully.</summary>
    Completed = 3,

    /// <summary>Step execution failed.</summary>
    Failed = 4,

    /// <summary>Step was skipped (e.g., not applicable, cancelled).</summary>
    Skipped = 5
}
