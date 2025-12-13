// =============================================================================
// Phase 41: Runbook Execution Engine - Core Implementation
// Phase 43: Controlled Auto-Remediation Policy Integration
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0 + WIRING SPEC LOCK v1.0.0
// The primary implementation for runbook execution with approvals and policy.
// =============================================================================

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.Operations.Runbooks.Remediation;

namespace TerraFusion.Operations.Runbooks.Execution;

/// <summary>
/// Core implementation of <see cref="IRunbookExecutor"/>.
/// EXECUTION SPEC LOCK v1.0.0 + WIRING SPEC LOCK v1.0.0 (Phase 43)
/// </summary>
/// <remarks>
/// Design principles:
/// - Approval-first: All RequiresHumanApproval steps MUST be approved before execution
/// - Safe-by-default: DryRun=true prevents real actions in Phase 41
/// - Policy-governed: Phase 43 adds policy evaluation before execution (WIRING SPEC LOCK)
/// - Auditable: All execution decisions and state changes are logged
/// - Immutable plans: Execution NEVER modifies the underlying RunbookPlan
/// </remarks>
public sealed class RunbookExecutor : IRunbookExecutor
{
    private readonly IRunbookExecutionStore _store;
    private readonly IRunbookActionProvider _actionProvider;
    private readonly ILogger<RunbookExecutor> _logger;

    // Phase 43: Policy integration (WIRING SPEC LOCK v1.0.0)
    private readonly IRemediationPolicyEngine? _policyEngine;
    private readonly AutoRemediationOptions _autoRemediationOptions;

    // Plan cache - we need access to plans for step execution
    private readonly Dictionary<string, RunbookPlan> _planCache = new();
    private readonly object _planCacheLock = new();

    /// <summary>
    /// Initializes a new instance of <see cref="RunbookExecutor"/>.
    /// Phase 41 EXECUTION SPEC LOCK + Phase 43 WIRING SPEC LOCK.
    /// </summary>
    /// <param name="store">The execution store for persistence.</param>
    /// <param name="actionProvider">The action provider for step execution.</param>
    /// <param name="logger">The logger instance.</param>
    /// <param name="policyEngine">Optional: Phase 43 policy engine for auto-remediation decisions.</param>
    /// <param name="autoRemediationOptions">Optional: Phase 43 auto-remediation configuration.</param>
    public RunbookExecutor(
        IRunbookExecutionStore store,
        IRunbookActionProvider actionProvider,
        ILogger<RunbookExecutor> logger,
        IRemediationPolicyEngine? policyEngine = null,
        IOptions<AutoRemediationOptions>? autoRemediationOptions = null)
    {
        _store = store ?? throw new ArgumentNullException(nameof(store));
        _actionProvider = actionProvider ?? throw new ArgumentNullException(nameof(actionProvider));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        // Phase 43: Optional policy integration
        _policyEngine = policyEngine;
        _autoRemediationOptions = autoRemediationOptions?.Value ?? new AutoRemediationOptions();
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

        // =========================================================================
        // Phase 43: Policy Evaluation (WIRING SPEC LOCK v1.0.0)
        // =========================================================================
        var (policyDecision, policyRuleId, shouldSkip, requiresApproval) =
            EvaluatePolicy(plan, planStep, execution);

        // Update step execution with policy decision (before validation)
        stepExecution = stepExecution with
        {
            PolicyDecision = policyDecision,
            PolicyRuleId = policyRuleId
        };

        // Handle DenyAutoExecute - skip the step entirely
        if (shouldSkip)
        {
            return await HandleDeniedStepAsync(execution, stepExecution, stepId, policyRuleId, cancellationToken);
        }

        // If policy requires approval and step not yet approved, update and validate
        if (requiresApproval && stepExecution.ApprovedBy == null)
        {
            // Update step in execution to record policy decision
            var updatedWithPolicy = UpdateStepInExecution(execution, stepId, _ => stepExecution);
            await _store.SaveAsync(updatedWithPolicy, cancellationToken);

            // Validate execution state (throws if approval required but not granted)
            ValidateStepExecution(execution, stepExecution, planStep, requiresApproval);
        }
        else if (requiresApproval)
        {
            // Approval granted - validate other aspects
            ValidateStepExecution(execution, stepExecution, planStep, requiresApproval);
        }
        // If !requiresApproval, policy says auto-execute OK - skip approval validation

        // =========================================================================
        // End Phase 43 Policy Evaluation
        // =========================================================================

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

        // Update step to InProgress (include policy decision)
        var stepStartTime = DateTimeOffset.UtcNow;
        updatedExecution = UpdateStepInExecution(updatedExecution, stepId, s => s with
        {
            Status = RunbookStepExecutionStatus.InProgress,
            StartedAt = stepStartTime,
            PolicyDecision = policyDecision,
            PolicyRuleId = policyRuleId
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

        // Update step with result (preserve policy decision)
        var stepEndTime = DateTimeOffset.UtcNow;
        updatedExecution = UpdateStepInExecution(updatedExecution, stepId, s => s with
        {
            Status = result.Success
                ? RunbookStepExecutionStatus.Completed
                : RunbookStepExecutionStatus.Failed,
            CompletedAt = stepEndTime,
            ErrorMessage = result.ErrorMessage,
            ActionOutput = result.Output,
            PolicyDecision = policyDecision,
            PolicyRuleId = policyRuleId
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
        RunbookStep planStep,
        bool policyRequiresApproval)
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
        // Note: AwaitingApproval is OK if policy determined approval not required
        if (stepExecution.Status == RunbookStepExecutionStatus.AwaitingApproval && policyRequiresApproval)
        {
            throw new InvalidOperationException(
                $"Step '{stepExecution.StepId}' requires approval before execution");
        }

        if (stepExecution.Status != RunbookStepExecutionStatus.Pending &&
            stepExecution.Status != RunbookStepExecutionStatus.AwaitingApproval)
        {
            throw new InvalidOperationException(
                $"Step '{stepExecution.StepId}' is in status '{stepExecution.Status}' and cannot be executed");
        }

        // Check if step requires approval and has been approved
        // Skip this check if policy says auto-execution is allowed
        if (policyRequiresApproval && planStep.RequiresHumanApproval && stepExecution.ApprovedBy == null)
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

    #region Phase 43: Policy Evaluation Helpers (WIRING SPEC LOCK v1.0.0)

    /// <summary>
    /// Evaluates the remediation policy for a step execution.
    /// Returns the policy decision and whether the step should skip or require approval.
    /// </summary>
    private (RemediationDecisionKind? Decision, string? RuleId, bool ShouldSkip, bool RequiresApproval)
        EvaluatePolicy(RunbookPlan plan, RunbookStep step, RunbookExecution execution)
    {
        // No policy engine = conservative default (require approval)
        if (_policyEngine is null)
        {
            return (null, null, ShouldSkip: false, RequiresApproval: true);
        }

        // Build policy context (convert Guid county ID to string for policy)
        var countyGuid = plan.ImpactedCountyIds?.FirstOrDefault();
        var countyId = countyGuid?.ToString() ?? "UNKNOWN";

        var context = new RemediationPolicyContext(
            countyId,
            execution.Severity,
            plan,
            step,
            DateTimeOffset.UtcNow);

        // Evaluate policy
        var decision = _policyEngine.Evaluate(context);

        // Log policy decision if configured
        if (_autoRemediationOptions.AlwaysLogPolicyDecisions)
        {
            LogPolicyDecision(step.StepId, countyId, decision);
        }

        // Determine behavior based on decision
        return decision.Kind switch
        {
            RemediationDecisionKind.DenyAutoExecute =>
                (decision.Kind, decision.AppliedRuleId, ShouldSkip: true, RequiresApproval: false),

            RemediationDecisionKind.RequireHumanApproval =>
                (decision.Kind, decision.AppliedRuleId, ShouldSkip: false, RequiresApproval: true),

            RemediationDecisionKind.AllowAutoExecute =>
                (decision.Kind, decision.AppliedRuleId, ShouldSkip: false, RequiresApproval: !CanAutoExecute(plan, step)),

            _ => (decision.Kind, decision.AppliedRuleId, ShouldSkip: false, RequiresApproval: true)
        };
    }

    /// <summary>
    /// Checks whether auto-execution is allowed based on feature flags, county opt-in,
    /// and Phase 44 step-level eligibility (kind + safety level).
    /// PHASE 44 SPEC LOCK: Benton-only, Safe Diagnostics only.
    /// </summary>
    private bool CanAutoExecute(RunbookPlan plan, RunbookStep step)
    {
        // =========================================================================
        // Phase 44 KILL SWITCH: Instant OFF lever (SPEC LOCK v1.0.1)
        // This check short-circuits BEFORE any other eligibility is considered.
        // When enabled, NO auto-execution ever, regardless of other flags.
        // =========================================================================
        if (_autoRemediationOptions.AutoRemediationKillSwitchEnabled)
        {
            _logger.LogDebug(
                "Auto-execution blocked: AutoRemediationKillSwitchEnabled is true (kill switch ON)");
            return false;
        }

        // Global kill switch
        if (!_autoRemediationOptions.EnableAutoRemediation)
        {
            _logger.LogDebug("Auto-execution blocked: EnableAutoRemediation is false");
            return false;
        }

        // County opt-in check (convert Guid to string for lookup)
        var countyGuid = plan.ImpactedCountyIds?.FirstOrDefault();
        var countyId = countyGuid?.ToString() ?? "UNKNOWN";

        if (!_autoRemediationOptions.OptedInCounties.Contains(countyId))
        {
            _logger.LogInformation(
                "Auto-execution blocked for county {CountyId} - not in opted-in list",
                countyId);
            return false;
        }

        // =========================================================================
        // Phase 44: Step-Level Eligibility Check (PHASE 44 SPEC LOCK v1.0.0)
        // Only Diagnostic steps at InfoOnly/LowRisk can auto-execute.
        // =========================================================================
        if (!_autoRemediationOptions.AllowSafeDiagnosticsAutoExecute)
        {
            _logger.LogDebug(
                "Auto-execution blocked: AllowSafeDiagnosticsAutoExecute is false");
            return false;
        }

        // Step Kind check: only Diagnostic steps are eligible for auto-execution
        if (step.Kind != RunbookStepKind.Diagnostic)
        {
            _logger.LogInformation(
                "Auto-execution blocked for step {StepId}: Kind is {Kind}, only Diagnostic allowed",
                step.StepId, step.Kind);
            return false;
        }

        // Safety Level check: only InfoOnly or LowRisk are eligible
        if (step.SafetyLevel is not (RunbookSafetyLevel.InfoOnly or RunbookSafetyLevel.LowRisk))
        {
            _logger.LogInformation(
                "Auto-execution blocked for step {StepId}: SafetyLevel is {SafetyLevel}, only InfoOnly/LowRisk allowed",
                step.StepId, step.SafetyLevel);
            return false;
        }

        return true;
    }

    /// <summary>
    /// Logs a policy decision for audit trail.
    /// </summary>
    private void LogPolicyDecision(string stepId, string countyId, RemediationDecision decision)
    {
        switch (decision.Kind)
        {
            case RemediationDecisionKind.DenyAutoExecute:
                _logger.LogWarning(
                    "Policy decision for step {StepId}: DENIED by rule {RuleId} (County: {CountyId})",
                    stepId, decision.AppliedRuleId ?? "default", countyId);
                break;

            case RemediationDecisionKind.AllowAutoExecute:
                _logger.LogInformation(
                    "Policy decision for step {StepId}: AllowAutoExecute by rule {RuleId} (County: {CountyId})",
                    stepId, decision.AppliedRuleId ?? "default", countyId);
                break;

            default:
                _logger.LogInformation(
                    "Policy decision for step {StepId}: {Decision} by rule {RuleId} (County: {CountyId})",
                    stepId, decision.Kind, decision.AppliedRuleId ?? "default", countyId);
                break;
        }
    }

    /// <summary>
    /// Handles a step that was denied by policy - skips it with audit record.
    /// </summary>
    private async Task<RunbookExecution> HandleDeniedStepAsync(
        RunbookExecution execution,
        RunbookStepExecution stepExecution,
        string stepId,
        string? ruleId,
        CancellationToken cancellationToken)
    {
        _logger.LogWarning(
            "Step {StepId} DENIED by policy rule {RuleId} - skipping execution",
            stepId, ruleId ?? "default");

        // Update step to Skipped with policy decision recorded
        var updatedExecution = UpdateStepInExecution(execution, stepId, _ => stepExecution with
        {
            Status = RunbookStepExecutionStatus.Skipped,
            CompletedAt = DateTimeOffset.UtcNow,
            ErrorMessage = $"Denied by policy (rule: {ruleId ?? "default"})"
        });

        // Update overall execution status
        updatedExecution = UpdateExecutionStatusAfterStep(updatedExecution);

        await _store.SaveAsync(updatedExecution, cancellationToken);

        return updatedExecution;
    }

    #endregion
}
