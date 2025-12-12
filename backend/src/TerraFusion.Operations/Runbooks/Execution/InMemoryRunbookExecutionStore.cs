// =============================================================================
// Phase 41: Runbook Execution Engine - In-Memory Store Implementation
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0
// Thread-safe in-memory storage for runbook executions.
// =============================================================================

using System.Collections.Concurrent;

namespace TerraFusion.Operations.Runbooks.Execution;

/// <summary>
/// In-memory implementation of <see cref="IRunbookExecutionStore"/>.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
/// <remarks>
/// Thread-safe using ConcurrentDictionary.
/// For Phase 41 only - future phases should use persistent storage.
/// </remarks>
public sealed class InMemoryRunbookExecutionStore : IRunbookExecutionStore
{
    private readonly ConcurrentDictionary<string, RunbookExecution> _executions = new();

    /// <inheritdoc/>
    public Task SaveAsync(RunbookExecution execution, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(execution);
        cancellationToken.ThrowIfCancellationRequested();

        _executions.AddOrUpdate(execution.ExecutionId, execution, (_, _) => execution);

        return Task.CompletedTask;
    }

    /// <inheritdoc/>
    public Task<RunbookExecution?> GetByIdAsync(string executionId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(executionId);
        cancellationToken.ThrowIfCancellationRequested();

        _executions.TryGetValue(executionId, out var execution);
        return Task.FromResult(execution);
    }

    /// <inheritdoc/>
    public Task<IReadOnlyList<RunbookExecution>> GetByPlanIdAsync(string planId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(planId);
        cancellationToken.ThrowIfCancellationRequested();

        var executions = _executions.Values
            .Where(e => e.PlanId == planId)
            .OrderByDescending(e => e.CreatedAt)
            .ToList();

        return Task.FromResult<IReadOnlyList<RunbookExecution>>(executions);
    }

    /// <inheritdoc/>
    public Task<bool> DeleteAsync(string executionId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(executionId);
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(_executions.TryRemove(executionId, out _));
    }

    /// <inheritdoc/>
    public Task ClearAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _executions.Clear();
        return Task.CompletedTask;
    }

    /// <summary>
    /// Gets the count of stored executions (for testing/monitoring).
    /// </summary>
    public int Count => _executions.Count;
}
