// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TerraFusion SystemGPT Diagnostic Models
// Phase 15: SystemGPT Console - AI Control Center for County Tech Leads
// Phase 17: Safe Mode & Kill Switch
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
}
