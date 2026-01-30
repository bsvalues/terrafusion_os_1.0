// =============================================================================
// Phase 40A: Runbook Engine - Scenario Tests
// =============================================================================
// Tests for real-world incident scenarios.
// RUNBOOK SPEC LOCK v1.0.0
// =============================================================================

using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.Operations.Incidents;
using TerraFusion.Operations.Runbooks;

namespace TerraFusion.Unit.Tests.Phase40A;

/// <summary>
/// Scenario-based tests for the RunbookEngine.
/// Tests real-world incident combinations and edge cases.
/// </summary>
[Trait("Category", "Phase40A")]
[Trait("Category", "Scenario")]
public class RunbookScenarioTests
{
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid YakimaCountyId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid KingCountyId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly DateTime BaseTime = new(2025, 12, 11, 10, 0, 0, DateTimeKind.Utc);

    private readonly IRunbookEngine _engine;

    public RunbookScenarioTests()
    {
        var loggerMock = new Mock<ILogger<RunbookEngine>>();
        var options = new RunbookEngineOptions { EngineVersion = "1.0.0-test" };

        _engine = new RunbookEngine(
            Options.Create(options),
            loggerMock.Object,
            new NullRunbookExplanationService());
    }

    // =========================================================================
    // SCENARIO 1: Forecaster Degradation Cascade
    // =========================================================================

    [Fact]
    [Trait("Category", "RealWorld")]
    public async Task Scenario_ForecasterCascadeFailure()
    {
        // SCENARIO: Forecaster pipeline fails, causing stale forecasts,
        // high error rates, and slow duration. Common cascade.
        var incident = new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = "Forecaster Pipeline Cascade Failure",
            Description = "Multiple forecaster-related alerts triggered simultaneously",
            OverallSeverity = IncidentSeverity.Warning,
            Status = IncidentStatus.New,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale"),
                CreateAlert("AtlasForecastErrorRateHigh"),
                CreateAlert("AtlasForecastDurationSpike")
            },
            Metrics = new List<IncidentMetricSnapshot>(),
            Recommendations = new List<IncidentRecommendation>(),
            TriagedAt = BaseTime,
            Government = true
        };

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Should().NotBeNull();
        plan.Steps.Should().HaveCountGreaterThan(3, "Cascade should produce comprehensive plan");

        // Should have diagnostic steps first
        plan.Steps.First().Kind.Should().Be(RunbookStepKind.Diagnostic);

        // Should have steps addressing all three alert types
        var alertsCovered = plan.Steps.SelectMany(s => s.RelatedAlertNames).Distinct().ToList();
        alertsCovered.Should().Contain("AtlasForecastStale");
        alertsCovered.Should().Contain("AtlasForecastErrorRateHigh");
        alertsCovered.Should().Contain("AtlasForecastDurationSpike");
    }

    // =========================================================================
    // SCENARIO 2: Orchestrator Complete Outage
    // =========================================================================

    [Fact]
    [Trait("Category", "RealWorld")]
    public async Task Scenario_OrchestratorOutage_CriticalResponse()
    {
        // SCENARIO: Orchestrator completely stalled with telemetry dropping.
        // Critical severity, requires immediate action.
        var incident = new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = "CRITICAL: Orchestrator Outage",
            Description = "Orchestrator stalled and telemetry dropping",
            OverallSeverity = IncidentSeverity.Critical,
            Status = IncidentStatus.New,
            ImpactedCountyIds = new List<Guid> { BentonCountyId, YakimaCountyId },
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasOrchestratorStall"),
                CreateAlert("AtlasTelemetryDropRate")
            },
            Metrics = new List<IncidentMetricSnapshot>(),
            Recommendations = new List<IncidentRecommendation>(),
            TriagedAt = BaseTime,
            Government = true
        };

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.OverallSeverity.Should().Be(IncidentSeverity.Critical);
        plan.Steps.Should().Contain(s => s.Kind == RunbookStepKind.RestartService);
        plan.Steps.Should().Contain(s => s.Kind == RunbookStepKind.Notification);
        plan.Steps.Should().Contain(s => s.SafetyLevel == RunbookSafetyLevel.HighRisk);
    }

    // =========================================================================
    // SCENARIO 3: Swarm Safety Mode Triggered
    // =========================================================================

    [Fact]
    [Trait("Category", "RealWorld")]
    public async Task Scenario_SwarmSafety_PolicyReview()
    {
        // SCENARIO: Swarm entered safe mode due to action spike.
        // Need to investigate guardrails and reset policies.
        var incident = new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = "Swarm Safe Mode Activation",
            Description = "Swarm triggered safe mode after action spike",
            OverallSeverity = IncidentSeverity.Warning,
            Status = IncidentStatus.New,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("SwarmActionSpike"),
                CreateAlert("SwarmSafeModeTriggered"),
                CreateAlert("SwarmCooldownActivation")
            },
            Metrics = new List<IncidentMetricSnapshot>(),
            Recommendations = new List<IncidentRecommendation>(),
            TriagedAt = BaseTime,
            Government = true
        };

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().Contain(s =>
            s.Title.Contains("Guardrail") ||
            s.Description.Contains("guardrail", StringComparison.OrdinalIgnoreCase) ||
            s.Description.Contains("safe mode", StringComparison.OrdinalIgnoreCase));

        // All swarm alerts should be covered
        var alertsCovered = plan.Steps.SelectMany(s => s.RelatedAlertNames).Distinct().ToList();
        alertsCovered.Should().Contain(a => a.StartsWith("Swarm"));
    }

    // =========================================================================
    // SCENARIO 4: Anomaly Detection Alert Storm
    // =========================================================================

    [Fact]
    [Trait("Category", "RealWorld")]
    public async Task Scenario_AnomalyStorm_InvestigationNeeded()
    {
        // SCENARIO: Multiple anomaly alerts firing, indicating potential
        // data quality issues or genuine system anomalies.
        var incident = new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = "Anomaly Detection Storm",
            Description = "Multiple anomaly alerts indicating potential data issues",
            OverallSeverity = IncidentSeverity.Warning,
            Status = IncidentStatus.New,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasAnomalySpike"),
                CreateAlert("AtlasAnomalyCritical")
            },
            Metrics = new List<IncidentMetricSnapshot>(),
            Recommendations = new List<IncidentRecommendation>(),
            TriagedAt = BaseTime,
            Government = true
        };

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().Contain(s => s.Kind == RunbookStepKind.DataValidation);
        plan.Steps.Should().Contain(s => s.Kind == RunbookStepKind.ManualInvestigation);
    }

    // =========================================================================
    // SCENARIO 5: Multi-County Impact
    // =========================================================================

    [Fact]
    [Trait("Category", "RealWorld")]
    public async Task Scenario_MultiCountyOutage()
    {
        // SCENARIO: Issue affecting multiple counties requires
        // coordinated response across county boundaries.
        var incident = new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = "Multi-County Atlas Outage",
            Description = "Atlas services degraded across multiple counties",
            OverallSeverity = IncidentSeverity.Critical,
            Status = IncidentStatus.New,
            ImpactedCountyIds = new List<Guid> { BentonCountyId, YakimaCountyId, KingCountyId },
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlertForCounty("AtlasOrchestratorStall", BentonCountyId),
                CreateAlertForCounty("AtlasOrchestratorStall", YakimaCountyId),
                CreateAlertForCounty("AtlasForecastStale", KingCountyId)
            },
            Metrics = new List<IncidentMetricSnapshot>(),
            Recommendations = new List<IncidentRecommendation>(),
            TriagedAt = BaseTime,
            Government = true
        };

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.ImpactedCountyIds.Should().HaveCount(3);
        plan.Steps.Should().Contain(s => s.Kind == RunbookStepKind.Notification,
            "Multi-county outages require escalation");
    }

    // =========================================================================
    // SCENARIO 6: Atlas + Swarm Combined
    // =========================================================================

    [Fact]
    [Trait("Category", "RealWorld")]
    public async Task Scenario_AtlasSwarmCombined_FullReview()
    {
        // SCENARIO: Both Atlas prediction issues and Swarm execution
        // issues occurring simultaneously - full system review needed.
        var incident = new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = "Full System Degradation",
            Description = "Atlas prediction and Swarm execution both impacted",
            OverallSeverity = IncidentSeverity.Critical,
            Status = IncidentStatus.New,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale"),
                CreateAlert("AtlasOrchestratorStall"),
                CreateAlert("SwarmSafeModeTriggered"),
                CreateAlert("SwarmPolicyLoadHigh")
            },
            Metrics = new List<IncidentMetricSnapshot>(),
            Recommendations = new List<IncidentRecommendation>(),
            TriagedAt = BaseTime,
            Government = true
        };

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().HaveCountGreaterThan(5);

        // Should cover both Atlas and Swarm
        var atlasSteps = plan.Steps.Where(s => s.RelatedAlertNames.Any(a => a.StartsWith("Atlas")));
        var swarmSteps = plan.Steps.Where(s => s.RelatedAlertNames.Any(a => a.StartsWith("Swarm")));

        atlasSteps.Should().NotBeEmpty();
        swarmSteps.Should().NotBeEmpty();
    }

    // =========================================================================
    // SCENARIO 7: County Imbalance
    // =========================================================================

    [Fact]
    [Trait("Category", "RealWorld")]
    public async Task Scenario_CountyImbalance_InvestigateLoad()
    {
        // SCENARIO: Actions concentrated in one county, potential
        // load balancing or configuration issue.
        var incident = new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = "County Action Imbalance Detected",
            Description = "Swarm actions heavily skewed to single county",
            OverallSeverity = IncidentSeverity.Info,
            Status = IncidentStatus.New,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("SwarmActionsByCountyImbalance")
            },
            Metrics = new List<IncidentMetricSnapshot>(),
            Recommendations = new List<IncidentRecommendation>(),
            TriagedAt = BaseTime,
            Government = true
        };

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().NotBeEmpty();
        plan.Steps.Should().Contain(s => s.Kind == RunbookStepKind.ConfigCheck);
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private static IncidentAlertRef CreateAlert(string alertName)
    {
        return new IncidentAlertRef
        {
            AlertName = alertName,
            Labels = new Dictionary<string, string>
            {
                ["countyId"] = BentonCountyId.ToString(),
                ["severity"] = "warning"
            },
            StartsAt = BaseTime,
            Fingerprint = $"{alertName}-{Guid.NewGuid():N}"
        };
    }

    private static IncidentAlertRef CreateAlertForCounty(string alertName, Guid countyId)
    {
        return new IncidentAlertRef
        {
            AlertName = alertName,
            Labels = new Dictionary<string, string>
            {
                ["countyId"] = countyId.ToString(),
                ["severity"] = "warning"
            },
            StartsAt = BaseTime,
            Fingerprint = $"{alertName}-{countyId:N}-{Guid.NewGuid():N}"
        };
    }
}
