// =============================================================================
// Phase 44: Kill Switch Tests
// =============================================================================
// ROLLOUT SPEC LOCK v1.0.1
// Tests for the hard kill switch that short-circuits ALL auto-execution.
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
/// Tests for the AutoRemediationKillSwitchEnabled property.
/// This is the "single instant OFF lever" for county IT staff.
/// </summary>
[Trait("Phase", "44")]
[Trait("Component", "KillSwitch")]
[Trait("Category", "Core")]
public sealed class KillSwitchTests : IDisposable
{
    // Benton County GUID (valid hex format)
    private static readonly Guid BentonCountyGuid = Guid.Parse("00000000-0000-0000-0000-0000000be100");
    private static readonly string BentonCountyIdString = BentonCountyGuid.ToString();

    private readonly InMemoryRunbookExecutionStore _store;
    private readonly Mock<IRunbookActionProvider> _actionProviderMock;
    private readonly Mock<ILogger<RunbookExecutor>> _loggerMock;
    private readonly Mock<IRemediationPolicyEngine> _policyEngineMock;

    public KillSwitchTests()
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

    #region A) Kill Switch Default Behavior

    [Fact]
    public void KillSwitchEnabled_IsDefaultTrue()
    {
        // Arrange & Act: Create default options
        var options = new AutoRemediationOptions();

        // Assert: Kill switch should be ON by default (safe default)
        options.AutoRemediationKillSwitchEnabled.Should().BeTrue(
            "kill switch should be ON by default for safety");
    }

    [Fact]
    public void KillSwitchEnabled_DisablesAllAutoExecutionByDefault()
    {
        // Arrange: Default options (kill switch ON)
        var options = new AutoRemediationOptions();

        // Assert: No auto-execution possible with default settings
        options.AutoRemediationKillSwitchEnabled.Should().BeTrue();
        options.EnableAutoRemediation.Should().BeFalse();
        options.AllowSafeDiagnosticsAutoExecute.Should().BeFalse();
    }

    #endregion

    #region B) Kill Switch Blocks All Auto-Execution

    [Fact]
    public async Task KillSwitchOn_BlocksAutoExecution_EvenWithAllOtherFlagsEnabled()
    {
        // Arrange: Kill switch ON (true), but ALL other flags enabled
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = true, // KILL SWITCH ON
            EnableAutoRemediation = true,            // Would allow auto-exec
            AllowSafeDiagnosticsAutoExecute = true,  // Would allow Phase 44
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        // Create a perfect Phase 44 candidate (Benton, Diagnostic, InfoOnly)
        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: MUST require approval - kill switch overrides everything
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        // Action provider MUST NOT have been called
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task KillSwitchOn_BlocksAutoExecution_ForAllCounties()
    {
        // Arrange: Kill switch ON, multiple counties opted in
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = true, // KILL SWITCH ON
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string> { BentonCountyIdString, "yakima", "pierce", "king" }
        };

        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Kill switch blocks ALL counties
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task KillSwitchOn_BlocksAutoExecution_ForAllStepKinds()
    {
        // Arrange: Kill switch ON
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = true, // KILL SWITCH ON
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        // Test multiple step kinds (using actual enum values)
        var stepKinds = new[] { RunbookStepKind.Diagnostic, RunbookStepKind.RestartService, RunbookStepKind.ScaleOut };

        foreach (var kind in stepKinds)
        {
            var plan = CreatePlan(BentonCountyGuid, kind, RunbookSafetyLevel.InfoOnly);
            var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

            // Act & Assert: Kill switch blocks ALL step kinds
            var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*requires approval*");
        }

        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    #endregion

    #region C) Kill Switch OFF Does Not Imply Auto-Execution

    [Fact]
    public async Task KillSwitchOff_StillRequiresOtherFlags_EnableAutoRemediation()
    {
        // Arrange: Kill switch OFF, but EnableAutoRemediation = false
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF
            EnableAutoRemediation = false,            // This blocks
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Must still require approval
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");
    }

    [Fact]
    public async Task KillSwitchOff_StillRequiresOtherFlags_AllowSafeDiagnostics()
    {
        // Arrange: Kill switch OFF, but AllowSafeDiagnosticsAutoExecute = false
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = false,  // This blocks
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Must still require approval
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");
    }

    [Fact]
    public async Task KillSwitchOff_StillRequiresOtherFlags_CountyOptIn()
    {
        // Arrange: Kill switch OFF, but county NOT opted in
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string>()    // Empty - no counties!
        };

        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act & Assert: Must still require approval
        var act = async () => await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*requires approval*");
    }

    [Fact]
    public async Task KillSwitchOff_AllowsAutoExecution_WhenAllConditionsMet()
    {
        // Arrange: Kill switch OFF + all other conditions met
        var options = new AutoRemediationOptions
        {
            AutoRemediationKillSwitchEnabled = false, // Kill switch OFF
            EnableAutoRemediation = true,
            AllowSafeDiagnosticsAutoExecute = true,
            OptedInCounties = new HashSet<string> { BentonCountyIdString }
        };

        SetupPolicyToAllowAutoExecute();
        var executor = CreateExecutor(options);

        var plan = CreatePlan(BentonCountyGuid, RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly);
        var execution = await executor.StartExecutionAsync(plan, new RunbookExecutionOptions { DryRun = false });

        // Act: Execute step (should auto-execute)
        var result = await executor.ExecuteStepAsync(execution.ExecutionId, "STEP-000001");

        // Assert: Step completed (auto-executed)
        result.Steps[0].Status.Should().Be(RunbookStepExecutionStatus.Completed);
        _actionProviderMock.Verify(
            p => p.ExecuteAsync(It.IsAny<RunbookPlan>(), It.IsAny<RunbookStep>(), false, It.IsAny<CancellationToken>()),
            Times.Once);
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
            Title = "Kill Switch Test Plan",
            Description = "Phase 44 kill switch test plan",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = new List<Guid> { countyGuid },
            Steps = new List<RunbookStep>
            {
                new RunbookStep
                {
                    StepId = "STEP-000001",
                    Order = 1,
                    Title = "Test Step",
                    Description = "Test step for kill switch",
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
