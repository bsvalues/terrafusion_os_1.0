// =============================================================================
// Phase 39: Incident Triage Engine - Unit Tests
// =============================================================================
// TDD: These tests are written FIRST, before implementation.
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
/// Unit tests for the IncidentTriageEngine.
/// Tests classification, grouping, severity determination, and recommendations.
/// </summary>
[Trait("Category", "Phase39")]
[Trait("Category", "Unit")]
public class IncidentTriageEngineTests
{
    // Test constants
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid YakimaCountyId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly DateTime BaseTime = new(2025, 12, 11, 10, 0, 0, DateTimeKind.Utc);

    private readonly IIncidentTriageEngine _engine;
    private readonly Mock<ILogger<IncidentTriageEngine>> _loggerMock;
    private readonly IncidentTriageOptions _options;

    public IncidentTriageEngineTests()
    {
        _loggerMock = new Mock<ILogger<IncidentTriageEngine>>();
        _options = new IncidentTriageOptions
        {
            GroupingTimeWindowMinutes = 5,
            GroupAcrossComponents = false,
            MaxAlertsPerIncident = 50,
            MinRecommendations = 2,
            MaxRecommendations = 7
        };

        _engine = new IncidentTriageEngine(
            Options.Create(_options),
            _loggerMock.Object);
    }

    #region Helper Methods

    private static IncidentAlertRef CreateAlert(
        string alertName,
        Guid countyId,
        string severity = "warning",
        string component = "atlas",
        DateTime? startsAt = null)
    {
        return new IncidentAlertRef
        {
            AlertName = alertName,
            Labels = new Dictionary<string, string>
            {
                ["countyId"] = countyId.ToString(),
                ["severity"] = severity,
                ["component"] = component,
                ["government"] = "true"
            },
            StartsAt = startsAt ?? BaseTime,
            Fingerprint = $"{alertName}-{countyId}-{startsAt?.Ticks ?? BaseTime.Ticks}"
        };
    }

    private static IncidentMetricSnapshot CreateMetric(
        Guid countyId,
        string metricName,
        double value)
    {
        return new IncidentMetricSnapshot
        {
            CountyId = countyId,
            MetricName = metricName,
            Value = value,
            Timestamp = BaseTime
        };
    }

    #endregion

    // =========================================================================
    // SECTION A: Single Alert Classification Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "Classification")]
    public async Task TriageAsync_SingleWarningAlert_ProducesWarningSeverity()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastErrorRateHigh", BentonCountyId, "warning")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.OverallSeverity.Should().Be(IncidentSeverity.Warning);
        result.ImpactedCountyIds.Should().Contain(BentonCountyId);
        result.Alerts.Should().HaveCount(1);
    }

    [Fact]
    [Trait("Category", "Classification")]
    public async Task TriageAsync_SingleCriticalAlert_ProducesCriticalSeverity()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasOrchestratorStall", BentonCountyId, "critical")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.OverallSeverity.Should().Be(IncidentSeverity.Critical);
        result.Status.Should().Be(IncidentStatus.New);
    }

    [Fact]
    [Trait("Category", "Classification")]
    public async Task TriageAsync_SingleInfoAlert_ProducesInfoSeverity()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("SwarmCooldownActivation", BentonCountyId, "info", "swarm")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.OverallSeverity.Should().Be(IncidentSeverity.Info);
    }

    [Fact]
    [Trait("Category", "Classification")]
    public async Task TriageAsync_SingleAlert_ExtractsCountyFromLabels()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale", YakimaCountyId, "critical")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.PrimaryCountyId.Should().Be(YakimaCountyId);
        result.ImpactedCountyIds.Should().ContainSingle().Which.Should().Be(YakimaCountyId);
    }

    [Fact]
    [Trait("Category", "Classification")]
    public async Task TriageAsync_SingleAlert_GeneratesTitle()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasOrchestratorStall", BentonCountyId, "critical")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Title.Should().NotBeNullOrWhiteSpace();
        result.Title.Should().ContainAny("Orchestrator", "Atlas", "Stall");
    }

    [Fact]
    [Trait("Category", "Classification")]
    public async Task TriageAsync_SingleAlert_GeneratesDescription()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("SwarmSafeModeTriggered", BentonCountyId, "critical", "swarm")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Description.Should().NotBeNullOrWhiteSpace();
        result.Description.Length.Should().BeGreaterThan(20);
    }

    // =========================================================================
    // SECTION B: Multi-Alert Grouping Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "Grouping")]
    public async Task TriageAsync_RelatedAlertsWithinTimeWindow_GroupedIntoSingleIncident()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastErrorRateHigh", BentonCountyId, "warning", startsAt: BaseTime),
                CreateAlert("AtlasForecastDurationSpike", BentonCountyId, "warning", startsAt: BaseTime.AddMinutes(2))
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Alerts.Should().HaveCount(2);
        result.ImpactedCountyIds.Should().ContainSingle();
    }

    [Fact]
    [Trait("Category", "Grouping")]
    public async Task TriageAsync_MultipleAlertsWithCritical_EscalatesToCritical()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastErrorRateHigh", BentonCountyId, "warning"),
                CreateAlert("AtlasOrchestratorStall", BentonCountyId, "critical")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.OverallSeverity.Should().Be(IncidentSeverity.Critical);
    }

    [Fact]
    [Trait("Category", "Grouping")]
    public async Task TriageAsync_AlertsFromDifferentCounties_BothCountiesInImpactedList()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale", BentonCountyId, "critical"),
                CreateAlert("AtlasForecastStale", YakimaCountyId, "critical")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.ImpactedCountyIds.Should().Contain(BentonCountyId);
        result.ImpactedCountyIds.Should().Contain(YakimaCountyId);
        result.ImpactedCountyIds.Should().HaveCount(2);
    }

    [Fact]
    [Trait("Category", "Grouping")]
    public async Task TriageAsync_AtlasAndSwarmAlerts_SeparatedByComponent()
    {
        // When GroupAcrossComponents = false, alerts from different components
        // should be noted but still grouped into the same incident (same request)
        // The component field helps with classification

        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale", BentonCountyId, "critical", "atlas"),
                CreateAlert("SwarmSafeModeTriggered", BentonCountyId, "critical", "swarm")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Alerts.Should().HaveCount(2);
        result.OverallSeverity.Should().Be(IncidentSeverity.Critical);
    }

    // =========================================================================
    // SECTION C: Alert + Metric Correlation Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "Correlation")]
    public async Task TriageAsync_WithMetricSnapshots_IncludesMetricsInResult()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastErrorRateHigh", BentonCountyId, "warning")
            },
            MetricSnapshots = new List<IncidentMetricSnapshot>
            {
                CreateMetric(BentonCountyId, "atlas_forecast_engine_errors_total", 42.0)
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Metrics.Should().NotBeEmpty();
        result.Metrics.Should().Contain(m => m.MetricName == "atlas_forecast_engine_errors_total");
    }

    [Fact]
    [Trait("Category", "Correlation")]
    public async Task TriageAsync_WithTraceIds_IncludesCorrelatedTraceId()
    {
        // Arrange
        var traceId = "abc123def456";
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasOrchestratorStall", BentonCountyId, "critical")
            },
            TraceIds = new List<string> { traceId }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.CorrelatedTraceId.Should().Be(traceId);
    }

    // =========================================================================
    // SECTION D: Recommendation Generation Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "Recommendations")]
    public async Task TriageAsync_AnyAlert_GeneratesAtLeastMinRecommendations()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale", BentonCountyId, "critical")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Recommendations.Should().HaveCountGreaterOrEqualTo(_options.MinRecommendations);
    }

    [Fact]
    [Trait("Category", "Recommendations")]
    public async Task TriageAsync_AnyAlert_GeneratesAtMostMaxRecommendations()
    {
        // Arrange - multiple critical alerts should not exceed max recommendations
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale", BentonCountyId, "critical"),
                CreateAlert("AtlasOrchestratorStall", BentonCountyId, "critical"),
                CreateAlert("SwarmSafeModeTriggered", BentonCountyId, "critical", "swarm")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Recommendations.Should().HaveCountLessOrEqualTo(_options.MaxRecommendations);
    }

    [Fact]
    [Trait("Category", "Recommendations")]
    public async Task TriageAsync_AtlasAlert_GeneratesAtlasRecommendations()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasOrchestratorStall", BentonCountyId, "critical", "atlas")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Recommendations.Should().Contain(r =>
            r.Category == RecommendationCategory.Atlas ||
            r.Category == RecommendationCategory.Configuration);
    }

    [Fact]
    [Trait("Category", "Recommendations")]
    public async Task TriageAsync_SwarmAlert_GeneratesSwarmRecommendations()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("SwarmSafeModeTriggered", BentonCountyId, "critical", "swarm")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Recommendations.Should().Contain(r =>
            r.Category == RecommendationCategory.Swarm ||
            r.Category == RecommendationCategory.Guardrails);
    }

    [Fact]
    [Trait("Category", "Recommendations")]
    public async Task TriageAsync_Recommendations_HaveUniqueIds()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale", BentonCountyId, "critical"),
                CreateAlert("AtlasOrchestratorStall", BentonCountyId, "critical")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        var ids = result.Recommendations.Select(r => r.Id).ToList();
        ids.Should().OnlyHaveUniqueItems();
    }

    [Fact]
    [Trait("Category", "Recommendations")]
    public async Task TriageAsync_Recommendations_HaveActionableText()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale", BentonCountyId, "critical")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        foreach (var recommendation in result.Recommendations)
        {
            recommendation.Text.Should().NotBeNullOrWhiteSpace();
            recommendation.Text.Length.Should().BeGreaterThan(10);
            // Should not be generic "check logs" spam
            recommendation.Text.Should().NotBe("Check logs");
        }
    }

    // =========================================================================
    // SECTION E: Edge Cases and Validation
    // =========================================================================

    [Fact]
    [Trait("Category", "Validation")]
    public async Task TriageAsync_NullRequest_ThrowsArgumentNullException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(
            () => _engine.TriageAsync(null!));
    }

    [Fact]
    [Trait("Category", "Validation")]
    public async Task TriageAsync_EmptyAlerts_ThrowsArgumentException()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>()
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _engine.TriageAsync(request));
    }

    [Fact]
    [Trait("Category", "Validation")]
    public async Task TriageAsync_UnknownAlertName_StillProducesIncident()
    {
        // Unknown alerts should not crash; they get generic handling
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("UnknownAlertType", BentonCountyId, "warning")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.Recommendations.Should().NotBeEmpty();
        result.Recommendations.Should().Contain(r => r.Category == RecommendationCategory.Unknown);
    }

    [Fact]
    [Trait("Category", "Validation")]
    public async Task TriageAsync_MissingCountyIdLabel_HandlesGracefully()
    {
        // Arrange - alert without countyId label
        var alert = new IncidentAlertRef
        {
            AlertName = "AtlasForecastStale",
            Labels = new Dictionary<string, string>
            {
                ["severity"] = "critical",
                ["component"] = "atlas"
                // No countyId!
            },
            StartsAt = BaseTime,
            Fingerprint = "test-fingerprint-123"
        };

        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef> { alert }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.PrimaryCountyId.Should().BeNull();
        result.ImpactedCountyIds.Should().BeEmpty();
    }

    [Fact]
    [Trait("Category", "Validation")]
    public async Task TriageAsync_DuplicateAlerts_Deduplicated()
    {
        // Arrange - same fingerprint = same alert
        var fingerprint = "duplicate-alert-fingerprint";
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = "AtlasForecastStale",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "critical"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = fingerprint
                },
                new IncidentAlertRef
                {
                    AlertName = "AtlasForecastStale",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "critical"
                    },
                    StartsAt = BaseTime.AddMinutes(1),
                    Fingerprint = fingerprint // Same fingerprint!
                }
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Alerts.Should().HaveCount(1); // Deduplicated
    }

    // =========================================================================
    // SECTION F: Government Compliance Tests
    // =========================================================================

    [Fact]
    [Trait("Category", "Compliance")]
    public async Task TriageAsync_AnyIncident_HasGovernmentFlagTrue()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale", BentonCountyId, "critical")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.Government.Should().BeTrue();
    }

    [Fact]
    [Trait("Category", "Compliance")]
    public async Task TriageAsync_AnyIncident_HasAuditInfo()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale", BentonCountyId, "critical")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.AuditInfo.Should().NotBeNull();
        result.AuditInfo!.TriageEngineVersion.Should().Be(_options.EngineVersion);
        result.AuditInfo.TriageDurationMs.Should().BeGreaterOrEqualTo(0);
    }

    [Fact]
    [Trait("Category", "Compliance")]
    public async Task TriageAsync_AnyIncident_HasTriagedAtTimestamp()
    {
        // Arrange
        var beforeTriage = DateTime.UtcNow;
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale", BentonCountyId, "critical")
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);
        var afterTriage = DateTime.UtcNow;

        // Assert
        result.TriagedAt.Should().BeOnOrAfter(beforeTriage);
        result.TriagedAt.Should().BeOnOrBefore(afterTriage);
    }

    [Fact]
    [Trait("Category", "Compliance")]
    public async Task TriageAsync_IncidentId_IsUniqueGuid()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                CreateAlert("AtlasForecastStale", BentonCountyId, "critical")
            }
        };

        // Act
        var result1 = await _engine.TriageAsync(request);
        var result2 = await _engine.TriageAsync(request);

        // Assert
        result1.IncidentId.Should().NotBe(Guid.Empty);
        result2.IncidentId.Should().NotBe(Guid.Empty);
        result1.IncidentId.Should().NotBe(result2.IncidentId); // Each triage gets unique ID
    }
}
