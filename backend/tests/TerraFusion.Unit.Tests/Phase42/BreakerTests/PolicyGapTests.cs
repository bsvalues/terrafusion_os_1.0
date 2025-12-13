// =============================================================================
// Phase 42: Breaker Tests - Policy Gaps & Edge Cases
// =============================================================================
// Tests designed to expose gaps, conflicts, and malformed data handling.
// =============================================================================

using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.Operations.Incidents;
using TerraFusion.Operations.Runbooks;
using TerraFusion.Operations.Runbooks.Remediation;
using Xunit;

namespace TerraFusion.Unit.Tests.Phase42.BreakerTests;

[Trait("Phase", "42")]
[Trait("Component", "RemediationPolicy")]
[Trait("Category", "Breaker")]
public class PolicyGapTests
{
    private readonly Mock<ILogger<RemediationPolicyEngine>> _loggerMock;

    public PolicyGapTests()
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

    private static RemediationPolicyContext CreateContext(
        string countyId = "benton",
        IncidentSeverity severity = IncidentSeverity.Warning,
        RunbookStep? step = null,
        DateTimeOffset? timestamp = null,
        IReadOnlyList<string>? alertNames = null)
    {
        step ??= CreateStep();
        var plan = CreatePlan(step);
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

    #region Policy Gap Tests

    [Fact]
    public void Evaluate_UncoveredStepKind_FallsBackToDefault()
    {
        // Arrange - Policy only covers Diagnostic and ConfigCheck
        var rules = new[]
        {
            new RemediationRule("ALLOW-DIAG", RemediationDecisionKind.AllowAutoExecute, StepKind: RunbookStepKind.Diagnostic),
            new RemediationRule("ALLOW-CONFIG", RemediationDecisionKind.AllowAutoExecute, StepKind: RunbookStepKind.ConfigCheck),
        };

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", rules)
        };

        var engine = CreateEngine(options);

        // Act - Test all uncovered step kinds
        var uncoveredKinds = new[]
        {
            RunbookStepKind.RestartService,
            RunbookStepKind.ScaleOut,
            RunbookStepKind.Failover,
            RunbookStepKind.Notification,
            RunbookStepKind.ManualInvestigation,
            RunbookStepKind.DataValidation,
            RunbookStepKind.Rollback,
            RunbookStepKind.Other
        };

        foreach (var kind in uncoveredKinds)
        {
            var step = CreateStep(kind: kind);
            var decision = engine.Evaluate(CreateContext(step: step));

            // Assert - All uncovered kinds fall back to RequireHumanApproval
            decision.Kind.Should().Be(
                RemediationDecisionKind.RequireHumanApproval,
                because: $"StepKind.{kind} is not covered by policy");
        }
    }

    [Fact]
    public void Evaluate_UnknownCounty_FallsBackToGlobal()
    {
        // Arrange
        var bentonRule = new RemediationRule(
            "BENTON-ALLOW",
            RemediationDecisionKind.AllowAutoExecute,
            CountyId: "benton"
        );

        var globalRule = new RemediationRule(
            "GLOBAL-DENY",
            RemediationDecisionKind.DenyAutoExecute
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

        // Act - Unknown county
        var decision = engine.Evaluate(CreateContext(countyId: "unknown-county"));

        // Assert - Falls back to global policy
        decision.Kind.Should().Be(RemediationDecisionKind.DenyAutoExecute);
        decision.ScopeId.Should().Be("global");
    }

    #endregion

    #region Conflicting Rules Tests

    [Fact]
    public void Evaluate_ConflictingRules_DenyWins()
    {
        // Arrange - Same priority, both match, but different decisions
        var rules = new[]
        {
            new RemediationRule("ALLOW", RemediationDecisionKind.AllowAutoExecute, Priority: 10),
            new RemediationRule("DENY", RemediationDecisionKind.DenyAutoExecute, Priority: 10),
        };

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", rules)
        };

        var engine = CreateEngine(options);

        // Act
        var decision = engine.Evaluate(CreateContext());

        // Assert - Deny always wins
        decision.Kind.Should().Be(RemediationDecisionKind.DenyAutoExecute);
    }

    [Fact]
    public void Evaluate_MultipleMatchingAllowRules_HighestPriorityWins()
    {
        // Arrange
        var rules = new[]
        {
            new RemediationRule("LOW-PRI", RemediationDecisionKind.RequireHumanApproval, Priority: 1),
            new RemediationRule("MED-PRI", RemediationDecisionKind.AllowAutoExecute, Priority: 50),
            new RemediationRule("HIGH-PRI", RemediationDecisionKind.RequireHumanApproval, Priority: 100),
        };

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", rules)
        };

        var engine = CreateEngine(options);

        // Act
        var decision = engine.Evaluate(CreateContext());

        // Assert - Highest priority wins
        decision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
        decision.AppliedRuleId.Should().Be("HIGH-PRI");
    }

    [Fact]
    public void Evaluate_SamePrioritySameSpecificity_FirstInListWins()
    {
        // Arrange - Same priority, same specificity
        var rules = new[]
        {
            new RemediationRule("FIRST", RemediationDecisionKind.AllowAutoExecute, StepKind: RunbookStepKind.Diagnostic),
            new RemediationRule("SECOND", RemediationDecisionKind.RequireHumanApproval, StepKind: RunbookStepKind.Diagnostic),
        };

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", rules)
        };

        var engine = CreateEngine(options);
        var step = CreateStep(kind: RunbookStepKind.Diagnostic);

        // Act
        var decision = engine.Evaluate(CreateContext(step: step));

        // Assert - First matching rule wins
        decision.AppliedRuleId.Should().Be("FIRST");
    }

    #endregion

    #region Malformed Data Tests

    [Fact]
    public void Evaluate_EmptyCountyId_HandledGracefully()
    {
        // Arrange
        var rule = new RemediationRule(
            "GLOBAL-ALLOW",
            RemediationDecisionKind.AllowAutoExecute
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act - Empty county ID
        var decision = engine.Evaluate(CreateContext(countyId: ""));

        // Assert - Falls back to global
        decision.ScopeId.Should().Be("global");
    }

    [Fact]
    public void Evaluate_WhitespaceCountyId_HandledGracefully()
    {
        // Arrange
        var rule = new RemediationRule(
            "GLOBAL-ALLOW",
            RemediationDecisionKind.AllowAutoExecute
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act - Whitespace county ID
        var decision = engine.Evaluate(CreateContext(countyId: "   "));

        // Assert - Falls back to global
        decision.ScopeId.Should().Be("global");
    }

    [Fact]
    public void EvaluatePlan_EmptyPlan_ReturnsEmptyDictionary()
    {
        // Arrange
        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new List<RemediationRule>())
        };

        var engine = CreateEngine(options);
        var emptyPlan = new RunbookPlan
        {
            PlanId = "PLAN-EMPTY",
            IncidentId = Guid.NewGuid(),
            Title = "Empty Plan",
            Description = "No steps",
            OverallSeverity = IncidentSeverity.Info,
            ImpactedCountyIds = new List<Guid>(),
            Steps = new List<RunbookStep>(), // Empty
            CreatedAt = DateTimeOffset.UtcNow
        };

        // Act
        var decisions = engine.EvaluatePlan(
            "benton",
            IncidentSeverity.Info,
            emptyPlan,
            DateTimeOffset.UtcNow
        );

        // Assert
        decisions.Should().BeEmpty();
    }

    [Fact]
    public void EvaluatePlan_NullPlan_ThrowsArgumentNullException()
    {
        // Arrange
        var options = new RemediationPolicyOptions();
        var engine = CreateEngine(options);

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => engine.EvaluatePlan(
            "benton",
            IncidentSeverity.Info,
            null!,
            DateTimeOffset.UtcNow
        ));
    }

    #endregion

    #region Boundary Tests

    [Fact]
    public void Evaluate_TimeWindowEdge_AtExactStartTime()
    {
        // Arrange - Window from 09:00 to 17:00
        var rule = new RemediationRule(
            "BUSINESS-HOURS",
            RemediationDecisionKind.AllowAutoExecute,
            ActiveFromUtcOffset: TimeSpan.FromHours(9),
            ActiveToUtcOffset: TimeSpan.FromHours(17)
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act - Exactly 09:00:00
        var exactStart = new DateTimeOffset(2024, 1, 15, 9, 0, 0, TimeSpan.Zero);
        var decision = engine.Evaluate(CreateContext(timestamp: exactStart));

        // Assert - Should match (inclusive start)
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
    }

    [Fact]
    public void Evaluate_TimeWindowEdge_AtExactEndTime()
    {
        // Arrange - Window from 09:00 to 17:00
        var rule = new RemediationRule(
            "BUSINESS-HOURS",
            RemediationDecisionKind.AllowAutoExecute,
            ActiveFromUtcOffset: TimeSpan.FromHours(9),
            ActiveToUtcOffset: TimeSpan.FromHours(17)
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act - Exactly 17:00:00
        var exactEnd = new DateTimeOffset(2024, 1, 15, 17, 0, 0, TimeSpan.Zero);
        var decision = engine.Evaluate(CreateContext(timestamp: exactEnd));

        // Assert - Should match (inclusive end)
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
    }

    [Fact]
    public void Evaluate_SeverityEdge_ExactMinimum()
    {
        // Arrange
        var rule = new RemediationRule(
            "MIN-WARNING",
            RemediationDecisionKind.AllowAutoExecute,
            MinSeverity: IncidentSeverity.Warning
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act - Exactly at minimum
        var decision = engine.Evaluate(CreateContext(severity: IncidentSeverity.Warning));

        // Assert - Should match (inclusive minimum)
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
    }

    [Fact]
    public void Evaluate_SeverityEdge_ExactMaximum()
    {
        // Arrange
        var rule = new RemediationRule(
            "MAX-WARNING",
            RemediationDecisionKind.AllowAutoExecute,
            MaxSeverity: IncidentSeverity.Warning
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act - Exactly at maximum
        var decision = engine.Evaluate(CreateContext(severity: IncidentSeverity.Warning));

        // Assert - Should match (inclusive maximum)
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
    }

    #endregion

    #region Large Scale Tests

    [Fact]
    public void Evaluate_ManyRules_PerformsReasonably()
    {
        // Arrange - 1000 rules
        var rules = Enumerable.Range(1, 1000)
            .Select(i => new RemediationRule(
                $"RULE-{i}",
                RemediationDecisionKind.RequireHumanApproval,
                CountyId: $"county-{i % 100}",
                Priority: i % 10
            ))
            .ToList();

        // Add one matching rule at the end
        rules.Add(new RemediationRule(
            "MATCH-RULE",
            RemediationDecisionKind.AllowAutoExecute,
            CountyId: "benton",
            Priority: 100
        ));

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", rules)
        };

        var engine = CreateEngine(options);

        // Act
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        var decision = engine.Evaluate(CreateContext(countyId: "benton"));
        stopwatch.Stop();

        // Assert - Correct result in reasonable time
        decision.AppliedRuleId.Should().Be("MATCH-RULE");
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(100); // Should be <100ms
    }

    [Fact]
    public void EvaluatePlan_ManySteps_HandlesCorrectly()
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

        // 100 steps
        var steps = Enumerable.Range(1, 100)
            .Select(i => CreateStep(
                $"STEP-{i:D6}",
                i % 2 == 0 ? RunbookStepKind.Diagnostic : RunbookStepKind.RestartService))
            .ToArray();

        var plan = CreatePlan(steps);

        // Act
        var decisions = engine.EvaluatePlan(
            "benton",
            IncidentSeverity.Warning,
            plan,
            DateTimeOffset.UtcNow
        );

        // Assert
        decisions.Should().HaveCount(100);
        decisions.Values.Count(d => d.Kind == RemediationDecisionKind.AllowAutoExecute).Should().Be(50);
        decisions.Values.Count(d => d.Kind == RemediationDecisionKind.RequireHumanApproval).Should().Be(50);
    }

    #endregion
}
