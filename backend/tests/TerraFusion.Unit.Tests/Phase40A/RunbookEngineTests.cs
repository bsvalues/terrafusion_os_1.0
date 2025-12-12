// =============================================================================
// Phase 40A: Runbook Engine - Unit Tests
// =============================================================================
// Tests for runbook generation from incident summaries.
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
/// Unit tests for the RunbookEngine.
/// Tests per-alert mapping and plan generation.
/// </summary>
[Trait("Category", "Phase40A")]
[Trait("Category", "Unit")]
public class RunbookEngineTests
{
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid YakimaCountyId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly DateTime BaseTime = new(2025, 12, 11, 10, 0, 0, DateTimeKind.Utc);

    private readonly IRunbookEngine _engine;
    private readonly Mock<ILogger<RunbookEngine>> _loggerMock;
    private readonly RunbookEngineOptions _options;

    public RunbookEngineTests()
    {
        _loggerMock = new Mock<ILogger<RunbookEngine>>();
        _options = new RunbookEngineOptions
        {
            EngineVersion = "1.0.0-test"
        };

        _engine = new RunbookEngine(
            Options.Create(_options),
            _loggerMock.Object,
            new NullRunbookExplanationService());
    }

    // =========================================================================
    // SECTION A: Per-Alert Runbook Generation Tests
    // =========================================================================

    [Theory]
    [InlineData("AtlasForecastStale")]
    [InlineData("AtlasForecastErrorRateHigh")]
    [InlineData("AtlasForecastDurationSpike")]
    [InlineData("AtlasOrchestratorStall")]
    [InlineData("AtlasAnomalySpike")]
    [InlineData("AtlasAnomalyCritical")]
    [InlineData("AtlasTelemetryDropRate")]
    [InlineData("SwarmActionSpike")]
    [InlineData("SwarmCooldownActivation")]
    [InlineData("SwarmSafeModeTriggered")]
    [InlineData("SwarmPolicyLoadHigh")]
    [InlineData("SwarmActionsByCountyImbalance")]
    [Trait("Category", "AlertMapping")]
    public async Task GenerateRunbook_KnownAlert_ProducesValidPlan(string alertName)
    {
        // Arrange
        var incident = CreateIncidentWithAlert(alertName);

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Should().NotBeNull();
        plan.PlanId.Should().StartWith("PLAN-");
        plan.IncidentId.Should().Be(incident.IncidentId);
        plan.Steps.Should().NotBeEmpty();
        plan.Steps.Should().AllSatisfy(step =>
        {
            step.StepId.Should().StartWith("STEP-");
            step.Order.Should().BeGreaterThan(0);
            step.Title.Should().NotBeNullOrWhiteSpace();
            step.Description.Should().NotBeNullOrWhiteSpace();
            step.RequiresHumanApproval.Should().BeTrue("Phase 40A requires all steps have human approval");
            step.CanBeSuggestedForAutomation.Should().BeFalse("Phase 40A does not allow automation");
        });
    }

    [Fact]
    [Trait("Category", "AlertMapping")]
    public async Task GenerateRunbook_AtlasForecastStale_ContainsDiagnosticSteps()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasForecastStale");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().Contain(s => s.Kind == RunbookStepKind.Diagnostic);
        plan.Steps.Should().Contain(s => s.Title.Contains("Dashboard") || s.Title.Contains("Logs"));
    }

    [Fact]
    [Trait("Category", "AlertMapping")]
    public async Task GenerateRunbook_AtlasOrchestratorStall_ContainsRestartStep()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasOrchestratorStall");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().Contain(s => s.Kind == RunbookStepKind.RestartService);
        plan.Steps.Should().Contain(s => s.SafetyLevel == RunbookSafetyLevel.HighRisk);
    }

    [Fact]
    [Trait("Category", "AlertMapping")]
    public async Task GenerateRunbook_AtlasAnomalyCritical_ContainsNotificationStep()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasAnomalyCritical");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().Contain(s => s.Kind == RunbookStepKind.Notification);
        plan.Steps.Should().Contain(s => s.Title.Contains("Notify"));
    }

    [Fact]
    [Trait("Category", "AlertMapping")]
    public async Task GenerateRunbook_SwarmSafeModeTriggered_ContainsGuardrailReview()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("SwarmSafeModeTriggered");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().Contain(s =>
            s.Title.Contains("Guardrail") ||
            s.Description.Contains("guardrail", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    [Trait("Category", "AlertMapping")]
    public async Task GenerateRunbook_SwarmCooldownActivation_IsLowSeverityPlan()
    {
        // Arrange - cooldown is INFO level, should produce light plan
        var incident = CreateIncidentWithAlert("SwarmCooldownActivation", IncidentSeverity.Info);

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().HaveCountLessThan(5);
        plan.Steps.Should().AllSatisfy(s =>
            s.SafetyLevel.Should().BeOneOf(RunbookSafetyLevel.InfoOnly, RunbookSafetyLevel.LowRisk));
    }

    [Fact]
    [Trait("Category", "AlertMapping")]
    public async Task GenerateRunbook_UnknownAlert_ProducesGenericPlan()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("UnknownFutureAlert");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().NotBeEmpty();
        plan.Steps.Should().Contain(s => s.Kind == RunbookStepKind.ManualInvestigation);
    }

    // =========================================================================
    // SECTION B: Multi-Alert Merging Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "MultiAlert")]
    public async Task GenerateRunbook_MultipleAtlasAlerts_MergesStepsCoherently()
    {
        // Arrange
        var incident = CreateIncidentWithAlerts(
            "AtlasOrchestratorStall",
            "AtlasForecastStale",
            "AtlasTelemetryDropRate");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().NotBeEmpty();

        // Steps should be in logical order (diagnostics before restarts)
        var diagnosticIndices = plan.Steps
            .Where(s => s.Kind == RunbookStepKind.Diagnostic)
            .Select(s => s.Order);
        var restartIndices = plan.Steps
            .Where(s => s.Kind == RunbookStepKind.RestartService)
            .Select(s => s.Order);

        if (diagnosticIndices.Any() && restartIndices.Any())
        {
            diagnosticIndices.Max().Should().BeLessThan(restartIndices.Min(),
                "Diagnostic steps should come before restart steps");
        }
    }

    [Fact]
    [Trait("Category", "MultiAlert")]
    public async Task GenerateRunbook_AtlasPlusSwarm_ProducesComprehensivePlan()
    {
        // Arrange
        var incident = CreateIncidentWithAlerts(
            "AtlasOrchestratorStall",
            "SwarmSafeModeTriggered");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().NotBeEmpty();

        // Should have steps for both Atlas and Swarm
        var atlasSteps = plan.Steps.Where(s =>
            s.RelatedAlertNames.Any(a => a.StartsWith("Atlas")));
        var swarmSteps = plan.Steps.Where(s =>
            s.RelatedAlertNames.Any(a => a.StartsWith("Swarm")));

        atlasSteps.Should().NotBeEmpty("Should have Atlas-related steps");
        swarmSteps.Should().NotBeEmpty("Should have Swarm-related steps");
    }

    [Fact]
    [Trait("Category", "MultiAlert")]
    public async Task GenerateRunbook_DuplicateAlerts_DeduplicatesSteps()
    {
        // Arrange
        var incident = CreateIncidentWithAlerts(
            "AtlasForecastStale",
            "AtlasForecastStale",
            "AtlasForecastStale");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        // Should not have triple the steps
        var singleAlertPlan = await _engine.GenerateRunbookAsync(
            CreateIncidentWithAlert("AtlasForecastStale"));

        plan.Steps.Count.Should().Be(singleAlertPlan.Steps.Count,
            "Duplicate alerts should not create duplicate steps");
    }

    // =========================================================================
    // SECTION C: Plan Structure Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "Structure")]
    public async Task GenerateRunbook_ProducesPlanWithCorrectVersion()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasForecastStale");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.PlanVersion.Should().Be("runbook-spec-v1.0.0");
    }

    [Fact]
    [Trait("Category", "Structure")]
    public async Task GenerateRunbook_IncludesAuditInfo()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasForecastStale");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.AuditInfo.Should().NotBeNull();
        plan.AuditInfo!.EngineVersion.Should().Be("1.0.0-test");
        plan.AuditInfo.GenerationDurationMs.Should().BeGreaterOrEqualTo(0);
        plan.AuditInfo.AppliedTemplates.Should().Contain("AtlasForecastStale");
    }

    [Fact]
    [Trait("Category", "Structure")]
    public async Task GenerateRunbook_StepsAreOrderedSequentially()
    {
        // Arrange
        var incident = CreateIncidentWithAlerts(
            "AtlasOrchestratorStall",
            "SwarmSafeModeTriggered");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        var orders = plan.Steps.Select(s => s.Order).ToList();
        orders.Should().BeInAscendingOrder();
        orders.Should().OnlyHaveUniqueItems();
        orders.First().Should().Be(1, "First step should have Order = 1");
    }

    [Fact]
    [Trait("Category", "Structure")]
    public async Task GenerateRunbook_InheritsSeverityFromIncident()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasOrchestratorStall", IncidentSeverity.Critical);

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.OverallSeverity.Should().Be(IncidentSeverity.Critical);
    }

    [Fact]
    [Trait("Category", "Structure")]
    public async Task GenerateRunbook_InheritsCountiesFromIncident()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasForecastStale");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.ImpactedCountyIds.Should().BeEquivalentTo(incident.ImpactedCountyIds);
    }

    // =========================================================================
    // SECTION D: Edge Cases
    // =========================================================================

    [Fact]
    [Trait("Category", "EdgeCase")]
    public async Task GenerateRunbook_NullIncident_ThrowsArgumentNullException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            _engine.GenerateRunbookAsync(null!));
    }

    [Fact]
    [Trait("Category", "EdgeCase")]
    public async Task GenerateRunbook_EmptyAlerts_ProducesGenericPlan()
    {
        // Arrange
        var incident = new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = "Empty Incident",
            Description = "No alerts",
            OverallSeverity = IncidentSeverity.Info,
            Status = IncidentStatus.New,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Alerts = new List<IncidentAlertRef>(),
            Metrics = new List<IncidentMetricSnapshot>(),
            Recommendations = new List<IncidentRecommendation>(),
            TriagedAt = BaseTime,
            Government = true
        };

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Should().NotBeNull();
        plan.Steps.Should().BeEmpty(); // No alerts = no steps
    }

    [Fact]
    [Trait("Category", "EdgeCase")]
    public async Task GenerateRunbook_MultipleCounties_AllCountiesInPlan()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasForecastStale");
        incident = incident with
        {
            ImpactedCountyIds = new List<Guid> { BentonCountyId, YakimaCountyId }
        };

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.ImpactedCountyIds.Should().Contain(BentonCountyId);
        plan.ImpactedCountyIds.Should().Contain(YakimaCountyId);
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private static IncidentSummary CreateIncidentWithAlert(
        string alertName,
        IncidentSeverity severity = IncidentSeverity.Warning)
    {
        return new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = $"Incident: {alertName}",
            Description = $"Test incident triggered by {alertName}",
            OverallSeverity = severity,
            Status = IncidentStatus.New,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = alertName,
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = severity.ToString().ToLowerInvariant()
                    },
                    StartsAt = BaseTime,
                    Fingerprint = $"{alertName}-{Guid.NewGuid():N}"
                }
            },
            Metrics = new List<IncidentMetricSnapshot>(),
            Recommendations = new List<IncidentRecommendation>(),
            TriagedAt = BaseTime,
            Government = true
        };
    }

    private static IncidentSummary CreateIncidentWithAlerts(params string[] alertNames)
    {
        var alerts = alertNames.Select(name => new IncidentAlertRef
        {
            AlertName = name,
            Labels = new Dictionary<string, string>
            {
                ["countyId"] = BentonCountyId.ToString(),
                ["severity"] = "warning"
            },
            StartsAt = BaseTime,
            Fingerprint = $"{name}-{Guid.NewGuid():N}"
        }).ToList();

        return new IncidentSummary
        {
            IncidentId = Guid.NewGuid(),
            Title = $"Incident: Multiple Alerts ({alertNames.Length})",
            Description = $"Test incident triggered by: {string.Join(", ", alertNames)}",
            OverallSeverity = IncidentSeverity.Warning,
            Status = IncidentStatus.New,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Alerts = alerts,
            Metrics = new List<IncidentMetricSnapshot>(),
            Recommendations = new List<IncidentRecommendation>(),
            TriagedAt = BaseTime,
            Government = true
        };
    }
}
