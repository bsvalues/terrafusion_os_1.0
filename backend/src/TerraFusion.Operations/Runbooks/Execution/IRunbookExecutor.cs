// =============================================================================
// Phase 41: Runbook Execution Engine - Core Interface
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0
// The primary interface for runbook execution operations.
// =============================================================================

namespace TerraFusion.Operations.Runbooks.Execution;

/// <summary>
/// Core interface for runbook execution.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
/// <remarks>
/// Design principles:
/// - Approval-first: All RequiresHumanApproval steps MUST be approved before execution
/// - Safe-by-default: DryRun=true prevents real actions in Phase 41
/// - Auditable: All execution decisions and state changes are logged
/// - Immutable plans: Execution NEVER modifies the underlying RunbookPlan
/// - Government-compliant: FISMA-High requirements met
/// </remarks>
public interface IRunbookExecutor
{
    /// <summary>
    /// Starts execution of a runbook plan.
    /// </summary>
    /// <param name="plan">The runbook plan to execute.</param>
    /// <param name="options">Optional execution configuration.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created execution with initial state.</returns>
    /// <exception cref="ArgumentNullException">If plan is null.</exception>
    Task<RunbookExecution> StartExecutionAsync(
        RunbookPlan plan,
        RunbookExecutionOptions? options = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Executes a specific step in an execution.
    /// </summary>
    /// <param name="executionId">The execution ID.</param>
    /// <param name="stepId">The step ID to execute.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Updated execution state after step execution.</returns>
    /// <exception cref="InvalidOperationException">If step requires approval and is not approved.</exception>
    /// <exception cref="InvalidOperationException">If execution is not in a valid state for step execution.</exception>
    Task<RunbookExecution> ExecuteStepAsync(
        string executionId,
        string stepId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Approves a step for execution.
    /// </summary>
    /// <param name="executionId">The execution ID.</param>
    /// <param name="stepId">The step ID to approve.</param>
    /// <param name="approvedBy">Identity of the approver (required).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Updated execution state with approval recorded.</returns>
    /// <exception cref="ArgumentException">If approvedBy is null or empty.</exception>
    /// <exception cref="InvalidOperationException">If step does not require approval or is not pending.</exception>
    Task<RunbookExecution> ApproveStepAsync(
        string executionId,
        string stepId,
        string approvedBy,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cancels an execution.
    /// </summary>
    /// <param name="executionId">The execution ID.</param>
    /// <param name="cancelledBy">Identity of who cancelled.</param>
    /// <param name="reason">Optional reason for cancellation.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Updated execution state with Cancelled status.</returns>
    Task<RunbookExecution> CancelExecutionAsync(
        string executionId,
        string? cancelledBy = null,
        string? reason = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current state of an execution.
    /// </summary>
    /// <param name="executionId">The execution ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The execution state, or null if not found.</returns>
    Task<RunbookExecution?> GetExecutionAsync(
        string executionId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Lists all executions for a plan.
    /// </summary>
    /// <param name="planId">The plan ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of executions for the plan.</returns>
    Task<IReadOnlyList<RunbookExecution>> GetExecutionsByPlanAsync(
        string planId,
        CancellationToken cancellationToken = default);
}
