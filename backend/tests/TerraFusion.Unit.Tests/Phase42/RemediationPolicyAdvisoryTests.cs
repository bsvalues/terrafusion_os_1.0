// =============================================================================
// Phase 42: Remediation Policy Engine Tests - Advisory Mode
// =============================================================================
// Tests ensuring policy engine is advisory-only (no execution side effects).
// =============================================================================

using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.Operations.Incidents;
using TerraFusion.Operations.Runbooks;
using TerraFusion.Operations.Runbooks.Remediation;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase42;

[Trait("Phase", "42")]
[Trait("Component", "RemediationPolicy")]
public class RemediationPolicyAdvisoryTests
{
    private readonly Mock<ILogger<RemediationPolicyEngine>> _loggerMock;

    public RemediationPolicyAdvisoryTests()
    {
        _loggerMock = new Mock<ILogger<RemediationPolicyEngine>>();
    }

    private RemediationPolicyEngine CreateEngine(RemediationPolicyOptions options)
    {
        var optionsMock = Options.Create(options);
        return new RemediationPolicyEngine(optionsMock, _loggerMock.Object);
    }

    private static RunbookStep CreateStep(
        string stepId = "STEP-000001",
        RunbookStepKind kind = RunbookStepKind.Diagnostic,
        RunbookSafetyLevel safetyLevel = RunbookSafetyLevel.InfoOnly,
        string title = "Test Step")
    {
        return new RunbookStep
        {
            StepId = stepId,
            Order = 1,
            Title = title,
            Description = "Test description",
            Kind = kind,
            SafetyLevel = safetyLevel,
            RequiresHumanApproval = true
        };
    }

    private static RunbookPlan CreatePlan(params RunbookStep[] steps)
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid()}",
            IncidentId = Guid.NewGuid(),
            Title = "Test Plan",
            Description = "Test plan description",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = new List<Guid> { Guid.NewGuid() },
            Steps = steps.ToList(),
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    #region Advisory Mode Verification

    [Fact]
    public void Evaluate_ReturnsDecision_DoesNotTriggerExecution()
    {
        // Arrange
        var rule = new RemediationRule(
            "ALLOW-FAILOVER",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.Failover
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = true,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        var failoverStep = CreateStep(
            kind: RunbookStepKind.Failover,
            safetyLevel: RunbookSafetyLevel.HighRisk);
        var plan = CreatePlan(failoverStep);

        var context = new RemediationPolicyContext(
            "benton",
            IncidentSeverity.Critical,
            plan,
            failoverStep,
            DateTimeOffset.UtcNow
        );

        // Act
        var decision = engine.Evaluate(context);

        // Assert - Decision is "allowed" but step.RequiresHumanApproval is unchanged
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);

        // The step still requires human approval (Phase 42 doesn't change this)
        failoverStep.RequiresHumanApproval.Should().BeTrue();
    }

    [Fact]
    public void Evaluate_AllowAutoExecute_IsAdvisoryOnly()
    {
        // Arrange
        var rule = new RemediationRule(
            "ALLOW-RESTART",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.RestartService
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        var restartStep = CreateStep(kind: RunbookStepKind.RestartService);
        var plan = CreatePlan(restartStep);

        var context = new RemediationPolicyContext(
            "benton",
            IncidentSeverity.Warning,
            plan,
            restartStep,
            DateTimeOffset.UtcNow
        );

        // Act
        var decision = engine.Evaluate(context);

        // Assert
        // Decision is advisory - it indicates WHAT we WOULD do, not that we DID it
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        decision.Reason.Should().Contain("Matched rule");

        // No external side effects - just a decision object
        // In Phase 43+, this decision would be passed to RunbookExecutor
    }

    #endregion

    #region Decision Object Semantics

    [Fact]
    public void RemediationDecision_AllowAutoExecute_HasCorrectSemantics()
    {
        // Arrange & Act
        var decision = new RemediationDecision(
            RemediationDecisionKind.AllowAutoExecute,
            "AUTO-SAFE-RULE",
            "benton",
            "Step is safe for automated execution"
        );

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        decision.AppliedRuleId.Should().Be("AUTO-SAFE-RULE");
        decision.ScopeId.Should().Be("benton");
        decision.Reason.Should().Contain("safe");
    }

    [Fact]
    public void RemediationDecision_RequireHumanApproval_HasCorrectSemantics()
    {
        // Arrange & Act
        var decision = new RemediationDecision(
            RemediationDecisionKind.RequireHumanApproval,
            null,
            "global",
            "No matching rule found; defaulting to require human approval"
        );

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
        decision.AppliedRuleId.Should().BeNull();
        decision.ScopeId.Should().Be("global");
        decision.Reason.Should().Contain("human approval");
    }

    [Fact]
    public void RemediationDecision_DenyAutoExecute_HasCorrectSemantics()
    {
        // Arrange & Act
        var decision = new RemediationDecision(
            RemediationDecisionKind.DenyAutoExecute,
            "DENY-ROLLBACK",
            "global",
            "Rollback operations are never auto-executed"
        );

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.DenyAutoExecute);
        decision.AppliedRuleId.Should().Be("DENY-ROLLBACK");
        decision.Reason.Should().Contain("never auto-executed");
    }

    [Fact]
    public void RemediationDecision_Default_IsConservative()
    {
        // Act
        var defaultDecision = RemediationDecision.Default("test-scope");

        // Assert
        defaultDecision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
        defaultDecision.AppliedRuleId.Should().BeNull();
        defaultDecision.ScopeId.Should().Be("test-scope");
        defaultDecision.Reason.Should().Contain("defaulting");
    }

    #endregion

    #region Logging Tests

    [Fact]
    public void Evaluate_WithLoggingEnabled_LogsDecision()
    {
        // Arrange
        var rule = new RemediationRule(
            "ALLOW-DIAG",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.Diagnostic
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = true,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        var step = CreateStep(kind: RunbookStepKind.Diagnostic);
        var plan = CreatePlan(step);

        var context = new RemediationPolicyContext(
            "benton",
            IncidentSeverity.Warning,
            plan,
            step,
            DateTimeOffset.UtcNow
        );

        // Act
        var decision = engine.Evaluate(context);

        // Assert - Logger was called
        _loggerMock.Verify(
            x => x.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Policy evaluation")),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public void Evaluate_WithLoggingDisabled_DoesNotLog()
    {
        // Arrange
        var rule = new RemediationRule(
            "ALLOW-DIAG",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.Diagnostic
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false, // Disabled
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        var step = CreateStep(kind: RunbookStepKind.Diagnostic);
        var plan = CreatePlan(step);

        var context = new RemediationPolicyContext(
            "benton",
            IncidentSeverity.Warning,
            plan,
            step,
            DateTimeOffset.UtcNow
        );

        // Act
        var decision = engine.Evaluate(context);

        // Assert - Logger was NOT called
        _loggerMock.Verify(
            x => x.Log(
                It.IsAny<LogLevel>(),
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Never);
    }

    #endregion

    #region EvaluatePlan Advisory Tests

    [Fact]
    public void EvaluatePlan_ReturnsDecisionsForAllSteps_NoSideEffects()
    {
        // Arrange
        var diagRule = new RemediationRule(
            "ALLOW-DIAG",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.Diagnostic
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { diagRule })
        };

        var engine = CreateEngine(options);

        var step1 = CreateStep("STEP-1", RunbookStepKind.Diagnostic);
        var step2 = CreateStep("STEP-2", RunbookStepKind.RestartService);
        var step3 = CreateStep("STEP-3", RunbookStepKind.Failover);
        var plan = CreatePlan(step1, step2, step3);

        // Act
        var decisions = engine.EvaluatePlan(
            "benton",
            IncidentSeverity.Warning,
            plan,
            DateTimeOffset.UtcNow
        );

        // Assert
        decisions.Should().HaveCount(3);

        // Step 1: Diagnostic -> AllowAutoExecute
        decisions["STEP-1"].Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);

        // Steps 2 & 3: No matching rule -> RequireHumanApproval
        decisions["STEP-2"].Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
        decisions["STEP-3"].Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);

        // Plan is unchanged (advisory-only)
        plan.Steps.Should().HaveCount(3);
        plan.Steps.Should().AllSatisfy(s => s.RequiresHumanApproval.Should().BeTrue());
    }

    #endregion
}
