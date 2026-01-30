// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TerraFusion SystemGPT Diagnostic Models
// Phase 15: SystemGPT Console - AI Control Center for County Tech Leads
// Phase 17: Safe Mode & Kill Switch
// Phase 18: Benton CAMA RAG Readiness Panel
// Phase 19: AI Incident Timeline
// Phase 20: Metrics & Telemetry Console
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

namespace TerraFusion.AI.Models
{
    /// <summary>
    /// SystemGPT operational mode.
    /// Phase 17: Safe Mode allows county tech leads to constrain AI behavior during incidents.
    /// </summary>
    public enum SystemGptMode
    {
        /// <summary>Normal operation - all AI features enabled.</summary>
        Normal = 0,

        /// <summary>Safe Mode - AI constrained, mutating operations blocked.</summary>
        SafeMode = 1
    }

    /// <summary>
    /// Response model for the SystemGPT Diagnostics endpoint.
    /// Provides a consolidated view of the TerraFusion AI subsystem health.
    /// </summary>
    public class SystemDiagnosticsResponse
    {
        /// <summary>
        /// Phase 22: County identifier for this diagnostics snapshot.
        /// </summary>
        public string CountyId { get; set; } = "benton";

        /// <summary>
        /// Phase 22: County display name.
        /// </summary>
        public string CountyName { get; set; } = "Benton County";

        /// <summary>
        /// Phase 22: Whether this county has full AI/RAG services configured.
        /// </summary>
        public bool CountyConfigured { get; set; } = true;

        /// <summary>
        /// Overall system health status.
        /// </summary>
        public SystemHealthStatus OverallHealth { get; set; } = SystemHealthStatus.Unknown;

        /// <summary>
        /// Current SystemGPT operational mode (Phase 17).
        /// </summary>
        public SystemGptMode Mode { get; set; } = SystemGptMode.Normal;

        /// <summary>
        /// Human-readable reason if Safe Mode is active (Phase 17).
        /// </summary>
        public string? ModeReason { get; set; }

        /// <summary>
        /// Who/what changed the mode last (Phase 17).
        /// </summary>
        public string? ModeChangedBy { get; set; }

        /// <summary>
        /// When the mode was last changed (Phase 17).
        /// </summary>
        public DateTime? ModeChangedAt { get; set; }

        /// <summary>
        /// Timestamp of this diagnostics snapshot.
        /// </summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Registered GPT configurations.
        /// </summary>
        public List<GptConfigSummary> GptConfigs { get; set; } = new();

        /// <summary>
        /// Embedding service status.
        /// </summary>
        public EmbeddingServiceStatus EmbeddingStatus { get; set; } = new();

        /// <summary>
        /// RAG datasets and their index status.
        /// </summary>
        public List<RagDatasetSummary> RagDatasets { get; set; } = new();

        /// <summary>
        /// ExplainGPT service status.
        /// </summary>
        public ServiceStatus ExplainGptStatus { get; set; } = new();

        /// <summary>
        /// Usage statistics.
        /// </summary>
        public UsageStatistics Statistics { get; set; } = new();

        /// <summary>
        /// Herald banner summary (last diagnostic messages).
        /// </summary>
        public List<HeraldMessage> HeraldMessages { get; set; } = new();

        /// <summary>
        /// Phase 18: Benton CAMA RAG readiness status.
        /// County-specific RAG health for the Benton County demo story.
        /// </summary>
        public BentonRagReadinessDto? BentonRag { get; set; }

        /// <summary>
        /// Phase 26: Last guardrail decision for this county.
        /// Shows the most recent guardrail evaluation result.
        /// </summary>
        public LastGuardrailDecisionDto? LastGuardrailDecision { get; set; }
    }

    /// <summary>
    /// Overall system health indicator.
    /// </summary>
    public enum SystemHealthStatus
    {
        Unknown = 0,
        Healthy = 1,
        Degraded = 2,
        Unhealthy = 3
    }

    /// <summary>
    /// Summary of a registered GPT configuration.
    /// </summary>
    public class GptConfigSummary
    {
        /// <summary>
        /// Unique key for this GPT (e.g., "PropertyAssessmentGPT").
        /// </summary>
        public string Key { get; set; } = string.Empty;

        /// <summary>
        /// Display name.
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Whether this GPT is enabled.
        /// </summary>
        public bool Enabled { get; set; }

        /// <summary>
        /// Model being used (e.g., "gpt-4", "simulated").
        /// </summary>
        public string Model { get; set; } = string.Empty;

        /// <summary>
        /// Whether RAG is enabled for this GPT.
        /// </summary>
        public bool RagEnabled { get; set; }

        /// <summary>
        /// Count of conversations using this GPT.
        /// </summary>
        public int ConversationCount { get; set; }
    }

    /// <summary>
    /// Status of the embedding service.
    /// </summary>
    public class EmbeddingServiceStatus
    {
        /// <summary>
        /// Current embedding mode.
        /// </summary>
        public string Mode { get; set; } = "Unknown";

        /// <summary>
        /// Whether the service is available.
        /// </summary>
        public bool Available { get; set; }

        /// <summary>
        /// Embedding dimensions (1536 for OpenAI, varies for others).
        /// </summary>
        public int Dimensions { get; set; }

        /// <summary>
        /// Provider name (e.g., "OpenAI", "Simulated").
        /// </summary>
        public string Provider { get; set; } = string.Empty;

        /// <summary>
        /// Last successful embedding timestamp.
        /// </summary>
        public DateTime? LastSuccess { get; set; }
    }

    /// <summary>
    /// Summary of a RAG dataset.
    /// </summary>
    public class RagDatasetSummary
    {
        /// <summary>
        /// Dataset key (e.g., "benton_cama_basics").
        /// </summary>
        public string Key { get; set; } = string.Empty;

        /// <summary>
        /// Display name.
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Whether the dataset is indexed.
        /// </summary>
        public bool Indexed { get; set; }

        /// <summary>
        /// Number of documents in the dataset.
        /// </summary>
        public int DocumentCount { get; set; }

        /// <summary>
        /// Number of embeddings generated.
        /// </summary>
        public int EmbeddingCount { get; set; }

        /// <summary>
        /// Last index timestamp.
        /// </summary>
        public DateTime? LastIndexed { get; set; }

        /// <summary>
        /// Index health status.
        /// </summary>
        public string Status { get; set; } = "Unknown";
    }

    /// <summary>
    /// Generic service status.
    /// </summary>
    public class ServiceStatus
    {
        /// <summary>
        /// Whether the service is healthy.
        /// </summary>
        public bool Healthy { get; set; }

        /// <summary>
        /// Service status message.
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Last check timestamp.
        /// </summary>
        public DateTime? LastCheck { get; set; }

        /// <summary>
        /// Response time in milliseconds.
        /// </summary>
        public int? ResponseTimeMs { get; set; }
    }

    /// <summary>
    /// Usage statistics for the AI subsystem.
    /// </summary>
    public class UsageStatistics
    {
        /// <summary>
        /// Total number of conversations.
        /// </summary>
        public int TotalConversations { get; set; }

        /// <summary>
        /// Total number of messages.
        /// </summary>
        public int TotalMessages { get; set; }

        /// <summary>
        /// Total audit records.
        /// </summary>
        public int AuditRecordCount { get; set; }

        /// <summary>
        /// Total RAG trace entries.
        /// </summary>
        public int RagTraceCount { get; set; }

        /// <summary>
        /// Messages in the last 24 hours.
        /// </summary>
        public int MessagesLast24h { get; set; }

        /// <summary>
        /// Conversations in the last 24 hours.
        /// </summary>
        public int ConversationsLast24h { get; set; }
    }

    /// <summary>
    /// Herald diagnostic message.
    /// </summary>
    public class HeraldMessage
    {
        /// <summary>
        /// Message severity level.
        /// </summary>
        public string Level { get; set; } = "Info";

        /// <summary>
        /// Message text.
        /// </summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>
        /// Timestamp of the message.
        /// </summary>
        public DateTime Timestamp { get; set; }

        /// <summary>
        /// Source component.
        /// </summary>
        public string Source { get; set; } = string.Empty;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // Phase 17: Safe Mode Request/Response DTOs
    // ═══════════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Request to set SystemGPT operational mode (Phase 17).
    /// </summary>
    public class SetSystemGptModeRequest
    {
        /// <summary>
        /// True to enable Safe Mode, false to return to Normal.
        /// </summary>
        public bool Enabled { get; set; }

        /// <summary>
        /// Required when enabling Safe Mode - explains why it's being activated.
        /// </summary>
        public string? Reason { get; set; }
    }

    /// <summary>
    /// Response after setting SystemGPT mode (Phase 17).
    /// </summary>
    public class SetSystemGptModeResponse
    {
        /// <summary>
        /// Whether the operation succeeded.
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Current mode after the operation.
        /// </summary>
        public SystemGptMode Mode { get; set; }

        /// <summary>
        /// Mode reason (if Safe Mode is active).
        /// </summary>
        public string? ModeReason { get; set; }

        /// <summary>
        /// Who changed the mode.
        /// </summary>
        public string? ChangedBy { get; set; }

        /// <summary>
        /// When the mode was changed.
        /// </summary>
        public DateTime ChangedAt { get; set; }

        /// <summary>
        /// Status message.
        /// </summary>
        public string Message { get; set; } = string.Empty;
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // Phase 18: Benton CAMA RAG Readiness DTOs
    // County-specific RAG health for the Benton County demo story.
    // "Is the Benton CAMA RAG brain ready, fresh, and indexed?"
    // ═══════════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Benton CAMA RAG overall status indicator.
    /// </summary>
    public enum BentonRagStatus
    {
        /// <summary>Fully indexed and up-to-date.</summary>
        Ready,

        /// <summary>Data older than threshold (e.g., 7 days).</summary>
        Stale,

        /// <summary>No documents or embeddings present.</summary>
        Unindexed,

        /// <summary>Some documents missing embeddings.</summary>
        Partial
    }

    /// <summary>
    /// Phase 18: Benton CAMA RAG readiness status for SystemGPT Console.
    /// Provides county-specific visibility into the RAG brain health.
    /// </summary>
    public sealed class BentonRagReadinessDto
    {
        /// <summary>
        /// Dataset key (e.g., "benton_cama_basics").
        /// </summary>
        public string DatasetKey { get; init; } = "benton_cama_basics";

        /// <summary>
        /// Human-friendly display name.
        /// </summary>
        public string DisplayName { get; init; } = "Benton CAMA Basics";

        /// <summary>
        /// Whether the dataset is fully indexed (docs and embeddings present).
        /// </summary>
        public bool IsIndexed { get; init; }

        /// <summary>
        /// True if documents exist but embeddings are incomplete.
        /// </summary>
        public bool IsPartiallyIndexed { get; init; }

        /// <summary>
        /// Number of documents in the dataset.
        /// </summary>
        public int DocumentCount { get; init; }

        /// <summary>
        /// Number of embeddings (chunks) generated.
        /// </summary>
        public int EmbeddingCount { get; init; }

        /// <summary>
        /// Last document ingestion timestamp.
        /// </summary>
        public DateTimeOffset? LastIngestAt { get; init; }

        /// <summary>
        /// Last embedding index timestamp.
        /// </summary>
        public DateTimeOffset? LastIndexAt { get; init; }

        /// <summary>
        /// Overall readiness status.
        /// </summary>
        public BentonRagStatus OverallStatus { get; init; } = BentonRagStatus.Unindexed;

        /// <summary>
        /// Human-readable explanation of the status.
        /// </summary>
        public string? StatusReason { get; init; }

        /// <summary>
        /// List of GPT configs that use this RAG dataset.
        /// </summary>
        public List<string> ActiveGptConfigs { get; init; } = new();
    }

    /// <summary>
    /// Phase 18: Benton CAMA RAG snapshot for export.
    /// Downloadable audit artifact with full context.
    /// </summary>
    public sealed class BentonRagSnapshotDto
    {
        /// <summary>
        /// Snapshot generation timestamp.
        /// </summary>
        public DateTimeOffset GeneratedAtUtc { get; init; } = DateTimeOffset.UtcNow;

        /// <summary>
        /// TerraFusion OS version.
        /// </summary>
        public string TerraFusionVersion { get; init; } = "1.0.0";

        /// <summary>
        /// Benton CAMA RAG readiness data.
        /// </summary>
        public BentonRagReadinessDto Readiness { get; init; } = new();

        /// <summary>
        /// GPT configurations actively using Benton CAMA RAG.
        /// </summary>
        public List<string> ActiveGptConfigsUsingRag { get; init; } = new();

        /// <summary>
        /// Any health warnings related to this dataset.
        /// </summary>
        public List<string> HealthWarnings { get; init; } = new();

        /// <summary>
        /// Snapshot metadata.
        /// </summary>
        public BentonRagSnapshotMetadata Metadata { get; init; } = new();
    }

    /// <summary>
    /// Metadata for Benton RAG snapshot.
    /// </summary>
    public sealed class BentonRagSnapshotMetadata
    {
        /// <summary>
        /// County identifier.
        /// </summary>
        public string CountyCode { get; init; } = "benton";

        /// <summary>
        /// County display name.
        /// </summary>
        public string CountyName { get; init; } = "Benton County, WA";

        /// <summary>
        /// Snapshot type identifier.
        /// </summary>
        public string SnapshotType { get; init; } = "BentonCamaRagReadiness";

        /// <summary>
        /// Export format version for forward compatibility.
        /// </summary>
        public string FormatVersion { get; init; } = "1.0";
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // Phase 19: SystemGPT AI Incident Timeline DTOs
    // Chronological list of key AI events for audit and visibility.
    // ═══════════════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Phase 19: Kind of SystemGPT event for the incident timeline.
    /// </summary>
    public enum SystemGptEventKind
    {
        /// <summary>Unknown event type.</summary>
        Unknown = 0,

        /// <summary>Safe Mode was enabled or disabled.</summary>
        SafeModeChanged = 1,

        /// <summary>RAG dataset was reindexed.</summary>
        RagReindexed = 2,

        /// <summary>RAG health status changed (Ready/Stale/Partial/Unindexed).</summary>
        RagHealthChanged = 3,

        /// <summary>AI health snapshot was downloaded.</summary>
        HealthSnapshotDownloaded = 4,

        /// <summary>Benton CAMA RAG snapshot was downloaded.</summary>
        BentonRagSnapshotDownloaded = 5,

        /// <summary>Herald warning message.</summary>
        HeraldWarning = 6,

        /// <summary>Herald error message.</summary>
        HeraldError = 7
    }

    /// <summary>
    /// Phase 19: DTO representing a single AI system event for the incident timeline.
    /// </summary>
    public sealed class SystemGptEventDto
    {
        /// <summary>
        /// UTC timestamp when the event occurred.
        /// </summary>
        public DateTimeOffset TimestampUtc { get; init; }

        /// <summary>
        /// Kind/category of the event.
        /// </summary>
        public SystemGptEventKind Kind { get; init; }

        /// <summary>
        /// Severity level: "info", "warning", or "error".
        /// </summary>
        public string Severity { get; init; } = "info";

        /// <summary>
        /// Short summary/title of the event.
        /// </summary>
        public string Summary { get; init; } = string.Empty;

        /// <summary>
        /// Optional longer description or context.
        /// </summary>
        public string? Details { get; init; }

        /// <summary>
        /// Actor who triggered the event (username, "system", or null).
        /// </summary>
        public string? Actor { get; init; }

        /// <summary>
        /// Optional correlation/trace ID for linking related events.
        /// </summary>
        public string? CorrelationId { get; init; }
    }

    #region Phase 20: Metrics & Telemetry

    /// <summary>
    /// Phase 20: A single data point in a metrics time series.
    /// </summary>
    public sealed class SystemGptMetricSeriesPoint
    {
        /// <summary>UTC timestamp for this data point.</summary>
        public DateTimeOffset TimestampUtc { get; init; }

        /// <summary>The metric value at this timestamp.</summary>
        public double Value { get; init; }
    }

    /// <summary>
    /// Phase 20: A named time series of metric values (for sparkline charts).
    /// </summary>
    public sealed class SystemGptMetricSeries
    {
        /// <summary>Metric name, e.g. "gpt_latency_ms_p95".</summary>
        public string Name { get; init; } = string.Empty;

        /// <summary>Unit of measurement, e.g. "ms", "req/min", "%".</summary>
        public string Unit { get; init; } = string.Empty;

        /// <summary>Data points for the time series.</summary>
        public IReadOnlyList<SystemGptMetricSeriesPoint> Points { get; init; } = Array.Empty<SystemGptMetricSeriesPoint>();
    }

    /// <summary>
    /// Phase 20: Comprehensive metrics snapshot for the SystemGPT Telemetry Console.
    /// Answers: "How fast is GPT?", "What's our error rate?", "How busy is the AI?"
    /// </summary>
    public sealed class SystemGptMetricsSnapshotDto
    {
        /// <summary>Phase 22: County identifier for this metrics snapshot.</summary>
        public string CountyId { get; init; } = "benton";

        /// <summary>Phase 22: County display name.</summary>
        public string CountyName { get; init; } = "Benton County";

        /// <summary>Phase 22: Whether this county has full AI/RAG services configured.</summary>
        public bool CountyConfigured { get; init; } = true;

        /// <summary>When this snapshot was generated.</summary>
        public DateTimeOffset GeneratedAtUtc { get; init; }

        /// <summary>Time window in minutes that this snapshot covers.</summary>
        public int WindowMinutes { get; init; }

        // ─────────────────────────────────────────────────────────────────────
        // High-level stats (quick display cards)
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>GPT completion latency - 50th percentile (median) in ms.</summary>
        public double GptLatencyMsP50 { get; init; }

        /// <summary>GPT completion latency - 95th percentile in ms.</summary>
        public double GptLatencyMsP95 { get; init; }

        /// <summary>RAG retrieval latency - 95th percentile in ms.</summary>
        public double RagLatencyMsP95 { get; init; }

        /// <summary>Embedding generation latency - 95th percentile in ms.</summary>
        public double EmbeddingLatencyMsP95 { get; init; }

        /// <summary>Average requests per minute in the window.</summary>
        public double RequestsPerMinute { get; init; }

        /// <summary>Error rate as a percentage (0–100).</summary>
        public double ErrorRatePercent { get; init; }

        /// <summary>Total requests in the window.</summary>
        public long TotalRequests { get; init; }

        /// <summary>Total input tokens processed in the window.</summary>
        public long TotalTokensIn { get; init; }

        /// <summary>Total output tokens generated in the window.</summary>
        public long TotalTokensOut { get; init; }

        // ─────────────────────────────────────────────────────────────────────
        // Time series for sparkline charts
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>Time series data for charting (latency, throughput, errors over time).</summary>
        public IReadOnlyList<SystemGptMetricSeries> Series { get; init; } = Array.Empty<SystemGptMetricSeries>();

        // ─────────────────────────────────────────────────────────────────────
        // Phase 21: Capacity Prediction & Advisory
        // ─────────────────────────────────────────────────────────────────────

        /// <summary>Phase 21: Capacity prediction and advisory for county tech leads.</summary>
        public SystemGptCapacityPredictionDto? Capacity { get; init; }
    }

    #region Phase 21: Capacity Prediction & Advisory

    /// <summary>
    /// Phase 21: Saturation risk level for capacity planning.
    /// </summary>
    public enum SaturationRiskLevel
    {
        /// <summary>System operating within normal parameters.</summary>
        Low = 0,

        /// <summary>Moderate load with rising metrics - monitor closely.</summary>
        Medium = 1,

        /// <summary>Approaching saturation - action recommended.</summary>
        High = 2
    }

    /// <summary>
    /// Phase 21: Capacity prediction and advisory for the SystemGPT Console.
    /// Answers: "Are we trending towards saturation?", "What should we do about it?"
    /// </summary>
    public sealed class SystemGptCapacityPredictionDto
    {
        /// <summary>Current saturation risk level: "Low", "Medium", or "High".</summary>
        public string SaturationRisk { get; init; } = "Low";

        /// <summary>Predicted requests per minute in approximately 5 minutes.</summary>
        public double PredictedRequestsPerMinuteIn5Min { get; init; }

        /// <summary>True if GPT latency is trending upward.</summary>
        public bool LatencyIncreasing { get; init; }

        /// <summary>True if error rate is trending upward.</summary>
        public bool ErrorRateIncreasing { get; init; }

        /// <summary>True if RAG latency is trending upward.</summary>
        public bool RagLatencyIncreasing { get; init; }

        /// <summary>Human-readable advisory for the county tech lead.</summary>
        public string? Advisory { get; init; }
    }

    #endregion

    #endregion

    // ═══════════════════════════════════════════════════════════════════════════════
    // Phase 23: SystemGPT Federated Overview (Multi-County Dashboard)
    // Aggregates all counties' SystemGPT status into a read-only overview.
    // ═══════════════════════════════════════════════════════════════════════════════

    #region Phase 23: Federated Overview

    /// <summary>
    /// Phase 23: Per-county health overview for the Federated Dashboard.
    /// Provides a snapshot of each county's SystemGPT operational status.
    /// </summary>
    public sealed class SystemGptCountyOverviewDto
    {
        /// <summary>County code (e.g., "benton", "yakima", "franklin").</summary>
        public string CountyId { get; init; } = string.Empty;

        /// <summary>Display name (e.g., "Benton County").</summary>
        public string CountyName { get; init; } = string.Empty;

        /// <summary>Whether this county has full AI/RAG services configured.</summary>
        public bool Configured { get; init; }

        /// <summary>Overall system health: "Healthy", "Degraded", "Unhealthy", or "Unknown".</summary>
        public string Health { get; init; } = "Unknown";

        /// <summary>Capacity risk level: "Low", "Medium", "High", or "Unknown".</summary>
        public string CapacityRisk { get; init; } = "Unknown";

        /// <summary>GPT latency P95 in milliseconds (-1 if unavailable).</summary>
        public double P95LatencyMs { get; init; } = -1;

        /// <summary>Error rate percentage in the last metrics window (-1 if unavailable).</summary>
        public double ErrorRatePercent { get; init; } = -1;

        /// <summary>Benton RAG readiness: "Ready", "Stale", "Partial", "Unindexed", or "Unknown".</summary>
        public string RagStatus { get; init; } = "Unknown";

        /// <summary>SystemGPT operational mode: "Normal", "SafeMode", or "Unknown".</summary>
        public string AiMode { get; init; } = "Unknown";

        /// <summary>Optional human-readable note (e.g., "Not configured", "Placeholder").</summary>
        public string? Note { get; init; }
    }

    /// <summary>
    /// Phase 23: Federated overview response containing all counties.
    /// </summary>
    public sealed class SystemGptFederatedOverviewResponse
    {
        /// <summary>Timestamp when this overview was generated.</summary>
        public DateTimeOffset GeneratedAtUtc { get; init; } = DateTimeOffset.UtcNow;

        /// <summary>Total number of counties in the federation.</summary>
        public int TotalCounties { get; init; }

        /// <summary>Number of fully configured counties.</summary>
        public int ConfiguredCounties { get; init; }

        /// <summary>Per-county overview list.</summary>
        public IReadOnlyList<SystemGptCountyOverviewDto> Counties { get; init; } = Array.Empty<SystemGptCountyOverviewDto>();
    }

    #endregion
}
