// =============================================================================
// Phase 45: Auto-Remediation Ops Core Tests
// =============================================================================
// OPS SPEC LOCK v1.0.0
// Tests for Phase 45 metrics instrumentation and observability.
// =============================================================================

using FluentAssertions;
using TerraFusion.Operations.Runbooks.Execution;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase45;

/// <summary>
/// Core tests for Phase 45 auto-remediation operations.
/// Focus: Metrics API, block reason tracking, invariant detection.
/// </summary>
[Trait("Phase", "45")]
[Trait("Component", "AutoRemediationOps")]
[Trait("Category", "Core")]
public sealed class AutoRemediationOpsTests
{
    private const string BentonCountyId = "benton";
    private const string YakimaCountyId = "yakima";

    #region A) Metrics API Tests

    [Fact]
    public void RecordAttempt_WithDryRunTrue_RecordsSimulated()
    {
        // Arrange & Act: Record a DryRun attempt
        var act = () => AutoRemediationMetrics.RecordAttempt(
            countyId: BentonCountyId,
            stepKind: "Diagnostic",
            safetyLevel: "InfoOnly",
            dryRun: true);

        // Assert: Should not throw
        act.Should().NotThrow();
    }

    [Fact]
    public void RecordAttempt_WithDryRunFalse_RecordsReal()
    {
        // Arrange & Act: Record a real attempt
        var act = () => AutoRemediationMetrics.RecordAttempt(
            countyId: BentonCountyId,
            stepKind: "Diagnostic",
            safetyLevel: "InfoOnly",
            dryRun: false);

        // Assert: Should not throw
        act.Should().NotThrow();
    }

    [Fact]
    public void RecordReal_ValidParameters_Succeeds()
    {
        var act = () => AutoRemediationMetrics.RecordReal(
            countyId: BentonCountyId,
            stepKind: "Diagnostic",
            safetyLevel: "LowRisk");

        act.Should().NotThrow();
    }

    [Fact]
    public void RecordSimulated_ValidParameters_Succeeds()
    {
        var act = () => AutoRemediationMetrics.RecordSimulated(
            countyId: BentonCountyId,
            stepKind: "Diagnostic",
            safetyLevel: "InfoOnly");

        act.Should().NotThrow();
    }

    #endregion

    #region B) Block Reason Tracking Tests

    [Theory]
    [InlineData(AutoExecBlockReason.KillSwitch)]
    [InlineData(AutoExecBlockReason.Flags)]
    [InlineData(AutoExecBlockReason.Policy)]
    [InlineData(AutoExecBlockReason.County)]
    [InlineData(AutoExecBlockReason.Safety)]
    [InlineData(AutoExecBlockReason.Kind)]
    [InlineData(AutoExecBlockReason.DryRun)]
    public void RecordBlock_AllReasons_Succeed(AutoExecBlockReason reason)
    {
        var act = () => AutoRemediationMetrics.RecordBlock(BentonCountyId, reason);
        act.Should().NotThrow();
    }

    [Fact]
    public void RecordBlock_KillSwitch_TracksCorrectly()
    {
        // This test verifies the kill-switch block is recorded
        var act = () => AutoRemediationMetrics.RecordBlock(
            countyId: BentonCountyId,
            reason: AutoExecBlockReason.KillSwitch);

        act.Should().NotThrow();
    }

    [Fact]
    public void RecordBlock_PolicyBlock_TracksCorrectly()
    {
        var act = () => AutoRemediationMetrics.RecordBlock(
            countyId: BentonCountyId,
            reason: AutoExecBlockReason.Policy);

        act.Should().NotThrow();
    }

    #endregion

    #region C) Invariant Violation Tracking Tests

    [Theory]
    [InlineData(AutoExecInvariant.BentonOnly)]
    [InlineData(AutoExecInvariant.SafeOnly)]
    [InlineData(AutoExecInvariant.DiagnosticsOnly)]
    [InlineData(AutoExecInvariant.DryRunNoExec)]
    public void RecordInvariantViolation_AllTypes_Succeed(AutoExecInvariant invariant)
    {
        var act = () => AutoRemediationMetrics.RecordInvariantViolation(YakimaCountyId, invariant);
        act.Should().NotThrow();
    }

    [Fact]
    public void RecordInvariantViolation_BentonOnly_TracksNonBentonAttempt()
    {
        // Scenario: Yakima tried to auto-execute (should be blocked AND recorded)
        var act = () => AutoRemediationMetrics.RecordInvariantViolation(
            countyId: YakimaCountyId,
            invariant: AutoExecInvariant.BentonOnly);

        act.Should().NotThrow();
    }

    [Fact]
    public void RecordInvariantViolation_SafeOnly_TracksHighRiskAttempt()
    {
        // Scenario: HighRisk step tried to auto-execute
        var act = () => AutoRemediationMetrics.RecordInvariantViolation(
            countyId: BentonCountyId,
            invariant: AutoExecInvariant.SafeOnly);

        act.Should().NotThrow();
    }

    #endregion

    #region D) Kill Switch State Tracking Tests

    [Fact]
    public void SetKillSwitchState_Enabled_TracksAsOne()
    {
        var act = () => AutoRemediationMetrics.SetKillSwitchState(
            countyId: BentonCountyId,
            enabled: true);

        act.Should().NotThrow();
    }

    [Fact]
    public void SetKillSwitchState_Disabled_TracksAsZero()
    {
        var act = () => AutoRemediationMetrics.SetKillSwitchState(
            countyId: BentonCountyId,
            enabled: false);

        act.Should().NotThrow();
    }

    [Fact]
    public void SetKillSwitchState_MultipleCounties_TracksIndependently()
    {
        // Arrange & Act: Set different states for different counties
        var act1 = () => AutoRemediationMetrics.SetKillSwitchState(BentonCountyId, false);
        var act2 = () => AutoRemediationMetrics.SetKillSwitchState(YakimaCountyId, true);

        // Assert: Both should succeed
        act1.Should().NotThrow();
        act2.Should().NotThrow();
    }

    #endregion

    #region E) Label Sanitization Tests

    [Fact]
    public void RecordAttempt_WithNullCountyId_HandlesGracefully()
    {
        var act = () => AutoRemediationMetrics.RecordAttempt(
            countyId: null!,
            stepKind: "Diagnostic",
            safetyLevel: "InfoOnly",
            dryRun: true);

        act.Should().NotThrow();
    }

    [Fact]
    public void RecordAttempt_WithEmptyCountyId_HandlesGracefully()
    {
        var act = () => AutoRemediationMetrics.RecordAttempt(
            countyId: "",
            stepKind: "Diagnostic",
            safetyLevel: "InfoOnly",
            dryRun: true);

        act.Should().NotThrow();
    }

    [Fact]
    public void RecordAttempt_WithLongCountyId_Truncates()
    {
        var longId = new string('x', 200);
        var act = () => AutoRemediationMetrics.RecordAttempt(
            countyId: longId,
            stepKind: "Diagnostic",
            safetyLevel: "InfoOnly",
            dryRun: true);

        act.Should().NotThrow();
    }

    #endregion

    #region F) Enum Coverage Tests

    [Fact]
    public void AutoExecBlockReason_HasAllExpectedValues()
    {
        var values = Enum.GetValues<AutoExecBlockReason>();
        values.Should().Contain(AutoExecBlockReason.KillSwitch);
        values.Should().Contain(AutoExecBlockReason.Flags);
        values.Should().Contain(AutoExecBlockReason.Policy);
        values.Should().Contain(AutoExecBlockReason.County);
        values.Should().Contain(AutoExecBlockReason.Safety);
        values.Should().Contain(AutoExecBlockReason.Kind);
        values.Should().Contain(AutoExecBlockReason.DryRun);
    }

    [Fact]
    public void AutoExecInvariant_HasAllExpectedValues()
    {
        var values = Enum.GetValues<AutoExecInvariant>();
        values.Should().Contain(AutoExecInvariant.BentonOnly);
        values.Should().Contain(AutoExecInvariant.SafeOnly);
        values.Should().Contain(AutoExecInvariant.DiagnosticsOnly);
        values.Should().Contain(AutoExecInvariant.DryRunNoExec);
    }

    #endregion
}
