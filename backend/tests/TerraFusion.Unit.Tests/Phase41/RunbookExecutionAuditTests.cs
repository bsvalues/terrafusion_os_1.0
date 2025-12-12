// =============================================================================
// Phase 41: Runbook Execution Engine - Audit Trail Tests
// =============================================================================
// EXECUTION SPEC LOCK v1.0.0
// Tests for audit trail completeness and integrity.
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
/// Tests for audit trail functionality.
/// Focus: Timestamps, identity tracking, execution records.
/// </summary>
[Trait("Phase", "41")]
[Trait("Component", "RunbookExecution")]
public sealed class RunbookExecutionAuditTests : IDisposable
{
    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly Mock<ILogger<RunbookExecutor>> _loggerMock;
    private readonly RunbookExecutor _sut;

    public RunbookExecutionAuditTests()
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

    #region Execution Timestamp Tests

    [Fact]
    public async Task Execution_CreatedAt_IsSetOnCreation()
    {
        // Arrange
        var plan = CreateTestPlan();
        var before = DateTimeOffset.UtcNow;

        // Act
        var execution = await _sut.StartExecutionAsync(plan);

        // Assert
        execution.CreatedAt.Should().BeOnOrAfter(before);
        execution.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task Execution_StartedAt_IsSetOnFirstStepExecution()
    {
        // Arrange
        var plan = CreateSafePlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Pre-assert
        execution.StartedAt.Should().BeNull();

        var before = DateTimeOffset.UtcNow;

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert
        result.StartedAt.Should().NotBeNull();
        result.StartedAt!.Value.Should().BeOnOrAfter(before);
    }

    [Fact]
    public async Task Execution_CompletedAt_IsSetOnCompletion()
    {
        // Arrange
        var plan = CreateSafePlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);
        var before = DateTimeOffset.UtcNow;

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert
        result.CompletedAt.Should().NotBeNull();
        result.CompletedAt!.Value.Should().BeOnOrAfter(before);
    }

    [Fact]
    public async Task Execution_CompletedAt_IsSetOnCancellation()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);
        var before = DateTimeOffset.UtcNow;

        // Act
        var result = await _sut.CancelExecutionAsync(execution.ExecutionId);

        // Assert
        result.CompletedAt.Should().NotBeNull();
        result.CompletedAt!.Value.Should().BeOnOrAfter(before);
    }

    [Fact]
    public async Task Execution_CompletedAt_IsSetOnFailure()
    {
        // Arrange
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Failed("Action failed"));

        var plan = CreateSafePlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);
        var before = DateTimeOffset.UtcNow;

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert
        result.CompletedAt.Should().NotBeNull();
        result.CompletedAt!.Value.Should().BeOnOrAfter(before);
    }

    #endregion

    #region Step Timestamp Tests

    [Fact]
    public async Task Step_StartedAt_IsSetOnExecution()
    {
        // Arrange
        var plan = CreateSafePlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Pre-assert
        execution.Steps[0].StartedAt.Should().BeNull();

        var before = DateTimeOffset.UtcNow;

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert
        result.Steps[0].StartedAt.Should().NotBeNull();
        result.Steps[0].StartedAt!.Value.Should().BeOnOrAfter(before);
    }

    [Fact]
    public async Task Step_CompletedAt_IsSetOnCompletion()
    {
        // Arrange
        var plan = CreateSafePlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert
        result.Steps[0].CompletedAt.Should().NotBeNull();
        result.Steps[0].CompletedAt!.Value.Should().BeOnOrAfter(result.Steps[0].StartedAt!.Value);
    }

    [Fact]
    public async Task Step_ApprovedAt_IsSetOnApproval()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);
        var before = DateTimeOffset.UtcNow;

        // Act
        var result = await _sut.ApproveStepAsync(execution.ExecutionId, "STEP-001", "approver@county.gov");

        // Assert
        result.Steps[0].ApprovedAt.Should().NotBeNull();
        result.Steps[0].ApprovedAt!.Value.Should().BeOnOrAfter(before);
    }

    #endregion

    #region Identity Tracking Tests

    [Fact]
    public async Task Execution_StartedBy_IsTracked()
    {
        // Arrange
        var plan = CreateTestPlan();
        var options = new RunbookExecutionOptions { InitiatedBy = "operator@benton.county.gov" };

        // Act
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Assert
        execution.StartedBy.Should().Be("operator@benton.county.gov");
    }

    [Fact]
    public async Task Step_ApprovedBy_IsTracked()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Act
        var result = await _sut.ApproveStepAsync(execution.ExecutionId, "STEP-001", "supervisor@county.gov");

        // Assert
        result.Steps[0].ApprovedBy.Should().Be("supervisor@county.gov");
    }

    [Fact]
    public async Task Cancellation_CancelledBy_IsTracked()
    {
        // Arrange
        var plan = CreateTestPlan();
        var execution = await _sut.StartExecutionAsync(plan);

        // Act
        var result = await _sut.CancelExecutionAsync(execution.ExecutionId, "admin@county.gov", "Issue resolved");

        // Assert
        result.Notes.Should().Contain("admin@county.gov");
    }

    #endregion

    #region Execution ID Tests

    [Fact]
    public async Task ExecutionId_HasCorrectFormat()
    {
        // Arrange
        var plan = CreateTestPlan();

        // Act
        var execution = await _sut.StartExecutionAsync(plan);

        // Assert
        execution.ExecutionId.Should().StartWith("EXEC-");
        execution.ExecutionId.Should().HaveLength("EXEC-".Length + 32); // EXEC- + 32 hex chars
    }

    [Fact]
    public async Task ExecutionId_IsUnique()
    {
        // Arrange
        var plan = CreateTestPlan();

        // Act
        var execution1 = await _sut.StartExecutionAsync(plan);
        var execution2 = await _sut.StartExecutionAsync(plan);
        var execution3 = await _sut.StartExecutionAsync(plan);

        // Assert
        execution1.ExecutionId.Should().NotBe(execution2.ExecutionId);
        execution2.ExecutionId.Should().NotBe(execution3.ExecutionId);
        execution1.ExecutionId.Should().NotBe(execution3.ExecutionId);
    }

    #endregion

    #region Error Message Tracking Tests

    [Fact]
    public async Task Step_ErrorMessage_IsTrackedOnFailure()
    {
        // Arrange
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Failed("Connection timeout to database"));

        var plan = CreateSafePlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert
        result.Steps[0].ErrorMessage.Should().Be("Connection timeout to database");
    }

    [Fact]
    public async Task Step_ErrorMessage_IsNull_OnSuccess()
    {
        // Arrange
        var plan = CreateSafePlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert
        result.Steps[0].ErrorMessage.Should().BeNull();
    }

    [Fact]
    public async Task Step_ActionOutput_IsTracked()
    {
        // Arrange
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Succeeded("Service restarted successfully at 10:30 AM"));

        var plan = CreateSafePlan();
        var options = new RunbookExecutionOptions { AllowSafeAutoExecution = true };
        var execution = await _sut.StartExecutionAsync(plan, options);

        // Act
        var result = await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Assert
        result.Steps[0].ActionOutput.Should().Be("Service restarted successfully at 10:30 AM");
    }

    #endregion

    #region Version Tracking Tests

    [Fact]
    public async Task Execution_HasVersionString()
    {
        // Arrange
        var plan = CreateTestPlan();

        // Act
        var execution = await _sut.StartExecutionAsync(plan);

        // Assert
        execution.ExecutionVersion.Should().Be("execution-spec-v1.0.0");
    }

    #endregion

    #region Persistence Tests

    [Fact]
    public async Task AuditTrail_IsPersisted()
    {
        // Arrange
        var plan = CreateSafePlan();
        var options = new RunbookExecutionOptions
        {
            AllowSafeAutoExecution = true,
            InitiatedBy = "operator@county.gov"
        };

        var execution = await _sut.StartExecutionAsync(plan, options);
        await _sut.ExecuteStepAsync(execution.ExecutionId, "STEP-001");

        // Act - Retrieve from store
        var retrieved = await _sut.GetExecutionAsync(execution.ExecutionId);

        // Assert - All audit info should be persisted
        retrieved.Should().NotBeNull();
        retrieved!.StartedBy.Should().Be("operator@county.gov");
        retrieved.CreatedAt.Should().Be(execution.CreatedAt);
        retrieved.Steps[0].StartedAt.Should().NotBeNull();
        retrieved.Steps[0].CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task MultipleExecutions_AllPersisted()
    {
        // Arrange
        var plan = CreateTestPlan();

        // Act
        var exec1 = await _sut.StartExecutionAsync(plan, new RunbookExecutionOptions { InitiatedBy = "user1@county.gov" });
        var exec2 = await _sut.StartExecutionAsync(plan, new RunbookExecutionOptions { InitiatedBy = "user2@county.gov" });

        // Assert
        var executions = await _sut.GetExecutionsByPlanAsync(plan.PlanId);
        executions.Should().HaveCount(2);
        executions.Should().Contain(e => e.StartedBy == "user1@county.gov");
        executions.Should().Contain(e => e.StartedBy == "user2@county.gov");
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
            Description = "Test plan for audit tests",
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

    private static RunbookPlan CreateSafePlan()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Safe Plan",
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
                    Title = "Safe Step",
                    Description = "Read-only operation",
                    Kind = RunbookStepKind.Diagnostic,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly,
                    RequiresHumanApproval = false
                }
            ]
        };
    }

    #endregion
}
