// =============================================================================
// Phase 41: Runbook Execution Engine - Core Executor Tests
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0
// Tests for the RunbookExecutor implementation.
// =============================================================================

using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.Operations.Incidents;
using TerraFusion.Operations.Runbooks;
using TerraFusion.Operations.Runbooks.Execution;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase41;

/// <summary>
/// Tests for <see cref="RunbookExecutor"/>.
/// Focus: Core execution logic, state transitions, step execution.
/// </summary>
[Trait("Phase", "41")]
[Trait("Component", "RunbookExecution")]
public sealed class RunbookExecutorTests : IDisposable
{
    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly Mock<ILogger<RunbookExecutor>> _loggerMock;
    private readonly RunbookExecutor _sut;

    public RunbookExecutorTests()
    {
        _store = new InMemoryRunbookExecutionStore();
        _actionProviderMock = new Mock<IRunbookActionProvider>();
        _loggerMock = new Mock<ILogger<RunbookExecutor>>();

        // Default: action provider succeeds
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Succeeded("Action completed"));

        _sut = new RunbookExecutor(_store, _actionProviderMock.Object, _loggerMock.Object);
    }

    public void Dispose()
    {
        _store.ClearAsync().GetAwaiter().GetResult();
    }

    #region StartExecutionAsync Tests

    [Fact]
    public async Task StartExecutionAsync_WithValidPlan_CreatesExecution()
    {
        // Arrange
        var plan = CreateTestPlan();

        // Act
        var execution = await _sut.StartExecutionAsync(plan);

        // Assert
        execution.Should().NotBeNull();
        execution.ExecutionId.Should().StartWith("EXEC-");
        execution.PlanId.Should().Be(plan.PlanId);
        execution.IncidentId.Should().Be(plan.IncidentId);
        execution.Status.Should().Be(RunbookExecutionStatus.Pending);
        execution.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
        execution.Steps.Should().HaveCount(plan.Steps.Count);
    }

    [Fact]
    public async Task StartExecutionAsync_WithDryRunTrue_SetsIsDryRun()
    {
        // Arrange
        var plan = CreateTestPlan();
        var options = new RunbookExecutionOptions { DryRun = true };

        // Act
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Assert
        execution.IsDryRun.Should().BeTrue();
    }

    [Fact]
    public async Task StartExecutionAsync_WithDryRunFalse_SetsIsDryRunFalse()
    {
        // Arrange
        var plan = CreateTestPlan();
        var options = new RunbookExecutionOptions { DryRun = false };

        // Act
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Assert
        execution.IsDryRun.Should().BeFalse();
    }

    [Fact]
    public async Task StartExecutionAsync_DefaultOptions_DryRunIsTrue()
    {
        // Arrange
        var plan = CreateTestPlan();

        // Act
        var execution = await _sut.StartExecutionAsync(plan);

        // Assert - Default for Phase 41 is DryRun=true
        execution.IsDryRun.Should().BeTrue();
    }

    [Fact]
    public async Task StartExecutionAsync_WithInitiatedBy_SetsStartedBy()
    {
        // Arrange
        var plan = CreateTestPlan();
        var options = new RunbookExecutionOptions { InitiatedBy = "operator@county.gov" };

        // Act
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Assert
        execution.StartedBy.Should().Be("operator@county.gov");
    }

    [Fact]
    public async Task StartExecutionAsync_WithNotes_SetsNotes()
    {
        // Arrange
        var plan = CreateTestPlan();
        var options = new RunbookExecutionOptions { ExecutionNotes = "Emergency response" };

        // Act
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Assert
        execution.Notes.Should().Be("Emergency response");
    }

    [Fact]
    public async Task StartExecutionAsync_NullPlan_ThrowsArgumentNullException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            _sut.StartExecutionAsync(null!));
    }

    [Fact]
    public async Task StartExecutionAsync_StepsRequiringApproval_SetToAwaitingApproval()
    {
        // Arrange
        var plan = CreateTestPlan();

        // Act
        var execution = await _sut.StartExecutionAsync(plan);

        // Assert - All steps requiring approval should be AwaitingApproval
        execution.Steps.Should().OnlyContain(s =>
            s.Status == RunbookStepExecutionStatus.AwaitingApproval);
    }

    [Fact]
    public async Task StartExecutionAsync_PersistsToStore()
    {
        // Arrange
        var plan = CreateTestPlan();

        // Act
        var execution = await _sut.StartExecutionAsync(plan);

        // Assert
        var retrieved = await _store.GetByIdAsync(execution.ExecutionId);
        retrieved.Should().NotBeNull();
        retrieved!.ExecutionId.Should().Be(execution.ExecutionId);
    }

    #endregion

    #region ExecuteStepAsync Tests

    [Fact]
    public async Task ExecuteStepAsync_ApprovedStep_ExecutesSuccessfully()
    {
        // Arrange
        var plan = CreateTestPlanWithSafeStep();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);
        var stepId = plan.Steps[0].StepId;

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        result.Status.Should().Be(RunbookExecutionStatus.Completed);
        var step = result.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.Completed);
        step.StartedAt.Should().NotBeNull();
        step.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ExecuteStepAsync_NonExistentExecution_ThrowsInvalidOperationException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ExecuteStepAsync("EXEC-nonexistent", "STEP-001"));
    }

    [Fact]
    public async Task ExecuteStepAsync_NonExistentStep_ThrowsInvalidOperationException()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-nonexistent"));
    }

    [Fact]
    public async Task ExecuteStepAsync_UnapprovedStep_ThrowsInvalidOperationException()
    {
        // Arrange
        var plan = CreateTestPlan(); // Steps require approval
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Act & Assert - Step is AwaitingApproval, cannot execute
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ExecuteStepAsync(execution.ExecutionId, stepId));
        ex.Message.Should().Contain("requires approval");
    }

    [Fact]
    public async Task ExecuteStepAsync_ActionProviderFails_StepStatusFailed()
    {
        // Arrange
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Failed("Action failed"));

        var plan = CreateTestPlanWithSafeStep();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);
        var stepId = plan.Steps[0].StepId;

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        result.Status.Should().Be(RunbookExecutionStatus.Failed);
        var step = result.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.Failed);
        step.ErrorMessage.Should().Be("Action failed");
    }

    [Fact]
    public async Task ExecuteStepAsync_ActionProviderThrows_StepStatusFailed()
    {
        // Arrange
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Provider exception"));

        var plan = CreateTestPlanWithSafeStep();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);
        var stepId = plan.Steps[0].StepId;

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        result.Status.Should().Be(RunbookExecutionStatus.Failed);
        var step = result.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.Failed);
        step.ErrorMessage.Should().Contain("Provider exception");
    }

    [Fact]
    public async Task ExecuteStepAsync_FirstStep_SetsExecutionToRunning()
    {
        // Arrange
        var plan = CreateTestPlanWithSafeStep();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Pre-assert
        execution.Status.Should().Be(RunbookExecutionStatus.Pending);
        execution.StartedAt.Should().BeNull();

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Assert - After completion, status depends on whether all steps are done
        result.StartedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ExecuteStepAsync_AllStepsComplete_SetsExecutionToCompleted()
    {
        // Arrange
        var plan = CreateTestPlanWithSafeStep(); // Single step plan
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Assert
        result.Status.Should().Be(RunbookExecutionStatus.Completed);
        result.CompletedAt.Should().NotBeNull();
    }

    #endregion

    #region ApproveStepAsync Tests

    [Fact]
    public async Task ApproveStepAsync_ValidStep_SetsApproval()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Act
        var result = await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "approver@county.gov");

        // Assert
        var step = result.Steps.First(s => s.StepId == stepId);
        step.ApprovedBy.Should().Be("approver@county.gov");
        step.ApprovedAt.Should().NotBeNull();
        step.Status.Should().Be(RunbookStepExecutionStatus.Pending);
    }

    [Fact]
    public async Task ApproveStepAsync_EmptyApprovedBy_ThrowsArgumentException()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.ApproveStepAsync(execution.ExecutionId, stepId, ""));
    }

    [Fact]
    public async Task ApproveStepAsync_NullApprovedBy_ThrowsArgumentNullException()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            _sut.ApproveStepAsync(execution.ExecutionId, stepId, null!));
    }

    [Fact]
    public async Task ApproveStepAsync_AlreadyApproved_ThrowsInvalidOperationException()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;
        await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "approver1@county.gov");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ApproveStepAsync(execution.ExecutionId, stepId, "approver2@county.gov"));
        ex.Message.Should().Contain("already approved");
    }

    [Fact]
    public async Task ApproveStepAsync_NonExistentExecution_ThrowsInvalidOperationException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ApproveStepAsync("EXEC-nonexistent", "STEP-001", "approver@county.gov"));
    }

    [Fact]
    public async Task ApproveStepAsync_NonExistentStep_ThrowsInvalidOperationException()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ApproveStepAsync(execution.ExecutionId, "STEP-nonexistent", "approver@county.gov"));
    }

    #endregion

    #region CancelExecutionAsync Tests

    [Fact]
    public async Task CancelExecutionAsync_PendingExecution_SetsToCancelled()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Act
        var result = await _sut.CancelExecutionAsync(execution.ExecutionId, "operator@county.gov", "Emergency");

        // Assert
        result.Status.Should().Be(RunbookExecutionStatus.Cancelled);
        result.CompletedAt.Should().NotBeNull();
        result.Notes.Should().Contain("Cancelled");
        result.Notes.Should().Contain("operator@county.gov");
        result.Notes.Should().Contain("Emergency");
    }

    [Fact]
    public async Task CancelExecutionAsync_PendingSteps_MarkedAsSkipped()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Act
        var result = await _sut.CancelExecutionAsync(execution.ExecutionId);

        // Assert
        result.Steps.Should().OnlyContain(s => s.Status == RunbookStepExecutionStatus.Skipped);
    }

    [Fact]
    public async Task CancelExecutionAsync_CompletedExecution_ThrowsInvalidOperationException()
    {
        // Arrange
        var plan = CreateTestPlanWithSafeStep();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);
        await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.CancelExecutionAsync(execution.ExecutionId));
        ex.Message.Should().Contain("Completed");
    }

    [Fact]
    public async Task CancelExecutionAsync_NonExistentExecution_ThrowsInvalidOperationException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.CancelExecutionAsync("EXEC-nonexistent"));
    }

    #endregion

    #region GetExecutionAsync Tests

    [Fact]
    public async Task GetExecutionAsync_ExistingExecution_ReturnsExecution()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Act
        var result = await _sut.GetExecutionAsync(execution.ExecutionId);

        // Assert
        result.Should().NotBeNull();
        result!.ExecutionId.Should().Be(execution.ExecutionId);
    }

    [Fact]
    public async Task GetExecutionAsync_NonExistentExecution_ReturnsNull()
    {
        // Act
        var result = await _sut.GetExecutionAsync("EXEC-nonexistent");

        // Assert
        result.Should().BeNull();
    }

    #endregion

    #region GetExecutionsByPlanAsync Tests

    [Fact]
    public async Task GetExecutionsByPlanAsync_MultipleExecutions_ReturnsAll()
    {
        // Arrange
        var plan = CreateTestPlan();
        await _sut.StartExecutionAsync(plan);
        await _sut.StartExecutionAsync(plan);
        await _sut.StartExecutionAsync(plan);

        // Act
        var results = await _sut.GetExecutionsByPlanAsync(plan.PlanId);

        // Assert
        results.Should().HaveCount(3);
        results.Should().OnlyContain(e => e.PlanId == plan.PlanId);
    }

    [Fact]
    public async Task GetExecutionsByPlanAsync_NoExecutions_ReturnsEmpty()
    {
        // Act
        var results = await _sut.GetExecutionsByPlanAsync("PLAN-nonexistent");

        // Assert
        results.Should().BeEmpty();
    }

    #endregion

    #region Test Helpers

    private static RunbookPlan CreateTestPlan()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Test Runbook Plan",
            Description = "Test plan for unit tests",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-000001",
                    Order = 1,
                    Title = "Diagnostic Step",
                    Description = "Check system health",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = true
                },
                new RunbookStep
                {
                    StepId = "STEP-000002",
                    Order = 2,
                    Title = "Config Check",
                    Description = "Verify configuration",
                    Kind = RunbookStepKind.ConfigCheck,
                    SafetyLevel = RunbookSafetyLevel.LowRisk,
                    RequiresHumanApproval = true
                },
                new RunbookStep
                {
                    StepId = "STEP-000003",
                    Order = 3,
                    Title = "Restart Service",
                    Description = "Restart the affected service",
                    Kind = RunbookStepKind.RestartService,
                    SafetyLevel = RunbookSafetyLevel.MediumRisk,
                    RequiresHumanApproval = true
                }
            ]
        };
    }

    private static RunbookPlan CreateTestPlanWithSafeStep()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Test Runbook Plan - Safe",
            Description = "Test plan with a safe step",
            OverallSeverity = IncidentSeverity.Info,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-000001",
                    Order = 1,
                    Title = "Safe Diagnostic Step",
                    Description = "Read-only diagnostic",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = false
                }
            ]
        };
    }

    #endregion
}
