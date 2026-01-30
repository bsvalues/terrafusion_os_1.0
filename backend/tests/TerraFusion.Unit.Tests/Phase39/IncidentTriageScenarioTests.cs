// =============================================================================
// Phase 39: Incident Triage Scenario Tests
// =============================================================================
// Real-world government incident scenarios from Phase 38 alert rules.
// Tests the "forecast cascade", "orchestrator stall", "safe mode" patterns.
// =============================================================================

using Xunit;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.Operations.Incidents;

namespace TerraFusion.Unit.Tests.Phase39;

/// <summary>
/// Scenario-based tests for government incident patterns.
/// Each scenario represents a realistic production situation.
/// </summary>
[Trait("Category", "Phase39")]
[Trait("Category", "Scenarios")]
public class IncidentTriageScenarioTests
{
    // Test constants - Washington State counties
    private static readonly Guid BentonCountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid YakimaCountyId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid KingCountyId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly DateTime BaseTime = new(2025, 12, 11, 10, 0, 0, DateTimeKind.Utc);

    private readonly IIncidentTriageEngine _engine;

    public IncidentTriageScenarioTests()
    {
        var loggerMock = new Mock<ILogger<IncidentTriageEngine>>();
        var options = new IncidentTriageOptions
        {
            GroupingTimeWindowMinutes = 5,
            GroupAcrossComponents = false,
            MaxAlertsPerIncident = 50,
            MinRecommendations = 2,
            MaxRecommendations = 7
        };

        _engine = new IncidentTriageEngine(
            Options.Create(options),
            loggerMock.Object);
    }

    // =========================================================================
    // SCENARIO 1: Forecast Cascade Failure
    // =========================================================================
    // Pattern: Forecast errors → Duration spikes → Stale forecasts
    // Expected: Single Critical incident with cascade-aware recommendations

    [Fact]
    [Trait("Scenario", "ForecastCascade")]
    public async Task Scenario_ForecastCascade_ProducesCorrectIncident()
    {
        // Arrange - cascade of forecast-related alerts in sequence
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = "AtlasForecastErrorRateHigh",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "warning",
                        ["component"] = "atlas"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = "fp-error-rate"
                },
                new IncidentAlertRef
                {
                    AlertName = "AtlasForecastDurationSpike",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "warning",
                        ["component"] = "atlas"
                    },
                    StartsAt = BaseTime.AddMinutes(2),
                    Fingerprint = "fp-duration-spike"
                },
                new IncidentAlertRef
                {
                    AlertName = "AtlasForecastStale",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "critical",
                        ["component"] = "atlas"
                    },
                    StartsAt = BaseTime.AddMinutes(4),
                    Fingerprint = "fp-stale"
                }
            },
            MetricSnapshots = new List<IncidentMetricSnapshot>
            {
                new IncidentMetricSnapshot
                {
                    CountyId = BentonCountyId,
                    MetricName = "atlas_forecast_engine_errors_total",
                    Value = 47.0,
                    Timestamp = BaseTime
                },
                new IncidentMetricSnapshot
                {
                    CountyId = BentonCountyId,
                    MetricName = "atlas_forecast_engine_duration_seconds",
                    Value = 45.2, // Way above 10s threshold
                    Timestamp = BaseTime.AddMinutes(2)
                }
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.OverallSeverity.Should().Be(IncidentSeverity.Critical);
        result.Title.Should().ContainAny("Forecast", "Atlas", "Cascade");
        result.ImpactedCountyIds.Should().ContainSingle().Which.Should().Be(BentonCountyId);
        result.Alerts.Should().HaveCount(3);

        // Recommendations should address the cascade
        result.Recommendations.Should().Contain(r =>
            r.Text.ContainsAny("forecast", "error", "duration") ||
            r.Category == RecommendationCategory.Atlas);
    }

    // =========================================================================
    // SCENARIO 2: Orchestrator Stall
    // =========================================================================
    // Pattern: AtlasOrchestratorStall (critical) - single severe alert
    // Expected: Immediate critical incident with restart recommendations

    [Fact]
    [Trait("Scenario", "OrchestratorStall")]
    public async Task Scenario_OrchestratorStall_ProducesCriticalIncident()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
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
                    Fingerprint = "fp-orchestrator-stall"
                }
            },
            MetricSnapshots = new List<IncidentMetricSnapshot>
            {
                new IncidentMetricSnapshot
                {
                    CountyId = BentonCountyId,
                    MetricName = "atlas_orchestrator_runs_total",
                    Value = 0, // No runs in last interval
                    Timestamp = BaseTime
                }
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.OverallSeverity.Should().Be(IncidentSeverity.Critical);
        result.Title.Should().ContainAny("Orchestrator", "Stall", "Atlas");
        result.Description.Should().NotBeNullOrWhiteSpace();

        // Should recommend restart/recovery actions
        result.Recommendations.Should().Contain(r =>
            r.Text.ContainsAny("restart", "check", "health", "pod", "service") ||
            r.Category == RecommendationCategory.Recovery);
    }

    // =========================================================================
    // SCENARIO 3: Swarm Safe Mode Triggered
    // =========================================================================
    // Pattern: Action spike → Safe mode triggered
    // Expected: Critical incident with guardrails investigation

    [Fact]
    [Trait("Scenario", "SafeMode")]
    public async Task Scenario_SwarmSafeMode_ProducesGuardrailsIncident()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = "SwarmActionSpike",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "warning",
                        ["component"] = "swarm"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = "fp-action-spike"
                },
                new IncidentAlertRef
                {
                    AlertName = "SwarmSafeModeTriggered",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "critical",
                        ["component"] = "swarm"
                    },
                    StartsAt = BaseTime.AddMinutes(1),
                    Fingerprint = "fp-safe-mode"
                }
            },
            MetricSnapshots = new List<IncidentMetricSnapshot>
            {
                new IncidentMetricSnapshot
                {
                    CountyId = BentonCountyId,
                    MetricName = "swarm_actions_total",
                    Value = 1500, // Spiked above threshold
                    Timestamp = BaseTime
                },
                new IncidentMetricSnapshot
                {
                    CountyId = BentonCountyId,
                    MetricName = "swarm_safe_mode_active",
                    Value = 1, // Safe mode engaged
                    Timestamp = BaseTime.AddMinutes(1)
                }
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.OverallSeverity.Should().Be(IncidentSeverity.Critical);
        result.Alerts.Should().HaveCount(2);

        // Should have swarm and guardrails recommendations
        result.Recommendations.Should().Contain(r =>
            r.Category == RecommendationCategory.Swarm ||
            r.Category == RecommendationCategory.Guardrails);

        // Description should mention the swarm system (case-insensitive check)
        result.Description.ToLowerInvariant().Should().ContainAny(
            "safe mode", "guardrail", "swarm", "action", "alert");
    }

    // =========================================================================
    // SCENARIO 4: Multi-County Anomaly Detection
    // =========================================================================
    // Pattern: Anomaly alerts from multiple counties simultaneously
    // Expected: Incident with all counties listed, cross-county investigation

    [Fact]
    [Trait("Scenario", "MultiCountyAnomaly")]
    public async Task Scenario_MultiCountyAnomaly_ListsAllImpactedCounties()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = "AtlasAnomalySpike",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "warning",
                        ["component"] = "atlas"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = "fp-anomaly-benton"
                },
                new IncidentAlertRef
                {
                    AlertName = "AtlasAnomalySpike",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = YakimaCountyId.ToString(),
                        ["severity"] = "warning",
                        ["component"] = "atlas"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = "fp-anomaly-yakima"
                },
                new IncidentAlertRef
                {
                    AlertName = "AtlasAnomalyCritical",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = KingCountyId.ToString(),
                        ["severity"] = "critical",
                        ["component"] = "atlas"
                    },
                    StartsAt = BaseTime.AddMinutes(1),
                    Fingerprint = "fp-anomaly-king"
                }
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.OverallSeverity.Should().Be(IncidentSeverity.Critical);
        result.ImpactedCountyIds.Should().HaveCount(3);
        result.ImpactedCountyIds.Should().Contain(BentonCountyId);
        result.ImpactedCountyIds.Should().Contain(YakimaCountyId);
        result.ImpactedCountyIds.Should().Contain(KingCountyId);

        // Title should indicate multi-county impact
        result.Title.Should().ContainAny("Anomaly", "Multi", "Counties", "Atlas");
    }

    // =========================================================================
    // SCENARIO 5: Telemetry Drop
    // =========================================================================
    // Pattern: Telemetry ingest drops, leading to observability blind spot
    // Expected: Warning incident with monitoring recommendations

    [Fact]
    [Trait("Scenario", "TelemetryDrop")]
    public async Task Scenario_TelemetryDrop_ProducesMonitoringIncident()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = "AtlasTelemetryDropRate",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "warning",
                        ["component"] = "atlas"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = "fp-telemetry-drop"
                }
            },
            MetricSnapshots = new List<IncidentMetricSnapshot>
            {
                new IncidentMetricSnapshot
                {
                    CountyId = BentonCountyId,
                    MetricName = "atlas_telemetry_ingest_total",
                    Value = 50, // Dropped from 500+
                    Timestamp = BaseTime
                }
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.OverallSeverity.Should().Be(IncidentSeverity.Warning);
        result.Title.Should().ContainAny("Telemetry", "Drop", "Atlas");

        // Should recommend checking telemetry pipeline
        result.Recommendations.Should().Contain(r =>
            r.Text.ContainsAny("telemetry", "ingest", "pipeline", "data") ||
            r.Category == RecommendationCategory.Monitoring);
    }

    // =========================================================================
    // SCENARIO 6: Cooldown Activation (Info - Routine)
    // =========================================================================
    // Pattern: Routine cooldown activation after heavy processing
    // Expected: Info severity, no urgent action needed

    [Fact]
    [Trait("Scenario", "CooldownRoutine")]
    public async Task Scenario_CooldownRoutine_ProducesInfoIncident()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = "SwarmCooldownActivation",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "info",
                        ["component"] = "swarm"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = "fp-cooldown"
                }
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.OverallSeverity.Should().Be(IncidentSeverity.Info);
        result.Status.Should().Be(IncidentStatus.New);

        // Info incidents should still have recommendations (monitoring, etc.)
        result.Recommendations.Should().NotBeEmpty();
    }

    // =========================================================================
    // SCENARIO 7: County Load Imbalance
    // =========================================================================
    // Pattern: Swarm actions heavily skewed to one county
    // Expected: Warning with load balancing recommendations

    [Fact]
    [Trait("Scenario", "CountyImbalance")]
    public async Task Scenario_CountyLoadImbalance_ProducesLoadBalancingIncident()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                new IncidentAlertRef
                {
                    AlertName = "SwarmActionsByCountyImbalance",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = KingCountyId.ToString(),
                        ["severity"] = "warning",
                        ["component"] = "swarm"
                    },
                    StartsAt = BaseTime,
                    Fingerprint = "fp-imbalance"
                }
            },
            MetricSnapshots = new List<IncidentMetricSnapshot>
            {
                new IncidentMetricSnapshot
                {
                    CountyId = KingCountyId,
                    MetricName = "swarm_actions_by_county",
                    Value = 950, // 95% of actions
                    Timestamp = BaseTime
                },
                new IncidentMetricSnapshot
                {
                    CountyId = BentonCountyId,
                    MetricName = "swarm_actions_by_county",
                    Value = 25, // 2.5%
                    Timestamp = BaseTime
                },
                new IncidentMetricSnapshot
                {
                    CountyId = YakimaCountyId,
                    MetricName = "swarm_actions_by_county",
                    Value = 25, // 2.5%
                    Timestamp = BaseTime
                }
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.OverallSeverity.Should().Be(IncidentSeverity.Warning);
        result.PrimaryCountyId.Should().Be(KingCountyId);

        // Should recommend load balancing investigation
        result.Recommendations.Should().Contain(r =>
            r.Text.ContainsAny("load", "balance", "distribution", "county") ||
            r.Category == RecommendationCategory.Configuration);
    }

    // =========================================================================
    // SCENARIO 8: Combined Atlas + Swarm Failure (Worst Case)
    // =========================================================================
    // Pattern: Both systems failing simultaneously
    // Expected: Critical, comprehensive recommendations for both systems

    [Fact]
    [Trait("Scenario", "CombinedFailure")]
    public async Task Scenario_CombinedAtlasSwarmFailure_ProducesComprehensiveIncident()
    {
        // Arrange
        var request = new IncidentTriageRequest
        {
            Alerts = new List<IncidentAlertRef>
            {
                // Atlas failures
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
                    Fingerprint = "fp-atlas-stall"
                },
                new IncidentAlertRef
                {
                    AlertName = "AtlasForecastStale",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "critical",
                        ["component"] = "atlas"
                    },
                    StartsAt = BaseTime.AddMinutes(1),
                    Fingerprint = "fp-atlas-stale"
                },
                // Swarm failures
                new IncidentAlertRef
                {
                    AlertName = "SwarmSafeModeTriggered",
                    Labels = new Dictionary<string, string>
                    {
                        ["countyId"] = BentonCountyId.ToString(),
                        ["severity"] = "critical",
                        ["component"] = "swarm"
                    },
                    StartsAt = BaseTime.AddMinutes(2),
                    Fingerprint = "fp-swarm-safe"
                }
            }
        };

        // Act
        var result = await _engine.TriageAsync(request);

        // Assert
        result.OverallSeverity.Should().Be(IncidentSeverity.Critical);
        result.Alerts.Should().HaveCount(3);

        // Should have recommendations for both Atlas AND Swarm
        var categories = result.Recommendations.Select(r => r.Category).Distinct().ToList();
        categories.Should().Contain(r =>
            r == RecommendationCategory.Atlas ||
            r == RecommendationCategory.Swarm ||
            r == RecommendationCategory.Recovery);
    }
}

// =============================================================================
// Extension method for test assertions
// =============================================================================
internal static class StringExtensions
{
    public static bool ContainsAny(this string source, params string[] values)
    {
        if (string.IsNullOrEmpty(source)) return false;
        return values.Any(v => source.Contains(v, StringComparison.OrdinalIgnoreCase));
    }
}
