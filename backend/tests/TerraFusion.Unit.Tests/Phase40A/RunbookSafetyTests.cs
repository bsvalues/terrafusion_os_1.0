// =============================================================================
// Phase 40A: Runbook Engine - Safety Tests
// =============================================================================
// Tests for safety constraints and governance requirements.
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
/// Safety and governance tests for Phase 40A runbook generation.
/// Ensures all steps require human approval and no automation is suggested.
/// </summary>
[Trait("Category", "Phase40A")]
[Trait("Category", "Safety")]
public class RunbookSafetyTests
{
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly DateTime BaseTime = new(2025, 12, 11, 10, 0, 0, DateTimeKind.Utc);

    private readonly IRunbookEngine _engine;

    public RunbookSafetyTests()
    {
        var loggerMock = new Mock<ILogger<RunbookEngine>>();
        var options = new RunbookEngineOptions { EngineVersion = "1.0.0-test" };

        _engine = new RunbookEngine(
            Options.Create(options),
            loggerMock.Object,
            new NullRunbookExplanationService());
    }

    // =========================================================================
    // SECTION A: Human Approval Requirements
    // =========================================================================

    [Theory]
    [InlineData("AtlasForecastStale")]
    [InlineData("AtlasOrchestratorStall")]
    [InlineData("AtlasAnomalyCritical")]
    [InlineData("SwarmSafeModeTriggered")]
    [InlineData("SwarmActionSpike")]
    [Trait("Category", "HumanApproval")]
    public async Task AllSteps_RequireHumanApproval_InPhase40A(string alertName)
    {
        // Arrange
        var incident = CreateIncidentWithAlert(alertName);

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().AllSatisfy(step =>
        {
            step.RequiresHumanApproval.Should().BeTrue(
                $"Step '{step.Title}' must require human approval in Phase 40A");
        });
    }

    [Theory]
    [InlineData("AtlasForecastStale")]
    [InlineData("AtlasOrchestratorStall")]
    [InlineData("AtlasAnomalyCritical")]
    [InlineData("SwarmSafeModeTriggered")]
    [InlineData("SwarmActionSpike")]
    [Trait("Category", "Automation")]
    public async Task NoSteps_CanBeSuggestedForAutomation_InPhase40A(string alertName)
    {
        // Arrange
        var incident = CreateIncidentWithAlert(alertName);

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().AllSatisfy(step =>
        {
            step.CanBeSuggestedForAutomation.Should().BeFalse(
                $"Step '{step.Title}' must not be suggested for automation in Phase 40A");
        });
    }

    // =========================================================================
    // SECTION B: Safety Level Appropriateness
    // =========================================================================

    [Fact]
    [Trait("Category", "SafetyLevel")]
    public async Task HighRiskSteps_HaveSafetyNotes()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasOrchestratorStall");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        var highRiskSteps = plan.Steps.Where(s => s.SafetyLevel == RunbookSafetyLevel.HighRisk);

        highRiskSteps.Should().AllSatisfy(step =>
        {
            (step.Description.Contains("SAFETY") ||
             step.Description.Contains("HIGH RISK") ||
             step.Description.Contains("WARNING") ||
             step.Description.Contains("CAUTION") ||
             step.Description.Contains("safety", StringComparison.OrdinalIgnoreCase) ||
             step.Description.Contains("high risk", StringComparison.OrdinalIgnoreCase) ||
             step.Description.Contains("warning", StringComparison.OrdinalIgnoreCase) ||
             step.Description.Contains("caution", StringComparison.OrdinalIgnoreCase))
            .Should().BeTrue($"High-risk step '{step.Title}' should include safety notes");
        });
    }

    [Fact]
    [Trait("Category", "SafetyLevel")]
    public async Task RestartSteps_AreMediumOrHighRisk()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasOrchestratorStall");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        var restartSteps = plan.Steps.Where(s => s.Kind == RunbookStepKind.RestartService);

        restartSteps.Should().AllSatisfy(step =>
        {
            step.SafetyLevel.Should().BeOneOf(
                RunbookSafetyLevel.MediumRisk,
                RunbookSafetyLevel.HighRisk);
        });
    }

    [Fact]
    [Trait("Category", "SafetyLevel")]
    public async Task DiagnosticSteps_AreLowRiskOrInfoOnly()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasForecastStale");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        var diagnosticSteps = plan.Steps.Where(s => s.Kind == RunbookStepKind.Diagnostic);

        diagnosticSteps.Should().AllSatisfy(step =>
        {
            step.SafetyLevel.Should().BeOneOf(
                RunbookSafetyLevel.InfoOnly,
                RunbookSafetyLevel.LowRisk);
        });
    }

    [Fact]
    [Trait("Category", "SafetyLevel")]
    public async Task CriticalAlerts_HaveHighRiskSteps()
    {
        // Critical alerts should have at least one high-risk step
        var incident = CreateIncidentWithAlert("AtlasAnomalyCritical");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        var highRiskSteps = plan.Steps.Where(s => s.SafetyLevel == RunbookSafetyLevel.HighRisk);

        highRiskSteps.Should().NotBeEmpty("Critical alerts should include high-risk remediation steps");

        highRiskSteps.Should().AllSatisfy(step =>
        {
            step.RequiresHumanApproval.Should().BeTrue(
                "High-risk steps must require human approval");
        });
    }

    // =========================================================================
    // SECTION C: Owner Role Requirements
    // =========================================================================

    [Theory]
    [InlineData("AtlasForecastStale")]
    [InlineData("AtlasOrchestratorStall")]
    [InlineData("SwarmSafeModeTriggered")]
    [Trait("Category", "OwnerRole")]
    public async Task AllSteps_HaveSuggestedOwnerRole(string alertName)
    {
        // Arrange
        var incident = CreateIncidentWithAlert(alertName);

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().AllSatisfy(step =>
        {
            step.SuggestedOwnerRole.Should().NotBeNullOrWhiteSpace(
                $"Step '{step.Title}' must have a suggested owner role");
        });
    }

    [Fact]
    [Trait("Category", "OwnerRole")]
    public async Task HighRiskSteps_RequireSeniorRole()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasOrchestratorStall");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        var highRiskSteps = plan.Steps.Where(s => s.SafetyLevel == RunbookSafetyLevel.HighRisk);

        highRiskSteps.Should().AllSatisfy(step =>
        {
            (step.SuggestedOwnerRole.Contains("Senior") ||
             step.SuggestedOwnerRole.Contains("Lead") ||
             step.SuggestedOwnerRole.Contains("Manager") ||
             step.SuggestedOwnerRole.Contains("DBA") ||
             step.SuggestedOwnerRole.Contains("Admin"))
            .Should().BeTrue($"High-risk step '{step.Title}' should require senior personnel");
        });
    }

    // =========================================================================
    // SECTION D: Critical Incident Escalation
    // =========================================================================

    [Fact]
    [Trait("Category", "Escalation")]
    public async Task CriticalIncidents_HaveNotificationStep()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasOrchestratorStall", IncidentSeverity.Critical);

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        plan.Steps.Should().Contain(s => s.Kind == RunbookStepKind.Notification,
            "Critical incidents must include a notification/escalation step");
    }

    [Fact]
    [Trait("Category", "Escalation")]
    public async Task CriticalSeverity_PlanDescriptionWarnsOfRisk()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasOrchestratorStall", IncidentSeverity.Critical);

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        (plan.Description.Contains("CRITICAL") ||
         plan.Description.Contains("immediate", StringComparison.OrdinalIgnoreCase) ||
         plan.Description.Contains("urgent", StringComparison.OrdinalIgnoreCase))
        .Should().BeTrue("Critical severity plan should warn of risk");
    }

    // =========================================================================
    // SECTION E: Step Ordering Safety
    // =========================================================================

    [Fact]
    [Trait("Category", "Ordering")]
    public async Task DiagnosticsBeforeRestarts()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasOrchestratorStall");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        var diagnosticOrders = plan.Steps
            .Where(s => s.Kind == RunbookStepKind.Diagnostic)
            .Select(s => s.Order)
            .ToList();

        var restartOrders = plan.Steps
            .Where(s => s.Kind == RunbookStepKind.RestartService)
            .Select(s => s.Order)
            .ToList();

        if (diagnosticOrders.Any() && restartOrders.Any())
        {
            diagnosticOrders.Max().Should().BeLessThan(restartOrders.Min(),
                "Diagnostic steps must come before restart steps");
        }
    }

    [Fact]
    [Trait("Category", "Ordering")]
    public async Task ConfigChecksBeforeRestarts()
    {
        // Arrange
        var incident = CreateIncidentWithAlert("AtlasForecastStale");

        // Act
        var plan = await _engine.GenerateRunbookAsync(incident);

        // Assert
        var configOrders = plan.Steps
            .Where(s => s.Kind == RunbookStepKind.ConfigCheck)
            .Select(s => s.Order)
            .ToList();

        var restartOrders = plan.Steps
            .Where(s => s.Kind == RunbookStepKind.RestartService)
            .Select(s => s.Order)
            .ToList();

        if (configOrders.Any() && restartOrders.Any())
        {
            configOrders.Max().Should().BeLessThan(restartOrders.Min(),
                "Config check steps should come before restart steps");
        }
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
}
