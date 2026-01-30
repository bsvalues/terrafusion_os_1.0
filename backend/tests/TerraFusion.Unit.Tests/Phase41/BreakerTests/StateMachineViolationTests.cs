// =============================================================================
// Phase 41 Breaker Tests: State Machine Violation Attacks
// =============================================================================
// Tests for invalid state transitions and execution flow violations.
// Attack vectors: skip states, re-execute, resume cancelled, state corruption
// =============================================================================

using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.Operations.Incidents;
using TerraFusion.Operations.Runbooks;
using TerraFusion.Operations.Runbooks.Execution;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase41.BreakerTests;

/// <summary>
/// BREAKER: Tests for state machine violations in the execution engine.
/// </summary>
[Trait("Phase", "41")]
[Trait("Component", "RunbookExecution")]
[Trait("Category", "Breaker")]
public sealed class StateMachineViolationTests : IDisposable
{
    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly RunbookExecutor _sut;

    public StateMachineViolationTests()
    {
        _store = new InMemoryRunbookExecutionStore();
        _actionProviderMock = new Mock<IRunbookActionProvider>();

        // Default: action provider succeeds
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Succeeded("Action completed"));

        _sut = new RunbookExecutor(_store, _actionProviderMock.Object, Mock.Of<ILogger<RunbookExecutor>>());
    }

    public void Dispose()
    {
        _store.ClearAsync().GetAwaiter().GetResult();
    }

    #region Execution Status Violations

    [Fact]
    public async Task ExecuteStepAsync_CompletedExecution_Blocked()
    {
        // Arrange - Complete an execution
        var plan = CreateTwoStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Approve and execute all steps to completion
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");
        await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[1].StepId, "admin@county.gov");
        var completed = await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[1].StepId);
        completed.Status.Should().Be(RunbookExecutionStatus.Completed);

        // Act - BREAKER: Try to execute step in completed execution
        var act = () => _sut.ExecuteStepAsync(completed.ExecutionId, plan.Steps[0].StepId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Completed*");
    }

    [Fact]
    public async Task ExecuteStepAsync_FailedExecution_Blocked()
    {
        // Arrange - Create execution and inject failure
        var plan = CreateTwoStepPlan();
        var failingProvider = new Mock<IRunbookActionProvider>();
        failingProvider
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Failed("Simulated failure"));

        var executor = new RunbookExecutor(_store, failingProvider.Object, Mock.Of<ILogger<RunbookExecutor>>());

        var execution = await executor.StartExecutionAsync(plan);

        // Approve and execute first step (will fail)
        await executor.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");
        var failed = await executor.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);
        failed.Status.Should().Be(RunbookExecutionStatus.Failed);

        // Act - BREAKER: Try to execute step in failed execution
        var act = () => executor.ExecuteStepAsync(failed.ExecutionId, plan.Steps[1].StepId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Failed*");
    }

    [Fact]
    public async Task ExecuteStepAsync_CancelledExecution_Blocked()
    {
        // Arrange - Create and cancel execution
        var plan = CreateTwoStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);
        await _sut.CancelExecutionAsync(execution.ExecutionId, "admin", "Testing");

        // Act - BREAKER: Try to execute step in cancelled execution
        var act = () => _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Cancelled*");
    }

    #endregion

    #region Step Ordering Violations

    [Fact]
    public async Task ExecuteStepAsync_OutOfOrder_Blocked()
    {
        // Arrange - Create multi-step plan
        var plan = CreateTwoStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Approve step 2 but try to execute it before step 1
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[1].StepId, "admin@county.gov");

        // Act - BREAKER: Try to execute step 2 before step 1
        var act = () => _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[1].StepId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*prior steps are not complete*");
    }

    [Fact]
    public async Task ExecuteStepAsync_SkipMiddleStep_Blocked()
    {
        // Arrange - Create 3-step plan
        var plan = CreateThreeStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Execute first step
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");
        await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Approve step 3
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[2].StepId, "admin@county.gov");

        // Act - BREAKER: Try to execute step 3 skipping step 2
        var act = () => _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[2].StepId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*prior steps are not complete*");
    }

    #endregion

    #region Re-Execution Attacks

    [Fact]
    public async Task ExecuteStepAsync_FailedStep_CannotReExecute()
    {
        // Arrange - Execute a step that fails
        var plan = CreateTwoStepPlan();
        var failingProvider = new Mock<IRunbookActionProvider>();
        failingProvider
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Failed("Simulated failure"));

        var executor = new RunbookExecutor(_store, failingProvider.Object, Mock.Of<ILogger<RunbookExecutor>>());

        var execution = await executor.StartExecutionAsync(plan);
        await executor.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");

        // Execute first step (will fail)
        var failed = await executor.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);
        var step = failed.Steps.First(s => s.StepId == plan.Steps[0].StepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.Failed);

        // Act - BREAKER: Try to re-execute failed step
        var act = () => executor.ExecuteStepAsync(failed.ExecutionId, plan.Steps[0].StepId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    #endregion

    #region Cancellation State Violations

    [Fact]
    public async Task CancelExecutionAsync_AlreadyCancelled_Throws()
    {
        // Arrange
        var plan = CreateTwoStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Cancel once
        await _sut.CancelExecutionAsync(execution.ExecutionId, "admin", "First cancel");

        // Act - BREAKER: Try to cancel again
        var act = () => _sut.CancelExecutionAsync(execution.ExecutionId, "attacker", "Second cancel");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Cancelled*cannot be cancelled*");
    }

    [Fact]
    public async Task CancelExecutionAsync_Completed_Throws()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Approve and complete execution
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");
        var completed = await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);
        completed.Status.Should().Be(RunbookExecutionStatus.Completed);

        // Act - BREAKER: Try to cancel completed execution
        var act = () => _sut.CancelExecutionAsync(completed.ExecutionId, "admin", "Trying to undo");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Completed*cannot be cancelled*");
    }

    [Fact]
    public async Task CancelExecutionAsync_Failed_Throws()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var failingProvider = new Mock<IRunbookActionProvider>();
        failingProvider
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Failed("Simulated failure"));

        var executor = new RunbookExecutor(_store, failingProvider.Object, Mock.Of<ILogger<RunbookExecutor>>());

        var execution = await executor.StartExecutionAsync(plan);
        await executor.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");

        // Fail execution
        var failed = await executor.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);
        failed.Status.Should().Be(RunbookExecutionStatus.Failed);

        // Act - BREAKER: Try to cancel failed execution
        var act = () => executor.CancelExecutionAsync(failed.ExecutionId, "admin", "Trying to clean up");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Failed*cannot be cancelled*");
    }

    [Fact]
    public async Task CancelExecutionAsync_PartiallyCompleted_Allowed()
    {
        // Arrange - Create execution with some completed steps
        var plan = CreateTwoStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Execute first step only
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");
        var partial = await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);
        partial.Status.Should().Be(RunbookExecutionStatus.PartiallyCompleted);

        // Act - BREAKER: Cancel should be allowed for PartiallyCompleted
        var cancelled = await _sut.CancelExecutionAsync(partial.ExecutionId, "admin", "Stopping early");

        // Assert
        cancelled.Status.Should().Be(RunbookExecutionStatus.Cancelled);
        cancelled.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Completed);
        cancelled.Steps[1].Status.Should().Be(RunbookStepExecutionStatus.Skipped);
    }

    #endregion

    #region Approval on Invalid States

    [Fact]
    public async Task ApproveStepAsync_CompletedStep_Throws()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Approve and execute step
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");
        var completed = await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Act - BREAKER: Try to approve completed step
        var act = () => _sut.ApproveStepAsync(completed.ExecutionId, plan.Steps[0].StepId, "late-approver");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Completed*cannot be approved*");
    }

    [Fact]
    public async Task ApproveStepAsync_FailedStep_Throws()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var failingProvider = new Mock<IRunbookActionProvider>();
        failingProvider
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Failed("Simulated failure"));

        var executor = new RunbookExecutor(_store, failingProvider.Object, Mock.Of<ILogger<RunbookExecutor>>());

        var execution = await executor.StartExecutionAsync(plan);
        await executor.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");

        // Execute and fail step
        var failed = await executor.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Act - BREAKER: Try to approve failed step
        var act = () => executor.ApproveStepAsync(failed.ExecutionId, plan.Steps[0].StepId, "post-mortem");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Failed*cannot be approved*");
    }

    [Fact]
    public async Task ApproveStepAsync_SkippedStep_Throws()
    {
        // Arrange
        var plan = CreateTwoStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Cancel to skip steps
        await _sut.CancelExecutionAsync(execution.ExecutionId, "admin", "Testing");

        // Act - BREAKER: Try to approve skipped step
        var act = () => _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "ghost-approver");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Skipped*cannot be approved*");
    }

    #endregion

    #region Helper Methods

    private static RunbookPlan CreateSingleStepPlan()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Single Step Plan",
            Description = "Test plan with one step",
            OverallSeverity = IncidentSeverity.Info,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "Step 1",
                    Description = "Single step",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = true
                }
            ]
        };
    }

    private static RunbookPlan CreateTwoStepPlan()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Two Step Plan",
            Description = "Test plan with two steps",
            OverallSeverity = IncidentSeverity.Info,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "First Step",
                    Description = "First step",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = true
                },
                new RunbookStep
                {
                    StepId = "STEP-002",
                    Order = 2,
                    Title = "Second Step",
                    Description = "Second step",
                    Kind = RunbookStepKind.ConfigCheck,
                    SafetyLevel = RunbookSafetyLevel.LowRisk,
                    RequiresHumanApproval = true
                }
            ]
        };
    }

    private static RunbookPlan CreateThreeStepPlan()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Three Step Plan",
            Description = "Test plan with three steps",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "Step 1",
                    Description = "Step 1",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = true
                },
                new RunbookStep
                {
                    StepId = "STEP-002",
                    Order = 2,
                    Title = "Step 2",
                    Description = "Step 2",
                    Kind = RunbookStepKind.ConfigCheck,
                    SafetyLevel = RunbookSafetyLevel.LowRisk,
                    RequiresHumanApproval = true
                },
                new RunbookStep
                {
                    StepId = "STEP-003",
                    Order = 3,
                    Title = "Step 3",
                    Description = "Step 3",
                    Kind = RunbookStepKind.RestartService,
                    SafetyLevel = RunbookSafetyLevel.MediumRisk,
                    RequiresHumanApproval = true
                }
            ]
        };
    }

    #endregion
}
