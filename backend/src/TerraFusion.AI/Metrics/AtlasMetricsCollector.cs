// ═══════════════════════════════════════════════════════════════════════════════
// 📊 PHASE 35: Atlas Observability Metrics Collector
// Prometheus metrics instrumentation for Atlas + Forecast Engine
// SPEC LOCK: All metric names, types, and labels are FROZEN
// "Government. Transcended."
// ═══════════════════════════════════════════════════════════════════════════════

using Prometheus;

namespace TerraFusion.AI.Metrics;

/// <summary>
/// Interface for Atlas metrics collection.
/// Provides methods to instrument Atlas, Forecast, Anomaly, and Swarm services.
/// </summary>
public interface IAtlasMetricsCollector
{
    // ═══════════════════════════════════════════════════════════════════════════
    // FORECAST ENGINE METRICS
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Increment the forecast generated counter.
    /// </summary>
    void IncrementForecastGenerated(string countyId);

    /// <summary>
    /// Record forecast computation duration.
    /// </summary>
    void ObserveForecastDuration(string countyId, double durationSeconds);

    /// <summary>
    /// Increment forecast engine error counter.
    /// </summary>
    void IncrementForecastError(string countyId, string errorType);

    // ═══════════════════════════════════════════════════════════════════════════
    // ORCHESTRATOR METRICS
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Increment orchestrator run counter.
    /// </summary>
    void IncrementOrchestratorRuns();

    /// <summary>
    /// Set the last run timestamp (Unix seconds).
    /// </summary>
    void SetOrchestratorLastRunTimestamp(double unixSeconds);

    /// <summary>
    /// Set the last run duration.
    /// </summary>
    void SetOrchestratorLastRunDuration(double durationSeconds);

    /// <summary>
    /// Increment cleanup runs counter.
    /// </summary>
    void IncrementCleanupRuns();

    /// <summary>
    /// Increment entries purged counter.
    /// </summary>
    void IncrementEntriesPurged(string countyId, int count);

    // ═══════════════════════════════════════════════════════════════════════════
    // TELEMETRY METRICS
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Increment telemetry ingest counter.
    /// </summary>
    void IncrementTelemetryIngest(string countyId);

    // ═══════════════════════════════════════════════════════════════════════════
    // ANOMALY DETECTION METRICS
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Increment anomaly detected counter.
    /// </summary>
    void IncrementAnomalyDetected(string countyId, string anomalyType);

    // ═══════════════════════════════════════════════════════════════════════════
    // SWARM POLICY METRICS
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Increment policy evaluation counter.
    /// </summary>
    void IncrementPolicyEvaluation(string countyId);

    /// <summary>
    /// Increment swarm action counter.
    /// </summary>
    void IncrementSwarmAction(string countyId, string actionType);

    /// <summary>
    /// Increment cooldown activation counter.
    /// </summary>
    void IncrementCooldownActivation(string countyId);

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST SUPPORT
    // ═══════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Get current value of forecast generated counter for testing.
    /// </summary>
    double GetForecastGeneratedCount(string countyId);

    /// <summary>
    /// Get current value of forecast error counter for testing.
    /// </summary>
    double GetForecastErrorCount(string countyId, string errorType);

    /// <summary>
    /// Get current value of orchestrator runs counter for testing.
    /// </summary>
    double GetOrchestratorRunsCount();

    /// <summary>
    /// Get current value of anomaly detected counter for testing.
    /// </summary>
    double GetAnomalyDetectedCount(string countyId, string anomalyType);

    /// <summary>
    /// Get current value of policy evaluation counter for testing.
    /// </summary>
    double GetPolicyEvaluationCount(string countyId);

    /// <summary>
    /// Get current value of swarm action counter for testing.
    /// </summary>
    double GetSwarmActionCount(string countyId, string actionType);

    /// <summary>
    /// Get current value of telemetry ingest counter for testing.
    /// </summary>
    double GetTelemetryIngestCount(string countyId);

    /// <summary>
    /// Get histogram observation count for testing.
    /// </summary>
    long GetForecastDurationObservationCount(string countyId);
}

/// <summary>
/// Phase 35: Prometheus metrics collector for Atlas observability.
/// All metrics are SPEC LOCKED - names, types, and labels are immutable.
/// </summary>
public sealed class AtlasMetricsCollector : IAtlasMetricsCollector
{
    // ═══════════════════════════════════════════════════════════════════════════
    // FORECAST ENGINE METRICS (SPEC LOCK)
    // ═══════════════════════════════════════════════════════════════════════════

    private static readonly Counter ForecastGeneratedTotal = Prometheus.Metrics
        .CreateCounter(
            "atlas_forecast_generated_total",
            "Total forecasts successfully computed",
            new CounterConfiguration
            {
                LabelNames = new[] { "countyId" }
            });

    private static readonly Histogram ForecastComputeDurationSeconds = Prometheus.Metrics
        .CreateHistogram(
            "atlas_forecast_compute_duration_seconds",
            "Duration of forecast computation",
            new HistogramConfiguration
            {
                LabelNames = new[] { "countyId" },
                Buckets = new[] { 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5 }
            });

    private static readonly Counter ForecastEngineErrorsTotal = Prometheus.Metrics
        .CreateCounter(
            "atlas_forecast_engine_errors_total",
            "Total forecast engine errors",
            new CounterConfiguration
            {
                LabelNames = new[] { "countyId", "errorType" }
            });

    // ═══════════════════════════════════════════════════════════════════════════
    // ORCHESTRATOR METRICS (SPEC LOCK)
    // ═══════════════════════════════════════════════════════════════════════════

    private static readonly Counter OrchestratorRunsTotal = Prometheus.Metrics
        .CreateCounter(
            "atlas_forecast_orchestrator_runs_total",
            "Total orchestrator run cycles");

    private static readonly Gauge OrchestratorLastRunTimestampSeconds = Prometheus.Metrics
        .CreateGauge(
            "atlas_forecast_orchestrator_last_run_timestamp_seconds",
            "Unix timestamp of last completed run");

    private static readonly Gauge OrchestratorLastRunDurationSeconds = Prometheus.Metrics
        .CreateGauge(
            "atlas_forecast_orchestrator_last_run_duration_seconds",
            "Duration of last run cycle");

    private static readonly Counter CleanupRunsTotal = Prometheus.Metrics
        .CreateCounter(
            "atlas_forecast_cleanup_runs_total",
            "Total TTL cleanup operations");

    private static readonly Counter EntriesPurgedTotal = Prometheus.Metrics
        .CreateCounter(
            "atlas_forecast_entries_purged_total",
            "Total stale forecasts purged",
            new CounterConfiguration
            {
                LabelNames = new[] { "countyId" }
            });

    // ═══════════════════════════════════════════════════════════════════════════
    // TELEMETRY METRICS (SPEC LOCK)
    // ═══════════════════════════════════════════════════════════════════════════

    private static readonly Counter TelemetryIngestTotal = Prometheus.Metrics
        .CreateCounter(
            "atlas_telemetry_ingest_total",
            "Total telemetry snapshots ingested",
            new CounterConfiguration
            {
                LabelNames = new[] { "countyId" }
            });

    // ═══════════════════════════════════════════════════════════════════════════
    // ANOMALY DETECTION METRICS (SPEC LOCK)
    // ═══════════════════════════════════════════════════════════════════════════

    private static readonly Counter AnomalyDetectedTotal = Prometheus.Metrics
        .CreateCounter(
            "atlas_anomaly_detected_total",
            "Total anomalies detected by type",
            new CounterConfiguration
            {
                LabelNames = new[] { "countyId", "anomalyType" }
            });

    // ═══════════════════════════════════════════════════════════════════════════
    // SWARM POLICY METRICS (SPEC LOCK)
    // ═══════════════════════════════════════════════════════════════════════════

    private static readonly Counter PolicyEvaluationsTotal = Prometheus.Metrics
        .CreateCounter(
            "swarm_predictive_policy_evaluations_total",
            "Total policy evaluations",
            new CounterConfiguration
            {
                LabelNames = new[] { "countyId" }
            });

    private static readonly Counter SwarmActionsTotal = Prometheus.Metrics
        .CreateCounter(
            "swarm_predictive_actions_total",
            "Total swarm actions triggered",
            new CounterConfiguration
            {
                LabelNames = new[] { "countyId", "actionType" }
            });

    private static readonly Counter CooldownActivationsTotal = Prometheus.Metrics
        .CreateCounter(
            "swarm_predictive_cooldown_activations_total",
            "Total cooldown activations",
            new CounterConfiguration
            {
                LabelNames = new[] { "countyId" }
            });

    // ═══════════════════════════════════════════════════════════════════════════
    // FORECAST ENGINE IMPLEMENTATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    public void IncrementForecastGenerated(string countyId)
    {
        ForecastGeneratedTotal.WithLabels(countyId ?? "unknown").Inc();
    }

    public void ObserveForecastDuration(string countyId, double durationSeconds)
    {
        ForecastComputeDurationSeconds.WithLabels(countyId ?? "unknown").Observe(durationSeconds);
    }

    public void IncrementForecastError(string countyId, string errorType)
    {
        ForecastEngineErrorsTotal.WithLabels(countyId ?? "unknown", errorType ?? "unknown").Inc();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ORCHESTRATOR IMPLEMENTATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    public void IncrementOrchestratorRuns()
    {
        OrchestratorRunsTotal.Inc();
    }

    public void SetOrchestratorLastRunTimestamp(double unixSeconds)
    {
        OrchestratorLastRunTimestampSeconds.Set(unixSeconds);
    }

    public void SetOrchestratorLastRunDuration(double durationSeconds)
    {
        OrchestratorLastRunDurationSeconds.Set(durationSeconds);
    }

    public void IncrementCleanupRuns()
    {
        CleanupRunsTotal.Inc();
    }

    public void IncrementEntriesPurged(string countyId, int count)
    {
        EntriesPurgedTotal.WithLabels(countyId ?? "unknown").Inc(count);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TELEMETRY IMPLEMENTATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    public void IncrementTelemetryIngest(string countyId)
    {
        TelemetryIngestTotal.WithLabels(countyId ?? "unknown").Inc();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ANOMALY DETECTION IMPLEMENTATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    public void IncrementAnomalyDetected(string countyId, string anomalyType)
    {
        AnomalyDetectedTotal.WithLabels(countyId ?? "unknown", anomalyType ?? "unknown").Inc();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SWARM POLICY IMPLEMENTATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    public void IncrementPolicyEvaluation(string countyId)
    {
        PolicyEvaluationsTotal.WithLabels(countyId ?? "unknown").Inc();
    }

    public void IncrementSwarmAction(string countyId, string actionType)
    {
        SwarmActionsTotal.WithLabels(countyId ?? "unknown", actionType ?? "unknown").Inc();
    }

    public void IncrementCooldownActivation(string countyId)
    {
        CooldownActivationsTotal.WithLabels(countyId ?? "unknown").Inc();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEST SUPPORT IMPLEMENTATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    public double GetForecastGeneratedCount(string countyId)
    {
        return ForecastGeneratedTotal.WithLabels(countyId ?? "unknown").Value;
    }

    public double GetForecastErrorCount(string countyId, string errorType)
    {
        return ForecastEngineErrorsTotal.WithLabels(countyId ?? "unknown", errorType ?? "unknown").Value;
    }

    public double GetOrchestratorRunsCount()
    {
        return OrchestratorRunsTotal.Value;
    }

    public double GetAnomalyDetectedCount(string countyId, string anomalyType)
    {
        return AnomalyDetectedTotal.WithLabels(countyId ?? "unknown", anomalyType ?? "unknown").Value;
    }

    public double GetPolicyEvaluationCount(string countyId)
    {
        return PolicyEvaluationsTotal.WithLabels(countyId ?? "unknown").Value;
    }

    public double GetSwarmActionCount(string countyId, string actionType)
    {
        return SwarmActionsTotal.WithLabels(countyId ?? "unknown", actionType ?? "unknown").Value;
    }

    public double GetTelemetryIngestCount(string countyId)
    {
        return TelemetryIngestTotal.WithLabels(countyId ?? "unknown").Value;
    }

    public long GetForecastDurationObservationCount(string countyId)
    {
        return ForecastComputeDurationSeconds.WithLabels(countyId ?? "unknown").Count;
    }
}

/// <summary>
/// Null-object implementation for testing without Prometheus.
/// </summary>
public sealed class NullAtlasMetricsCollector : IAtlasMetricsCollector
{
    public void IncrementForecastGenerated(string countyId) { }
    public void ObserveForecastDuration(string countyId, double durationSeconds) { }
    public void IncrementForecastError(string countyId, string errorType) { }
    public void IncrementOrchestratorRuns() { }
    public void SetOrchestratorLastRunTimestamp(double unixSeconds) { }
    public void SetOrchestratorLastRunDuration(double durationSeconds) { }
    public void IncrementCleanupRuns() { }
    public void IncrementEntriesPurged(string countyId, int count) { }
    public void IncrementTelemetryIngest(string countyId) { }
    public void IncrementAnomalyDetected(string countyId, string anomalyType) { }
    public void IncrementPolicyEvaluation(string countyId) { }
    public void IncrementSwarmAction(string countyId, string actionType) { }
    public void IncrementCooldownActivation(string countyId) { }

    public double GetForecastGeneratedCount(string countyId) => 0;
    public double GetForecastErrorCount(string countyId, string errorType) => 0;
    public double GetOrchestratorRunsCount() => 0;
    public double GetAnomalyDetectedCount(string countyId, string anomalyType) => 0;
    public double GetPolicyEvaluationCount(string countyId) => 0;
    public double GetSwarmActionCount(string countyId, string actionType) => 0;
    public double GetTelemetryIngestCount(string countyId) => 0;
    public long GetForecastDurationObservationCount(string countyId) => 0;
}
