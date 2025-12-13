// =============================================================================
// Phase 42: Remediation Policy Engine Tests - Rule Matching
// =============================================================================
// Comprehensive tests for rule matching logic.
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
public class RemediationPolicyMatchingTests
{
    private readonly Mock<ILogger<RemediationPolicyEngine>> _loggerMock;

    public RemediationPolicyMatchingTests()
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

    #region County Filter Tests

    [Fact]
    public void Evaluate_CountyFilter_MatchesExact()
    {
        // Arrange
        var rule = new RemediationRule(
            "BENTON-ONLY",
            RemediationDecisionKind.AllowAutoExecute,
            CountyId: "benton"
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act - Benton should match
        var bentonDecision = engine.Evaluate(CreateContext(countyId: "benton"));

        // Act - Yakima should NOT match
        var yakimaDecision = engine.Evaluate(CreateContext(countyId: "yakima"));

        // Assert
        bentonDecision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        yakimaDecision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
    }

    [Fact]
    public void Evaluate_CountyFilter_CaseInsensitive()
    {
        // Arrange
        var rule = new RemediationRule(
            "BENTON-ONLY",
            RemediationDecisionKind.AllowAutoExecute,
            CountyId: "BENTON"
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act
        var decision = engine.Evaluate(CreateContext(countyId: "benton"));

        // Assert
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
    }

    #endregion

    #region Component Filter Tests

    [Fact]
    public void Evaluate_ComponentFilter_MatchesTitleContains()
    {
        // Arrange - Component filter matches against step Title
        var rule = new RemediationRule(
            "ATLAS-ONLY",
            RemediationDecisionKind.AllowAutoExecute,
            Component: "Atlas"
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);
        var atlasStep = CreateStep(title: "Check Atlas Health");
        var swarmStep = CreateStep(title: "Check Swarm Status");

        // Act
        var atlasDecision = engine.Evaluate(CreateContext(step: atlasStep));
        var swarmDecision = engine.Evaluate(CreateContext(step: swarmStep));

        // Assert
        atlasDecision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        swarmDecision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
    }

    #endregion

    #region SafetyLevel Filter Tests

    [Theory]
    [InlineData(RunbookSafetyLevel.InfoOnly, RunbookSafetyLevel.InfoOnly, true)]
    [InlineData(RunbookSafetyLevel.LowRisk, RunbookSafetyLevel.LowRisk, true)]
    [InlineData(RunbookSafetyLevel.MediumRisk, RunbookSafetyLevel.MediumRisk, true)]
    [InlineData(RunbookSafetyLevel.HighRisk, RunbookSafetyLevel.HighRisk, true)]
    [InlineData(RunbookSafetyLevel.InfoOnly, RunbookSafetyLevel.LowRisk, false)]
    [InlineData(RunbookSafetyLevel.HighRisk, RunbookSafetyLevel.InfoOnly, false)]
    public void Evaluate_SafetyLevelFilter_ExactMatch(
        RunbookSafetyLevel ruleLevel,
        RunbookSafetyLevel stepLevel,
        bool shouldMatch)
    {
        // Arrange
        var rule = new RemediationRule(
            "SAFETY-RULE",
            RemediationDecisionKind.AllowAutoExecute,
            SafetyLevel: ruleLevel
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);
        var step = CreateStep(safetyLevel: stepLevel);

        // Act
        var decision = engine.Evaluate(CreateContext(step: step));

        // Assert
        decision.Kind.Should().Be(
            shouldMatch
                ? RemediationDecisionKind.AllowAutoExecute
                : RemediationDecisionKind.RequireHumanApproval);
    }

    #endregion

    #region Severity Range Filter Tests

    [Theory]
    [InlineData(IncidentSeverity.Info, IncidentSeverity.Critical, IncidentSeverity.Warning, true)]
    [InlineData(IncidentSeverity.Info, IncidentSeverity.Warning, IncidentSeverity.Info, true)]
    [InlineData(IncidentSeverity.Warning, IncidentSeverity.Critical, IncidentSeverity.Info, false)]
    [InlineData(IncidentSeverity.Info, IncidentSeverity.Warning, IncidentSeverity.Critical, false)]
    public void Evaluate_SeverityRangeFilter(
        IncidentSeverity minSeverity,
        IncidentSeverity maxSeverity,
        IncidentSeverity incidentSeverity,
        bool shouldMatch)
    {
        // Arrange
        var rule = new RemediationRule(
            "SEVERITY-RANGE",
            RemediationDecisionKind.AllowAutoExecute,
            MinSeverity: minSeverity,
            MaxSeverity: maxSeverity
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act
        var decision = engine.Evaluate(CreateContext(severity: incidentSeverity));

        // Assert
        decision.Kind.Should().Be(
            shouldMatch
                ? RemediationDecisionKind.AllowAutoExecute
                : RemediationDecisionKind.RequireHumanApproval);
    }

    [Fact]
    public void Evaluate_MinSeverityOnly_FiltersLower()
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

        // Act
        var infoDecision = engine.Evaluate(CreateContext(severity: IncidentSeverity.Info));
        var warningDecision = engine.Evaluate(CreateContext(severity: IncidentSeverity.Warning));
        var criticalDecision = engine.Evaluate(CreateContext(severity: IncidentSeverity.Critical));

        // Assert
        infoDecision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
        warningDecision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        criticalDecision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
    }

    #endregion

    #region Alert Names Filter Tests

    [Fact]
    public void Evaluate_AlertNamesFilter_ContainsMatch()
    {
        // Arrange
        var rule = new RemediationRule(
            "ATLAS-ALERTS",
            RemediationDecisionKind.AllowAutoExecute,
            AlertNames: new[] { "Atlas", "CPU" }
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act - Should match (contains "Atlas")
        var matchDecision = engine.Evaluate(CreateContext(
            alertNames: new[] { "AtlasHighMemory", "NetworkLatency" }));

        // Act - Should NOT match
        var noMatchDecision = engine.Evaluate(CreateContext(
            alertNames: new[] { "SwarmOverload", "DiskSpace" }));

        // Assert
        matchDecision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        noMatchDecision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
    }

    [Fact]
    public void Evaluate_AlertNamesFilter_IgnoredWhenContextHasNoAlerts()
    {
        // Arrange - Rule has alert filter but context has no alerts
        var rule = new RemediationRule(
            "ALERT-RULE",
            RemediationDecisionKind.AllowAutoExecute,
            AlertNames: new[] { "Atlas" }
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act - No alerts in context means filter is skipped
        var decision = engine.Evaluate(CreateContext(alertNames: null));

        // Assert - Should match because alert filter is skipped when context has no alerts
        decision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
    }

    #endregion

    #region Time Window Filter Tests

    [Fact]
    public void Evaluate_TimeWindowFilter_WithinWindow()
    {
        // Arrange - Rule active from 09:00 to 17:00 UTC
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

        // Act - 12:00 UTC (within window)
        var withinWindow = new DateTimeOffset(2024, 1, 15, 12, 0, 0, TimeSpan.Zero);
        var withinDecision = engine.Evaluate(CreateContext(timestamp: withinWindow));

        // Act - 20:00 UTC (outside window)
        var outsideWindow = new DateTimeOffset(2024, 1, 15, 20, 0, 0, TimeSpan.Zero);
        var outsideDecision = engine.Evaluate(CreateContext(timestamp: outsideWindow));

        // Assert
        withinDecision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        outsideDecision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
    }

    [Fact]
    public void Evaluate_TimeWindowFilter_OvernightWindow()
    {
        // Arrange - Rule active from 22:00 to 06:00 UTC (overnight)
        var rule = new RemediationRule(
            "MAINTENANCE-WINDOW",
            RemediationDecisionKind.AllowAutoExecute,
            ActiveFromUtcOffset: TimeSpan.FromHours(22),
            ActiveToUtcOffset: TimeSpan.FromHours(6)
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act - 23:00 UTC (within window)
        var lateNight = new DateTimeOffset(2024, 1, 15, 23, 0, 0, TimeSpan.Zero);
        var lateDecision = engine.Evaluate(CreateContext(timestamp: lateNight));

        // Act - 04:00 UTC (within window)
        var earlyMorning = new DateTimeOffset(2024, 1, 15, 4, 0, 0, TimeSpan.Zero);
        var earlyDecision = engine.Evaluate(CreateContext(timestamp: earlyMorning));

        // Act - 12:00 UTC (outside window)
        var noon = new DateTimeOffset(2024, 1, 15, 12, 0, 0, TimeSpan.Zero);
        var noonDecision = engine.Evaluate(CreateContext(timestamp: noon));

        // Assert
        lateDecision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        earlyDecision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        noonDecision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
    }

    #endregion

    #region Combined Filters Tests

    [Fact]
    public void Evaluate_AllFilters_MustMatch()
    {
        // Arrange - Rule with all filters
        var rule = new RemediationRule(
            "VERY-SPECIFIC",
            RemediationDecisionKind.AllowAutoExecute,
            CountyId: "benton",
            Component: "Atlas",
            StepKind: RunbookStepKind.Diagnostic,
            SafetyLevel: RunbookSafetyLevel.InfoOnly,
            MinSeverity: IncidentSeverity.Warning,
            MaxSeverity: IncidentSeverity.Warning
        );

        var options = new RemediationPolicyOptions
        {
            LogEvaluations = false,
            GlobalPolicy = new RemediationPolicy("global", new[] { rule })
        };

        var engine = CreateEngine(options);

        // Act - Perfect match
        var matchStep = CreateStep(
            kind: RunbookStepKind.Diagnostic,
            safetyLevel: RunbookSafetyLevel.InfoOnly,
            title: "Check Atlas Health");
        var matchDecision = engine.Evaluate(CreateContext(
            countyId: "benton",
            severity: IncidentSeverity.Warning,
            step: matchStep));

        // Act - Wrong county
        var wrongCountyDecision = engine.Evaluate(CreateContext(
            countyId: "yakima",
            severity: IncidentSeverity.Warning,
            step: matchStep));

        // Act - Wrong severity
        var wrongSeverityDecision = engine.Evaluate(CreateContext(
            countyId: "benton",
            severity: IncidentSeverity.Critical,
            step: matchStep));

        // Assert
        matchDecision.Kind.Should().Be(RemediationDecisionKind.AllowAutoExecute);
        wrongCountyDecision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
        wrongSeverityDecision.Kind.Should().Be(RemediationDecisionKind.RequireHumanApproval);
    }

    #endregion
}
