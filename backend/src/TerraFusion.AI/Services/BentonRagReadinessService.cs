// ═══════════════════════════════════════════════════════════════════════════════
// 🏛️ TerraFusion Benton CAMA RAG Readiness Service
// Phase 18: "Is the Benton CAMA RAG brain ready, fresh, and indexed?"
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

using Microsoft.Extensions.Logging;
using TerraFusion.AI.Interfaces;
using TerraFusion.AI.Models;

namespace TerraFusion.AI.Services;

/// <summary>
/// Service interface for Benton CAMA RAG readiness assessment.
/// Provides county-specific RAG health evaluation for the SystemGPT Console.
/// </summary>
public interface IBentonRagReadinessService
{
    /// <summary>
    /// Get the current readiness status of Benton CAMA RAG dataset.
    /// </summary>
    Task<BentonRagReadinessDto> GetReadinessAsync();

    /// <summary>
    /// Generate a full snapshot for export/audit.
    /// </summary>
    Task<BentonRagSnapshotDto> GenerateSnapshotAsync();

    /// <summary>
    /// Get Herald warnings for Benton RAG health issues.
    /// </summary>
    Task<List<HeraldMessage>> GetHealthWarningsAsync();
}

/// <summary>
/// Phase 18: Benton CAMA RAG Readiness Service implementation.
/// Evaluates the health and readiness of the Benton County CAMA RAG brain.
/// </summary>
public class BentonRagReadinessService : IBentonRagReadinessService
{
    private readonly IRAGService _ragService;
    private readonly ILogger<BentonRagReadinessService> _logger;

    /// <summary>
    /// Dataset key for Benton CAMA - stable identifier.
    /// </summary>
    public const string BentonDatasetKey = "benton_cama_basics";

    /// <summary>
    /// Display name for the dataset.
    /// </summary>
    public const string BentonDisplayName = "Benton CAMA Basics";

    /// <summary>
    /// Dataset ID in the database (1 is the primary Benton dataset).
    /// </summary>
    private const int BentonDatasetId = 1;

    /// <summary>
    /// Staleness threshold in days.
    /// </summary>
    private const int StalenessThresholdDays = 7;

    public BentonRagReadinessService(
        IRAGService ragService,
        ILogger<BentonRagReadinessService> logger)
    {
        _ragService = ragService ?? throw new ArgumentNullException(nameof(ragService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public async Task<BentonRagReadinessDto> GetReadinessAsync()
    {
        _logger.LogDebug("Evaluating Benton CAMA RAG readiness");

        try
        {
            // Try to get the dataset from RAG service
            var dataset = await _ragService.GetDatasetAsync(BentonDatasetId);

            if (dataset == null)
            {
                _logger.LogWarning("Benton CAMA dataset not found (ID: {DatasetId})", BentonDatasetId);
                return CreateUnindexedDto("Dataset not found in system.");
            }

            var docCount = dataset.DocumentCount;
            var embeddingCount = dataset.TotalChunks;
            var lastIndexed = dataset.LastIndexedAt;
            var lastUpdated = dataset.UpdatedAt;

            // Determine status
            var (status, reason) = EvaluateStatus(docCount, embeddingCount, lastIndexed, lastUpdated);

            var dto = new BentonRagReadinessDto
            {
                DatasetKey = BentonDatasetKey,
                DisplayName = dataset.Name ?? BentonDisplayName,
                IsIndexed = status == BentonRagStatus.Ready || status == BentonRagStatus.Stale,
                IsPartiallyIndexed = status == BentonRagStatus.Partial,
                DocumentCount = docCount,
                EmbeddingCount = embeddingCount,
                LastIngestAt = lastUpdated != default ? new DateTimeOffset(lastUpdated, TimeSpan.Zero) : null,
                LastIndexAt = lastIndexed.HasValue ? new DateTimeOffset(lastIndexed.Value, TimeSpan.Zero) : null,
                OverallStatus = status,
                StatusReason = reason,
                ActiveGptConfigs = new List<string> { "PropertyAssessmentGPT", "ExplainGPT" }
            };

            _logger.LogDebug("Benton CAMA RAG readiness: {Status} - {Reason}", status, reason);
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to evaluate Benton CAMA RAG readiness");
            return CreateUnindexedDto($"Error evaluating readiness: {ex.Message}");
        }
    }

    /// <inheritdoc />
    public async Task<BentonRagSnapshotDto> GenerateSnapshotAsync()
    {
        _logger.LogInformation("Generating Benton CAMA RAG snapshot for export");

        var readiness = await GetReadinessAsync();
        var warnings = await GetHealthWarningsAsync();

        return new BentonRagSnapshotDto
        {
            GeneratedAtUtc = DateTimeOffset.UtcNow,
            TerraFusionVersion = "1.0.0",
            Readiness = readiness,
            ActiveGptConfigsUsingRag = readiness.ActiveGptConfigs,
            HealthWarnings = warnings.Select(w => w.Message).ToList(),
            Metadata = new BentonRagSnapshotMetadata
            {
                CountyCode = "benton",
                CountyName = "Benton County, WA",
                SnapshotType = "BentonCamaRagReadiness",
                FormatVersion = "1.0"
            }
        };
    }

    /// <inheritdoc />
    public async Task<List<HeraldMessage>> GetHealthWarningsAsync()
    {
        var readiness = await GetReadinessAsync();
        var warnings = new List<HeraldMessage>();
        var now = DateTime.UtcNow;

        switch (readiness.OverallStatus)
        {
            case BentonRagStatus.Unindexed:
                warnings.Add(new HeraldMessage
                {
                    Level = "Warning",
                    Message = "Benton CAMA RAG dataset is unindexed — ExplainGPT and RAG responses may be incomplete.",
                    Source = "BentonRagReadiness",
                    Timestamp = now
                });
                break;

            case BentonRagStatus.Partial:
                warnings.Add(new HeraldMessage
                {
                    Level = "Warning",
                    Message = "Benton CAMA RAG embeddings are incomplete — similarity quality reduced.",
                    Source = "BentonRagReadiness",
                    Timestamp = now
                });
                break;

            case BentonRagStatus.Stale:
                var daysOld = readiness.LastIngestAt.HasValue
                    ? (int)(DateTimeOffset.UtcNow - readiness.LastIngestAt.Value).TotalDays
                    : -1;
                warnings.Add(new HeraldMessage
                {
                    Level = "Info",
                    Message = $"Benton CAMA RAG data may be stale (last ingest: {daysOld} days ago).",
                    Source = "BentonRagReadiness",
                    Timestamp = now
                });
                break;

            case BentonRagStatus.Ready:
                // No warnings for ready status
                break;
        }

        return warnings;
    }

    /// <summary>
    /// Evaluate the overall status based on document/embedding counts and timestamps.
    /// </summary>
    private (BentonRagStatus status, string reason) EvaluateStatus(
        int docCount,
        int embeddingCount,
        DateTime? lastIndexed,
        DateTime lastUpdated)
    {
        // No documents at all
        if (docCount <= 0)
        {
            return (BentonRagStatus.Unindexed, "No documents ingested for Benton CAMA.");
        }

        // Documents present but no embeddings
        if (embeddingCount <= 0)
        {
            return (BentonRagStatus.Unindexed, "Documents present but no embeddings created.");
        }

        // Partial embeddings (less than documents - rough heuristic)
        // Note: In reality, one doc can have multiple chunks, so this is approximate
        if (embeddingCount < docCount)
        {
            return (BentonRagStatus.Partial, "Some documents may be missing embeddings.");
        }

        // Check for staleness
        var referenceDate = lastIndexed ?? lastUpdated;
        var daysSinceUpdate = (DateTime.UtcNow - referenceDate).TotalDays;

        if (daysSinceUpdate > StalenessThresholdDays)
        {
            return (BentonRagStatus.Stale, $"Data older than {StalenessThresholdDays} days; consider re-ingesting.");
        }

        // All good
        return (BentonRagStatus.Ready, "Fully indexed and up-to-date.");
    }

    /// <summary>
    /// Create a DTO representing an unindexed state.
    /// </summary>
    private static BentonRagReadinessDto CreateUnindexedDto(string reason)
    {
        return new BentonRagReadinessDto
        {
            DatasetKey = BentonDatasetKey,
            DisplayName = BentonDisplayName,
            IsIndexed = false,
            IsPartiallyIndexed = false,
            DocumentCount = 0,
            EmbeddingCount = 0,
            LastIngestAt = null,
            LastIndexAt = null,
            OverallStatus = BentonRagStatus.Unindexed,
            StatusReason = reason,
            ActiveGptConfigs = new List<string>()
        };
    }
}
