// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TerraFusion SystemGPT Diagnostic Models
// Phase 15: SystemGPT Console - AI Control Center for County Tech Leads
// Phase 17: Safe Mode & Kill Switch
// Phase 18: Benton CAMA RAG Readiness Panel
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
}
