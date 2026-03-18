// TFT-191 — canon-observability: Prometheus metric definitions
// TerraCanon domain — observability infrastructure. No valuation math.

using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace TerraFusion.API.Monitoring;

/// <summary>
/// Central registry of Prometheus-style metrics for TerraFusion.
/// Uses the .NET 8 <see cref="System.Diagnostics.Metrics"/> API which is
/// natively exported by <c>OpenTelemetry.Exporter.Prometheus.AspNetCore</c>.
/// </summary>
public static class PrometheusConfig
{
    /// <summary>Meter name used for all TerraFusion metrics.</summary>
    public const string MeterName = "TerraFusion.API";

    private static readonly Meter Meter = new(MeterName, "1.0.0");

    // ── HTTP Request Metrics ─────────────────────────────────────

    /// <summary>
    /// Total number of HTTP requests received, labeled by method, path, and status.
    /// Type: Counter.
    /// </summary>
    public static readonly Counter<long> HttpRequestsTotal =
        Meter.CreateCounter<long>(
            "terrafusion_http_requests_total",
            unit: "{request}",
            description: "Total HTTP requests received");

    /// <summary>
    /// Duration of HTTP requests in seconds.
    /// Type: Histogram.
    /// </summary>
    public static readonly Histogram<double> HttpRequestDurationSeconds =
        Meter.CreateHistogram<double>(
            "terrafusion_http_request_duration_seconds",
            unit: "s",
            description: "HTTP request duration in seconds");

    /// <summary>
    /// Number of HTTP requests currently being processed.
    /// Type: UpDownCounter (gauge-like).
    /// </summary>
    public static readonly UpDownCounter<int> HttpRequestsInFlight =
        Meter.CreateUpDownCounter<int>(
            "terrafusion_http_requests_in_flight",
            unit: "{request}",
            description: "HTTP requests currently being processed");

    // ── Sync / Connector Metrics ─────────────────────────────────

    /// <summary>
    /// Total number of connector sync operations completed.
    /// Labels: connector_name, status (success | failure).
    /// Type: Counter.
    /// </summary>
    public static readonly Counter<long> SyncOperationsTotal =
        Meter.CreateCounter<long>(
            "terrafusion_sync_operations_total",
            unit: "{operation}",
            description: "Total connector sync operations completed");

    /// <summary>
    /// Duration of the last sync operation per connector, in seconds.
    /// Type: Histogram.
    /// </summary>
    public static readonly Histogram<double> SyncDurationSeconds =
        Meter.CreateHistogram<double>(
            "terrafusion_sync_duration_seconds",
            unit: "s",
            description: "Duration of connector sync operations");

    /// <summary>
    /// Number of records processed in the last sync per connector.
    /// Type: Counter.
    /// </summary>
    public static readonly Counter<long> SyncRecordsProcessed =
        Meter.CreateCounter<long>(
            "terrafusion_sync_records_processed_total",
            unit: "{record}",
            description: "Total records processed by sync operations");

    /// <summary>
    /// Current health status of each connector (1 = healthy, 0 = unhealthy).
    /// Type: ObservableGauge (registered via callback).
    /// </summary>
    /// <remarks>
    /// Register a callback with <see cref="RegisterConnectorHealthGauge"/> to report live values.
    /// </remarks>
    private static ObservableGauge<int>? _connectorHealthGauge;

    /// <summary>
    /// Register a callback that reports per-connector health as a gauge.
    /// Call once during startup.
    /// </summary>
    /// <param name="healthProvider">
    /// Function returning a sequence of (connectorName, isHealthy) tuples.
    /// </param>
    public static void RegisterConnectorHealthGauge(
        Func<IEnumerable<Measurement<int>>> healthProvider)
    {
        _connectorHealthGauge = Meter.CreateObservableGauge(
            "terrafusion_connector_health",
            healthProvider,
            unit: "{status}",
            description: "Connector health status (1=healthy, 0=unhealthy)");
    }

    // ── ETL Pipeline Metrics ─────────────────────────────────────

    /// <summary>
    /// Total ETL pipeline runs completed.
    /// Labels: source_system, status (success | failure).
    /// Type: Counter.
    /// </summary>
    public static readonly Counter<long> EtlRunsTotal =
        Meter.CreateCounter<long>(
            "terrafusion_etl_runs_total",
            unit: "{run}",
            description: "Total ETL pipeline runs completed");

    /// <summary>
    /// Duration of ETL pipeline runs in seconds.
    /// Type: Histogram.
    /// </summary>
    public static readonly Histogram<double> EtlRunDurationSeconds =
        Meter.CreateHistogram<double>(
            "terrafusion_etl_run_duration_seconds",
            unit: "s",
            description: "Duration of ETL pipeline runs");

    /// <summary>
    /// Total records processed across all ETL steps.
    /// Labels: step_id, source_system.
    /// Type: Counter.
    /// </summary>
    public static readonly Counter<long> EtlRecordsTotal =
        Meter.CreateCounter<long>(
            "terrafusion_etl_records_total",
            unit: "{record}",
            description: "Total records processed by ETL steps");

    /// <summary>
    /// Number of ETL step failures.
    /// Labels: step_id, source_system.
    /// Type: Counter.
    /// </summary>
    public static readonly Counter<long> EtlStepFailures =
        Meter.CreateCounter<long>(
            "terrafusion_etl_step_failures_total",
            unit: "{failure}",
            description: "Total ETL step failures");

    // ── System / Infrastructure Metrics ──────────────────────────

    /// <summary>
    /// Number of active database connections.
    /// Type: ObservableGauge (registered via callback).
    /// </summary>
    private static ObservableGauge<int>? _dbConnectionsGauge;

    /// <summary>
    /// Register a callback that reports active database connection count.
    /// </summary>
    public static void RegisterDatabaseConnectionsGauge(
        Func<int> connectionCountProvider)
    {
        _dbConnectionsGauge = Meter.CreateObservableGauge(
            "terrafusion_db_connections_active",
            () => connectionCountProvider(),
            unit: "{connection}",
            description: "Active database connections");
    }

    /// <summary>
    /// Database query duration in seconds.
    /// Type: Histogram.
    /// </summary>
    public static readonly Histogram<double> DbQueryDurationSeconds =
        Meter.CreateHistogram<double>(
            "terrafusion_db_query_duration_seconds",
            unit: "s",
            description: "Database query duration in seconds");

    // ── Convenience helpers ──────────────────────────────────────

    /// <summary>
    /// Record a completed HTTP request in a single call.
    /// </summary>
    public static void RecordHttpRequest(string method, string path, int statusCode, double durationSeconds)
    {
        var tags = new TagList
        {
            { "method", method },
            { "path", path },
            { "status_code", statusCode.ToString() }
        };

        HttpRequestsTotal.Add(1, tags);
        HttpRequestDurationSeconds.Record(durationSeconds, tags);
    }

    /// <summary>
    /// Record a completed sync operation in a single call.
    /// </summary>
    public static void RecordSyncOperation(string connectorName, bool success, double durationSeconds, long recordCount)
    {
        var tags = new TagList
        {
            { "connector_name", connectorName },
            { "status", success ? "success" : "failure" }
        };

        SyncOperationsTotal.Add(1, tags);
        SyncDurationSeconds.Record(durationSeconds, tags);
        SyncRecordsProcessed.Add(recordCount, tags);
    }

    /// <summary>
    /// Record a completed ETL run in a single call.
    /// </summary>
    public static void RecordEtlRun(string sourceSystem, bool success, double durationSeconds, long recordCount)
    {
        var tags = new TagList
        {
            { "source_system", sourceSystem },
            { "status", success ? "success" : "failure" }
        };

        EtlRunsTotal.Add(1, tags);
        EtlRunDurationSeconds.Record(durationSeconds, tags);
        EtlRecordsTotal.Add(recordCount, tags);

        if (!success)
            EtlStepFailures.Add(1, tags);
    }
}
