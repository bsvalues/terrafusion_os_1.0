// =============================================================================
// Phase 42: Remediation Policy Engine Tests - Core Engine
// =============================================================================
// TDD test suite for IRemediationPolicyEngine.
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
public class RemediationPolicyEngineTests
{
    private readonly Mock<ILogger<RemediationPolicyEngine>> _loggerMock;

    public RemediationPolicyEngineTests()
    {
        _loggerMock = new Mock<ILogger<RemediationPolicyEngine>>();
    }

    #region Helpers

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

    private static RemediationPolicyContext CreateContext(
        string countyId = "benton",
        IncidentSeverity severity = IncidentSeverity.Warning,
        RunbookStep? step = null,
        RunbookPlan? plan = null,
        DateTimeOffset? timestamp = null,
        IReadOnlyList<string>? alertNames = null)
    {
        step ??= CreateStep();
        plan ??= CreatePlan(step);
        timestamp ??= DateTimeOffset.UtcNow;

        return new RemediationPolicyContext(
            countyId,
            severity,
            plan,
            step,
            timestamp.Value,
            alertNames
        );
    }

    #endregion

    #region Default Behavior Tests

    [Fact]
    public void Evaluate_NoRulesConfigured_ReturnsRequireHumanApproval()
    {
        // Arrange
        var options = new RemediationPolicyOptions { LogEvaluations = false };
        var engine = CreateEngine(options);
        var context = CreateContext();

        // Act
        var decision = engine.Evaluate(context);

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
        decision.AppliedRuleId.Should().BeNull();
        decision.Reason.Should().Contain("No matching rule");
    }

    [Fact]
    public void Evaluate_EmptyRuleList_ReturnsRequireHumanApproval()
    {
        // Arrange
        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new List<RemediationRule>())
        };
        var engine = CreateEngine(options);
        var context = CreateContext();

        // Act
        var decision = engine.Evaluate(context);

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
    }

    [Fact]
    public void Evaluate_NullContext_ThrowsArgumentNullException()
    {
        // Arrange
        var options = new RemediationPolicyOptions();
        var engine = CreateEngine(options);

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => engine.Evaluate(null!));
    }

    #endregion

    #region Rule Matching Tests

    [Fact]
    public void Evaluate_MatchingRule_ReturnsRuleDecision()
    {
        // Arrange
        var rule = new RemediationRule(
            "ALLOW-DIAG",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.Diagnostic
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);
        var step = CreateStep(kind: RunbookStepKind.Diagnostic);
        var context = CreateContext(step: step);

        // Act
        var decision = engine.Evaluate(context);

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        decision.AppliedRuleId.Should().Be("ALLOW-DIAG");
    }

    [Fact]
    public void Evaluate_NoMatchingRule_ReturnsDefault()
    {
        // Arrange
        var rule = new RemediationRule(
            "ALLOW-CONFIG-CHECK",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.ConfigCheck
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);
        var step = CreateStep(kind: RunbookStepKind.Diagnostic); // Different kind
        var context = CreateContext(step: step);

        // Act
        var decision = engine.Evaluate(context);

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
        decision.AppliedRuleId.Should().BeNull();
    }

    [Theory]
    [InlineData(RunbookStepKind.Diagnostic, RunbookSafetyLevel.InfoOnly, true)]
    [InlineData(RunbookStepKind.Diagnostic, RunbookSafetyLevel.LowRisk, false)]
    [InlineData(RunbookStepKind.ConfigCheck, RunbookSafetyLevel.InfoOnly, false)]
    public void Evaluate_MultipleFilters_MatchesCorrectly(
        RunbookStepKind stepKind,
        RunbookSafetyLevel safetyLevel,
        bool shouldMatch)
    {
        // Arrange
        var rule = new RemediationRule(
            "ALLOW-SPECIFIC",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.Diagnostic,
            SafetyLevel: RunbookSafetyLevel.InfoOnly
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);
        var step = CreateStep(kind: stepKind, safetyLevel: safetyLevel);
        var context = CreateContext(step: step);

        // Act
        var decision = engine.Evaluate(context);

        // Assert
        if (shouldMatch)
        {
            decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
            decision.AppliedRuleId.Should().Be("ALLOW-SPECIFIC");
        }
        else
        {
            decision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
        }
    }

    #endregion

    #region Precedence Tests

    [Fact]
    public void Evaluate_DenyAlwaysWins_OverAllowWithSamePriority()
    {
        // Arrange
        var allowRule = new RemediationRule(
            "ALLOW-DIAG",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.Diagnostic,
            Priority: 10
        );

        var denyRule = new RemediationRule(
            "DENY-DIAG",
            RemediationDecisionKind.DenyAutoExecute,
            StepKind: RunbookStepKind.Diagnostic,
            Priority: 10
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { allowRule, denyRule })
        };

        var engine = CreateEngine(options);
        var step = CreateStep(kind: RunbookStepKind.Diagnostic);
        var context = CreateContext(step: step);

        // Act
        var decision = engine.Evaluate(context);

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.DenyAutoExecute);
        decision.AppliedRuleId.Should().Be("DENY-DIAG");
    }

    [Fact]
    public void Evaluate_HigherPriorityWins()
    {
        // Arrange
        var lowPriorityRule = new RemediationRule(
            "LOW-PRIORITY",
            RemediationDecisionKind.RequireHumanApproval,
            StepKind: RunbookStepKind.Diagnostic,
            Priority: 1
        );

        var highPriorityRule = new RemediationRule(
            "HIGH-PRIORITY",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.Diagnostic,
            Priority: 100
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { lowPriorityRule, highPriorityRule })
        };

        var engine = CreateEngine(options);
        var step = CreateStep(kind: RunbookStepKind.Diagnostic);
        var context = CreateContext(step: step);

        // Act
        var decision = engine.Evaluate(context);

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        decision.AppliedRuleId.Should().Be("HIGH-PRIORITY");
    }

    [Fact]
    public void Evaluate_MoreSpecificRuleWins_WhenSamePriority()
    {
        // Arrange - general rule vs county-specific rule
        var generalRule = new RemediationRule(
            "GENERAL",
            RemediationDecisionKind.RequireHumanApproval,
            StepKind: RunbookStepKind.Diagnostic,
            Priority: 0
        );

        var specificRule = new RemediationRule(
            "BENTON-SPECIFIC",
            RemediationDecisionKind.AllowAutoExecute,
            CountyId: "benton",
            StepKind: RunbookStepKind.Diagnostic,
            Priority: 0
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { generalRule, specificRule })
        };

        var engine = CreateEngine(options);
        var step = CreateStep(kind: RunbookStepKind.Diagnostic);
        var context = CreateContext(countyId: "benton", step: step);

        // Act
        var decision = engine.Evaluate(context);

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        decision.AppliedRuleId.Should().Be("BENTON-SPECIFIC");
    }

    #endregion

    #region County Scope Tests

    [Fact]
    public void Evaluate_CountyPolicyOverridesGlobal()
    {
        // Arrange
        var globalRule = new RemediationRule(
            "GLOBAL-DENY",
            RemediationDecisionKind.DenyAutoExecute,
            StepKind: RunbookStepKind.Diagnostic
        );

        var bentonRule = new RemediationRule(
            "BENTON-ALLOW",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.Diagnostic
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { globalRule }),
            CountyPolicies = new Dictionary<string, RemediationPolicy>
            {
                ["benton"] = new RemediationPolicy("benton", new[] { bentonRule })
            }
        };

        var engine = CreateEngine(options);
        var step = CreateStep(kind: RunbookStepKind.Diagnostic);
        var context = CreateContext(countyId: "benton", step: step);

        // Act
        var decision = engine.Evaluate(context);

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        decision.AppliedRuleId.Should().Be("BENTON-ALLOW");
        decision.ScopeId.Should().Be("benton");
    }

    [Fact]
    public void Evaluate_FallsBackToGlobalWhenNoCountyPolicy()
    {
        // Arrange
        var globalRule = new RemediationRule(
            "GLOBAL-ALLOW",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.Diagnostic
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { globalRule })
        };

        var engine = CreateEngine(options);
        var step = CreateStep(kind: RunbookStepKind.Diagnostic);
        var context = CreateContext(countyId: "yakima", step: step);

        // Act
        var decision = engine.Evaluate(context);

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        decision.ScopeId.Should().Be("global");
    }

    #endregion

    #region EvaluatePlan Tests

    [Fact]
    public void EvaluatePlan_EvaluatesAllSteps()
    {
        // Arrange
        var diagRule = new RemediationRule(
            "ALLOW-DIAG",
            RemediationDecisionKind.AllowAutoExecute,
            StepKind: RunbookStepKind.Diagnostic
        );

        var failoverRule = new RemediationRule(
            "DENY-FAILOVER",
            RemediationDecisionKind.DenyAutoExecute,
            StepKind: RunbookStepKind.Failover
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { diagRule, failoverRule })
        };

        var engine = CreateEngine(options);

        var step1 = CreateStep("STEP-1", kind: RunbookStepKind.Diagnostic);
        var step2 = CreateStep("STEP-2", kind: RunbookStepKind.Failover);
        var step3 = CreateStep("STEP-3", kind: RunbookStepKind.RestartService);
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
        decisions["STEP-1"].Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        decisions["STEP-2"].Kind.Should().Be(RemediationDecisionKind.DenyAutoExecute);
        decisions["STEP-3"].Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
    }

    #endregion
}
