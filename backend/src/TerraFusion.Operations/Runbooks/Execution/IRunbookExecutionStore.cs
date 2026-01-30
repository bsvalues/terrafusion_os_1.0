// =============================================================================
// Phase 41: Runbook Execution Engine - Execution Store Interface
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0
// Abstraction for persisting execution state (in-memory for Phase 41).
// =============================================================================

namespace TerraFusion.Operations.Runbooks.Execution;

/// <summary>
/// Interface for storing and retrieving runbook executions.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
/// <remarks>
/// Phase 41 uses in-memory storage. Future phases may implement:
/// - Persistent storage (database)
/// - Distributed storage (Redis)
/// - Event sourcing patterns
/// </remarks>
public interface IRunbookExecutionStore
{
    /// <summary>
    /// Saves or updates an execution.
    /// </summary>
    /// <param name="execution">The execution to save.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Task representing the async operation.</returns>
    Task SaveAsync(RunbookExecution execution, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets an execution by ID.
    /// </summary>
    /// <param name="executionId">The execution ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The execution, or null if not found.</returns>
    Task<RunbookExecution?> GetByIdAsync(string executionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all executions for a plan.
    /// </summary>
    /// <param name="planId">The plan ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of executions for the plan.</returns>
    Task<IReadOnlyList<RunbookExecution>> GetByPlanIdAsync(string planId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes an execution (for cleanup/testing).
    /// </summary>
    /// <param name="executionId">The execution ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>True if deleted, false if not found.</returns>
    Task<bool> DeleteAsync(string executionId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Clears all executions (for testing).
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    Task ClearAsync(CancellationToken cancellationToken = default);
}
