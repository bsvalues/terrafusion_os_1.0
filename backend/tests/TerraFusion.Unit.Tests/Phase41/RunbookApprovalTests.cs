// =============================================================================
// Phase 41: Runbook Execution Engine - Approval Workflow Tests
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0
// Tests for approval enforcement and workflow compliance.
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
/// Tests for approval workflow enforcement.
/// Focus: Approval requirements, safety level enforcement, manual-only steps.
/// </summary>
public sealed class RunbookApprovalTests : IDisposable
{
    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly Mock<ILogger<RunbookExecutor>> _loggerMock;
    private readonly RunbookExecutor _sut;

    public RunbookApprovalTests()
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

    #region Approval Enforcement Tests

    [Fact]
    public async Task RequiresHumanApproval_True_MustBeApprovedBeforeExecution()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Assert - Step starts as AwaitingApproval
        var step = execution.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.AwaitingApproval);

        // Act & Assert - Cannot execute without approval
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ExecuteStepAsync(execution.ExecutionId, stepId));
        ex.Message.Should().Contain("requires approval");
    }

    [Fact]
    public async Task RequiresHumanApproval_ApprovedThenExecute_Succeeds()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Approve the step
        await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "approver@county.gov");

        // Act - Now execute
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        var step = result.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.Completed);
        step.ApprovedBy.Should().Be("approver@county.gov");
    }

    [Fact]
    public async Task HighRiskStep_RequiresApproval_EvenWithAutoExecutionEnabled()
    {
        // Arrange
        var plan = CreatePlanWithHighRiskStep();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);
        var stepId = plan.Steps[0].StepId;

        // Assert - High risk step should require approval
        var step = execution.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.AwaitingApproval);
    }

    [Fact]
    public async Task SafeStep_WithAutoExecutionDisabled_RequiresApproval()
    {
        // Arrange
        var plan = CreatePlanWithSafeStep();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = false }; // Phase 41 default
        var execution = await _sut.StartExecutionAsync(plan, options);
        var stepId = plan.Steps[0].StepId;

        // Assert - Even safe steps require approval in Phase 41
        var step = execution.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.AwaitingApproval);
    }

    [Fact]
    public async Task SafeStep_WithAutoExecutionEnabled_CanExecuteWithoutApproval()
    {
        // Arrange
        var plan = CreatePlanWithSafeStep();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);
        var stepId = plan.Steps[0].StepId;

        // Assert - Safe step should be Pending (not AwaitingApproval)
        var step = execution.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.Pending);

        // Act - Execute without approval
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        var executedStep = result.Steps.First(s => s.StepId == stepId);
        executedStep.Status.Should().Be(RunbookStepExecutionStatus.Completed);
    }

    [Fact]
    public async Task ApprovalTimestamp_IsRecorded()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;
        var beforeApproval = DateTimeOffset.UtcNow;

        // Act
        var result = await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "approver@county.gov");

        // Assert
        var step = result.Steps.First(s => s.StepId == stepId);
        step.ApprovedAt.Should().NotBeNull();
        step.ApprovedAt!.Value.Should().BeOnOrAfter(beforeApproval);
        step.ApprovedAt.Value.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task ApproverIdentity_IsRequired()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Act & Assert - Empty string not allowed
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.ApproveStepAsync(execution.ExecutionId, stepId, ""));

        // Act & Assert - Whitespace not allowed
        await Assert.ThrowsAsync<ArgumentException>(() =>
            _sut.ApproveStepAsync(execution.ExecutionId, stepId, "   "));
    }

    [Fact]
    public async Task ApproverIdentity_IsPersisted()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Act
        await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "john.doe@benton.county.gov");

        // Assert - Verify persisted
        var retrieved = await _sut.GetExecutionAsync(execution.ExecutionId);
        var step = retrieved!.Steps.First(s => s.StepId == stepId);
        step.ApprovedBy.Should().Be("john.doe@benton.county.gov");
    }

    [Fact]
    public async Task DoubleApproval_IsRejected()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // First approval
        await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "approver1@county.gov");

        // Act & Assert - Second approval rejected
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ApproveStepAsync(execution.ExecutionId, stepId, "approver2@county.gov"));
        ex.Message.Should().Contain("already approved");
    }

    [Fact]
    public async Task ApprovingCompletedStep_IsRejected()
    {
        // Arrange
        var plan = CreatePlanWithSafeStep();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);
        var stepId = plan.Steps[0].StepId;

        // Execute the step
        await _sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Act & Assert - Cannot approve completed step
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _sut.ApproveStepAsync(execution.ExecutionId, stepId, "approver@county.gov"));
        ex.Message.Should().Contain("cannot be approved");
    }

    #endregion

    #region Safety Level Enforcement Tests

    [Fact]
    public async Task InfoOnlyStep_IsSafest()
    {
        // Arrange
        var plan = new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "InfoOnly Test",
            Description = "Test",
            OverallSeverity = IncidentSeverity.Info,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "View Dashboard",
                    Description = "Read-only dashboard view",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = false
                }
            ]
        };

        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Assert - InfoOnly step can auto-execute
        var step = execution.Steps.First();
        step.Status.Should().Be(RunbookStepExecutionStatus.Pending);
    }

    [Fact]
    public async Task LowRiskStep_WithApprovalFalse_CanAutoExecute()
    {
        // Arrange
        var plan = new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "LowRisk Test",
            Description = "Test",
            OverallSeverity = IncidentSeverity.Info,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "Check Config",
                    Description = "Read configuration file",
                    Kind = RunbookStepKind.ConfigCheck,
                    SafetyLevel = RunbookSafetyLevel.LowRisk,
                    RequiresHumanApproval = false
                }
            ]
        };

        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Assert - LowRisk step with no approval requirement can auto-execute
        var step = execution.Steps.First();
        step.Status.Should().Be(RunbookStepExecutionStatus.Pending);
    }

    [Fact]
    public async Task MediumRiskStep_RequiresApproval_UnlessExplicitlyAllowed()
    {
        // Arrange
        var plan = new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "MediumRisk Test",
            Description = "Test",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "Restart Service",
                    Description = "Restart the web server",
                    Kind = RunbookStepKind.RestartService,
                    SafetyLevel = RunbookSafetyLevel.MediumRisk,
                    RequiresHumanApproval = true // MediumRisk should require approval
                }
            ]
        };

        var execution = await _sut.StartExecutionAsync(plan);

        // Assert - MediumRisk step requires approval
        var step = execution.Steps.First();
        step.Status.Should().Be(RunbookStepExecutionStatus.AwaitingApproval);
    }

    [Fact]
    public async Task HighRiskStep_AlwaysRequiresApproval()
    {
        // Arrange
        var plan = CreatePlanWithHighRiskStep();

        // Even with auto-execution enabled
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Assert - HighRisk always requires approval
        var step = execution.Steps.First();
        step.Status.Should().Be(RunbookStepExecutionStatus.AwaitingApproval);
    }

    #endregion

    #region Test Helpers

    private static RunbookPlan CreatePlanWithApprovalRequired()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Approval Required Plan",
            Description = "Plan requiring human approval",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "Diagnostic Step",
                    Description = "Check system health",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = true
                }
            ]
        };
    }

    private static RunbookPlan CreatePlanWithSafeStep()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Safe Step Plan",
            Description = "Plan with safe step",
            OverallSeverity = IncidentSeverity.Info,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "View Logs",
                    Description = "Read-only log viewing",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = false
                }
            ]
        };
    }

    private static RunbookPlan CreatePlanWithHighRiskStep()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "High Risk Plan",
            Description = "Plan with high risk step",
            OverallSeverity = IncidentSeverity.Critical,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = "STEP-001",
                    Order = 1,
                    Title = "Database Failover",
                    Description = "Failover to backup database",
                    Kind = RunbookStepKind.Failover,
                    SafetyLevel = RunbookSafetyLevel.HighRisk,
                    RequiresHumanApproval = true
                }
            ]
        };
    }

    #endregion
}
