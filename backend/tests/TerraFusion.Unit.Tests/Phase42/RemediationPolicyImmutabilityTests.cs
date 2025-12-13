// =============================================================================
// Phase 42: Remediation Policy Engine Tests - Immutability & Safety
// =============================================================================
// Tests ensuring the policy engine is pure and doesn't mutate inputs.
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
public class RemediationPolicyImmutabilityTests
{
    private readonly Mock<ILogger<RemediationPolicyEngine>> _loggerMock;

    public RemediationPolicyImmutabilityTests()
    {
        _loggerMock = new Mock<ILogger<RemediationPolicyEngine>>();
    }

    private RemediationPolicyEngine CreateEngine(RemediationPolicyOptions options)
    {
        var optionsMock = Options.Create(options);
        return new RemediationPolicyEngine(optionsMock, _loggerMock.Object);
    }

    private static RunbookStep CreateStep()
    {
        return new RunbookStep
        {
            StepId = "STEP-000001",
            Order = 1,
            Title = "Atlas Health Check",
            Description = "Test description",
            Kind = RunbookStepKind.Diagnostic,
            SafetyLevel = RunbookSafetyLevel.InfoOnly,
            RequiresHumanApproval = true
        };
    }

    private static RunbookPlan CreatePlan(RunbookStep step)
    {
        return new RunbookPlan
        {
            PlanId = $"PLAN-{Guid.NewGuid()}",
            IncidentId = Guid.NewGuid(),
            Title = "Test Plan",
            Description = "Test plan description",
            OverallSeverity = IncidentSeverity.Warning,
            ImpactedCountyIds = new List<Guid> { Guid.NewGuid() },
            Steps = new List<RunbookStep> { step },
            CreatedAt = DateTimeOffset.UtcNow
        };
    }

    #region Immutability Tests

    [Fact]
    public void Evaluate_DoesNotMutateContext()
    {
        // Arrange
        var rule = new RemediationRule(
            "ALLOW-ALL",
            RemediationDecisionKind.AllowAutoExecute
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        var step = CreateStep();
        var plan = CreatePlan(step);
        var timestamp = DateTimeOffset.UtcNow;
        var alertNames = new List<string> { "Alert1", "Alert2" };

        var context = new RemediationPolicyContext(
            "benton",
            IncidentSeverity.Warning,
            plan,
            step,
            timestamp,
            alertNames
        );

        // Capture original state
        var originalCountyId = context.CountyId;
        var originalSeverity = context.Severity;
        var originalStepId = context.Step.StepId;
        var originalPlanId = context.Plan.PlanId;
        var originalTimestamp = context.Timestamp;
        var originalAlertCount = context.AlertNames?.Count;

        // Act
        var decision = engine.Evaluate(context);

        // Assert - Context is unchanged
        context.CountyId.Should().Be(originalCountyId);
        context.Severity.Should().Be(originalSeverity);
        context.Step.StepId.Should().Be(originalStepId);
        context.Plan.PlanId.Should().Be(originalPlanId);
        context.Timestamp.Should().Be(originalTimestamp);
        context.AlertNames?.Count.Should().Be(originalAlertCount);
    }

    [Fact]
    public void Evaluate_DoesNotMutatePolicy()
    {
        // Arrange
        var rule = new RemediationRule(
            "ALLOW-ALL",
            RemediationDecisionKind.AllowAutoExecute
        );

        var globalPolicy = new RemediationPolicy("global", new[] { rule });

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = globalPolicy
        };

        var engine = CreateEngine(options);

        var step = CreateStep();
        var plan = CreatePlan(step);

        var context = new RemediationPolicyContext(
            "benton",
            IncidentSeverity.Warning,
            plan,
            step,
            DateTimeOffset.UtcNow
        );

        // Capture original state
        var originalRuleCount = globalPolicy.Rules.Count;
        var originalRuleId = globalPolicy.Rules[0].RuleId;

        // Act
        var decision = engine.Evaluate(context);

        // Assert - Policy is unchanged
        globalPolicy.Rules.Count.Should().Be(originalRuleCount);
        globalPolicy.Rules[0].RuleId.Should().Be(originalRuleId);
    }

    #endregion

    #region Determinism Tests

    [Fact]
    public void Evaluate_SameInputSameOutput_IsDeterministic()
    {
        // Arrange
        var rules = new[]
        {
            new RemediationRule("RULE-A", RemediationDecisionKind.AllowAutoExecute, StepKind: RunbookStepKind.Diagnostic),
            new RemediationRule("RULE-B", RemediationDecisionKind.RequireHumanApproval, StepKind: RunbookStepKind.Diagnostic, Priority: -1),
        };

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", rules)
        };

        var engine = CreateEngine(options);

        var step = CreateStep();
        var plan = CreatePlan(step);
        var fixedTimestamp = new DateTimeOffset(2024, 1, 15, 12, 0, 0, TimeSpan.Zero);

        var context = new RemediationPolicyContext(
            "benton",
            IncidentSeverity.Warning,
            plan,
            step,
            fixedTimestamp
        );

        // Act - Run multiple times
        var decisions = Enumerable.Range(0, 10)
            .Select(_ => engine.Evaluate(context))
            .ToList();

        // Assert - All decisions are identical
        decisions.Should().OnlyContain(d =>
            d.Kind == decisions[0].Kind &&
            d.AppliedRuleId == decisions[0].AppliedRuleId);
    }

    [Fact]
    public void Evaluate_DifferentEngineInstances_SameResult()
    {
        // Arrange
        var rules = new[]
        {
            new RemediationRule("ALLOW-DIAG", RemediationDecisionKind.AllowAutoExecute, StepKind: RunbookStepKind.Diagnostic)
        };

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", rules)
        };

        var engine1 = CreateEngine(options);
        var engine2 = CreateEngine(options);

        var step = CreateStep();
        var plan = CreatePlan(step);
        var fixedTimestamp = new DateTimeOffset(2024, 1, 15, 12, 0, 0, TimeSpan.Zero);

        var context = new RemediationPolicyContext(
            "benton",
            IncidentSeverity.Warning,
            plan,
            step,
            fixedTimestamp
        );

        // Act
        var decision1 = engine1.Evaluate(context);
        var decision2 = engine2.Evaluate(context);

        // Assert
        decision1.Kind.Should().Be(decision2.Kind);
        decision1.AppliedRuleId.Should().Be(decision2.AppliedRuleId);
        decision1.ScopeId.Should().Be(decision2.ScopeId);
    }

    #endregion

    #region Thread Safety Tests

    [Fact]
    public async Task Evaluate_ConcurrentCalls_ThreadSafe()
    {
        // Arrange
        var rules = new[]
        {
            new RemediationRule("ALLOW-DIAG", RemediationDecisionKind.AllowAutoExecute, StepKind: RunbookStepKind.Diagnostic)
        };

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", rules)
        };

        var engine = CreateEngine(options);

        var step = CreateStep();
        var plan = CreatePlan(step);
        var fixedTimestamp = new DateTimeOffset(2024, 1, 15, 12, 0, 0, TimeSpan.Zero);

        var context = new RemediationPolicyContext(
            "benton",
            IncidentSeverity.Warning,
            plan,
            step,
            fixedTimestamp
        );

        // Act - Run 100 concurrent evaluations
        var tasks = Enumerable.Range(0, 100)
            .Select(_ => Task.Run(() => engine.Evaluate(context)))
            .ToArray();

        var decisions = await Task.WhenAll(tasks);

        // Assert - All decisions match and no exceptions
        decisions.Should().HaveCount(100);
        decisions.Should().OnlyContain(d =>
            d.Kind == RemediationDecisionKind.AllowAutoExecute &&
            d.AppliedRuleId == "ALLOW-DIAG");
    }

    #endregion

    #region Record Equality Tests

    [Fact]
    public void RemediationDecision_RecordEquality_Works()
    {
        // Arrange
        var decision1 = new RemediationDecision(
            RemediationDecisionKind.AllowAutoExecute,
            "RULE-1",
            "global",
            "Matched rule"
        );

        var decision2 = new RemediationDecision(
            RemediationDecisionKind.AllowAutoExecute,
            "RULE-1",
            "global",
            "Matched rule"
        );

        var decision3 = new RemediationDecision(
            RemediationDecisionKind.DenyAutoExecute,
            "RULE-1",
            "global",
            "Matched rule"
        );

        // Assert
        decision1.Should().Be(decision2);
        decision1.Should().NotBe(decision3);
    }

    [Fact]
    public void RemediationRule_RecordEquality_Works()
    {
        // Arrange
        var rule1 = new RemediationRule(
            "RULE-1",
            RemediationDecisionKind.AllowAutoExecute,
            CountyId: "benton"
        );

        var rule2 = new RemediationRule(
            "RULE-1",
            RemediationDecisionKind.AllowAutoExecute,
            CountyId: "benton"
        );

        var rule3 = new RemediationRule(
            "RULE-1",
            RemediationDecisionKind.AllowAutoExecute,
            CountyId: "yakima"
        );

        // Assert
        rule1.Should().Be(rule2);
        rule1.Should().NotBe(rule3);
    }

    #endregion
}
