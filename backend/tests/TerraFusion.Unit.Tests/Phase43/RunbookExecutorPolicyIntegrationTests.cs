// =============================================================================
// Phase 43: Controlled Auto-Remediation - Executor Policy Integration Tests
// =============================================================================
// WIRING SPEC LOCK v1.0.0
// Tests for IRemediationPolicyEngine integration with RunbookExecutor.
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
/// Tests for policy engine integration with RunbookExecutor.
/// Focus: Policy decision flow, feature flags, auto-execution control.
/// </summary>
[Trait("Phase", "43")]
[Trait("Component", "AutoRemediation")]
[Trait("Category", "Integration")]
public sealed class RunbookExecutorPolicyIntegrationTests : IDisposable
{
    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly Mock<ILogger<RunbookExecutor>> _loggerMock;
    private readonly Mock<IRemediationPolicyEngine> _policyEngineMock;

    public RunbookExecutorPolicyIntegrationTests()
    {
        _store = new InMemoryRunbookExecutionStore();
        _actionProviderMock = new Mock<IRunbookActionProvider>();
        _loggerMock = new Mock<ILogger<RunbookExecutor>>();
        _policyEngineMock = new Mock<IRemediationPolicyEngine>();

        // Default: action provider succeeds
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

    #region Policy Decision Recording Tests

    [Fact]
    public async Task ExecuteStep_RecordsPolicyDecisionOnStepExecution()
    {
        // Arrange
        var decision = new RemediationDecision(
            RemediationDecisionKind.RequireHumanApproval,
            "rule-001",
            "policy-001",
            "Test rule matched");

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(decision);

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object);
        var plan = CreateTestPlan();
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First(s => !s.RequiresHumanApproval).StepId;

        // Pre-approve the step to allow execution
        await sut.ApproveStepAsync(execution.ExecutionId, stepId, "test-user");

        // Act
        var result = await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        var step = result.Steps.First(s => s.StepId == stepId);
        step.PolicyDecision.Should().Be(RemediationDecisionKind.RequireHumanApproval);
    }

    [Fact]
    public async Task ExecuteStep_RecordsPolicyRuleIdOnStepExecution()
    {
        // Arrange
        var decision = new RemediationDecision(
            RemediationDecisionKind.AllowAutoExecute,
            "rule-auto-001",
            "policy-benton",
            "Auto-execute allowed");

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(decision);

        var options = CreateAutoRemediationOptionsForCounties(true, "benton");

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object, autoOptions: options);
        var plan = CreateTestPlanWithCounty("benton");
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act
        var result = await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        var step = result.Steps.First(s => s.StepId == stepId);
        step.PolicyRuleId.Should().Be("rule-auto-001");
    }

    #endregion

    #region DenyAutoExecute Tests

    [Fact]
    public async Task ExecuteStep_WhenPolicyDenies_StepSkipped()
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
        var result = await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        var step = result.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.Skipped);
        step.PolicyDecision.Should().Be(RemediationDecisionKind.DenyAutoExecute);
    }

    [Fact]
    public async Task ExecuteStep_WhenPolicyDenies_ActionProviderNotCalled()
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
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "Action provider should NOT be called when policy denies execution");
    }

    [Fact]
    public async Task ExecuteStep_WhenPolicyDenies_ErrorMessageContainsDeniedByPolicy()
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
        var result = await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        var step = result.Steps.First(s => s.StepId == stepId);
        step.ErrorMessage.Should().Contain("Denied by policy");
    }

    #endregion

    #region RequireHumanApproval Tests

    [Fact]
    public async Task ExecuteStep_WhenPolicyRequiresApproval_AndNotApproved_StepAwaitsApproval()
    {
        // Arrange
        var decision = new RemediationDecision(
            RemediationDecisionKind.RequireHumanApproval,
            "rule-approval-001",
            "policy-safe",
            "Manual approval required");

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(decision);

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object);
        var plan = CreateTestPlan();
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act & Assert - should throw because step requires approval
        var action = () => sut.ExecuteStepAsync(execution.ExecutionId, stepId);
        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*approval*");
    }

    [Fact]
    public async Task ExecuteStep_WhenPolicyRequiresApproval_AndApproved_StepExecutes()
    {
        // Arrange
        var decision = new RemediationDecision(
            RemediationDecisionKind.RequireHumanApproval,
            "rule-approval-001",
            "policy-safe",
            "Manual approval required");

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(decision);

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object);
        var plan = CreateTestPlan();
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Approve the step
        await sut.ApproveStepAsync(execution.ExecutionId, stepId, "approver-user");

        // Act
        var result = await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        var step = result.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.Completed);
        step.PolicyDecision.Should().Be(RemediationDecisionKind.RequireHumanApproval);
    }

    [Fact]
    public async Task ExecuteStep_WhenPolicyRequiresApproval_IgnoresFeatureFlag()
    {
        // Arrange - Policy says RequireHumanApproval, but flag is ON
        var decision = new RemediationDecision(
            RemediationDecisionKind.RequireHumanApproval,
            "rule-approval-001",
            "policy-safe",
            "Manual approval required");

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(decision);

        var options = CreateAutoRemediationOptionsForCounties(true, "benton");

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object, autoOptions: options);
        var plan = CreateTestPlanWithCounty("benton");
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act & Assert - should STILL require approval even with flag ON
        var action = () => sut.ExecuteStepAsync(execution.ExecutionId, stepId);
        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*approval*");
    }

    #endregion

    #region AllowAutoExecute Tests

    [Fact]
    public async Task ExecuteStep_WhenPolicyAllowsAuto_AndFeatureFlagOff_RequiresApproval()
    {
        // Arrange
        var decision = new RemediationDecision(
            RemediationDecisionKind.AllowAutoExecute,
            "rule-auto-001",
            "policy-safe",
            "Safe for auto-execution");

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(decision);

        var options = new AutoRemediationOptions
        {
            EnableAutoRemediation = false // Feature flag OFF
        };

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object, autoOptions: options);
        var plan = CreateTestPlan();
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act & Assert - should require approval when flag is OFF
        var action = () => sut.ExecuteStepAsync(execution.ExecutionId, stepId);
        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*approval*");
    }

    [Fact]
    public async Task ExecuteStep_WhenPolicyAllowsAuto_AndFeatureFlagOn_AndCountyOptedIn_AutoExecutes()
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

        var options = CreateAutoRemediationOptionsForCounties(true, "benton");

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object, autoOptions: options);
        var plan = CreateTestPlanWithCounty("benton");
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act - should auto-execute without requiring approval
        var result = await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        var step = result.Steps.First(s => s.StepId == stepId);
        step.Status.Should().Be(RunbookStepExecutionStatus.Completed);
        step.PolicyDecision.Should().Be(RemediationDecisionKind.AllowAutoExecute);
    }

    [Fact]
    public async Task ExecuteStep_WhenPolicyAllowsAuto_AndFeatureFlagOn_ButCountyNotOptedIn_RequiresApproval()
    {
        // Arrange
        var decision = new RemediationDecision(
            RemediationDecisionKind.AllowAutoExecute,
            "rule-auto-001",
            "policy-general",
            "Safe for auto-execution");

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(decision);

        var options = CreateAutoRemediationOptionsForCounties(true, "yakima"); // Different county

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object, autoOptions: options);
        var plan = CreateTestPlanWithCounty("benton"); // Benton NOT opted in
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act & Assert - should require approval when county not opted in
        var action = () => sut.ExecuteStepAsync(execution.ExecutionId, stepId);
        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*approval*");
    }

    [Fact]
    public async Task ExecuteStep_WhenPolicyAllowsAuto_AndCountyOptedIn_ActionProviderCalled()
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

        var options = CreateAutoRemediationOptionsForCounties(true, "benton");

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object, autoOptions: options);
        var plan = CreateTestPlanWithCounty("benton");
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act
        await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Once,
            "Action provider should be called when auto-execution is allowed");
    }

    #endregion

    #region No Policy Engine (Backward Compatibility) Tests

    [Fact]
    public async Task ExecuteStep_WhenNoPolicyEngine_FallsBackToApprovalRequired()
    {
        // Arrange - No policy engine injected
        var sut = CreateExecutor(policyEngine: null);
        var plan = CreateTestPlan();
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Act & Assert - should require approval (conservative default)
        var action = () => sut.ExecuteStepAsync(execution.ExecutionId, stepId);
        await action.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*approval*");
    }

    [Fact]
    public async Task ExecuteStep_WhenNoPolicyEngine_PolicyDecisionIsNull()
    {
        // Arrange - No policy engine injected
        var sut = CreateExecutor(policyEngine: null);
        var plan = CreateTestPlan();
        var execution = await sut.StartExecutionAsync(plan);
        var stepId = plan.Steps.First().StepId;

        // Pre-approve step
        await sut.ApproveStepAsync(execution.ExecutionId, stepId, "test-user");

        // Act
        var result = await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        var step = result.Steps.First(s => s.StepId == stepId);
        step.PolicyDecision.Should().BeNull("no policy engine means no decision recorded");
        step.PolicyRuleId.Should().BeNull();
    }

    #endregion

    #region DryRun Mode Tests

    [Fact]
    public async Task ExecuteStep_DryRunMode_PolicyStillEvaluated()
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

        var options = CreateAutoRemediationOptionsForCounties(true, "benton");

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object, autoOptions: options);
        var plan = CreateTestPlanWithCounty("benton");
        var executionOptions = new RunbookExecutionOptions { DryRun = true };
        var execution = await sut.StartExecutionAsync(plan, executionOptions);
        var stepId = plan.Steps.First().StepId;

        // Act
        await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        _policyEngineMock.Verify(
            e => e.Evaluate(It.IsAny<RemediationPolicyContext>()),
            Times.Once,
            "Policy should be evaluated even in DryRun mode");
    }

    [Fact]
    public async Task ExecuteStep_DryRunMode_ActionProviderReceivesDryRunFlag()
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

        var options = CreateAutoRemediationOptionsForCounties(true, "benton");

        var sut = CreateExecutor(policyEngine: _policyEngineMock.Object, autoOptions: options);
        var plan = CreateTestPlanWithCounty("benton");
        var executionOptions = new RunbookExecutionOptions { DryRun = true };
        var execution = await sut.StartExecutionAsync(plan, executionOptions);
        var stepId = plan.Steps.First().StepId;

        // Act
        await sut.ExecuteStepAsync(execution.ExecutionId, stepId);

        // Assert
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), true, It.IsAny<CancellationToken>()),
            Times.Once,
            "Action provider should receive isDryRun=true");
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
    // Using valid hex GUIDs that represent test county IDs
    private static readonly Guid BentonCountyGuid = Guid.Parse("00000000-0000-0000-0000-0000000be100");
    private static readonly Guid YakimaCountyGuid = Guid.Parse("00000000-0000-0000-0000-00000000ac00");

    // String representations for OptedInCounties (GUID.ToString() format)
    private static string BentonCountyIdString => BentonCountyGuid.ToString();
    private static string YakimaCountyIdString => YakimaCountyGuid.ToString();

    private static RunbookPlan CreateTestPlan()
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Test Runbook Plan",
            Description = "Test plan for Phase 43 tests",
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
                },
                new()
                {
                    StepId = "step-2",
                    Order = 2,
                    Title = "Test Step 2",
                    Description = "Second test step",
                    Kind = RunbookStepKind.Rollback,
                    RequiresHumanApproval = true,
                    SafetyLevel = RunbookSafetyLevel.MediumRisk
                }
            },
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    private static RunbookPlan CreateTestPlanWithCounty(string countyName)
    {
        var countyGuid = countyName.ToLowerInvariant() switch
        {
            "benton" => BentonCountyGuid,
            "yakima" => YakimaCountyGuid,
            _ => Guid.NewGuid()
        };

        var plan = CreateTestPlan();
        return plan with { ImpactedCountyIds = new List<Guid> { countyGuid } };
    }

    /// <summary>
    /// Creates AutoRemediationOptions with the correct GUID string format for county IDs.
    /// </summary>
    private static AutoRemediationOptions CreateAutoRemediationOptionsForCounties(
        bool enableAutoRemediation,
        params string[] countyNames)
    {
        var optedInCounties = new HashSet<string>();
        foreach (var name in countyNames)
        {
            var countyId = name.ToLowerInvariant() switch
            {
                "benton" => BentonCountyIdString,
                "yakima" => YakimaCountyIdString,
                _ => name
            };
            optedInCounties.Add(countyId);
        }

        return new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = enableAutoRemediation ? false : true, // Kill switch OFF when auto-exec enabled
            EnableAutoRemediation = enableAutoRemediation,
            AllowSafeDiagnosticsAutoExecute = enableAutoRemediation, // Phase 44: Required for auto-execution
            OptedInCounties = optedInCounties
        };
    }

    #endregion
}
