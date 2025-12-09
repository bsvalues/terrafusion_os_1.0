// ═══════════════════════════════════════════════════════════════════════════════
// 🏥 TerraFusion SystemGPT Health Evaluator
// Phase 15.4: Herald Threshold Rules - Early Warning System
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services
{
    /// <summary>
    /// Evaluates AI subsystem health and generates Herald messages based on thresholds.
    /// Phase 15.4: Transforms SystemGPT Console from dashboard to early warning system.
    /// </summary>
    public interface ISystemGptHealthEvaluator
    {
        /// <summary>
        /// Evaluate the current diagnostics snapshot and generate Herald messages.
        /// </summary>
        /// <param name="diagnostics">Current diagnostics snapshot</param>
        /// <returns>Updated diagnostics with evaluated health and Herald messages</returns>
        SystemDiagnosticsResponse EvaluateHealth(SystemDiagnosticsResponse diagnostics);
    }

    /// <summary>
    /// Default implementation of SystemGPT health evaluation.
    /// Applies threshold rules to generate Herald warnings/errors.
    /// </summary>
    public class SystemGptHealthEvaluator : ISystemGptHealthEvaluator
    {
        private readonly ILogger<SystemGptHealthEvaluator> _logger;

        // ═══════════════════════════════════════════════════════════════
        // THRESHOLD CONFIGURATION
        // ═══════════════════════════════════════════════════════════════

        /// <summary>
        /// High activity threshold for 24-hour message count.
        /// Above this triggers an info Herald message.
        /// </summary>
        public int HighActivityThreshold { get; set; } = 100;

        /// <summary>
        /// Very high activity threshold for 24-hour message count.
        /// Above this triggers a warning Herald message.
        /// </summary>
        public int VeryHighActivityThreshold { get; set; } = 500;

        /// <summary>
        /// Minimum expected embedding dimensions for production mode.
        /// OpenAI uses 1536; values below indicate simulated mode.
        /// </summary>
        public int MinProductionEmbeddingDimensions { get; set; } = 1536;

        public SystemGptHealthEvaluator(ILogger<SystemGptHealthEvaluator> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <inheritdoc />
        public SystemDiagnosticsResponse EvaluateHealth(SystemDiagnosticsResponse diagnostics)
        {
            var messages = new List<HeraldMessage>();
            var overallHealth = SystemHealthStatus.Healthy;

            // ═══════════════════════════════════════════════════════════════
            // RULE 1: RAG Index + Simulated Embeddings Warning
            // ═══════════════════════════════════════════════════════════════
            var unindexedDatasets = diagnostics.RagDatasets
                .Where(d => !d.Indexed)
                .Select(d => d.Name)
                .ToList();

            if (unindexedDatasets.Any())
            {
                var isSimulated = diagnostics.EmbeddingStatus.Mode == "Simulated" ||
                                  diagnostics.EmbeddingStatus.Dimensions < MinProductionEmbeddingDimensions;

                if (isSimulated)
                {
                    messages.Add(new HeraldMessage
                    {
                        Level = "Warning",
                        Message = $"RAG not fully indexed ({unindexedDatasets.Count} dataset(s)). " +
                                  "Simulated embeddings active - run 'make gpt-ingest' to index.",
                        Timestamp = DateTime.UtcNow,
                        Source = "HealthEvaluator"
                    });
                    overallHealth = SystemHealthStatus.Degraded;
                    _logger.LogWarning("RAG datasets not indexed with simulated embeddings: {Datasets}",
                        string.Join(", ", unindexedDatasets));
                }
                else
                {
                    messages.Add(new HeraldMessage
                    {
                        Level = "Warning",
                        Message = $"RAG not fully indexed ({unindexedDatasets.Count} dataset(s)). " +
                                  "Run 'make gpt-ingest' to index for optimal responses.",
                        Timestamp = DateTime.UtcNow,
                        Source = "HealthEvaluator"
                    });
                    overallHealth = SystemHealthStatus.Degraded;
                }
            }
            else if (diagnostics.RagDatasets.Any())
            {
                // All datasets indexed - good!
                messages.Add(new HeraldMessage
                {
                    Level = "Success",
                    Message = $"All RAG datasets indexed ({diagnostics.RagDatasets.Count} dataset(s) ready).",
                    Timestamp = DateTime.UtcNow,
                    Source = "HealthEvaluator"
                });
            }

            // ═══════════════════════════════════════════════════════════════
            // RULE 2: Embedding Service Mode Check
            // ═══════════════════════════════════════════════════════════════
            if (!diagnostics.EmbeddingStatus.Available)
            {
                messages.Add(new HeraldMessage
                {
                    Level = "Error",
                    Message = "Embedding service unavailable. AI responses will be degraded.",
                    Timestamp = DateTime.UtcNow,
                    Source = "HealthEvaluator"
                });
                overallHealth = SystemHealthStatus.Unhealthy;
            }
            else if (diagnostics.EmbeddingStatus.Mode == "Simulated")
            {
                messages.Add(new HeraldMessage
                {
                    Level = "Info",
                    Message = $"Embedding mode: Simulated ({diagnostics.EmbeddingStatus.Dimensions}D). " +
                              "Set OPENAI_API_KEY for production embeddings.",
                    Timestamp = DateTime.UtcNow,
                    Source = "HealthEvaluator"
                });
            }
            else
            {
                messages.Add(new HeraldMessage
                {
                    Level = "Success",
                    Message = $"Embedding mode: {diagnostics.EmbeddingStatus.Provider} " +
                              $"({diagnostics.EmbeddingStatus.Dimensions}D) - Production ready.",
                    Timestamp = DateTime.UtcNow,
                    Source = "HealthEvaluator"
                });
            }

            // ═══════════════════════════════════════════════════════════════
            // RULE 3: ExplainGPT Health Check
            // ═══════════════════════════════════════════════════════════════
            if (!diagnostics.ExplainGptStatus.Healthy)
            {
                messages.Add(new HeraldMessage
                {
                    Level = "Error",
                    Message = "ExplainGPT experiencing failures. Self-explaining features may be unavailable.",
                    Timestamp = DateTime.UtcNow,
                    Source = "HealthEvaluator"
                });
                overallHealth = SystemHealthStatus.Degraded;
            }

            // ═══════════════════════════════════════════════════════════════
            // RULE 4: GPT Configuration Health
            // ═══════════════════════════════════════════════════════════════
            var enabledGpts = diagnostics.GptConfigs.Count(g => g.Enabled);
            var totalGpts = diagnostics.GptConfigs.Count;

            if (totalGpts == 0)
            {
                messages.Add(new HeraldMessage
                {
                    Level = "Warning",
                    Message = "No GPT configurations registered. AI assistants unavailable.",
                    Timestamp = DateTime.UtcNow,
                    Source = "HealthEvaluator"
                });
                overallHealth = SystemHealthStatus.Degraded;
            }
            else if (enabledGpts == 0)
            {
                messages.Add(new HeraldMessage
                {
                    Level = "Warning",
                    Message = $"All {totalGpts} GPT configuration(s) disabled. Enable at least one for AI assistance.",
                    Timestamp = DateTime.UtcNow,
                    Source = "HealthEvaluator"
                });
                overallHealth = SystemHealthStatus.Degraded;
            }
            else
            {
                messages.Add(new HeraldMessage
                {
                    Level = "Success",
                    Message = $"{enabledGpts}/{totalGpts} GPT configuration(s) active and ready.",
                    Timestamp = DateTime.UtcNow,
                    Source = "HealthEvaluator"
                });
            }

            // ═══════════════════════════════════════════════════════════════
            // RULE 5: Activity Spike Detection
            // ═══════════════════════════════════════════════════════════════
            if (diagnostics.Statistics.MessagesLast24h > VeryHighActivityThreshold)
            {
                messages.Add(new HeraldMessage
                {
                    Level = "Warning",
                    Message = $"Very high GPT activity: {diagnostics.Statistics.MessagesLast24h} messages " +
                              $"in the last 24 hours. Monitor for rate limiting.",
                    Timestamp = DateTime.UtcNow,
                    Source = "HealthEvaluator"
                });
            }
            else if (diagnostics.Statistics.MessagesLast24h > HighActivityThreshold)
            {
                messages.Add(new HeraldMessage
                {
                    Level = "Info",
                    Message = $"High GPT activity: {diagnostics.Statistics.MessagesLast24h} messages " +
                              $"in the last 24 hours.",
                    Timestamp = DateTime.UtcNow,
                    Source = "HealthEvaluator"
                });
            }

            // ═══════════════════════════════════════════════════════════════
            // RULE 6: RAG-Enabled GPT Without Index
            // ═══════════════════════════════════════════════════════════════
            var ragEnabledGpts = diagnostics.GptConfigs.Where(g => g.RagEnabled && g.Enabled).ToList();
            if (ragEnabledGpts.Any() && unindexedDatasets.Any())
            {
                messages.Add(new HeraldMessage
                {
                    Level = "Warning",
                    Message = $"{ragEnabledGpts.Count} RAG-enabled GPT(s) active but RAG index incomplete. " +
                              "Responses may lack context.",
                    Timestamp = DateTime.UtcNow,
                    Source = "HealthEvaluator"
                });
            }

            // ═══════════════════════════════════════════════════════════════
            // FINAL: Apply evaluated health and messages
            // ═══════════════════════════════════════════════════════════════

            // Prepend evaluated messages to existing Herald messages
            diagnostics.HeraldMessages = messages.Concat(diagnostics.HeraldMessages).ToList();

            // Only downgrade health, never upgrade from existing evaluation
            if (overallHealth > diagnostics.OverallHealth)
            {
                diagnostics.OverallHealth = overallHealth;
            }

            _logger.LogInformation("Health evaluation complete: {Health}, {MessageCount} Herald messages",
                diagnostics.OverallHealth, messages.Count);

            return diagnostics;
        }
    }
}
