// =============================================================================
// Phase 41: Runbook Execution Engine - Multi-Step Workflow Tests
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0
// Tests for multi-step execution flows and ordering.
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
/// Tests for multi-step workflow execution.
/// Focus: Step ordering, partial completion, state transitions.
/// </summary>
[Trait("Phase", "41")]
[Trait("Component", "RunbookExecution")]
public sealed class RunbookExecutionWorkflowTests : IDisposable
{
    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly Mock<ILogger<RunbookExecutor>> _loggerMock;
    private readonly RunbookExecutor _sut;

    public RunbookExecutionWorkflowTests()
    {
        _store = new InMemoryRunbookExecutionStore();
        _actionProviderMock = new Mock<IRunbookActionProvider>();
        _loggerMock = new Mock<ILogger<RunbookExecutor>>();

        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Succeeded("Action completed"));

        _sut = new RunbookExecutor(_store, _actionProviderMock.Object, _loggerMock.Object);
    }

    public void Dispose()
    {
        _store.ClearAsync().GetAwaiter().GetResult();
    }

    #region Multi-Step Ordering Tests

    [Fact]
    public async Task MultiStepPlan_MustExecuteInOrder()
    {
        // Arrange
        var plan = CreateMultiStepPlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act & Assert - Cannot execute step 2 before step 1
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-002"));
        ex.Message.Should().Contain("prior steps");
    }

    [Fact]
    public async Task MultiStepPlan_ExecuteInOrder_Succeeds()
    {
        // Arrange
        var plan = CreateMultiStepPlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act - Execute steps in order
        var result1 = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");
        var result2 = await _sut.ExecuteStepAsync(result1.ExecutionId, "STEP-002");
        var result3 = await _sut.ExecuteStepAsync(result2.ExecutionId, "STEP-003");

        // Assert
        result3.Status.Should().Be(RunbookExecutionStatus.Completed);
        result3.Steps.Should().OnlyContain(s => s.Status == RunbookStepExecutionStatus.Completed);
    }

    [Fact]
    public async Task MultiStepPlan_PartialExecution_ShowsPartiallyCompleted()
    {
        // Arrange
        var plan = CreateMultiStepPlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act - Execute only first step
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert - Status should reflect partial completion
        result.Status.Should().Be(RunbookExecutionStatus.PartiallyCompleted);

        var step1 = result.Steps.First(s => s.StepId == "STEP-001");
        step1.Status.Should().Be(RunbookStepExecutionStatus.Completed);

        var step2 = result.Steps.First(s => s.StepId == "STEP-002");
        step2.Status.Should().Be(RunbookStepExecutionStatus.Pending);
    }

    [Fact]
    public async Task MultiStepPlan_OneStepFails_ExecutionFails()
    {
        // Arrange
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.Is<RunbookStep>(s => s.StepId == "STEP-002"), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Failed("Step 2 failed"));

        var plan = CreateMultiStepPlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act
        var result1 = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");
        var result2 = await _sut.ExecuteStepAsync(result1.ExecutionId, "STEP-002");

        // Assert
        result2.Status.Should().Be(RunbookExecutionStatus.Failed);
        result2.Steps.First(s => s.StepId == "STEP-002").Status.Should().Be(RunbookStepExecutionStatus.Failed);
    }

    [Fact]
    public async Task MultiStepPlan_AfterFailure_CannotExecuteMoreSteps()
    {
        // Arrange
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.Is<RunbookStep>(s => s.StepId == "STEP-001"), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Failed("Step 1 failed"));

        var plan = CreateMultiStepPlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Fail step 1
        await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Act & Assert - Cannot execute step 2 after failure
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-002"));
        ex.Message.Should().Contain("Failed");
    }

    #endregion

    #region State Transition Tests

    [Fact]
    public async Task StateTransition_Pending_To_Running()
    {
        // Arrange
        var plan = CreateMultiStepPlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Pre-assert
        execution.Status.Should().Be(RunbookExecutionStatus.Pending);

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert - After first step, should be PartiallyCompleted or Running
        result.StartedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task StateTransition_Running_To_Completed()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert
        result.Status.Should().Be(RunbookExecutionStatus.Completed);
        result.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task StateTransition_Running_To_Cancelled()
    {
        // Arrange
        var plan = CreateMultiStepPlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Start execution
        await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Act
        var result = await _sut.CancelExecutionAsync(execution.ExecutionId);

        // Assert
        result.Status.Should().Be(RunbookExecutionStatus.Cancelled);
        result.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task StepTransition_Pending_To_InProgress_To_Completed()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Pre-assert
        execution.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Pending);
        execution.Steps[0].StartedAt.Should().BeNull();

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert
        var step = result.Steps[0];
        step.Status.Should().Be(RunbookStepExecutionStatus.Completed);
        step.StartedAt.Should().NotBeNull();
        step.CompletedAt.Should().NotBeNull();
        step.CompletedAt.Should().BeOnOrAfter(step.StartedAt!.Value);
    }

    [Fact]
    public async Task StepTransition_AwaitingApproval_To_Pending_After_Approval()
    {
        // Arrange
        var plan = CreatePlanRequiringApproval();
        var execution = await _sut.StartExecutionAsync(plan);

        // Pre-assert
        execution.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.AwaitingApproval);

        // Act
        var result = await _sut.ApproveStepAsync(execution.ExecutionId, "STEP-001", "approver@county.gov");

        // Assert - After approval, should be Pending (ready to execute)
        result.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Pending);
    }

    #endregion

    #region Cancellation Tests

    [Fact]
    public async Task Cancellation_PendingSteps_AreSkipped()
    {
        // Arrange
        var plan = CreateMultiStepPlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Execute first step only
        await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Act
        var result = await _sut.CancelExecutionAsync(execution.ExecutionId);

        // Assert - Step 1 completed, steps 2 and 3 skipped
        result.Steps.First(s => s.StepId == "STEP-001").Status.Should().Be(RunbookStepExecutionStatus.Completed);
        result.Steps.First(s => s.StepId == "STEP-002").Status.Should().Be(RunbookStepExecutionStatus.Skipped);
        result.Steps.First(s => s.StepId == "STEP-003").Status.Should().Be(RunbookStepExecutionStatus.Skipped);
    }

    [Fact]
    public async Task Cancellation_CompletedSteps_RemainCompleted()
    {
        // Arrange
        var plan = CreateMultiStepPlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Execute first two steps
        var result1 = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");
        await _sut.ExecuteStepAsync(result1.ExecutionId, "STEP-002");

        // Act
        var result = await _sut.CancelExecutionAsync(execution.ExecutionId);

        // Assert - Completed steps remain completed
        result.Steps.First(s => s.StepId == "STEP-001").Status.Should().Be(RunbookStepExecutionStatus.Completed);
        result.Steps.First(s => s.StepId == "STEP-002").Status.Should().Be(RunbookStepExecutionStatus.Completed);
        result.Steps.First(s => s.StepId == "STEP-003").Status.Should().Be(RunbookStepExecutionStatus.Skipped);
    }

    [Fact]
    public async Task Cancellation_WithReason_RecordsReason()
    {
        // Arrange
        var plan = CreateMultiStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Act
        var result = await _sut.CancelExecutionAsync(
            execution.ExecutionId,
            "operator@county.gov",
            "Incident resolved externally");

        // Assert
        result.Notes.Should().Contain("Incident resolved externally");
        result.Notes.Should().Contain("operator@county.gov");
    }

    #endregion

    #region DryRun Tests

    [Fact]
    public async Task DryRun_PassesDryRunFlagToActionProvider()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var options = new RunbookExecutionOptions { DryRun = true, AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act
        await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert - Action provider should receive isDryRun=true
        _actionProviderMock.Verify(p =>
            p.ExecuteAsync(
                It.IsAny<RunbookPlan>(),
                It.IsAny<RunbookStep>(),
                true, // isDryRun should be true
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DryRun_False_PassesFalseToActionProvider()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var options = new RunbookExecutionOptions { DryRun = false, AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act
        await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert - Action provider should receive isDryRun=false
        _actionProviderMock.Verify(p =>
            p.ExecuteAsync(
                It.IsAny<RunbookPlan>(),
                It.IsAny<RunbookStep>(),
                false, // isDryRun should be false
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DryRun_RecordsInExecution()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var options = new RunbookExecutionOptions { DryRun = true };

        // Act
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Assert
        execution.IsDryRun.Should().BeTrue();
    }

    #endregion

    #region Test Helpers

    private static RunbookPlan CreateMultiStepPlan()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Multi-Step Plan",
            Description = "Plan with multiple steps",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "Step 1 - Diagnostic",
                    Description = "First diagnostic step",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = false
                },
                new RunbookStep
                {
                    StepId = "STEP-002",
                    Order = 2,
                    Title = "Step 2 - Config Check",
                    Description = "Second step - check config",
                    Kind = RunbookStepKind.ConfigCheck,
                    SafetyLevel = RunbookSafetyLevel.LowRisk,
                    RequiresHumanApproval = false
                },
                new RunbookStep
                {
                    StepId = "STEP-003",
                    Order = 3,
                    Title = "Step 3 - Restart",
                    Description = "Third step - restart service",
                    Kind = RunbookStepKind.RestartService,
                    SafetyLevel = RunbookSafetyLevel.MediumRisk,
                    RequiresHumanApproval = false
                }
            ]
        };
    }

    private static RunbookPlan CreateSingleStepPlan()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Single Step Plan",
            Description = "Plan with one step",
            OverallSeverity = IncidentSeverity.Info,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "Single Step",
                    Description = "Only step in plan",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = false
                }
            ]
        };
    }

    private static RunbookPlan CreatePlanRequiringApproval()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Approval Required Plan",
            Description = "Plan requiring approval",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "Approval Step",
                    Description = "Step requiring approval",
                    Kind = RunbookStepKind.RestartService,
                    SafetyLevel = RunbookSafetyLevel.MediumRisk,
                    RequiresHumanApproval = true
                }
            ]
        };
    }

    #endregion
}
