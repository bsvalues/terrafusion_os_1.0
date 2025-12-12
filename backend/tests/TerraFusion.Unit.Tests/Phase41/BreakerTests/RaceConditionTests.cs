// =============================================================================
// Phase 41 Breaker Tests: Race Conditions and Concurrency
// =============================================================================
// Tests for race conditions, concurrent approvals, and parallel execution attacks.
// Attack vectors: concurrent approvals, parallel step execution, cancellation races
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
/// BREAKER: Tests for race conditions and concurrent access attacks.
/// Note: These tests probe for concurrency vulnerabilities but may need
/// production-grade synchronization to fully validate thread safety.
/// </summary>
[Trait("Phase", "41")]
[Trait("Component", "RunbookExecution")]
[Trait("Category", "Breaker")]
public sealed class RaceConditionTests : IDisposable
{
    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly RunbookExecutor _sut;

    public RaceConditionTests()
    {
        _store = new InMemoryRunbookExecutionStore();
        _actionProviderMock = new Mock<IRunbookActionProvider>();

        // Default: action provider succeeds (but slowly)
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Succeeded("Action completed"));

        _sut = new RunbookExecutor(_store, _actionProviderMock.Object, Mock.Of<ILogger<RunbookExecutor>>());
    }

    public void Dispose()
    {
        _store.ClearAsync().GetAwaiter().GetResult();
    }

    #region Concurrent Approval Attacks

    [Fact]
    public async Task ConcurrentApprovals_SameStep_OnlyFirstSucceeds()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;

        // Act - BREAKER: Try to approve same step concurrently
        // The implementation is secure - it throws on duplicate approval attempts
        var approvalTasks = Enumerable.Range(1, 10)
            .Select(async i =>
            {
                try
                {
                    return await _sut.ApproveStepAsync(execution.ExecutionId, stepId, $"user{i}@county.gov");
                }
                catch (InvalidOperationException)
                {
                    // Expected for concurrent attempts after first succeeds
                    return null;
                }
            })
            .ToList();

        var results = await Task.WhenAll(approvalTasks);

        // Assert - Only one approval should succeed
        var successfulApprovals = results.Where(r => r != null).ToList();
        successfulApprovals.Should().HaveCount(1, "Only one concurrent approval should succeed");

        var finalExecution = await _sut.GetExecutionAsync(execution.ExecutionId);
        var step = finalExecution!.Steps[0];
        step.ApprovedBy.Should().NotBeNullOrEmpty();
        step.ApprovedAt.Should().NotBeNull();
        // After approval, step moves to Pending (ready to execute)
        step.Status.Should().Be(RunbookStepExecutionStatus.Pending);
    }

    [Fact]
    public async Task ConcurrentApprovals_DifferentSteps_AllSucceed()
    {
        // Arrange
        var plan = CreateThreeStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Act - BREAKER: Approve different steps concurrently
        var approvalTasks = plan.Steps
            .Select((step, i) => _sut.ApproveStepAsync(execution.ExecutionId, step.StepId, $"user{i}@county.gov"))
            .ToList();

        var results = await Task.WhenAll(approvalTasks);

        // Assert - All approvals should succeed
        results.Should().AllSatisfy(r => r.Should().NotBeNull());

        var finalExecution = await _sut.GetExecutionAsync(execution.ExecutionId);
        finalExecution!.Steps.Should().AllSatisfy(s =>
        {
            s.Status.Should().Be(RunbookStepExecutionStatus.Pending);
            s.ApprovedBy.Should().NotBeNullOrEmpty();
        });
    }

    #endregion

    #region Parallel Execution Attacks

    [Fact]
    public async Task ParallelExecution_SameStep_OnlyOneSucceeds()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);
        var stepId = plan.Steps[0].StepId;
        await _sut.ApproveStepAsync(execution.ExecutionId, stepId, "admin@county.gov");

        // Act - BREAKER: Try to execute same step in parallel
        // The implementation is secure - it throws on re-execution attempts
        var executeTasks = Enumerable.Range(1, 5)
            .Select(async _ =>
            {
                try
                {
                    return await _sut.ExecuteStepAsync(execution.ExecutionId, stepId);
                }
                catch (InvalidOperationException)
                {
                    // Expected for concurrent attempts after first succeeds
                    return null;
                }
            })
            .ToList();

        var results = await Task.WhenAll(executeTasks);

        // Assert - Only one execution should succeed
        var successful = results.Where(r => r != null && r.Status == RunbookExecutionStatus.Completed).ToList();
        successful.Should().HaveCountLessOrEqualTo(1, "Only one parallel execution should succeed");

        // Final state should be consistent
        var finalExecution = await _sut.GetExecutionAsync(execution.ExecutionId);
        finalExecution!.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Completed);
    }

    [Fact]
    public async Task SequentialSteps_MustExecuteInOrder()
    {
        // Arrange
        var plan = CreateThreeStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Approve all steps first
        foreach (var step in plan.Steps)
        {
            await _sut.ApproveStepAsync(execution.ExecutionId, step.StepId, "admin@county.gov");
        }

        // Act - BREAKER: Try to execute steps 2 and 3 before step 1 (should throw)
        var actStep2 = async () => await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[1].StepId);
        var actStep3 = async () => await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[2].StepId);

        // Assert - Steps 2 and 3 should throw (step 1 not completed)
        await actStep2.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*prior steps*");
        await actStep3.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*prior steps*");

        // Only after step 1 completes, step 2 should succeed
        await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);
        var afterStep1 = await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[1].StepId);
        afterStep1.Steps.First(s => s.StepId == plan.Steps[1].StepId).Status.Should().Be(RunbookStepExecutionStatus.Completed);
    }

    #endregion

    #region Cancellation Race Attacks

    [Fact]
    public async Task CancelDuringExecution_GracefulHandling()
    {
        // Arrange - Slow provider to create race window
        var slowProvider = new Mock<IRunbookActionProvider>();
        slowProvider
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .Returns(async (RunbookPlan _, RunbookStep _, bool _, CancellationToken ct) =>
            {
                await Task.Delay(100, ct);
                return RunbookStepResult.Succeeded("Completed");
            });

        var executor = new RunbookExecutor(_store, slowProvider.Object, Mock.Of<ILogger<RunbookExecutor>>());

        var plan = CreateSingleStepPlan();
        var execution = await executor.StartExecutionAsync(plan);
        await executor.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");

        // Act - BREAKER: Start execution and cancel concurrently
        var executeTask = executor.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);
        var cancelTask = Task.Run(async () =>
        {
            await Task.Delay(10); // Small delay to let execution start
            try
            {
                await executor.CancelExecutionAsync(execution.ExecutionId, "admin", "Race test");
            }
            catch (InvalidOperationException)
            {
                // Expected if execution completes first
            }
        });

        await Task.WhenAll(executeTask, cancelTask);

        // Assert - Execution should be in a consistent state
        var finalExecution = await executor.GetExecutionAsync(execution.ExecutionId);
        finalExecution!.Status.Should().BeOneOf(
            RunbookExecutionStatus.Cancelled,
            RunbookExecutionStatus.Completed);
    }

    [Fact]
    public async Task MultipleCancellations_SecondThrows()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Act - First cancellation succeeds
        var firstCancel = await _sut.CancelExecutionAsync(execution.ExecutionId, "admin1", "First cancel");
        firstCancel.Status.Should().Be(RunbookExecutionStatus.Cancelled);

        // Second cancellation should throw
        var act = async () => await _sut.CancelExecutionAsync(execution.ExecutionId, "admin2", "Second cancel");

        // Assert - Second cancellation should throw
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*cannot be cancelled*");
    }

    [Fact]
    public async Task CancelAfterCompletion_Throws()
    {
        // Arrange
        var plan = CreateSingleStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);
        await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "admin@county.gov");
        var completed = await _sut.ExecuteStepAsync(execution.ExecutionId, plan.Steps[0].StepId);
        completed.Status.Should().Be(RunbookExecutionStatus.Completed);

        // Act - BREAKER: Try to cancel after completion
        var act = async () => await _sut.CancelExecutionAsync(execution.ExecutionId, "admin", "Too late");

        // Assert - Should throw because completed execution cannot be cancelled
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*cannot be cancelled*");
    }

    #endregion

    #region Store Race Conditions

    [Fact]
    public async Task ConcurrentStoreUpdates_ConsistentState()
    {
        // Arrange
        var plan = CreateTwoStepPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Act - BREAKER: Concurrent updates to same execution
        var updateTasks = new List<Task<RunbookExecution>>
        {
            _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[0].StepId, "user1@county.gov"),
            _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[1].StepId, "user2@county.gov")
        };

        var results = await Task.WhenAll(updateTasks);

        // Assert - Both should succeed, final state should have both approved
        var finalExecution = await _sut.GetExecutionAsync(execution.ExecutionId);
        finalExecution!.Steps.Should().AllSatisfy(s =>
            s.Status.Should().Be(RunbookStepExecutionStatus.Pending));
    }

    [Fact]
    public async Task ReadWhileWrite_ConsistentView()
    {
        // Arrange
        var plan = CreateManyStepPlan(20);
        var execution = await _sut.StartExecutionAsync(plan);

        // Act - BREAKER: Read and write concurrently
        var tasks = new List<Task>();

        // Approve steps
        for (int i = 0; i < 10; i++)
        {
            var idx = i;
            tasks.Add(Task.Run(async () =>
            {
                await _sut.ApproveStepAsync(execution.ExecutionId, plan.Steps[idx].StepId, $"user{idx}@county.gov");
            }));
        }

        // Read execution
        for (int i = 0; i < 5; i++)
        {
            tasks.Add(Task.Run(async () =>
            {
                var read = await _sut.GetExecutionAsync(execution.ExecutionId);
                read.Should().NotBeNull();
            }));
        }

        await Task.WhenAll(tasks);

        // Assert - Final state should be consistent
        var finalExecution = await _sut.GetExecutionAsync(execution.ExecutionId);
        finalExecution.Should().NotBeNull();
        finalExecution!.Steps.Count.Should().Be(20);
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

    private static RunbookPlan CreateThreeStepPlan()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Three Step Plan",
            Description = "Test plan with three steps",
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
