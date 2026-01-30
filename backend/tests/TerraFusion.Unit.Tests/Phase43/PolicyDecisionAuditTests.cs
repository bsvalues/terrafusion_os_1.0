// =============================================================================
// Phase 43: Controlled Auto-Remediation - Policy Decision Audit Tests
// =============================================================================
// WIRING SPEC LOCK v1.0.0
// Tests for policy decision audit trail and logging.
// =============================================================================

using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.Operations.Incidents;
using TerraFusion.Operations.Runbooks;
using TerraFusion.Operations.Runbooks.Execution;
using TerraFusion.Operations.Runbooks.Remediation;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase43;

/// <summary>
/// Tests for policy decision audit trail.
/// Focus: Logging, persistence, and auditability of policy decisions.
/// </summary>
[Trait("Phase", "43")]
[Trait("Component", "AutoRemediation")]
[Trait("Category", "Audit")]
public sealed class PolicyDecisionAuditTests : IDisposable
{
    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly Mock<ILogger<RunbookExecutor>> _loggerMock;
    private readonly Mock<IRemediationPolicyEngine> _policyEngineMock;

    public PolicyDecisionAuditTests()
    {
        _store = new InMemoryRunbookExecutionStore();
        _actionProviderMock = new Mock<IRunbookActionProvider>();
        _loggerMock = new Mock<ILogger<RunbookExecutor>>();
        _policyEngineMock = new Mock<IRemediationPolicyEngine>();

        _actionProviderMock
            .Setup(p => p.ExecuteAsync(
                It.IsAny<RunbookPlan>(),
                It.IsAny<RunbookStep>(),
                It.IsAny<bool>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Succeeded("Action completed"));
    }

    public void Dispose()
    {
        _store.ClearAsync().GetAwaiter().GetResult();
    }

    #region Logging Tests

    [Fact]
    public async Task ExecuteStep_WhenAlwaysLogPolicyDecisionsTrue_LogsDecision()
    {
        // Arrange
        var decision = new RemediationDecision(
            RemediationDecisionKind.AllowAutoExecute,
            "rule-auto-001",
            "policy-benton",
            "Safe for auto-execution");

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(decision);

        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF for auto-exec test
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = true, // Phase 44: Required for auto-execution
            OptedInCounties = new HashSet<string> { BentonCountyIdString },
            AlwaysLogPolicyDecisions = true
        };

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object, autoOptions: options);
        var plan = CreateTestPlanWithCounty("benton");
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act
        await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert - verify logging occurred
        _loggerMock.Verify(
            x => x.Log(
                It.Is<LogLevel>(l => l == LogLevel.Information),
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((o, t) => o.ToString()!.Contains("Policy decision") || o.ToString()!.Contains("policy")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            "Policy decision should be logged when AlwaysLogPolicyDecisions is true");
    }

    [Fact]
    public async Task ExecuteStep_DenyDecision_LogsWarning()
    {
        // Arrange
        var decision = new RemediationDecision(
            RemediationDecisionKind.DenyAutoExecute,
            "rule-deny-001",
            "policy-security",
            "Dangerous operation denied");

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(decision);

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object);
        var plan = CreateTestPlan();
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act
        await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert - verify warning logged for denied execution
        _loggerMock.Verify(
            x => x.Log(
                It.Is<LogLevel>(l => l == LogLevel.Warning),
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((o, t) => o.ToString()!.Contains("DENIED") || o.ToString()!.Contains("Denied")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.AtLeastOnce,
            "Denied execution should log a warning");
    }

    #endregion

    #region Persistence Tests

    [Fact]
    public async Task ExecuteStep_PolicyDecision_PersistedInStore()
    {
        // Arrange
        var decision = new RemediationDecision(
            RemediationDecisionKind.AllowAutoExecute,
            "rule-auto-001",
            "policy-benton",
            "Safe for auto-execution");

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(decision);

        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF for auto-exec test
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = true, // Phase 44: Required for auto-execution
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object, autoOptions: options);
        var plan = CreateTestPlanWithCounty("benton");
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act
        await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert - retrieve from store and verify policy decision persisted
        var storedExecution = await _store.GetByIdAsync(execution.ExecutionId);
        storedExecution.Should().NotBeNull();

        var step = storedExecution!.Steps.First(s => s.StepId == stepId);
        step.PolicyDecision.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        step.PolicyRuleId.Should().Be("rule-auto-001");
    }

    [Fact]
    public async Task ExecuteStep_DenyDecision_PersistedWithSkippedStatus()
    {
        // Arrange
        var decision = new RemediationDecision(
            RemediationDecisionKind.DenyAutoExecute,
            "rule-deny-001",
            "policy-security",
            "Dangerous operation denied");

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(decision);

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object);
        var plan = CreateTestPlan();
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act
        await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        var storedExecution = await _store.GetByIdAsync(execution.ExecutionId);
        var step = storedExecution!.Steps.First(s => s.StepId == stepId);

        step.Status.Should().Be(RunbookStepExecutionStatus.Skipped);
        step.PolicyDecision.Should().Be(RemediationDecisionKind.DenyAutoExecute);
        step.ErrorMessage.Should().Contain("Denied by policy");
    }

    #endregion

    #region Audit Context Tests

    [Fact]
    public async Task ExecuteStep_PolicyEngineReceivesCorrectContext()
    {
        // Arrange
        RemediationPolicyContext? capturedContext = null;

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Callback<RemediationPolicyContext>(ctx => capturedContext = ctx)
            .Returns(RemediationDecision.Default("test-policy"));

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object);
        var plan = CreateTestPlanWithCounty("benton");
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Pre-approve since default requires approval
        await sut.ApproveStepAsync(execution.ExecutionId, stepId, "test-user");

        // Act
        await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        capturedContext.Should().NotBeNull();
        // CountyId is the GUID.ToString() of the impacted county
        capturedContext!.CountyId.Should().Be(BentonCountyIdString);
        capturedContext.Plan.Should().NotBeNull();
        capturedContext.Step.Should().NotBeNull();
        capturedContext.Step.StepId.Should().Be(stepId);
        capturedContext.Timestamp.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task ExecuteStep_MultipleSeverities_PassedToPolicy()
    {
        // Arrange
        var capturedContexts = new List<RemediationPolicyContext>();

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Callback<RemediationPolicyContext>(ctx => capturedContexts.Add(ctx))
            .Returns(RemediationDecision.Default("test-policy"));

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object);

        // Create plans with different severities
        var criticalPlan = CreateTestPlanWithSeverity(IncidentSeverity.Critical);
        var lowPlan = CreateTestPlanWithSeverity(IncidentSeverity.Warning);

        var exec1 = await sut.StartExecutionAsync(criticalPlan);
        var exec2 = await sut.StartExecutionAsync(lowPlan);

        await sut.ApproveStepAsync(exec1.ExecutionId, criticalPlan.Steps.First().StepId, "user");
        await sut.ApproveStepAsync(exec2.ExecutionId, lowPlan.Steps.First().StepId, "user");

        // Act
        await sut.ExecuteStepAsync(exec1.ExecutionId, criticalPlan.Steps.First().StepId);
        await sut.ExecuteStepAsync(exec2.ExecutionId, lowPlan.Steps.First().StepId);

        // Assert
        capturedContexts.Should().HaveCount(2);
        capturedContexts.Should().Contain(c => c.Severity == IncidentSeverity.Critical);
        capturedContexts.Should().Contain(c => c.Severity == IncidentSeverity.Warning);
    }

    #endregion

    #region Helper Methods

    private RunbookExecutor CreateExecutor(
        IRemediationPolicyEngine? policyEngine = null,
        AutoRemediationOptions? autoOptions = null)
    {
        var optionsWrapper = autoOptions != null
            ? Options.Create(autoOptions)
            : Options.Create(new AutoRemediationOptions());

        return new RunbookExecutor(
            _store,
            _actionProviderMock.Object,
            _loggerMock.Object,
            policyEngine,
            optionsWrapper);
    }

    // Use well-known GUIDs for county identification in tests
    // Using valid hex GUID that represents Benton County test ID
    private static readonly Guid BentonCountyGuid = Guid.Parse("00000000-0000-0000-0000-0000000be100");
    private static string BentonCountyIdString => BentonCountyGuid.ToString();

    private static RunbookPlan CreateTestPlan()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Test Runbook Plan",
            Description = "Test plan for audit tests",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = [BentonCountyGuid],
            Steps = new List<RunbookStep>
            {
                new()
                {
                    StepId = "step-1",
                    Order = 1,
                    Title = "Test Step 1",
                    Description = "First test step",
                    Kind = RunbookStepKind.Diagnostic,
                    RequiresHumanApproval = false,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly
                }
            },
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    private static RunbookPlan CreateTestPlanWithCounty(string countyName)
    {
        // For this test we only have benton
        var plan = CreateTestPlan();
        return plan;
    }

    private static RunbookPlan CreateTestPlanWithSeverity(IncidentSeverity severity)
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Test Plan with Severity",
            Description = "Test plan for severity tests",
            OverallSeverity = severity,
            ImpactedCountyIds = [BentonCountyGuid],
            Steps = new List<RunbookStep>
            {
                new()
                {
                    StepId = $"step-{Guid.NewGuid():N}",
                    Order = 1,
                    Title = "Test Step",
                    Description = "Test step with severity",
                    Kind = RunbookStepKind.Diagnostic,
                    RequiresHumanApproval = false,
                    SafetyLevel = RunbookSafetyLevel.InfoOnly
                }
            },
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    private static AutoRemediationOptions CreateAutoRemediationOptionsForBenton(bool enableAutoRemediation)
    {
        return new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = enableAutoRemediation ? false : true, // Kill switch OFF when auto-exec enabled
            EnableAutoRemediation = enableAutoRemediation,
            AllowSafeDiagnosticsAutoExecute = enableAutoRemediation, // Phase 44: Required for auto-execution
            OptedInCounties = new HashSet<string> { BentonCountyIdString },
            AlwaysLogPolicyDecisions = true
        };
    }

    #endregion
}
