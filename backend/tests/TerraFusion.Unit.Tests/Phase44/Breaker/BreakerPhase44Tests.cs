// =============================================================================
// Phase 44: Breaker Invariant Tests - Benton-Only Safe Diagnostics
// =============================================================================
// RED-TEAM SPEC LOCK v1.0.0
// These tests BREAK the build if Phase 44 invariants are violated.
// CRITICAL: All tests in this file must PASS for the system to be safe.
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

namespace TerraFusion.Unit.Tests.Phase44.Breaker;

/// <summary>
/// RED-TEAM Breaker tests for Phase 44: Benton-Only Safe Diagnostics.
/// These tests enforce critical security invariants that MUST NEVER be violated.
/// SPEC: B44-01 through B44-08
/// </summary>
[Trait("Phase", "44")]
[Trait("Component", "BentonAutoRemediation")]
[Trait("Category", "Breaker")]
public sealed class BreakerPhase44Tests
{
    #region Test Constants

    // County GUIDs (must match production config)
    private static readonly Guid BentonCountyGuid = Guid.Parse("00000000-0000-0000-0000-0000000be100");
    private static readonly Guid YakimaCountyGuid = Guid.Parse("00000000-0000-0000-0000-00000000ac00");
    private static readonly Guid KingCountyGuid = Guid.Parse("00000000-0000-0000-0000-00000001a600");
    private static readonly Guid PierceCountyGuid = Guid.Parse("00000000-0000-0000-0000-0000000b1e00");

    private static readonly string BentonCountyIdString = BentonCountyGuid.ToString();

    #endregion

    #region Mocks

    private readonly Mock<IRunbookExecutionStore> _storeMock;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly Mock<ILogger<RunbookExecutor>> _loggerMock;
    private readonly Mock<IRemediationPolicyEngine> _policyEngineMock;
    private readonly InMemoryRunbookExecutionStore _store;

    public BreakerPhase44Tests()
    {
        _storeMock = new Mock<IRunbookExecutionStore>();
        _actionProviderMock = new Mock<IRunbookActionProvider>();
        _loggerMock = new Mock<ILogger<RunbookExecutor>>();
        _policyEngineMock = new Mock<IRemediationPolicyEngine>();
        _store = new InMemoryRunbookExecutionStore();

        // Default action provider returns success
        _actionProviderMock
            .Setup(p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(RunbookStepResult.Succeeded("Action completed"));
    }

    #endregion

    #region B44-01: Non-Benton County NEVER Auto-Executes

    /// <summary>
    /// B44-01: Yakima County steps MUST NEVER auto-execute, even with all flags enabled.
    /// CRITICAL INVARIANT: County isolation is sovereign.
    /// </summary>
    [Fact]
    public async Task B44_01_YakimaCounty_NeverAutoExecutes_EvenWithAllFlagsEnabled()
    {
        // Arrange: All flags enabled but Yakima NOT in opted-in counties
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string> { BentonCountyIdString } // Yakima excluded
        };

        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var yakimaPlan = CreatePlan(YakimaCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(yakimaPlan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: MUST throw - Yakima NEVER auto-executes
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        // Action provider MUST NOT have been called
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: Yakima County step was executed!");
    }

    /// <summary>
    /// B44-01b: King County steps MUST NEVER auto-execute.
    /// </summary>
    [Fact]
    public async Task B44_01b_KingCounty_NeverAutoExecutes()
    {
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var kingPlan = CreatePlan(KingCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(kingPlan, new RunbookExecutionOptions { DryRun = false });

        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: King County step was executed!");
    }

    /// <summary>
    /// B44-01c: Pierce County steps MUST NEVER auto-execute.
    /// </summary>
    [Fact]
    public async Task B44_01c_PierceCounty_NeverAutoExecutes()
    {
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var piercePlan = CreatePlan(PierceCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(piercePlan, new RunbookExecutionOptions { DryRun = false });

        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: Pierce County step was executed!");
    }

    #endregion

    #region B44-02: Non-Diagnostic Steps NEVER Auto-Execute

    /// <summary>
    /// B44-02: Rollback steps MUST NEVER auto-execute in any county.
    /// </summary>
    [Fact]
    public async Task B44_02_RollbackStep_NeverAutoExecutes()
    {
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Rollback, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: Rollback step was auto-executed!");
    }

    /// <summary>
    /// B44-02b: RestartService steps MUST NEVER auto-execute.
    /// </summary>
    [Fact]
    public async Task B44_02b_RestartServiceStep_NeverAutoExecutes()
    {
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.RestartService, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: RestartService step was auto-executed!");
    }

    /// <summary>
    /// B44-02c: Failover steps MUST NEVER auto-execute.
    /// </summary>
    [Fact]
    public async Task B44_02c_FailoverStep_NeverAutoExecutes()
    {
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Failover, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: Failover step was auto-executed!");
    }

    /// <summary>
    /// B44-02d: ScaleOut steps MUST NEVER auto-execute.
    /// </summary>
    [Fact]
    public async Task B44_02d_ScaleOutStep_NeverAutoExecutes()
    {
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.ScaleOut, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: ScaleOut step was auto-executed!");
    }

    #endregion

    #region B44-03: HighRisk/MediumRisk NEVER Auto-Execute

    /// <summary>
    /// B44-03: HighRisk Diagnostic steps MUST NEVER auto-execute.
    /// </summary>
    [Fact]
    public async Task B44_03_HighRiskDiagnostic_NeverAutoExecutes()
    {
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.HighRisk);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: HighRisk Diagnostic was auto-executed!");
    }

    /// <summary>
    /// B44-03b: MediumRisk Diagnostic steps MUST NEVER auto-execute.
    /// </summary>
    [Fact]
    public async Task B44_03b_MediumRiskDiagnostic_NeverAutoExecutes()
    {
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.MediumRisk);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: MediumRisk Diagnostic was auto-executed!");
    }

    #endregion

    #region B44-04: EnableAutoRemediation=false Blocks All

    /// <summary>
    /// B44-04: Global kill switch (EnableAutoRemediation=false) MUST block ALL auto-execution.
    /// </summary>
    [Fact]
    public async Task B44_04_EnableAutoRemediationFalse_BlocksAll()
    {
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF, but EnableAutoRemediation blocks
            EnableAutoRemediation = false, // Kill switch
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: Step executed despite EnableAutoRemediation=false!");
    }

    #endregion

    #region B44-05: AllowSafeDiagnosticsAutoExecute=false Blocks Phase 44

    /// <summary>
    /// B44-05: Phase 44 flag (AllowSafeDiagnosticsAutoExecute=false) MUST block diagnostic auto-execution.
    /// </summary>
    [Fact]
    public async Task B44_05_AllowSafeDiagnosticsAutoExecuteFalse_BlocksPhase44()
    {
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF, but AllowSafeDiagnosticsAutoExecute blocks
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = false, // Phase 44 kill switch
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: Step executed despite AllowSafeDiagnosticsAutoExecute=false!");
    }

    #endregion

    #region B44-06: Policy Override Respected

    /// <summary>
    /// B44-06: Policy returning RequireHumanApproval MUST override flags.
    /// </summary>
    [Fact]
    public async Task B44_06_PolicyRequireHumanApproval_OverridesFlags()
    {
        var options = CreateBentonEnabledOptions();

        // Policy says NO
        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(new RemediationDecision(
                Kind: RemediationDecisionKind.RequireHumanApproval,
                AppliedRuleId: "RULE-REQUIRE-APPROVAL",
                ScopeId: BentonCountyIdString,
                Reason: "Policy overrides flags"));

        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: Step executed despite policy RequireHumanApproval!");
    }

    /// <summary>
    /// B44-06b: Policy returning DenyAutoExecute MUST skip step entirely.
    /// </summary>
    [Fact]
    public async Task B44_06b_PolicyDenyAutoExecute_SkipsStep()
    {
        var options = CreateBentonEnabledOptions();

        // Policy denies
        _policyEngineMock
            .Setup(e => e.Evaluate(It.IsAny<RemediationPolicyContext>()))
            .Returns(new RemediationDecision(
                Kind: RemediationDecisionKind.DenyAutoExecute,
                AppliedRuleId: "RULE-DENY",
                ScopeId: BentonCountyIdString,
                Reason: "Denied by policy"));

        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act - should not throw but skip
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");

        // Assert: Step skipped, not executed
        result.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Skipped);
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "BREAKER VIOLATION: Denied step was executed!");
    }

    #endregion

    #region B44-07: Benton Safe Diagnostic DOES Auto-Execute (Positive)

    /// <summary>
    /// B44-07: Benton County + Diagnostic + InfoOnly + All Flags + Policy Allows = Auto-Execute.
    /// This is the ONLY combination that should work.
    /// </summary>
    [Fact]
    public async Task B44_07_BentonSafeDiagnostic_AutoExecutes()
    {
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act - should NOT throw
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");

        // Assert: Step executed successfully
        result.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Completed);
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), false, It.IsAny<CancellationToken>()),
            Times.Once,
            "Benton safe diagnostic should have been executed");
    }

    /// <summary>
    /// B44-07b: Benton County + Diagnostic + LowRisk + All Flags + Policy Allows = Auto-Execute.
    /// LowRisk is also eligible for Phase 44.
    /// </summary>
    [Fact]
    public async Task B44_07b_BentonLowRiskDiagnostic_AutoExecutes()
    {
        var options = CreateBentonEnabledOptions();
        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.LowRisk);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act - should NOT throw
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");

        // Assert: Step executed successfully
        result.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Completed);
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), false, It.IsAny<CancellationToken>()),
            Times.Once,
            "Benton LowRisk diagnostic should have been executed");
    }

    #endregion

    #region B44-08: Kill Switch Overrides ALL Other Flags

    /// <summary>
    /// B44-08: Kill switch ON blocks ALL auto-execution, even with all other flags enabled.
    /// This is the "single instant OFF lever" for county IT staff.
    /// </summary>
    [Fact]
    public async Task B44_08_KillSwitchOn_BlocksEverything()
    {
        // Arrange: Kill switch ON (true), but ALL other flags would allow auto-exec
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = true, // KILL SWITCH ON - overrides everything
            EnableAutoRemediation = true,            // Would allow auto-exec
            AllowSafeDiagnosticsAutoExecute = true,  // Would allow Phase 44
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        // Perfect Phase 44 candidate (Benton, Diagnostic, InfoOnly)
        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Kill switch MUST block - no exceptions
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        // CRITICAL: Action provider MUST NOT have been called
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "Kill switch ON must block ALL auto-execution");
    }

    /// <summary>
    /// B44-08b: Kill switch default is TRUE (safe default).
    /// New deployments MUST have kill switch ON until explicitly disabled.
    /// </summary>
    [Fact]
    public void B44_08b_KillSwitch_DefaultIsTrue()
    {
        // Arrange & Act: Create default options
        var options = new AutoRemediationOptions();

        // Assert: Kill switch MUST be ON by default
        options.AutoRemediationKillSwitchEnabled.Should().BeTrue(
            "SAFETY INVARIANT: Kill switch must default to TRUE (ON) for production safety");
    }

    #endregion

    #region Test Helpers

    private RunbookExecutor CreateExecutor(AutoRemediationOptions options)
    {
        return new RunbookExecutor(
            _store,
            _actionProviderMock.Object,
            _loggerMock.Object,
            _policyEngineMock.Object,
            Options.Create(options));
    }

    private AutoRemediationOptions CreateBentonEnabledOptions()
    {
        return new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF
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

    private RunbookPlan CreatePlan(Guid countyGuid, RunbookStepKind kind, RunbookSafetyLevel safetyLevel)
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid():N}",
            IncidentId = Guid.NewGuid(),
            Title = "Breaker Test Plan",
            Description = "Phase 44 breaker test plan",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = new List<Guid> { countyGuid },
            Steps = new List<RunbookStep>
            {
                new()
                {
                    StepId = "STEP-000001",
                    Order = 1,
                    Title = "Breaker Test Step",
                    Description = "Test step for breaker invariants",
                    Kind = kind,
                    RequiresHumanApproval = false,
                    SafetyLevel = safetyLevel
                }
            },
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    #endregion
}
