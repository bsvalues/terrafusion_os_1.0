// =============================================================================
// Phase 41: Runbook Execution Engine - Action Provider Interface
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0
// Abstraction for actual step actions (allows testing and extensibility).
// =============================================================================

namespace TerraFusion.Operations.Runbooks.Execution;

/// <summary>
/// Abstraction for executing runbook step actions.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
/// <remarks>
/// Design principles:
/// - Testable: Fake implementations for unit tests
/// - Extensible: Different providers for different action types
/// - Safe: Provider respects DryRun mode
/// - Isolated: No side effects on RunbookPlan or IncidentSummary
/// </remarks>
public interface IRunbookActionProvider
{
    /// <summary>
    /// Executes the action for a runbook step.
    /// </summary>
    /// <param name="plan">The runbook plan (read-only context).</param>
    /// <param name="step">The step to execute.</param>
    /// <param name="isDryRun">If true, simulate the action without real effects.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The result of the action execution.</returns>
    Task<RunbookStepResult> ExecuteAsync(
        RunbookPlan plan,
        RunbookStep step,
        bool isDryRun,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if this provider can handle the given step.
    /// </summary>
    /// <param name="step">The step to check.</param>
    /// <returns>True if this provider can execute the step.</returns>
    bool CanHandle(RunbookStep step);
}

/// <summary>
/// A no-op action provider for testing and DryRun mode.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
public sealed class NoOpRunbookActionProvider : IRunbookActionProvider
{
    /// <inheritdoc/>
    public Task<RunbookStepResult> ExecuteAsync(
        RunbookPlan plan,
        RunbookStep step,
        bool isDryRun,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var output = isDryRun
            ? $"[DryRun] Would execute step '{step.Title}' ({step.Kind})"
            : $"[NoOp] Simulated execution of step '{step.Title}' ({step.Kind})";

        return Task.FromResult(RunbookStepResult.Succeeded(output));
    }

    /// <inheritdoc/>
    public bool CanHandle(RunbookStep step) => true;
}
