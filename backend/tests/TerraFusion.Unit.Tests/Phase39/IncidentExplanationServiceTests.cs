// =============================================================================
// Phase 39: Incident Explanation Service - Unit Tests
// =============================================================================
// Tests for the LLM-as-explainer pattern with strict immutability constraints.
// TRIAGE SPEC LOCK v1.0.0
// =============================================================================

using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.Operations.Incidents;

namespace TerraFusion.Unit.Tests.Phase39;

/// <summary>
/// Unit tests for the IIncidentExplanationService implementations.
/// Tests LLM immutability constraints and explanation quality.
/// </summary>
[Trait("Category", "Phase39")]
[Trait("Category", "Unit")]
public class IncidentExplanationServiceTests
{
    // Test constants
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid TestIncidentId = Guid.Parse("99999999-9999-9999-9999-999999999999");
    private static readonly DateTime BaseTime = new(2025, 12, 11, 10, 0, 0, DateTimeKind.Utc);

    // =========================================================================
    // SECTION A: NullIncidentExplanationService Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "NullService")]
    public async Task NullService_GenerateExplanationAsync_ReturnsNull()
    {
        // Arrange
        var service = new NullIncidentExplanationService();
        var summary = CreateTestSummary();
        var options = new IncidentExplanationOptions();

        // Act
        var result = await service.GenerateExplanationAsync(summary, options);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    [Trait("Category", "NullService")]
    public async Task NullService_EnrichWithExplanationAsync_ReturnsSameIncident()
    {
        // Arrange
        var service = new NullIncidentExplanationService();
        var summary = CreateTestSummary();
        var options = new IncidentExplanationOptions();

        // Act
        var result = await service.EnrichWithExplanationAsync(summary, options);

        // Assert
        result.Should().Be(summary);
    }

    [Fact]
    [Trait("Category", "NullService")]
    public async Task NullService_IsAvailableAsync_ReturnsFalse()
    {
        // Arrange
        var service = new NullIncidentExplanationService();

        // Act
        var result = await service.IsAvailableAsync();

        // Assert
        result.Should().BeFalse();
    }

    // =========================================================================
    // SECTION B: Immutability Constraint Tests (for any implementation)
    // =========================================================================

    [Fact]
    [Trait("Category", "Immutability")]
    public async Task AnyExplanationService_CannotModifyIncidentId()
    {
        // This test validates the pattern - actual LLM service would be mocked
        var service = new NullIncidentExplanationService();
        var summary = CreateTestSummary();
        var originalId = summary.IncidentId;
        var options = new IncidentExplanationOptions();

        // Act
        var result = await service.EnrichWithExplanationAsync(summary, options);

        // Assert
        result.IncidentId.Should().Be(originalId);
    }

    [Fact]
    [Trait("Category", "Immutability")]
    public async Task AnyExplanationService_CannotModifySeverity()
    {
        var service = new NullIncidentExplanationService();
        var summary = CreateTestSummary();
        var originalSeverity = summary.OverallSeverity;
        var options = new IncidentExplanationOptions();

        // Act
        var result = await service.EnrichWithExplanationAsync(summary, options);

        // Assert
        result.OverallSeverity.Should().Be(originalSeverity);
    }

    [Fact]
    [Trait("Category", "Immutability")]
    public async Task AnyExplanationService_CannotModifyImpactedCountyIds()
    {
        var service = new NullIncidentExplanationService();
        var summary = CreateTestSummary();
        var originalCountyIds = summary.ImpactedCountyIds.ToList();
        var options = new IncidentExplanationOptions();

        // Act
        var result = await service.EnrichWithExplanationAsync(summary, options);

        // Assert
        result.ImpactedCountyIds.Should().BeEquivalentTo(originalCountyIds);
    }

    [Fact]
    [Trait("Category", "Immutability")]
    public async Task AnyExplanationService_CannotModifyAlerts()
    {
        var service = new NullIncidentExplanationService();
        var summary = CreateTestSummary();
        var originalAlertCount = summary.Alerts.Count;
        var originalAlertNames = summary.Alerts.Select(a => a.AlertName).ToList();
        var options = new IncidentExplanationOptions();

        // Act
        var result = await service.EnrichWithExplanationAsync(summary, options);

        // Assert
        result.Alerts.Should().HaveCount(originalAlertCount);
        result.Alerts.Select(a => a.AlertName).Should().BeEquivalentTo(originalAlertNames);
    }

    [Fact]
    [Trait("Category", "Immutability")]
    public async Task AnyExplanationService_CannotModifyMetrics()
    {
        var service = new NullIncidentExplanationService();
        var summary = CreateTestSummary();
        var originalMetricCount = summary.Metrics.Count;
        var options = new IncidentExplanationOptions();

        // Act
        var result = await service.EnrichWithExplanationAsync(summary, options);

        // Assert
        result.Metrics.Should().HaveCount(originalMetricCount);
    }

    // =========================================================================
    // SECTION C: Explanation Options Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "Options")]
    public void ExplanationOptions_DefaultValues_AreReasonable()
    {
        // Act
        var options = new IncidentExplanationOptions();

        // Assert
        options.MaxTokens.Should().BeGreaterThan(100);
        options.MaxTokens.Should().BeLessThanOrEqualTo(4096);
        options.Temperature.Should().BeInRange(0.0, 1.0);
        options.Enabled.Should().BeTrue();
    }

    [Fact]
    [Trait("Category", "Options")]
    public void ExplanationOptions_AudienceHint_DefaultsToCountyIT()
    {
        // Act
        var options = new IncidentExplanationOptions();

        // Assert
        options.AudienceHint.Should().NotBeNullOrWhiteSpace();
        options.AudienceHint.Should().Contain("county");
    }

    [Fact]
    [Trait("Category", "Options")]
    public void ExplanationOptions_CanDisable()
    {
        // Arrange
        var options = new IncidentExplanationOptions
        {
            Enabled = false
        };

        // Assert
        options.Enabled.Should().BeFalse();
    }

    // =========================================================================
    // SECTION D: Service Registration Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "Registration")]
    public void NullService_CanBeInstantiated_WithoutDependencies()
    {
        // NullIncidentExplanationService should have no dependencies
        var service = new NullIncidentExplanationService();

        service.Should().NotBeNull();
        service.Should().BeAssignableTo<IIncidentExplanationService>();
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private static IncidentSummary CreateTestSummary()
    {
        return new IncidentSummary
        {
            IncidentId = TestIncidentId,
            Title = "Atlas Orchestrator Stall",
            Description = "The Atlas orchestrator has stopped processing forecasts.",
            OverallSeverity = IncidentSeverity.Critical,
            Status = IncidentStatus.New,
            PrimaryCountyId = BentonCountyId,
            ImpactedCountyIds = new List<Guid> { BentonCountyId },
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = "AtlasOrchestratorStall",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "critical",
                        ["component"] = "atlas"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = "test-fingerprint"
                }
            },
            Metrics = new List<IncidentMetricSnapshot>
            {
                new IncidentMetricSnapshot
                {
                    CountyId = BentonCountyId,
                    MetricName = "atlas_orchestrator_runs_total",
                    Value = 0,
                    Timestamp = BaseTime
                }
            },
            Recommendations = new List<IncidentRecommendation>
            {
                new IncidentRecommendation
                {
                    Id = "REC-000001",
                    Text = "Check Atlas service health",
                    Category = RecommendationCategory.Atlas,
                    Confidence = ConfidenceLevel.High,
                    Priority = 1
                }
            },
            Government = true,
            TriagedAt = BaseTime,
            AuditInfo = new IncidentAuditInfo
            {
                TriageEngineVersion = "1.0.0",
                TriageDurationMs = 42
            }
        };
    }
}
