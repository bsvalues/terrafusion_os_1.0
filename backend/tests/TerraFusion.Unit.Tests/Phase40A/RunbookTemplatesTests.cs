// =============================================================================
// Phase 40A: Runbook Templates - Unit Tests
// =============================================================================
// Tests for alert-to-step template mappings.
// RUNBOOK SPEC LOCK v1.0.0
// =============================================================================

using Xunit;
using FluentAssertions;
using TerraFusion.Operations.Runbooks;

namespace TerraFusion.Unit.Tests.Phase40A;

/// <summary>
/// Unit tests for RunbookTemplates.
/// Validates all 12 Phase 38 alerts have proper step mappings.
/// </summary>
[Trait("Category", "Phase40A")]
[Trait("Category", "Templates")]
public class RunbookTemplatesTests
{
    // =========================================================================
    // SECTION A: Alert Coverage Tests
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
    [Trait("Category", "Coverage")]
    public void GetStepsForAlert_AllPhase38Alerts_ReturnSteps(string alertName)
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert(alertName);

        // Assert
        steps.Should().NotBeEmpty(
            $"Alert '{alertName}' must have at least one runbook step");
    }

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
    [Trait("Category", "StepQuality")]
    public void GetStepsForAlert_AllSteps_HaveValidStepId(string alertName)
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert(alertName);

        // Assert
        steps.Should().AllSatisfy(step =>
        {
            step.StepId.Should().StartWith("STEP-");
            step.StepId.Should().HaveLength(11, "STEP-XXXXXX format expected");
        });
    }

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
    [Trait("Category", "StepQuality")]
    public void GetStepsForAlert_AllSteps_HaveDescriptiveTitle(string alertName)
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert(alertName);

        // Assert
        steps.Should().AllSatisfy(step =>
        {
            step.Title.Should().NotBeNullOrWhiteSpace();
            step.Title.Length.Should().BeGreaterThan(10,
                "Step titles should be descriptive, not abbreviations");
        });
    }

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
    [Trait("Category", "StepQuality")]
    public void GetStepsForAlert_AllSteps_HaveActionableDescription(string alertName)
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert(alertName);

        // Assert
        steps.Should().AllSatisfy(step =>
        {
            step.Description.Should().NotBeNullOrWhiteSpace();
            step.Description.Length.Should().BeGreaterThan(50,
                "Step descriptions should be detailed and actionable");
        });
    }

    // =========================================================================
    // SECTION B: Supported Alerts List
    // =========================================================================

    [Fact]
    [Trait("Category", "Coverage")]
    public void SupportedAlerts_ContainsAllPhase38Alerts()
    {
        // Arrange
        var phase38Alerts = new[]
        {
            "AtlasForecastStale",
            "AtlasForecastErrorRateHigh",
            "AtlasForecastDurationSpike",
            "AtlasOrchestratorStall",
            "AtlasAnomalySpike",
            "AtlasAnomalyCritical",
            "AtlasTelemetryDropRate",
            "SwarmActionSpike",
            "SwarmCooldownActivation",
            "SwarmSafeModeTriggered",
            "SwarmPolicyLoadHigh",
            "SwarmActionsByCountyImbalance"
        };

        // Act
        var supported = RunbookTemplates.SupportedAlerts;

        // Assert
        supported.Should().Contain(phase38Alerts);
    }

    [Fact]
    [Trait("Category", "Coverage")]
    public void SupportedAlerts_HasExactly12Alerts()
    {
        // Assert
        RunbookTemplates.SupportedAlerts.Should().HaveCount(12,
            "Phase 38 defines exactly 12 alerts");
    }

    // =========================================================================
    // SECTION C: Unknown Alert Handling
    // =========================================================================

    [Fact]
    [Trait("Category", "Fallback")]
    public void GetStepsForAlert_UnknownAlert_ReturnsGenericSteps()
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert("UnknownFutureAlert");

        // Assert
        steps.Should().NotBeEmpty();
        steps.Should().Contain(s => s.Kind == RunbookStepKind.ManualInvestigation);
    }

    [Fact]
    [Trait("Category", "Fallback")]
    public void GetStepsForAlert_NullAlert_ReturnsGenericSteps()
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert(null!);

        // Assert
        steps.Should().NotBeEmpty();
    }

    [Fact]
    [Trait("Category", "Fallback")]
    public void GetStepsForAlert_EmptyAlert_ReturnsGenericSteps()
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert("");

        // Assert
        steps.Should().NotBeEmpty();
    }

    // =========================================================================
    // SECTION D: Step Kind Distribution
    // =========================================================================

    [Theory]
    [InlineData("AtlasForecastStale")]
    [InlineData("AtlasForecastErrorRateHigh")]
    [Trait("Category", "StepKinds")]
    public void GetStepsForAlert_ForecastAlerts_HaveDiagnosticSteps(string alertName)
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert(alertName);

        // Assert
        steps.Should().Contain(s => s.Kind == RunbookStepKind.Diagnostic,
            "Forecast alerts should include diagnostic steps");
    }

    [Fact]
    [Trait("Category", "StepKinds")]
    public void GetStepsForAlert_OrchestratorStall_HasRestartStep()
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert("AtlasOrchestratorStall");

        // Assert
        steps.Should().Contain(s => s.Kind == RunbookStepKind.RestartService,
            "Orchestrator stall should include restart option");
    }

    [Fact]
    [Trait("Category", "StepKinds")]
    public void GetStepsForAlert_AnomalyCritical_HasNotificationStep()
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert("AtlasAnomalyCritical");

        // Assert
        steps.Should().Contain(s => s.Kind == RunbookStepKind.Notification,
            "Critical anomalies should include notification step");
    }

    [Theory]
    [InlineData("SwarmSafeModeTriggered")]
    [InlineData("SwarmPolicyLoadHigh")]
    [Trait("Category", "StepKinds")]
    public void GetStepsForAlert_SwarmAlerts_HaveConfigCheckSteps(string alertName)
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert(alertName);

        // Assert
        steps.Should().Contain(s => s.Kind == RunbookStepKind.ConfigCheck,
            "Swarm alerts should include config review steps");
    }

    [Fact]
    [Trait("Category", "StepKinds")]
    public void GetStepsForAlert_CountyImbalance_HasInvestigationStep()
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert("SwarmActionsByCountyImbalance");

        // Assert
        steps.Should().Contain(s => s.Kind == RunbookStepKind.ManualInvestigation,
            "County imbalance should include manual investigation step");
    }

    // =========================================================================
    // SECTION E: Related Alert Names
    // =========================================================================

    [Theory]
    [InlineData("AtlasForecastStale")]
    [InlineData("AtlasOrchestratorStall")]
    [InlineData("SwarmSafeModeTriggered")]
    [Trait("Category", "RelatedAlerts")]
    public void GetStepsForAlert_AllSteps_ContainAlertInRelatedAlerts(string alertName)
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert(alertName);

        // Assert
        steps.Should().AllSatisfy(step =>
        {
            step.RelatedAlertNames.Should().Contain(alertName,
                "Each step should reference its source alert");
        });
    }

    // =========================================================================
    // SECTION F: Owner Role Appropriateness
    // =========================================================================

    [Theory]
    [InlineData("AtlasForecastStale")]
    [InlineData("AtlasOrchestratorStall")]
    [InlineData("SwarmSafeModeTriggered")]
    [InlineData("SwarmPolicyLoadHigh")]
    [Trait("Category", "OwnerRole")]
    public void GetStepsForAlert_AllSteps_HaveOwnerRole(string alertName)
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert(alertName);

        // Assert
        steps.Should().AllSatisfy(step =>
        {
            step.SuggestedOwnerRole.Should().NotBeNullOrWhiteSpace(
                $"Step '{step.Title}' must have an owner role");
        });
    }

    // =========================================================================
    // SECTION G: Step Uniqueness
    // =========================================================================

    [Theory]
    [InlineData("AtlasForecastStale")]
    [InlineData("AtlasOrchestratorStall")]
    [InlineData("SwarmSafeModeTriggered")]
    [Trait("Category", "Uniqueness")]
    public void GetStepsForAlert_AllSteps_HaveUniqueStepIds(string alertName)
    {
        // Act
        var steps = RunbookTemplates.GetStepsForAlert(alertName);

        // Assert
        var stepIds = steps.Select(s => s.StepId).ToList();
        stepIds.Should().OnlyHaveUniqueItems();
    }

    [Fact]
    [Trait("Category", "Uniqueness")]
    public void AllTemplates_HaveGloballyUniqueStepIds()
    {
        // Arrange
        var allStepIds = new List<string>();

        foreach (var alertName in RunbookTemplates.SupportedAlerts)
        {
            var steps = RunbookTemplates.GetStepsForAlert(alertName);
            allStepIds.AddRange(steps.Select(s => s.StepId));
        }

        // Assert - IDs should be unique across all templates
        allStepIds.Should().OnlyHaveUniqueItems(
            "Step IDs must be globally unique across all templates");
    }
}
