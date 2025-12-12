// =============================================================================
// Phase 40A: AI-Driven Incident Runbook Engine - Step Templates
// =============================================================================
// RUNBOOK SPEC LOCK v1.0.0
// Static templates for alert → runbook step mapping.
// Maps all 12 Phase 38 alerts to concrete, safety-aware steps.
// =============================================================================

namespace TerraFusion.Operations.Runbooks;

/// <summary>
/// Static class providing runbook step templates for known alert types.
/// Maps Phase 38 alerts to ordered, safety-aware steps.
/// </summary>
/// <remarks>
/// PHASE 40A CONSTRAINTS:
/// - All steps have RequiresHumanApproval = true
/// - All steps have CanBeSuggestedForAutomation = false
/// - Steps are ordered: Diagnostic → ConfigCheck → RestartService → ScaleOut/Failover
/// </remarks>
public static class RunbookTemplates
{
    private static int _stepCounter = 0;

    private static string GenerateStepId() => $"STEP-{Interlocked.Increment(ref _stepCounter):D6}";

    /// <summary>
    /// All supported alert names.
    /// </summary>
    public static readonly IReadOnlyList<string> SupportedAlerts = new[]
    {
        // Atlas Alerts (7)
        "AtlasForecastStale",
        "AtlasForecastErrorRateHigh",
        "AtlasForecastDurationSpike",
        "AtlasOrchestratorStall",
        "AtlasAnomalySpike",
        "AtlasAnomalyCritical",
        "AtlasTelemetryDropRate",
        // Swarm Alerts (5)
        "SwarmActionSpike",
        "SwarmCooldownActivation",
        "SwarmSafeModeTriggered",
        "SwarmPolicyLoadHigh",
        "SwarmActionsByCountyImbalance"
    };

    /// <summary>
    /// Gets runbook steps for a specific alert name.
    /// Returns generic steps for unknown alerts.
    /// </summary>
    public static List<RunbookStep> GetStepsForAlert(string alertName)
    {
        if (string.IsNullOrWhiteSpace(alertName))
        {
            return GetGenericSteps();
        }

        return alertName switch
        {
            // Atlas Alerts
            "AtlasForecastStale" => GetAtlasForecastStaleSteps(),
            "AtlasForecastErrorRateHigh" => GetAtlasForecastErrorSteps(),
            "AtlasForecastDurationSpike" => GetAtlasForecastDurationSteps(),
            "AtlasOrchestratorStall" => GetAtlasOrchestratorStallSteps(),
            "AtlasAnomalySpike" => GetAtlasAnomalySpikeSteps(),
            "AtlasAnomalyCritical" => GetAtlasAnomalyCriticalSteps(),
            "AtlasTelemetryDropRate" => GetAtlasTelemetryDropSteps(),
            // Swarm Alerts
            "SwarmActionSpike" => GetSwarmActionSpikeSteps(),
            "SwarmCooldownActivation" => GetSwarmCooldownSteps(),
            "SwarmSafeModeTriggered" => GetSwarmSafeModeSteps(),
            "SwarmPolicyLoadHigh" => GetSwarmPolicyLoadSteps(),
            "SwarmActionsByCountyImbalance" => GetSwarmImbalanceSteps(),
            // Unknown
            _ => GetGenericSteps()
        };
    }

    // =========================================================================
    // Atlas Forecast Stale Steps
    // =========================================================================
    private static List<RunbookStep> GetAtlasForecastStaleSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Check Atlas Dashboard",
                Description = "Open the Grafana Atlas Dashboard and verify the last successful forecast timestamp. " +
                              "Look for the 'atlas_forecast_last_success_timestamp' metric.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasForecastStale" },
                RelatedMetricNames = new List<string> { "atlas_forecast_last_success_timestamp", "atlas_forecast_generated_total" },
                EstimatedDurationMinutes = 5
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Review Forecast Engine Logs",
                Description = "Check Atlas Forecast Engine logs for errors or warnings. " +
                              "Use: kubectl logs -l app=atlas-forecast --tail=500 --since=30m",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasForecastStale" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Verify Data Pipeline Health",
                Description = "Check that county data is flowing into the forecast engine. " +
                              "Verify Harris PACS sync status and telemetry ingest rates.",
                Kind = RunbookStepKind.ConfigCheck,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasForecastStale" },
                RelatedMetricNames = new List<string> { "atlas_telemetry_ingest_total" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 4,
                Title = "Restart Forecast Service (If Needed)",
                Description = "If logs show the service is stuck, perform a rolling restart. " +
                              "SAFETY: This will briefly interrupt forecast generation. " +
                              "Use: kubectl rollout restart deployment/atlas-forecast",
                Kind = RunbookStepKind.RestartService,
                SafetyLevel = RunbookSafetyLevel.MediumRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasForecastStale" },
                EstimatedDurationMinutes = 15
            }
        };
    }

    // =========================================================================
    // Atlas Forecast Error Rate High Steps
    // =========================================================================
    private static List<RunbookStep> GetAtlasForecastErrorSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Identify Error Types",
                Description = "Check the atlas_forecast_engine_errors_total metric by errorType label. " +
                              "Common types: validation, timeout, data_quality, model_error.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasForecastErrorRateHigh" },
                RelatedMetricNames = new List<string> { "atlas_forecast_engine_errors_total" },
                EstimatedDurationMinutes = 5
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Review Recent Error Logs",
                Description = "Search logs for ERROR and WARN entries. Focus on stack traces " +
                              "and error messages that indicate root cause.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasForecastErrorRateHigh" },
                EstimatedDurationMinutes = 15
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Validate Input Data Quality",
                Description = "If errors are data_quality type, check recent county data imports. " +
                              "Look for malformed records, missing fields, or out-of-range values.",
                Kind = RunbookStepKind.DataValidation,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Data Analyst",
                RelatedAlertNames = new List<string> { "AtlasForecastErrorRateHigh" },
                EstimatedDurationMinutes = 20
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 4,
                Title = "Escalate to Development Team",
                Description = "If errors persist after data validation, escalate to the Atlas development team " +
                              "with error logs and reproduction steps.",
                Kind = RunbookStepKind.Notification,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasForecastErrorRateHigh" },
                EstimatedDurationMinutes = 10
            }
        };
    }

    // =========================================================================
    // Atlas Forecast Duration Spike Steps
    // =========================================================================
    private static List<RunbookStep> GetAtlasForecastDurationSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Check System Resources",
                Description = "Review CPU, memory, and disk I/O on the Atlas host. " +
                              "Look for resource exhaustion that could cause slow forecasts.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasForecastDurationSpike" },
                RelatedMetricNames = new List<string> { "node_cpu_seconds_total", "node_memory_MemAvailable_bytes" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Review Concurrent Load",
                Description = "Check if multiple counties are being processed simultaneously. " +
                              "High concurrency can cause resource contention.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasForecastDurationSpike" },
                RelatedMetricNames = new List<string> { "atlas_forecast_in_progress_count" },
                EstimatedDurationMinutes = 5
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Consider Scaling Out",
                Description = "If resource exhaustion is confirmed, consider adding more replicas. " +
                              "SAFETY: Review capacity planning before scaling.",
                Kind = RunbookStepKind.ScaleOut,
                SafetyLevel = RunbookSafetyLevel.MediumRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasForecastDurationSpike" },
                EstimatedDurationMinutes = 15
            }
        };
    }

    // =========================================================================
    // Atlas Orchestrator Stall Steps (CRITICAL)
    // =========================================================================
    private static List<RunbookStep> GetAtlasOrchestratorStallSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Verify Orchestrator Status",
                Description = "CRITICAL: Check the Atlas Orchestrator health endpoint. " +
                              "Verify the pod is running: kubectl get pods -l app=atlas-orchestrator",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasOrchestratorStall" },
                RelatedMetricNames = new List<string> { "atlas_forecast_orchestrator_runs_total" },
                EstimatedDurationMinutes = 5
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Check Job Queue Status",
                Description = "Review the orchestrator job queue for stuck or failed jobs. " +
                              "Look for jobs in 'Pending' state for >10 minutes.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasOrchestratorStall" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Review Orchestrator Logs",
                Description = "Check for deadlock, OOM, or exception patterns in orchestrator logs. " +
                              "Focus on the last 30 minutes before the stall.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasOrchestratorStall" },
                EstimatedDurationMinutes = 15
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 4,
                Title = "Notify Stakeholders",
                Description = "CRITICAL: If orchestrator is down, notify county IT contacts. " +
                              "Property forecasts will be stale until restored.",
                Kind = RunbookStepKind.Notification,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasOrchestratorStall" },
                EstimatedDurationMinutes = 5
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 5,
                Title = "Restart Orchestrator (With Caution)",
                Description = "HIGH RISK: Restart the orchestrator if diagnostics show it's unrecoverable. " +
                              "SAFETY: Ensure no jobs are mid-flight. This may cause brief forecast gaps. " +
                              "Use: kubectl rollout restart deployment/atlas-orchestrator",
                Kind = RunbookStepKind.RestartService,
                SafetyLevel = RunbookSafetyLevel.HighRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasOrchestratorStall" },
                EstimatedDurationMinutes = 20
            }
        };
    }

    // =========================================================================
    // Atlas Anomaly Spike Steps
    // =========================================================================
    private static List<RunbookStep> GetAtlasAnomalySpikeSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Review Anomaly Dashboard",
                Description = "Open the Atlas Anomaly Dashboard and identify the counties/properties " +
                              "generating anomalies. Look for patterns.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Data Analyst",
                RelatedAlertNames = new List<string> { "AtlasAnomalySpike" },
                RelatedMetricNames = new List<string> { "atlas_anomaly_detected_total" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Classify Anomaly Types",
                Description = "Determine if anomalies are threshold-based, statistical, or model-drift. " +
                              "This determines the appropriate response.",
                Kind = RunbookStepKind.ManualInvestigation,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Data Analyst",
                RelatedAlertNames = new List<string> { "AtlasAnomalySpike" },
                EstimatedDurationMinutes = 15
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Verify Data Source Integrity",
                Description = "If anomalies correlate with a data import, verify the source data. " +
                              "Check for bulk updates or data corrections that may be legitimate.",
                Kind = RunbookStepKind.DataValidation,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Data Analyst",
                RelatedAlertNames = new List<string> { "AtlasAnomalySpike" },
                EstimatedDurationMinutes = 20
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 4,
                Title = "Adjust Anomaly Thresholds (If Needed)",
                Description = "If anomalies are false positives due to legitimate data changes, " +
                              "consider adjusting detection thresholds via configuration.",
                Kind = RunbookStepKind.ConfigCheck,
                SafetyLevel = RunbookSafetyLevel.MediumRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Data Analyst",
                RelatedAlertNames = new List<string> { "AtlasAnomalySpike" },
                EstimatedDurationMinutes = 15
            }
        };
    }

    // =========================================================================
    // Atlas Anomaly Critical Steps (CRITICAL)
    // =========================================================================
    private static List<RunbookStep> GetAtlasAnomalyCriticalSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Immediate Anomaly Review",
                Description = "CRITICAL: A critical anomaly has been detected. " +
                              "Immediately review the anomaly details in the Atlas dashboard.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Data Analyst",
                RelatedAlertNames = new List<string> { "AtlasAnomalyCritical" },
                RelatedMetricNames = new List<string> { "atlas_anomaly_detected_total" },
                EstimatedDurationMinutes = 5
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Notify County Assessor",
                Description = "CRITICAL: Notify the county assessor's office of the anomaly. " +
                              "They may need to halt property assessments pending investigation.",
                Kind = RunbookStepKind.Notification,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasAnomalyCritical" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Root Cause Investigation",
                Description = "Perform deep investigation into the anomaly source. " +
                              "Check data imports, model outputs, and external integrations.",
                Kind = RunbookStepKind.ManualInvestigation,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Data Analyst",
                RelatedAlertNames = new List<string> { "AtlasAnomalyCritical" },
                EstimatedDurationMinutes = 30
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 4,
                Title = "Consider Temporary Forecast Halt",
                Description = "HIGH RISK: If anomaly indicates data corruption, consider halting " +
                              "forecasts for the affected county until resolved. " +
                              "SAFETY: This will impact citizen services.",
                Kind = RunbookStepKind.ConfigCheck,
                SafetyLevel = RunbookSafetyLevel.HighRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasAnomalyCritical" },
                EstimatedDurationMinutes = 15
            }
        };
    }

    // =========================================================================
    // Atlas Telemetry Drop Steps
    // =========================================================================
    private static List<RunbookStep> GetAtlasTelemetryDropSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Check Telemetry Ingest Pipeline",
                Description = "Verify the telemetry ingestion service is running. " +
                              "Check the atlas_telemetry_ingest_total metric for the affected county.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasTelemetryDropRate" },
                RelatedMetricNames = new List<string> { "atlas_telemetry_ingest_total" },
                EstimatedDurationMinutes = 5
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Verify Network Connectivity",
                Description = "Check network connectivity between data sources and the telemetry service. " +
                              "Look for firewall changes or network outages.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Network Admin",
                RelatedAlertNames = new List<string> { "AtlasTelemetryDropRate" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Check Harris PACS Connection",
                Description = "Verify the Harris PACS integration is healthy. " +
                              "Check connection status and recent sync timestamps.",
                Kind = RunbookStepKind.ConfigCheck,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "DBA",
                RelatedAlertNames = new List<string> { "AtlasTelemetryDropRate" },
                EstimatedDurationMinutes = 15
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 4,
                Title = "Restart Telemetry Service",
                Description = "If the service is stuck, perform a restart. " +
                              "SAFETY: Brief gap in telemetry data expected.",
                Kind = RunbookStepKind.RestartService,
                SafetyLevel = RunbookSafetyLevel.MediumRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "AtlasTelemetryDropRate" },
                EstimatedDurationMinutes = 10
            }
        };
    }

    // =========================================================================
    // Swarm Action Spike Steps
    // =========================================================================
    private static List<RunbookStep> GetSwarmActionSpikeSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Review Swarm Action Dashboard",
                Description = "Check the Swarm AI dashboard for the spike pattern. " +
                              "Identify which action types (scale_up, scale_down, etc.) are spiking.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmActionSpike" },
                RelatedMetricNames = new List<string> { "swarm_predictive_actions_total" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Identify Trigger Pattern",
                Description = "Determine what's triggering the excessive actions. " +
                              "Check if it's a feedback loop, bad policy, or legitimate load spike.",
                Kind = RunbookStepKind.ManualInvestigation,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmActionSpike" },
                EstimatedDurationMinutes = 15
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Review Rate Limiting Config",
                Description = "Check Swarm rate limiting configuration. " +
                              "Consider temporarily tightening limits if actions are harmful.",
                Kind = RunbookStepKind.ConfigCheck,
                SafetyLevel = RunbookSafetyLevel.MediumRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmActionSpike" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 4,
                Title = "Monitor for Safe Mode Trigger",
                Description = "If spike continues, Swarm may auto-trigger safe mode. " +
                              "Monitor the swarm_safe_mode_active metric.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmActionSpike" },
                RelatedMetricNames = new List<string> { "swarm_safe_mode_active" },
                EstimatedDurationMinutes = 5
            }
        };
    }

    // =========================================================================
    // Swarm Cooldown Activation Steps (INFO level)
    // =========================================================================
    private static List<RunbookStep> GetSwarmCooldownSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Acknowledge Cooldown",
                Description = "INFO: Swarm cooldown has been activated. This is a protective measure " +
                              "and may be expected behavior during high activity periods.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmCooldownActivation" },
                RelatedMetricNames = new List<string> { "swarm_predictive_cooldown_activations_total" },
                EstimatedDurationMinutes = 5
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Monitor Cooldown Duration",
                Description = "Track how long the cooldown persists. If it's frequent or extended, " +
                              "investigate the triggering pattern.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmCooldownActivation" },
                EstimatedDurationMinutes = 10
            }
        };
    }

    // =========================================================================
    // Swarm Safe Mode Triggered Steps (CRITICAL)
    // =========================================================================
    private static List<RunbookStep> GetSwarmSafeModeSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Confirm Safe Mode Status",
                Description = "CRITICAL: Swarm has entered safe mode. This limits predictive actions " +
                              "to protect the system. Verify via swarm_safe_mode_active metric.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmSafeModeTriggered" },
                RelatedMetricNames = new List<string> { "swarm_safe_mode_active", "swarm_predictive_cooldown_activations_total" },
                EstimatedDurationMinutes = 5
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Review Guardrail Triggers",
                Description = "Identify which guardrails triggered safe mode. " +
                              "Check for action rate limits, error thresholds, or manual triggers.",
                Kind = RunbookStepKind.ManualInvestigation,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmSafeModeTriggered" },
                EstimatedDurationMinutes = 15
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Assess System Capacity",
                Description = "Review current system capacity and load. Safe mode may indicate " +
                              "the system is overwhelmed or experiencing failures.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmSafeModeTriggered" },
                RelatedMetricNames = new List<string> { "node_cpu_seconds_total", "node_memory_MemAvailable_bytes" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 4,
                Title = "Plan Return to Normal Mode",
                Description = "Once root cause is addressed, plan the return to normal mode. " +
                              "SAFETY: Do not rush - ensure underlying issues are resolved first.",
                Kind = RunbookStepKind.ConfigCheck,
                SafetyLevel = RunbookSafetyLevel.MediumRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmSafeModeTriggered" },
                EstimatedDurationMinutes = 15
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 5,
                Title = "Exit Safe Mode (When Ready)",
                Description = "HIGH RISK: After confirming stability, exit safe mode. " +
                              "SAFETY: Monitor closely for 30 minutes after exit. " +
                              "Be prepared to re-enter safe mode if issues recur.",
                Kind = RunbookStepKind.ConfigCheck,
                SafetyLevel = RunbookSafetyLevel.HighRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmSafeModeTriggered" },
                EstimatedDurationMinutes = 30
            }
        };
    }

    // =========================================================================
    // Swarm Policy Load High Steps
    // =========================================================================
    private static List<RunbookStep> GetSwarmPolicyLoadSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Review Policy Evaluation Rate",
                Description = "Check the swarm_predictive_policy_evaluations_total metric. " +
                              "Identify which policies are being evaluated most frequently.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmPolicyLoadHigh" },
                RelatedMetricNames = new List<string> { "swarm_predictive_policy_evaluations_total" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Identify Expensive Policies",
                Description = "Look for policies that are computationally expensive or frequently triggered. " +
                              "These may need optimization.",
                Kind = RunbookStepKind.ManualInvestigation,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmPolicyLoadHigh" },
                EstimatedDurationMinutes = 15
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Consider Policy Optimization",
                Description = "If specific policies are causing load, consider: " +
                              "1) Increasing evaluation intervals 2) Simplifying policy logic 3) Caching results",
                Kind = RunbookStepKind.ConfigCheck,
                SafetyLevel = RunbookSafetyLevel.MediumRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmPolicyLoadHigh" },
                EstimatedDurationMinutes = 20
            }
        };
    }

    // =========================================================================
    // Swarm Actions By County Imbalance Steps
    // =========================================================================
    private static List<RunbookStep> GetSwarmImbalanceSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Review Per-County Action Distribution",
                Description = "Check the swarm_predictive_actions_total metric grouped by countyId. " +
                              "Identify which counties are receiving disproportionate actions.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmActionsByCountyImbalance" },
                RelatedMetricNames = new List<string> { "swarm_predictive_actions_total" },
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Investigate County-Specific Patterns",
                Description = "Determine if imbalance is due to legitimate differences in county data " +
                              "or a bug in county-specific policies.",
                Kind = RunbookStepKind.ManualInvestigation,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Data Analyst",
                RelatedAlertNames = new List<string> { "SwarmActionsByCountyImbalance" },
                EstimatedDurationMinutes = 15
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Review Load Balancing Config",
                Description = "Check Swarm load balancing configuration to ensure fair distribution " +
                              "across counties. Adjust weights if needed.",
                Kind = RunbookStepKind.ConfigCheck,
                SafetyLevel = RunbookSafetyLevel.MediumRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Ops Engineer",
                RelatedAlertNames = new List<string> { "SwarmActionsByCountyImbalance" },
                EstimatedDurationMinutes = 15
            }
        };
    }

    // =========================================================================
    // Generic Steps for Unknown Alerts
    // =========================================================================
    private static List<RunbookStep> GetGenericSteps()
    {
        return new List<RunbookStep>
        {
            new()
            {
                StepId = GenerateStepId(),
                Order = 1,
                Title = "Review Alert Details",
                Description = "Check the alert details in the monitoring dashboard. " +
                              "Identify the affected component and severity.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string>(),
                EstimatedDurationMinutes = 10
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 2,
                Title = "Check Related Logs",
                Description = "Review logs for the affected component. Look for errors, " +
                              "warnings, or unusual patterns.",
                Kind = RunbookStepKind.Diagnostic,
                SafetyLevel = RunbookSafetyLevel.InfoOnly,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string>(),
                EstimatedDurationMinutes = 15
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 3,
                Title = "Manual Investigation",
                Description = "If the alert type is unknown, perform manual investigation " +
                              "to understand the root cause and appropriate response.",
                Kind = RunbookStepKind.ManualInvestigation,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Senior Ops Engineer",
                RelatedAlertNames = new List<string>(),
                EstimatedDurationMinutes = 30
            },
            new()
            {
                StepId = GenerateStepId(),
                Order = 4,
                Title = "Escalate If Needed",
                Description = "If investigation reveals a critical issue or unknown pattern, " +
                              "escalate to the appropriate team.",
                Kind = RunbookStepKind.Notification,
                SafetyLevel = RunbookSafetyLevel.LowRisk,
                RequiresHumanApproval = true,
                SuggestedOwnerRole = "Ops Engineer",
                RelatedAlertNames = new List<string>(),
                EstimatedDurationMinutes = 10
            }
        };
    }
}
