// =============================================================================
// Phase 41 Breaker Tests: Resource Exhaustion, DryRun & Immutability
// =============================================================================
// Tests for resource exhaustion attacks, DryRun enforcement, and immutability.
// Attack vectors: many steps, unbounded store, DryRun bypass, plan mutation
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
/// BREAKER: Tests for resource exhaustion, DryRun enforcement, and immutability.
/// </summary>
public sealed class ResourceDryRunImmutabilityTests : IDisposable
{
    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly RunbookExecutor _sut;

    public ResourceDryRunImmutabilityTests()
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

    #region Resource Exhaustion

    [Fact]
    public async Task ManySteps_ExecutionHandlesGracefully()
    {
        // Arrange - BREAKER: Create plan with 50 steps (resource exhaustion test)
        var plan = CreateManyStepPlan(50);
        var execution = await _sut.StartExecutionAsync(plan);

        // Act - Approve and execute all steps
        foreach (var step in plan.Steps)
        {
            await _sut.ApproveStepAsync(execution.ExecutionId, step.StepId, "admin@county.gov");
            execution = await _sut.ExecuteStepAsync(execution.ExecutionId, step.StepId);
        }

        // Assert
        var finalExecution = await _sut.GetExecutionAsync(execution.ExecutionId);
        finalExecution!.Status.Should().Be(RunbookExecutionStatus.Completed);
        finalExecution.Steps.Should().HaveCount(50);
        finalExecution.Steps.Should().AllSatisfy(s =>
            s.Status.Should().Be(RunbookStepExecutionStatus.Completed));
    }

    [Fact]
    public async Task ManyExecutions_StoreHandlesLoad()
    {
        // Arrange - BREAKER: Create 50 executions (store growth test)
        var plans = Enumerable.Range(0, 50)
            .Select(i => CreateSingleStepPlan($"PLAN-{i:D4}"))
            .ToList();

        // Act
        var executions = new List<RunbookExecution>();
        foreach (var plan in plans)
        {
            var exec = await _sut.StartExecutionAsync(plan);
            executions.Add(exec);
        }

        // Assert
        _store.Count.Should().Be(50);

        // Verify all executions are retrievable
        foreach (var exec in executions)
        {
            var retrieved = await _sut.GetExecutionAsync(exec.ExecutionId);
            retrieved.Should().NotBeNull();
            retrieved!.PlanId.Should().Be(exec.PlanId);
        }
    }

    [Fact]
    public async Task StoreCleanup_ReleasesMemory()
    {
        // Arrange
        var plan = CreateSingleStepPlan("TEST-PLAN");
        var execution = await _sut.StartExecutionAsync(plan);

        _store.Count.Should().Be(1);

        // Act - BREAKER: Verify store cleanup works
        await _store.DeleteAsync(execution.ExecutionId);

        // Assert
        _store.Count.Should().Be(0);
        var retrieved = await _store.GetByIdAsync(execution.ExecutionId);
        retrieved.Should().BeNull();
    }

    [Fact]
    public async Task StoreClear_RemovesAll()
    {
        // Arrange - Create multiple executions
        for (int i = 0; i < 10; i++)
        {
            var plan = CreateSingleStepPlan($"PLAN-{i}");
            await _sut.StartExecutionAsync(plan);
        }

        _store.Count.Should().Be(10);

        // Act - BREAKER: Clear all
        await _store.ClearAsync();

        // Assert
        _store.Count.Should().Be(0);
    }

    #endregion

    #region DryRun Enforcement

    [Fact]
    public async Task DryRun_DefaultsToTrue()
    {
        // Arrange
        var plan = CreateSingleStepPlan("TEST-PLAN");

        // Act - BREAKER: Use default options (should default to DryRun=true)
        var execution = await _sut.StartExecutionAsync(plan);

        // Assert
        execution.IsDryRun.Should().BeTrue("DryRun should default to true per EXECUTION SPEC LOCK v1.0.0");
    }

    [Fact]
    public async Task DryRun_ExplicitTrue_PassedToActionProvider()
    {
        // Arrange
        bool capturedDryRun = false;
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .Callback<RunbookPlan, RunbookStep, bool, CancellationToken>((_, _, dryRun, _) => capturedDryRun = dryRun)
            .ReturnsAsync(RunbookStepResult.Succeeded("Executed"));

        var plan = CreateSingleStepPlan("TEST-PLAN");

        // Act
        var execution = await _sut.StartExecutionAsync(plan, new RunbookExecutionOptions
        {
            DryRun = true
        });
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");
        await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Assert
        capturedDryRun.Should().BeTrue();
    }

    [Fact]
    public async Task DryRun_ExplicitFalse_RealExecution()
    {
        // Arrange
        bool capturedDryRun = true;
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .Callback<RunbookPlan, RunbookStep, bool, CancellationToken>((_, _, dryRun, _) => capturedDryRun = dryRun)
            .ReturnsAsync(RunbookStepResult.Succeeded("Executed"));

        var plan = CreateSingleStepPlan("TEST-PLAN");

        // Act
        var execution = await _sut.StartExecutionAsync(plan, new RunbookExecutionOptions
        {
            DryRun = false
        });
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");
        await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Assert
        capturedDryRun.Should().BeFalse();
    }

    [Fact]
    public async Task DryRun_CannotBeChangedMidExecution()
    {
        // Arrange
        var plan = CreateTwoStepPlan();
        var execution = await _sut.StartExecutionAsync(plan, new RunbookExecutionOptions
        {
            DryRun = true
        });

        // Execute first step
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");
        await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Act - BREAKER: Verify DryRun flag is preserved in execution
        var reloaded = await _sut.GetExecutionAsync(execution.ExecutionId);

        // Assert - DryRun cannot be changed (it's an immutable record property)
        reloaded!.IsDryRun.Should().BeTrue("DryRun flag must be immutable once execution is created");
    }

    #endregion

    #region Action Provider Exploits

    [Fact]
    public async Task ActionProvider_ThrowsException_StepFailsGracefully()
    {
        // Arrange - BREAKER: Provider that throws exceptions
        var throwingProvider = new Mock<IRunbookActionProvider>();
        throwingProvider
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Simulated provider exception"));

        var executor = new RunbookExecutor(_store, throwingProvider.Object, Mock.Of<ILogger<RunbookExecutor>>());

        var plan = CreateSingleStepPlan("TEST-PLAN");
        var execution = await executor.StartExecutionAsync(plan);
        await executor.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");

        // Act
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Assert - Exception should be caught and step marked as failed
        result.Status.Should().Be(RunbookExecutionStatus.Failed);
        var step = result.Steps[0];
        step.Status.Should().Be(RunbookStepExecutionStatus.Failed);
        step.ErrorMessage.Should().Contain("Simulated provider exception");
    }

    [Fact]
    public async Task ActionProvider_ReturnsFailure_StepMarkedFailed()
    {
        // Arrange
        var failingProvider = new Mock<IRunbookActionProvider>();
        failingProvider
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Failed("Provider returned failure"));

        var executor = new RunbookExecutor(_store, failingProvider.Object, Mock.Of<ILogger<RunbookExecutor>>());

        var plan = CreateSingleStepPlan("TEST-PLAN");
        var execution = await executor.StartExecutionAsync(plan);
        await executor.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");

        // Act
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);

        // Assert
        var step = result.Steps[0];
        step.Status.Should().Be(RunbookStepExecutionStatus.Failed);
        step.ErrorMessage.Should().Contain("Provider returned failure");
    }

    #endregion

    #region Plan/Incident Immutability

    [Fact]
    public async Task ExecutePlan_DoesNotModifyOriginal()
    {
        // Arrange
        var originalPlanId = "ORIGINAL-PLAN";
        var plan = CreateSingleStepPlan(originalPlanId);
        var originalStepId = plan.Steps[0].StepId;
        var originalStepTitle = plan.Steps[0].Title;

        // Act
        var execution = await _sut.StartExecutionAsync(plan);
        await _sut.ApproveStepAsync(execution.ExecutionId, originalStepId, "admin@county.gov");
        await _sut.ExecuteStepAsync(execution.ExecutionId, originalStepId);

        // Assert - BREAKER: Original plan should be unchanged
        plan.PlanId.Should().Be(originalPlanId);
        plan.Steps[0].StepId.Should().Be(originalStepId);
        plan.Steps[0].Title.Should().Be(originalStepTitle);
    }

    [Fact]
    public async Task CancelExecution_DoesNotModifyPlan()
    {
        // Arrange
        var plan = CreateTwoStepPlan();
        var originalStepCount = plan.Steps.Count;
        var originalStatuses = plan.Steps.Select(s => s.RequiresHumanApproval).ToList();

        var execution = await _sut.StartExecutionAsync(plan);

        // Act
        await _sut.CancelExecutionAsync(execution.ExecutionId, "admin", "Testing");

        // Assert - BREAKER: Plan should be unchanged
        plan.Steps.Should().HaveCount(originalStepCount);
        for (int i = 0; i < plan.Steps.Count; i++)
        {
            plan.Steps[i].RequiresHumanApproval.Should().Be(originalStatuses[i]);
        }
    }

    [Fact]
    public async Task ExecutionRecord_IsImmutable()
    {
        // Arrange
        var plan = CreateSingleStepPlan("TEST-PLAN");
        var execution1 = await _sut.StartExecutionAsync(plan);
        var originalCreatedAt = execution1.CreatedAt;

        // Act - Make changes through executor
        await _sut.ApproveStepAsync(execution1.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");
        var execution2 = await _sut.ExecuteStepAsync(execution1.ExecutionId, plan.Steps[0].StepId);

        // Assert - execution1 still has original values (records are immutable)
        execution1.Status.Should().Be(RunbookExecutionStatus.Pending, "Original record should be unchanged");
        execution1.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.AwaitingApproval);

        // execution2 is a new record with updated values
        execution2.Status.Should().Be(RunbookExecutionStatus.Completed);
        execution2.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Completed);

        // CreatedAt should be preserved
        execution2.CreatedAt.Should().Be(originalCreatedAt);
    }

    #endregion

    #region Helper Methods

    private static RunbookPlan CreateSingleStepPlan(string planId)
    {
        return new RunbookPlan
        {
            PlanId = planId,
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
                    StepId = $"STEP-{Guid.NewGuid():N}",
                    Order = 1,
                    Title = "Test Step",
                    Description = "Test step",
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
                }
            ]
        };
    }

    private static RunbookPlan CreateManyStepPlan(int stepCount)
    {
        var steps = Enumerable.Range(1, stepCount).Select(i => new RunbookStep
        {
            StepId = $"STEP-{i:D4}",
            Order = i,
            Title = $"Step {i}",
            Description = $"Step {i} description",
            Kind = RunbookStepKind.Diagnostic,
            SafetyLevel = RunbookSafetyLevel.InfoOnly,
            RequiresHumanApproval = true
        }).ToList();

        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = $"Multi Step Plan ({stepCount} steps)",
            Description = "Test plan with many steps",
            OverallSeverity = IncidentSeverity.Info,
            ImpactedCountyIds = [Guid.NewGuid()],
            CreatedAt = DateTimeOffset.UtcNow,
            Steps = steps
        };
    }

    #endregion
}
