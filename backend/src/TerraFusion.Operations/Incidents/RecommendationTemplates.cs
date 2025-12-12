// =============================================================================
// Phase 39: Incident Triage Engine - Recommendation Templates
// =============================================================================
// TRIAGE SPEC LOCK v1.0.0
// Static templates for alert → recommendation mapping.
// =============================================================================

namespace TerraFusion.Operations.Incidents;

/// <summary>
/// Static class providing recommendation templates for known alert types.
/// Maps Phase 38 alerts to actionable recommendations.
/// </summary>
public static class RecommendationTemplates
{
    private static int _recommendationCounter = 0;

    private static string GenerateId() => $"REC-{Interlocked.Increment(ref _recommendationCounter):D6}";

    /// <summary>
    /// Gets recommendations for a specific alert name.
    /// Returns generic recommendations for unknown alerts.
    /// </summary>
    /// <param name="alertName">The Prometheus alert name.</param>
    /// <returns>List of recommendations with unique IDs.</returns>
    public static List<IncidentRecommendation> GetRecommendationsForAlert(string alertName)
    {
        if (string.IsNullOrWhiteSpace(alertName))
        {
            return GetGenericRecommendations();
        }

        return alertName switch
        {
            // Atlas Forecast Alerts
            "AtlasForecastStale" => GetAtlasForecastStaleRecommendations(),
            "AtlasForecastErrorRateHigh" => GetAtlasForecastErrorRecommendations(),
            "AtlasForecastDurationSpike" => GetAtlasForecastDurationRecommendations(),

            // Atlas Orchestrator Alerts
            "AtlasOrchestratorStall" => GetAtlasOrchestratorStallRecommendations(),

            // Atlas Anomaly Alerts
            "AtlasAnomalySpike" => GetAtlasAnomalySpikeRecommendations(),
            "AtlasAnomalyCritical" => GetAtlasAnomalyCriticalRecommendations(),

            // Atlas Telemetry Alerts
            "AtlasTelemetryDropRate" => GetAtlasTelemetryDropRecommendations(),

            // Swarm Action Alerts
            "SwarmActionSpike" => GetSwarmActionSpikeRecommendations(),
            "SwarmActionsByCountyImbalance" => GetSwarmCountyImbalanceRecommendations(),
            "SwarmCooldownActivation" => GetSwarmCooldownRecommendations(),
            "SwarmSafeModeTriggered" => GetSwarmSafeModeRecommendations(),
            "SwarmPolicyLoadHigh" => GetSwarmPolicyLoadRecommendations(),

            // Unknown alerts get generic recommendations
            _ => GetGenericRecommendations()
        };
    }

    // =========================================================================
    // Atlas Forecast Recommendations
    // =========================================================================

    private static List<IncidentRecommendation> GetAtlasForecastStaleRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "Check Atlas Forecast Engine service health in the Grafana Atlas dashboard",
                Category = RecommendationCategory.Atlas,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Verify forecast engine has recent successful runs via atlas_forecast_engine_runs_total metric",
                Category = RecommendationCategory.Monitoring,
                Confidence = ConfidenceLevel.High,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "Review Atlas service logs for errors or stalls preventing forecast generation",
                Category = RecommendationCategory.Recovery,
                Confidence = ConfidenceLevel.Medium,
                Priority = 3
            },
            new()
            {
                Id = GenerateId(),
                Text = "If stale for >15 minutes, consider restarting the Atlas Forecast service pod",
                Category = RecommendationCategory.Recovery,
                Confidence = ConfidenceLevel.Medium,
                Priority = 4
            }
        };
    }

    private static List<IncidentRecommendation> GetAtlasForecastErrorRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "Review Atlas forecast error logs for specific failure reasons",
                Category = RecommendationCategory.Atlas,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Check telemetry data quality - errors may indicate bad input data",
                Category = RecommendationCategory.Monitoring,
                Confidence = ConfidenceLevel.Medium,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "Verify county data connections are healthy (Harris PACS sync status)",
                Category = RecommendationCategory.Configuration,
                Confidence = ConfidenceLevel.Medium,
                Priority = 3
            }
        };
    }

    private static List<IncidentRecommendation> GetAtlasForecastDurationRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "Check system resource utilization (CPU, memory) on Atlas host",
                Category = RecommendationCategory.Atlas,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Review recent data volume changes that may increase processing time",
                Category = RecommendationCategory.Monitoring,
                Confidence = ConfidenceLevel.Medium,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "Verify no concurrent heavy workloads are competing for resources",
                Category = RecommendationCategory.Configuration,
                Confidence = ConfidenceLevel.Medium,
                Priority = 3
            }
        };
    }

    // =========================================================================
    // Atlas Orchestrator Recommendations
    // =========================================================================

    private static List<IncidentRecommendation> GetAtlasOrchestratorStallRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "CRITICAL: Check Atlas Orchestrator pod health and restart if necessary",
                Category = RecommendationCategory.Recovery,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Review orchestrator memory usage - stalls often indicate memory pressure",
                Category = RecommendationCategory.Atlas,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Check for deadlocks in orchestration queue via service logs",
                Category = RecommendationCategory.Atlas,
                Confidence = ConfidenceLevel.Medium,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "Verify database connectivity for orchestrator state persistence",
                Category = RecommendationCategory.Recovery,
                Confidence = ConfidenceLevel.Medium,
                Priority = 3
            },
            new()
            {
                Id = GenerateId(),
                Text = "If restart fails, escalate to on-call engineering team",
                Category = RecommendationCategory.Recovery,
                Confidence = ConfidenceLevel.High,
                Priority = 4
            }
        };
    }

    // =========================================================================
    // Atlas Anomaly Recommendations
    // =========================================================================

    private static List<IncidentRecommendation> GetAtlasAnomalySpikeRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "Review detected anomalies in Grafana Anomaly dashboard for patterns",
                Category = RecommendationCategory.Atlas,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Check if anomaly spike correlates with recent data imports or system changes",
                Category = RecommendationCategory.Monitoring,
                Confidence = ConfidenceLevel.Medium,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "Verify anomaly detection thresholds are correctly configured for this county",
                Category = RecommendationCategory.Configuration,
                Confidence = ConfidenceLevel.Medium,
                Priority = 3
            }
        };
    }

    private static List<IncidentRecommendation> GetAtlasAnomalyCriticalRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "CRITICAL: Investigate high-severity anomalies immediately",
                Category = RecommendationCategory.Atlas,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Check if critical anomalies indicate data integrity issues",
                Category = RecommendationCategory.Monitoring,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Review affected property records for potential data corruption",
                Category = RecommendationCategory.Atlas,
                Confidence = ConfidenceLevel.Medium,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "Consider pausing automated workflows until anomalies are resolved",
                Category = RecommendationCategory.Guardrails,
                Confidence = ConfidenceLevel.Medium,
                Priority = 3
            }
        };
    }

    // =========================================================================
    // Atlas Telemetry Recommendations
    // =========================================================================

    private static List<IncidentRecommendation> GetAtlasTelemetryDropRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "Check telemetry ingestion pipeline health and connectivity",
                Category = RecommendationCategory.Monitoring,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Verify data sources (Harris PACS, county systems) are sending data",
                Category = RecommendationCategory.Monitoring,
                Confidence = ConfidenceLevel.Medium,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "Review network connectivity between telemetry sources and Atlas",
                Category = RecommendationCategory.Configuration,
                Confidence = ConfidenceLevel.Medium,
                Priority = 3
            }
        };
    }

    // =========================================================================
    // Swarm Action Recommendations
    // =========================================================================

    private static List<IncidentRecommendation> GetSwarmActionSpikeRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "Review Swarm activity logs to understand the cause of the spike",
                Category = RecommendationCategory.Swarm,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Check if spike correlates with scheduled batch jobs or user activity",
                Category = RecommendationCategory.Monitoring,
                Confidence = ConfidenceLevel.Medium,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "Verify Swarm rate limiting is functioning correctly",
                Category = RecommendationCategory.Guardrails,
                Confidence = ConfidenceLevel.Medium,
                Priority = 3
            }
        };
    }

    private static List<IncidentRecommendation> GetSwarmCountyImbalanceRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "Review county-specific workload distribution in Swarm dashboard",
                Category = RecommendationCategory.Swarm,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Check if imbalance is due to legitimate workload differences",
                Category = RecommendationCategory.Monitoring,
                Confidence = ConfidenceLevel.Medium,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "Consider load balancing configuration adjustments if persistent",
                Category = RecommendationCategory.Configuration,
                Confidence = ConfidenceLevel.Medium,
                Priority = 3
            }
        };
    }

    private static List<IncidentRecommendation> GetSwarmCooldownRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "Monitor: Cooldown activation is a normal protective measure",
                Category = RecommendationCategory.Swarm,
                Confidence = ConfidenceLevel.High,
                Priority = 4
            },
            new()
            {
                Id = GenerateId(),
                Text = "Review activity leading to cooldown for any concerning patterns",
                Category = RecommendationCategory.Monitoring,
                Confidence = ConfidenceLevel.Medium,
                Priority = 5
            }
        };
    }

    private static List<IncidentRecommendation> GetSwarmSafeModeRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "CRITICAL: Safe mode indicates guardrails activated - investigate immediately",
                Category = RecommendationCategory.Guardrails,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Review Swarm activity logs for the trigger event",
                Category = RecommendationCategory.Swarm,
                Confidence = ConfidenceLevel.High,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Verify no unauthorized or malicious activity triggered safe mode",
                Category = RecommendationCategory.Guardrails,
                Confidence = ConfidenceLevel.High,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "Once root cause is identified and resolved, disable safe mode via admin console",
                Category = RecommendationCategory.Recovery,
                Confidence = ConfidenceLevel.High,
                Priority = 3
            },
            new()
            {
                Id = GenerateId(),
                Text = "Document the incident for compliance audit trail",
                Category = RecommendationCategory.Configuration,
                Confidence = ConfidenceLevel.High,
                Priority = 4
            }
        };
    }

    private static List<IncidentRecommendation> GetSwarmPolicyLoadRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "Review policy evaluation complexity and optimize if needed",
                Category = RecommendationCategory.Swarm,
                Confidence = ConfidenceLevel.Medium,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "Check for recursive or inefficient policy rules",
                Category = RecommendationCategory.Configuration,
                Confidence = ConfidenceLevel.Medium,
                Priority = 3
            },
            new()
            {
                Id = GenerateId(),
                Text = "Consider caching frequently evaluated policies",
                Category = RecommendationCategory.Configuration,
                Confidence = ConfidenceLevel.Medium,
                Priority = 4
            }
        };
    }

    // =========================================================================
    // Generic Recommendations
    // =========================================================================

    private static List<IncidentRecommendation> GetGenericRecommendations()
    {
        return new List<IncidentRecommendation>
        {
            new()
            {
                Id = GenerateId(),
                Text = "Review system logs for this alert type to understand the root cause",
                Category = RecommendationCategory.Unknown,
                Confidence = ConfidenceLevel.Low,
                Priority = 1
            },
            new()
            {
                Id = GenerateId(),
                Text = "Check related metrics in Grafana dashboards for additional context",
                Category = RecommendationCategory.Monitoring,
                Confidence = ConfidenceLevel.Low,
                Priority = 2
            },
            new()
            {
                Id = GenerateId(),
                Text = "If alert persists, escalate to engineering team for investigation",
                Category = RecommendationCategory.Recovery,
                Confidence = ConfidenceLevel.Medium,
                Priority = 3
            }
        };
    }
}
