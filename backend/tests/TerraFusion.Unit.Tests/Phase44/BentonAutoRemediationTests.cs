// =============================================================================
// Phase 44: Benton-Only Safe Diagnostics Auto-Remediation Tests
// =============================================================================
// ROLLOUT SPEC LOCK v1.0.0
// Tests for Benton County safe diagnostics auto-execution rollout.
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

namespace TerraFusion.Unit.Tests.Phase44;

/// <summary>
/// Tests for Benton County safe diagnostics auto-remediation.
/// Focus: Eligibility guards, county isolation, step kind/safety filtering.
/// </summary>
[Trait("Phase", "44")]
[Trait("Component", "BentonAutoRemediation")]
[Trait("Category", "Core")]
public sealed class BentonAutoRemediationTests : IDisposable
{
    // Benton County GUID (valid hex format)
    private static readonly Guid BentonCountyGuid = Guid.Parse("00000000-0000-0000-0000-0000000be100");
    private static readonly string BentonCountyIdString = BentonCountyGuid.ToString();

    // Yakima County GUID (for isolation tests)
    private static readonly Guid YakimaCountyGuid = Guid.Parse("00000000-0000-0000-0000-00000000ac00");
    private static readonly string YakimaCountyIdString = YakimaCountyGuid.ToString();

    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly Mock<ILogger<RunbookExecutor>> _loggerMock;
    private readonly Mock<IRemediationPolicyEngine> _policyEngineMock;

    public BentonAutoRemediationTests()
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
            .ReturnsAsync(RunbookStepResult.Succeeded("Diagnostic completed"));
    }

    public void Dispose()
    {
        // Cleanup if needed
    }

    #region A) Benton-Only Scope Tests

    [Fact]
    public async Task BentonEnabled_OthersDisabled_OnlyBentonCanAutoExecute()
    {
        // Arrange: Only Benton opted in
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        // Create Benton plan with safe diagnostic step
        var bentonPlan = CreatePlanWithSafeDiagnosticStep(BentonCountyGuid);
        var bentonExecution = await executor.StartExecutionAsync(bentonPlan, new RunbookExecutionOptions { DryRun = false });

        // Act: Execute Benton step (should auto-execute without approval)
        var bentonResult = await executor.ExecuteStepAsync(bentonExecution.ExecutionId, "STEP-000001");

        // Assert: Benton step completed (auto-executed)
        bentonResult.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Completed);
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), false, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task YakimaCounty_CannotAutoExecute_EvenWithAllFlagsEnabled()
    {
        // Arrange: Only Benton opted in, NOT Yakima
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string> { BentonCountyIdString } // Yakima NOT included
        };

        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        // Create Yakima plan with safe diagnostic step
        var yakimaPlan = CreatePlanWithSafeDiagnosticStep(YakimaCountyGuid);
        var yakimaExecution = await executor.StartExecutionAsync(yakimaPlan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Yakima step should require approval (throw on execute without approval)
        var act = async () => await executor.ExecuteStepAsync(yakimaExecution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        // Action provider should NOT have been called
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task EmptyEnabledCountyIds_NoAutoRemediation_BehaviorUnchanged()
    {
        // Arrange: No counties opted in
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string>() // Empty!
        };

        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        var bentonPlan = CreatePlanWithSafeDiagnosticStep(BentonCountyGuid);
        var execution = await executor.StartExecutionAsync(bentonPlan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Should require approval
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");
    }

    #endregion

    #region B) Safe Diagnostics Only Tests

    [Fact]
    public async Task SafeDiagnosticStep_AutoExecutes_WhenAllConditionsMet()
    {
        // Arrange: All flags enabled, Benton opted in
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        // Plan with InfoOnly Diagnostic step
        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");

        // Assert: Step completed automatically
        result.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Completed);
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), false, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task RollbackStep_CannotAutoExecute_EvenWithAllFlagsEnabled()
    {
        // Arrange: All flags enabled, but step is Rollback (not Diagnostic)
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        // Plan with Rollback step (should NOT auto-execute)
        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Rollback, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Should require approval
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");
    }

    [Fact]
    public async Task HighRiskDiagnosticStep_CannotAutoExecute()
    {
        // Arrange: Diagnostic step but HighRisk safety level
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.HighRisk);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Should require approval
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");
    }

    [Fact]
    public async Task MediumRiskDiagnosticStep_CannotAutoExecute()
    {
        // Arrange: Diagnostic step but MediumRisk safety level
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.MediumRisk);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Should require approval
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");
    }

    [Fact]
    public async Task LowRiskDiagnosticStep_CanAutoExecute()
    {
        // Arrange: Diagnostic step with LowRisk (should be allowed)
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.LowRisk);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");

        // Assert: Step completed automatically
        result.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Completed);
    }

    #endregion

    #region C) DryRun Behavior Tests

    [Fact]
    public async Task DryRunTrue_ActionProviderNotCalled_SimulationLogged()
    {
        // Arrange: All conditions met but DryRun = true
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        var plan = CreatePlanWithSafeDiagnosticStep(BentonCountyGuid);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = true });

        // Act
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");

        // Assert: Step completed but in DryRun mode
        result.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Completed);
        result.IsDryRun.Should().BeTrue();

        // ActionProvider should be called WITH DryRun=true parameter
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), true, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task DryRunFalse_ActionProviderCalled_RealExecution()
    {
        // Arrange: DryRun = false
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        var plan = CreatePlanWithSafeDiagnosticStep(BentonCountyGuid);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");

        // Assert: Real execution
        result.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Completed);
        result.IsDryRun.Should().BeFalse();

        // ActionProvider should be called WITH DryRun=false parameter
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), false, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    #endregion

    #region D) Policy + Config Agreement Tests

    [Fact]
    public async Task PolicyAllows_ConfigDenies_EnableAutoRemediationFalse_NoAutoExec()
    {
        // Arrange: Policy allows, but EnableAutoRemediation = false
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF, but EnableAutoRemediation blocks
            EnableAutoRemediation = false, // OFF
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        var plan = CreatePlanWithSafeDiagnosticStep(BentonCountyGuid);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Should require approval
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");
    }

    [Fact]
    public async Task PolicyAllows_ConfigDenies_AllowSafeDiagnosticsFalse_NoAutoExec()
    {
        // Arrange: Policy allows, but AllowSafeDiagnosticsAutoExecute = false
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF, but AllowSafeDiagnosticsAutoExecute blocks
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = false, // OFF
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        var plan = CreatePlanWithSafeDiagnosticStep(BentonCountyGuid);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Should require approval
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");
    }

    [Fact]
    public async Task PolicyRequiresApproval_FlagsEnabled_NoAutoExec()
    {
        // Arrange: Flags enabled, but policy says RequireHumanApproval
        var options = CreateBentonEnabledOptions();

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(new RemediationDecision(
                Kind: RemediationDecisionKind.RequireHumanApproval,
                AppliedRuleId: "RULE-REQUIRE-APPROVAL",
                ScopeId: BentonCountyIdString,
                Reason: "Policy requires manual approval"));

        var executor = CreateExecutor(options);

        var plan = CreatePlanWithSafeDiagnosticStep(BentonCountyGuid);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Should require approval (policy overrides flags)
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");
    }

    [Fact]
    public async Task PolicyDenies_FlagsEnabled_StepSkipped()
    {
        // Arrange: Flags enabled, but policy says DenyAutoExecute
        var options = CreateBentonEnabledOptions();

        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(new RemediationDecision(
                Kind: RemediationDecisionKind.DenyAutoExecute,
                AppliedRuleId: "RULE-DENY",
                ScopeId: BentonCountyIdString,
                Reason: "Policy denies execution"));

        var executor = CreateExecutor(options);

        var plan = CreatePlanWithSafeDiagnosticStep(BentonCountyGuid);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");

        // Assert: Step skipped (not executed)
        result.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Skipped);
        result.Steps[0].PolicyDecision.Should().Be(RemediationDecisionKind.DenyAutoExecute);
    }

    #endregion

    #region E) Audit Trail Tests

    [Fact]
    public async Task AutoExecutedStep_AuditTrailIncludesAllFields()
    {
        // Arrange
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();

        var executor = CreateExecutor(options);

        var plan = CreatePlanWithSafeDiagnosticStep(BentonCountyGuid);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");

        // Assert: Audit fields populated
        var step = result.Steps[0];
        step.PolicyDecision.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        step.PolicyRuleId.Should().Be("RULE-BENTON-SAFE");
        step.StartedAt.Should().NotBeNull();
        step.CompletedAt.Should().NotBeNull();
    }

    #endregion

    #region Helper Methods

    private RunbookExecutor CreateExecutor(AutoRemediationOptions options)
    {
        var optionsWrapper = Options.Create(options);
        return new RunbookExecutor(
            _store,
            _actionProviderMock.Object,
            _loggerMock.Object,
            _policyEngineMock.Object,
            optionsWrapper);
    }

    private AutoRemediationOptions CreateBentonEnabledOptions()
    {
        return new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF to enable Phase 44
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };
    }

    private void SetupPolicyToAllowAutoExecute()
    {
        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(new RemediationDecision(
                Kind: RemediationDecisionKind.AllowAutoExecute,
                AppliedRuleId: "RULE-BENTON-SAFE",
                ScopeId: BentonCountyIdString,
                Reason: "Benton safe diagnostics allowed"));
    }

    private RunbookPlan CreatePlanWithSafeDiagnosticStep(Guid countyGuid)
    {
        return CreatePlan(countyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
    }

    private RunbookPlan CreatePlan(Guid countyGuid, RunbookStepKind kind, RunbookSafetyLevel safetyLevel)
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Test Plan",
            Description = "Phase 44 test plan",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = new List<Guid> { countyGuid },
            Steps = new List<RunbookStep>
            {
                new RunbookStep
                {
                    StepId = "STEP-000001",
                    Order = 1,
                    Title = "Test Step",
                    Description = "Test step for Phase 44",
                    Kind = kind,
                    SafetyLevel = safetyLevel,
                    RequiresHumanApproval = true // Default requires approval
                }
            },
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    #endregion
}
