// =============================================================================
// Phase 41: Runbook Execution Engine - Core Implementation
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0
// The primary implementation for runbook execution with approvals.
// =============================================================================

using Microsoft.Extensions.Logging;

namespace TerraFusion.Operations.Runbooks.Execution;

/// <summary>
/// Core implementation of <see cref="IRunbookExecutor"/>.
/// EXECUTION SPEC LOCK v1.0.0
/// </summary>
/// <remarks>
/// Design principles:
/// - Approval-first: All RequiresHumanApproval steps MUST be approved before execution
/// - Safe-by-default: DryRun=true prevents real actions in Phase 41
/// - Auditable: All execution decisions and state changes are logged
/// - Immutable plans: Execution NEVER modifies the underlying RunbookPlan
/// </remarks>
public sealed class RunbookExecutor : IRunbookExecutor
{
    private readonly IRunbookExecutionStore _store;
    private readonly IRunbookActionProvider _actionProvider;
    private readonly ILogger<RunbookExecutor> _logger;

    // Plan cache - we need access to plans for step execution
    private readonly Dictionary<string, RunbookPlan> _planCache = new();
    private readonly object _planCacheLock = new();

    /// <summary>
    /// Initializes a new instance of <see cref="RunbookExecutor"/>.
    /// </summary>
    public RunbookExecutor(
        IRunbookExecutionStore store,
        IRunbookActionProvider actionProvider,
        ILogger<RunbookExecutor> logger)
    {
        _store = store ?? throw new ArgumentNullException(nameof(store));
        _actionProvider = actionProvider ?? throw new ArgumentNullException(nameof(actionProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc/>
    public async Task<RunbookExecution> StartExecutionAsync(
        RunbookPlan plan,
        RunbookExecutionOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(plan);
        cancellationToken.ThrowIfCancellationRequested();

        options ??= new RunbookExecutionOptions();

        _logger.LogInformation(
            "Starting execution for plan {PlanId} with DryRun={DryRun}",
            plan.PlanId, options.DryRun);

        // Create initial step executions
        var stepExecutions = plan.Steps
            .Select(s => new RunbookStepExecution
            {
                StepId = s.StepId,
                Order = s.Order,
                Status = DetermineInitialStepStatus(s, options)
            })
            .ToList();

        var execution = new RunbookExecution
        {
            ExecutionId = $"EXEC-{Guid.NewGuid():N}",
            PlanId = plan.PlanId,
            IncidentId = plan.IncidentId,
            Severity = plan.OverallSeverity,
            Status = RunbookExecutionStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow,
            Steps = stepExecutions,
            StartedBy = options.InitiatedBy,
            Notes = options.ExecutionNotes,
            IsDryRun = options.DryRun
        };

        // Cache the plan for later step execution
        CachePlan(execution.ExecutionId, plan);

        await _store.SaveAsync(execution, cancellationToken);

        _logger.LogInformation(
            "Created execution {ExecutionId} for plan {PlanId} with {StepCount} steps",
            execution.ExecutionId, plan.PlanId, stepExecutions.Count);

        return execution;
    }

    /// <inheritdoc/>
    public async Task<RunbookExecution> ExecuteStepAsync(
        string executionId,
        string stepId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(executionId);
        ArgumentException.ThrowIfNullOrWhiteSpace(stepId);
        cancellationToken.ThrowIfCancellationRequested();

        var execution = await _store.GetByIdAsync(executionId, cancellationToken)
            ?? throw new InvalidOperationException($"Execution '{executionId}' not found");

        var plan = GetCachedPlan(executionId)
            ?? throw new InvalidOperationException($"Plan for execution '{executionId}' not found in cache");

        var stepExecution = execution.Steps.FirstOrDefault(s => s.StepId == stepId)
            ?? throw new InvalidOperationException($"Step '{stepId}' not found in execution '{executionId}'");

        var planStep = plan.Steps.FirstOrDefault(s => s.StepId == stepId)
            ?? throw new InvalidOperationException($"Step '{stepId}' not found in plan '{plan.PlanId}'");

        // Validate execution state
        ValidateStepExecution(execution, stepExecution, planStep);

        _logger.LogInformation(
            "Executing step {StepId} in execution {ExecutionId} (DryRun={DryRun})",
            stepId, executionId, execution.IsDryRun);

        // Update execution status to Running if this is the first step
        var updatedExecution = execution.Status == RunbookExecutionStatus.Pending
            ? execution with
            {
                Status = RunbookExecutionStatus.Running,
                StartedAt = DateTimeOffset.UtcNow
            }
            : execution;

        // Update step to InProgress
        var stepStartTime = DateTimeOffset.UtcNow;
        updatedExecution = UpdateStepInExecution(updatedExecution, stepId, s => s with
        {
            Status = RunbookStepExecutionStatus.InProgress,
            StartedAt = stepStartTime
        });

        await _store.SaveAsync(updatedExecution, cancellationToken);

        // Execute the action
        RunbookStepResult result;
        try
        {
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            // Note: In a real implementation, we'd get timeout from options
            timeoutCts.CancelAfter(TimeSpan.FromMinutes(5));

            result = await _actionProvider.ExecuteAsync(plan, planStep, execution.IsDryRun, timeoutCts.Token);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            // Timeout
            result = RunbookStepResult.Failed("Step execution timed out");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Step {StepId} execution failed with exception", stepId);
            result = RunbookStepResult.Failed($"Step execution failed: {ex.Message}");
        }

        // Update step with result
        var stepEndTime = DateTimeOffset.UtcNow;
        updatedExecution = UpdateStepInExecution(updatedExecution, stepId, s => s with
        {
            Status = result.Success
                ? RunbookStepExecutionStatus.Completed
                : RunbookStepExecutionStatus.Failed,
            CompletedAt = stepEndTime,
            ErrorMessage = result.ErrorMessage,
            ActionOutput = result.Output
        });

        // Update overall execution status
        updatedExecution = UpdateExecutionStatusAfterStep(updatedExecution);

        await _store.SaveAsync(updatedExecution, cancellationToken);

        _logger.LogInformation(
            "Step {StepId} completed with Success={Success}, execution status is now {Status}",
            stepId, result.Success, updatedExecution.Status);

        return updatedExecution;
    }

    /// <inheritdoc/>
    public async Task<RunbookExecution> ApproveStepAsync(
        string executionId,
        string stepId,
        string approvedBy,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(executionId);
        ArgumentException.ThrowIfNullOrWhiteSpace(stepId);
        ArgumentException.ThrowIfNullOrWhiteSpace(approvedBy);
        cancellationToken.ThrowIfCancellationRequested();

        var execution = await _store.GetByIdAsync(executionId, cancellationToken)
            ?? throw new InvalidOperationException($"Execution '{executionId}' not found");

        var stepExecution = execution.Steps.FirstOrDefault(s => s.StepId == stepId)
            ?? throw new InvalidOperationException($"Step '{stepId}' not found in execution '{executionId}'");

        // Validate approval is valid
        if (stepExecution.Status != RunbookStepExecutionStatus.AwaitingApproval &&
            stepExecution.Status != RunbookStepExecutionStatus.Pending)
        {
            throw new InvalidOperationException(
                $"Step '{stepId}' is in status '{stepExecution.Status}' and cannot be approved");
        }

        if (stepExecution.ApprovedBy != null)
        {
            throw new InvalidOperationException($"Step '{stepId}' is already approved by '{stepExecution.ApprovedBy}'");
        }

        _logger.LogInformation(
            "Step {StepId} approved by {ApprovedBy} in execution {ExecutionId}",
            stepId, approvedBy, executionId);

        // Update step with approval
        var updatedExecution = UpdateStepInExecution(execution, stepId, s => s with
        {
            Status = RunbookStepExecutionStatus.Pending, // Move from AwaitingApproval to Pending (ready to execute)
            ApprovedBy = approvedBy,
            ApprovedAt = DateTimeOffset.UtcNow
        });

        await _store.SaveAsync(updatedExecution, cancellationToken);

        return updatedExecution;
    }

    /// <inheritdoc/>
    public async Task<RunbookExecution> CancelExecutionAsync(
        string executionId,
        string? cancelledBy = null,
        string? reason = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(executionId);
        cancellationToken.ThrowIfCancellationRequested();

        var execution = await _store.GetByIdAsync(executionId, cancellationToken)
            ?? throw new InvalidOperationException($"Execution '{executionId}' not found");

        // Can only cancel pending, running, or partially completed executions
        if (execution.Status is not (RunbookExecutionStatus.Pending or
            RunbookExecutionStatus.Running or
            RunbookExecutionStatus.PartiallyCompleted))
        {
            throw new InvalidOperationException(
                $"Execution '{executionId}' is in status '{execution.Status}' and cannot be cancelled");
        }

        _logger.LogInformation(
            "Execution {ExecutionId} cancelled by {CancelledBy}: {Reason}",
            executionId, cancelledBy ?? "system", reason ?? "No reason provided");

        // Update steps that haven't completed to Skipped
        var updatedSteps = execution.Steps.Select(s =>
            s.Status is RunbookStepExecutionStatus.Pending or RunbookStepExecutionStatus.AwaitingApproval
                ? s with { Status = RunbookStepExecutionStatus.Skipped }
                : s).ToList();

        var updatedExecution = execution with
        {
            Status = RunbookExecutionStatus.Cancelled,
            CompletedAt = DateTimeOffset.UtcNow,
            Steps = updatedSteps,
            Notes = string.IsNullOrEmpty(execution.Notes)
                ? $"Cancelled by {cancelledBy ?? "system"}: {reason ?? "No reason"}"
                : $"{execution.Notes} | Cancelled by {cancelledBy ?? "system"}: {reason ?? "No reason"}"
        };

        await _store.SaveAsync(updatedExecution, cancellationToken);

        return updatedExecution;
    }

    /// <inheritdoc/>
    public Task<RunbookExecution?> GetExecutionAsync(
        string executionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(executionId);
        return _store.GetByIdAsync(executionId, cancellationToken);
    }

    /// <inheritdoc/>
    public Task<IReadOnlyList<RunbookExecution>> GetExecutionsByPlanAsync(
        string planId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(planId);
        return _store.GetByPlanIdAsync(planId, cancellationToken);
    }

    #region Private Helpers

    private static RunbookStepExecutionStatus DetermineInitialStepStatus(
        RunbookStep step,
        RunbookExecutionOptions options)
    {
        // If step requires human approval, set to AwaitingApproval
        if (step.RequiresHumanApproval)
        {
            return RunbookStepExecutionStatus.AwaitingApproval;
        }

        // If SafetyLevel is high risk or above, require approval
        if (step.SafetyLevel >= RunbookSafetyLevel.HighRisk)
        {
            return RunbookStepExecutionStatus.AwaitingApproval;
        }

        // If AllowSafeAutoExecution is false (default for Phase 41), require approval for all
        if (!options.AllowSafeAutoExecution)
        {
            return RunbookStepExecutionStatus.AwaitingApproval;
        }

        // Otherwise, step is ready to execute
        return RunbookStepExecutionStatus.Pending;
    }

    private void ValidateStepExecution(
        RunbookExecution execution,
        RunbookStepExecution stepExecution,
        RunbookStep planStep)
    {
        // Check execution status allows step execution
        if (execution.Status is RunbookExecutionStatus.Completed or
            RunbookExecutionStatus.Failed or
            RunbookExecutionStatus.Cancelled)
        {
            throw new InvalidOperationException(
                $"Cannot execute step in execution with status '{execution.Status}'");
        }

        // Check step status allows execution
        if (stepExecution.Status == RunbookStepExecutionStatus.AwaitingApproval)
        {
            throw new InvalidOperationException(
                $"Step '{stepExecution.StepId}' requires approval before execution");
        }

        if (stepExecution.Status != RunbookStepExecutionStatus.Pending)
        {
            throw new InvalidOperationException(
                $"Step '{stepExecution.StepId}' is in status '{stepExecution.Status}' and cannot be executed");
        }

        // Check if step requires approval and has been approved
        if (planStep.RequiresHumanApproval && stepExecution.ApprovedBy == null)
        {
            throw new InvalidOperationException(
                $"Step '{stepExecution.StepId}' requires human approval but has not been approved");
        }

        // Check ordering: all prior steps should be completed (unless parallel execution is allowed)
        var priorIncompleteSteps = execution.Steps
            .Where(s => s.Order < stepExecution.Order)
            .Where(s => s.Status is not RunbookStepExecutionStatus.Completed and
                       not RunbookStepExecutionStatus.Skipped)
            .ToList();

        if (priorIncompleteSteps.Count > 0)
        {
            throw new InvalidOperationException(
                $"Cannot execute step '{stepExecution.StepId}' (order {stepExecution.Order}) " +
                $"because prior steps are not complete: {string.Join(", ", priorIncompleteSteps.Select(s => s.StepId))}");
        }
    }

    private static RunbookExecution UpdateStepInExecution(
        RunbookExecution execution,
        string stepId,
        Func<RunbookStepExecution, RunbookStepExecution> updateFunc)
    {
        var updatedSteps = execution.Steps.Select(s =>
            s.StepId == stepId ? updateFunc(s) : s).ToList();

        return execution with { Steps = updatedSteps };
    }

    private static RunbookExecution UpdateExecutionStatusAfterStep(RunbookExecution execution)
    {
        // Check if any step failed
        if (execution.Steps.Any(s => s.Status == RunbookStepExecutionStatus.Failed))
        {
            return execution with
            {
                Status = RunbookExecutionStatus.Failed,
                CompletedAt = DateTimeOffset.UtcNow
            };
        }

        // Check if all steps are completed
        var allCompleted = execution.Steps.All(s =>
            s.Status is RunbookStepExecutionStatus.Completed or RunbookStepExecutionStatus.Skipped);

        if (allCompleted)
        {
            return execution with
            {
                Status = RunbookExecutionStatus.Completed,
                CompletedAt = DateTimeOffset.UtcNow
            };
        }

        // Check if some completed but others are still pending
        var hasCompleted = execution.Steps.Any(s => s.Status == RunbookStepExecutionStatus.Completed);
        var hasPending = execution.Steps.Any(s =>
            s.Status is RunbookStepExecutionStatus.Pending or RunbookStepExecutionStatus.AwaitingApproval);

        if (hasCompleted && hasPending)
        {
            return execution with { Status = RunbookExecutionStatus.PartiallyCompleted };
        }

        // Otherwise, still running
        return execution with { Status = RunbookExecutionStatus.Running };
    }

    private void CachePlan(string executionId, RunbookPlan plan)
    {
        lock (_planCacheLock)
        {
            _planCache[executionId] = plan;
        }
    }

    private RunbookPlan? GetCachedPlan(string executionId)
    {
        lock (_planCacheLock)
        {
            return _planCache.TryGetValue(executionId, out var plan) ? plan : null;
        }
    }

    #endregion
}
