// =============================================================================
// Phase 39: Recommendation Templates - Unit Tests
// =============================================================================
// Tests for alert → recommendation mapping and template validation.
// =============================================================================

using Xunit;
using FluentAssertions;
using TerraFusion.Operations.Incidents;

namespace TerraFusion.Unit.Tests.Phase39;

/// <summary>
/// Unit tests for recommendation templates and alert mapping.
/// </summary>
[Trait("Category", "Phase39")]
[Trait("Category", "Unit")]
public class RecommendationTemplatesTests
{
    // =========================================================================
    // SECTION A: Atlas Alert Recommendations
    // =========================================================================

    [Theory]
    [InlineData("AtlasForecastStale")]
    [InlineData("AtlasForecastErrorRateHigh")]
    [InlineData("AtlasForecastDurationSpike")]
    [InlineData("AtlasOrchestratorStall")]
    [InlineData("AtlasAnomalySpike")]
    [InlineData("AtlasAnomalyCritical")]
    [InlineData("AtlasTelemetryDropRate")]
    [Trait("Category", "Atlas")]
    public void GetRecommendationsForAlert_AtlasAlert_ReturnsAtlasRecommendations(string alertName)
    {
        // Act
        var recommendations = RecommendationTemplates.GetRecommendationsForAlert(alertName);

        // Assert
        recommendations.Should().NotBeEmpty();
        recommendations.Should().Contain(r =>
            r.Category == RecommendationCategory.Atlas ||
            r.Category == RecommendationCategory.Recovery ||
            r.Category == RecommendationCategory.Monitoring);
    }

    [Fact]
    [Trait("Category", "Atlas")]
    public void GetRecommendationsForAlert_AtlasForecastStale_HasSpecificGuidance()
    {
        // Act
        var recommendations = RecommendationTemplates.GetRecommendationsForAlert("AtlasForecastStale");

        // Assert
        recommendations.Should().Contain(r =>
            r.Text.ContainsAny("forecast", "stale", "check", "service"));
    }

    [Fact]
    [Trait("Category", "Atlas")]
    public void GetRecommendationsForAlert_AtlasOrchestratorStall_HasRestartGuidance()
    {
        // Act
        var recommendations = RecommendationTemplates.GetRecommendationsForAlert("AtlasOrchestratorStall");

        // Assert
        recommendations.Should().Contain(r =>
            r.Text.ContainsAny("restart", "health", "pod", "service", "memory"));
    }

    // =========================================================================
    // SECTION B: Swarm Alert Recommendations
    // =========================================================================

    [Theory]
    [InlineData("SwarmActionSpike")]
    [InlineData("SwarmActionsByCountyImbalance")]
    [InlineData("SwarmCooldownActivation")]
    [InlineData("SwarmSafeModeTriggered")]
    [InlineData("SwarmPolicyLoadHigh")]
    [Trait("Category", "Swarm")]
    public void GetRecommendationsForAlert_SwarmAlert_ReturnsSwarmRecommendations(string alertName)
    {
        // Act
        var recommendations = RecommendationTemplates.GetRecommendationsForAlert(alertName);

        // Assert
        recommendations.Should().NotBeEmpty();
        recommendations.Should().Contain(r =>
            r.Category == RecommendationCategory.Swarm ||
            r.Category == RecommendationCategory.Guardrails ||
            r.Category == RecommendationCategory.Configuration);
    }

    [Fact]
    [Trait("Category", "Swarm")]
    public void GetRecommendationsForAlert_SwarmSafeModeTriggered_HasGuardrailGuidance()
    {
        // Act
        var recommendations = RecommendationTemplates.GetRecommendationsForAlert("SwarmSafeModeTriggered");

        // Assert
        recommendations.Should().Contain(r =>
            r.Text.ContainsAny("safe mode", "guardrail", "swarm", "disable") ||
            r.Category == RecommendationCategory.Guardrails);
    }

    [Fact]
    [Trait("Category", "Swarm")]
    public void GetRecommendationsForAlert_SwarmCooldownActivation_IsInformational()
    {
        // Cooldown is routine - recommendations should be monitoring-focused
        var recommendations = RecommendationTemplates.GetRecommendationsForAlert("SwarmCooldownActivation");

        recommendations.Should().NotBeEmpty();
        // Should not suggest urgent action
        recommendations.All(r =>
            !r.Text.Contains("immediate", StringComparison.OrdinalIgnoreCase) &&
            !r.Text.Contains("urgent", StringComparison.OrdinalIgnoreCase))
            .Should().BeTrue();
    }

    // =========================================================================
    // SECTION C: Unknown Alert Handling
    // =========================================================================

    [Fact]
    [Trait("Category", "Unknown")]
    public void GetRecommendationsForAlert_UnknownAlert_ReturnsGenericRecommendations()
    {
        // Act
        var recommendations = RecommendationTemplates.GetRecommendationsForAlert("UnknownAlertType");

        // Assert
        recommendations.Should().NotBeEmpty();
        recommendations.Should().Contain(r => r.Category == RecommendationCategory.Unknown);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [Trait("Category", "Unknown")]
    public void GetRecommendationsForAlert_EmptyAlertName_ReturnsGenericRecommendations(string alertName)
    {
        // Act
        var recommendations = RecommendationTemplates.GetRecommendationsForAlert(alertName);

        // Assert
        recommendations.Should().NotBeEmpty();
    }

    // =========================================================================
    // SECTION D: Recommendation Quality
    // =========================================================================

    [Fact]
    [Trait("Category", "Quality")]
    public void AllKnownAlerts_HaveActionableRecommendations()
    {
        // Arrange
        var knownAlerts = new[]
        {
            "AtlasForecastStale",
            "AtlasForecastErrorRateHigh",
            "AtlasForecastDurationSpike",
            "AtlasOrchestratorStall",
            "AtlasAnomalySpike",
            "AtlasAnomalyCritical",
            "AtlasTelemetryDropRate",
            "SwarmActionSpike",
            "SwarmActionsByCountyImbalance",
            "SwarmCooldownActivation",
            "SwarmSafeModeTriggered",
            "SwarmPolicyLoadHigh"
        };

        // Act & Assert
        foreach (var alertName in knownAlerts)
        {
            var recommendations = RecommendationTemplates.GetRecommendationsForAlert(alertName);
            recommendations.Should().NotBeEmpty($"Alert {alertName} should have recommendations");
            recommendations.Should().AllSatisfy(r =>
            {
                r.Text.Length.Should().BeGreaterThan(15,
                    $"Recommendation for {alertName} should have meaningful text");
            });
        }
    }

    [Fact]
    [Trait("Category", "Quality")]
    public void Recommendations_HaveValidPriorities()
    {
        // Arrange
        var alertName = "AtlasOrchestratorStall";

        // Act
        var recommendations = RecommendationTemplates.GetRecommendationsForAlert(alertName);

        // Assert
        recommendations.Should().AllSatisfy(r =>
        {
            r.Priority.Should().BeInRange(1, 10);
        });
    }

    [Fact]
    [Trait("Category", "Quality")]
    public void CriticalAlerts_HaveHighPriorityRecommendations()
    {
        // Critical alerts should have at least one high-priority recommendation
        var criticalAlerts = new[] { "AtlasOrchestratorStall", "SwarmSafeModeTriggered" };

        foreach (var alertName in criticalAlerts)
        {
            var recommendations = RecommendationTemplates.GetRecommendationsForAlert(alertName);
            recommendations.Should().Contain(r => r.Priority <= 3,
                $"Critical alert {alertName} should have high-priority recommendations");
        }
    }

    // =========================================================================
    // SECTION E: Category Distribution
    // =========================================================================

    [Fact]
    [Trait("Category", "Categories")]
    public void AllRecommendationCategories_AreUsed()
    {
        // Arrange
        var allAlerts = new[]
        {
            "AtlasForecastStale",
            "AtlasOrchestratorStall",
            "SwarmSafeModeTriggered",
            "SwarmActionSpike",
            "UnknownAlert"
        };

        // Act
        var allCategories = allAlerts
            .SelectMany(a => RecommendationTemplates.GetRecommendationsForAlert(a))
            .Select(r => r.Category)
            .Distinct()
            .ToList();

        // Assert - at least these categories should be used
        allCategories.Should().Contain(RecommendationCategory.Atlas);
        allCategories.Should().Contain(RecommendationCategory.Swarm);
        allCategories.Should().Contain(RecommendationCategory.Unknown);
    }

    // =========================================================================
    // SECTION F: Template Immutability
    // =========================================================================

    [Fact]
    [Trait("Category", "Immutability")]
    public void GetRecommendationsForAlert_ReturnsNewInstances()
    {
        // Templates should return new instances, not shared references
        var recommendations1 = RecommendationTemplates.GetRecommendationsForAlert("AtlasForecastStale");
        var recommendations2 = RecommendationTemplates.GetRecommendationsForAlert("AtlasForecastStale");

        // Should be equal content (excluding IDs which are unique per call)
        recommendations1.Should().BeEquivalentTo(
            recommendations2,
            options => options.Excluding(r => r.Id));

        // Should not be the same object references
        recommendations1.Should().NotBeSameAs(recommendations2);
    }

    [Fact]
    [Trait("Category", "Immutability")]
    public void GetRecommendationsForAlert_ReturnsUniqueIds()
    {
        // Each call should generate new unique IDs
        var recommendations1 = RecommendationTemplates.GetRecommendationsForAlert("AtlasForecastStale");
        var recommendations2 = RecommendationTemplates.GetRecommendationsForAlert("AtlasForecastStale");

        var ids1 = recommendations1.Select(r => r.Id).ToList();
        var ids2 = recommendations2.Select(r => r.Id).ToList();

        // IDs should not overlap between calls
        ids1.Intersect(ids2).Should().BeEmpty();
    }
}
