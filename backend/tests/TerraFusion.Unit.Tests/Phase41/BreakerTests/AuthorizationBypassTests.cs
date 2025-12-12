// =============================================================================
// Phase 41 Breaker Tests: Authorization Bypass Attacks
// =============================================================================
// Tests for approval circumvention and privilege escalation attempts.
// Attack vectors: empty string, whitespace-only, null coercion, re-approval
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
/// BREAKER: Tests for authorization bypass attacks on the approval workflow.
/// </summary>
[Trait("Phase", "41")]
[Trait("Component", "RunbookExecution")]
[Trait("Category", "Breaker")]
public sealed class AuthorizationBypassTests : IDisposable
{
    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly RunbookExecutor _sut;

    public AuthorizationBypassTests()
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

    #region ApprovedBy Validation Attacks

    [Theory]
    [InlineData("")]           // Empty string
    [InlineData(" ")]          // Single space
    [InlineData("  ")]         // Multiple spaces
    [InlineData("\t")]         // Tab
    [InlineData("\n")]         // Newline
    [InlineData("\r\n")]       // Windows newline
    [InlineData(" \t\n ")]     // Mixed whitespace
    public async Task ApproveStepAsync_WhitespaceApprovedBy_ThrowsArgumentException(string whitespaceValue)
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Act
        var act = () => _sut.ApproveStepAsync(execution.ExecutionId, stepId, whitespaceValue);

        // Assert - BREAKER: Verify whitespace is rejected, not treated as valid approval
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*approvedBy*");
    }

    [Fact]
    public async Task ApproveStepAsync_NullApprovedBy_ThrowsArgumentNullException()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Act
        var act = () => _sut.ApproveStepAsync(execution.ExecutionId, stepId, null!);

        // Assert - BREAKER: Null must be explicitly rejected
        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task ApproveStepAsync_ApprovedByNotStoredWhenValidationFails_NoStateCorruption()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Act - Try invalid approval
        try
        {
            await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "");
        }
        catch (ArgumentException) { /* expected */ }

        // Assert - BREAKER: Verify step state was not corrupted
        var reloadedExecution = await _sut.GetExecutionAsync(execution.ExecutionId);
        reloadedExecution.Should().NotBeNull();
        var step = reloadedExecution!.Steps.First(s => s.StepId == stepId);
        step.ApprovedBy.Should().BeNull("Failed validation should not set ApprovedBy");
        step.ApprovedAt.Should().BeNull("Failed validation should not set ApprovedAt");
        step.Status.Should().Be(RunbookStepExecutionStatus.AwaitingApproval);
    }

    #endregion

    #region Double Approval Attacks

    [Fact]
    public async Task ApproveStepAsync_AlreadyApproved_ThrowsInvalidOperationException()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // First valid approval
        await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "user1@county.gov");

        // Act - BREAKER: Try to approve again (privilege escalation attempt)
        var act = () => _sut.ApproveStepAsync(execution.ExecutionId, stepId, "attacker@evil.com");

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already approved*");
    }

    [Fact]
    public async Task ApproveStepAsync_ChangeApprover_NotAllowed()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // First approval
        var originalApproval = await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "original@county.gov");
        var originalApprover = originalApproval.Steps.First(s => s.StepId == stepId).ApprovedBy;

        // Act - BREAKER: Try to overwrite approval
        try
        {
            await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "attacker@evil.com");
        }
        catch (InvalidOperationException) { /* expected */ }

        // Assert - BREAKER: Original approver should be preserved
        var reloaded = await _sut.GetExecutionAsync(execution.ExecutionId);
        var step = reloaded!.Steps.First(s => s.StepId == stepId);
        step.ApprovedBy.Should().Be(originalApprover, "Original approval must not be overwritten");
    }

    #endregion

    #region Execute Without Approval Attacks

    [Fact]
    public async Task ExecuteStepAsync_RequiresApproval_NotApproved_Blocked()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Act - BREAKER: Try to execute without approval
        var act = () => _sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");
    }

    [Fact]
    public async Task ExecuteStepAsync_HighRiskStep_NoApproval_Blocked()
    {
        // Arrange - HighRisk steps always require approval regardless of settings
        var plan = CreatePlanWithHighRiskStep();
        var execution = await _sut.StartExecutionAsync(plan, new RunbookExecutionOptions
        {
            AllowSafeAutoExecution = true  // Even with this flag, high-risk should be blocked
        });
        var stepId = plan.Steps[0].StepId;

        // Assert - BREAKER: Step should require approval due to SafetyLevel
        var step = execution.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.AwaitingApproval);

        // Act - BREAKER: Try to execute without approval
        var act = () => _sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task ExecuteStepAsync_ApprovalRequired_ApproveThenExecute_Succeeds()
    {
        // Arrange
        var plan = CreatePlanWithApprovalRequired();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = false };
        var execution = await _sut.StartExecutionAsync(plan, options);
        var stepId = plan.Steps[0].StepId;

        // Approve the step normally
        await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "approver@county.gov");

        // Act - Execute the step (now it should work)
        var executed = await _sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert - Step completed normally after approval
        var stepExec = executed.Steps.First(s => s.StepId == stepId);
        stepExec.Status.Should().Be(RunbookStepExecutionStatus.Completed);
        stepExec.ApprovedBy.Should().Be("approver@county.gov");
    }

    #endregion

    #region Step Status Manipulation Attacks

    [Fact]
    public async Task ExecuteStepAsync_StepAlreadyCompleted_CannotReExecute()
    {
        // Arrange - Create and execute a step
        var plan = CreatePlanWithInfoOnlyStep();
        var execution = await _sut.StartExecutionAsync(plan, new RunbookExecutionOptions
        {
            AllowSafeAutoExecution = true
        });
        var stepId = plan.Steps[0].StepId;

        // Execute once (need to approve first due to default options)
        await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "admin@county.gov");
        await _sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Act - BREAKER: Try to re-execute completed step
        var act = () => _sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert - Execution is now Completed, cannot execute any more steps
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Cannot execute step*");
    }

    [Fact]
    public async Task ExecuteStepAsync_StepSkipped_CannotExecute()
    {
        // Arrange - Create and cancel execution (which skips pending steps)
        var plan = CreateMultiStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Cancel to mark steps as skipped
        await _sut.CancelExecutionAsync(execution.ExecutionId, "admin", "Testing");

        // Act - BREAKER: Try to execute skipped step
        var act = () => _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    #endregion

    #region Helper Methods

    private static RunbookPlan CreatePlanWithApprovalRequired()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Test Plan - Approval Required",
            Description = "Test plan for approval tests",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = $"STEP-{Guid.NewGuid():N}",
                    Order = 1,
                    Title = "Approval Required Step",
                    Description = "Test step requiring approval",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.LowRisk,
                    RequiresHumanApproval = true
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
            Title = "Test Plan - High Risk",
            Description = "Test plan with high risk step",
            OverallSeverity = IncidentSeverity.Critical,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = $"STEP-{Guid.NewGuid():N}",
                    Order = 1,
                    Title = "High Risk Step",
                    Description = "High risk remediation step",
                    Kind = RunbookStepKind.RestartService,
                    SafetyLevel = RunbookSafetyLevel.HighRisk,  // Forces approval
                    RequiresHumanApproval = false  // Not explicit, but SafetyLevel overrides
                }
            ]
        };
    }

    private static RunbookPlan CreatePlanWithInfoOnlyStep()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Test Plan - Info Only",
            Description = "Test plan with info only step",
            OverallSeverity = IncidentSeverity.Info,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps =
            [
                new RunbookStep
                {
                    StepId = $"STEP-{Guid.NewGuid():N}",
                    Order = 1,
                    Title = "Info Only Step",
                    Description = "Safe investigation step",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = false
                }
            ]
        };
    }

    private static RunbookPlan CreateMultiStepPlan()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Test Plan - Multi Step",
            Description = "Test plan with multiple steps",
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
                    Description = "First step",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = false
                },
                new RunbookStep
                {
                    StepId = "STEP-002",
                    Order = 2,
                    Title = "Step 2",
                    Description = "Second step",
                    Kind = RunbookStepKind.ConfigCheck,
                    SafetyLevel = RunbookSafetyLevel.LowRisk,
                    RequiresHumanApproval = true
                }
            ]
        };
    }

    #endregion
}
