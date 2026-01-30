// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TerraFusion RAG Fleet Readiness Models
// Phase 27: Multi-County RAG Fleet Readiness & Drift Detection
// "The moment TerraFusion becomes a regional valuation intelligence network."
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

namespace TerraFusion.AI.Models;

/// <summary>
/// Phase 27: Drift risk level for cross-county RAG comparison.
/// Indicates whether counties' RAG indexes are aligned or diverging.
/// </summary>
public enum RagFleetDriftRisk
{
    /// <summary>All configured counties have aligned RAG indexes.</summary>
    Low = 0,

    /// <summary>Moderate drift detected - some counties out of sync.</summary>
    Medium = 1,

    /// <summary>Significant drift - urgent attention recommended.</summary>
    High = 2
}

/// <summary>
/// Phase 27: Per-county RAG readiness snapshot for fleet comparison.
/// Provides the data needed to detect cross-county RAG drift.
/// </summary>
public sealed class RagCountyReadinessDto
{
    /// <summary>County code (e.g., "benton", "yakima", "franklin").</summary>
    public string CountyId { get; init; } = string.Empty;

    /// <summary>Display name (e.g., "Benton County").</summary>
    public string CountyName { get; init; } = string.Empty;

    /// <summary>Whether this county has RAG services configured.</summary>
    public bool Configured { get; init; }

    /// <summary>RAG status: "Ready", "Stale", "Partial", "Unindexed", or "Unknown".</summary>
    public string RagStatus { get; init; } = "Unknown";

    /// <summary>Number of documents in the RAG dataset (null if unknown/unconfigured).</summary>
    public int? DocumentCount { get; init; }

    /// <summary>Number of embeddings/chunks (null if unknown/unconfigured).</summary>
    public int? EmbeddingCount { get; init; }

    /// <summary>Last time the RAG index was updated (null if never/unknown).</summary>
    public DateTimeOffset? LastIndexedAtUtc { get; init; }

    /// <summary>Index age in hours (null if never indexed).</summary>
    public double? IndexAgeHours { get; init; }

    /// <summary>Optional note about this county's RAG status.</summary>
    public string? Note { get; init; }

    /// <summary>
    /// Factory method to create an unconfigured county placeholder.
    /// </summary>
    public static RagCountyReadinessDto Unconfigured(string countyId, string countyName) => new()
    {
        CountyId = countyId,
        CountyName = countyName,
        Configured = false,
        RagStatus = "Unknown",
        DocumentCount = null,
        EmbeddingCount = null,
        LastIndexedAtUtc = null,
        IndexAgeHours = null,
        Note = "RAG services not configured for this county"
    };
}

/// <summary>
/// Phase 27: RAG Fleet Readiness response containing cross-county comparison.
/// Detects drift and provides advisory for regional valuation governance.
/// </summary>
public sealed class RagFleetReadinessDto
{
    /// <summary>Timestamp when this readiness check was generated.</summary>
    public DateTimeOffset GeneratedAtUtc { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>Fleet-wide drift risk level.</summary>
    public RagFleetDriftRisk FleetDriftRisk { get; init; } = RagFleetDriftRisk.Low;

    /// <summary>Human-readable advisory explaining the drift status.</summary>
    public string Advisory { get; init; } = "Fleet RAG parity is healthy across all counties.";

    /// <summary>Per-county RAG readiness data for comparison.</summary>
    public IReadOnlyList<RagCountyReadinessDto> Counties { get; init; } = Array.Empty<RagCountyReadinessDto>();

    /// <summary>Total counties in the fleet.</summary>
    public int TotalCounties { get; init; }

    /// <summary>Number of counties with RAG configured.</summary>
    public int ConfiguredCounties { get; init; }

    /// <summary>Number of counties with RAG in "Ready" status.</summary>
    public int ReadyCounties { get; init; }

    /// <summary>Drift conditions detected (for diagnostics).</summary>
    public IReadOnlyList<string> DriftConditions { get; init; } = Array.Empty<string>();
}

/// <summary>
/// Phase 27: Summary fields for federated overview integration.
/// </summary>
public sealed class RagFleetSummaryDto
{
    /// <summary>Fleet-wide drift risk level.</summary>
    public RagFleetDriftRisk FleetRagDriftRisk { get; init; } = RagFleetDriftRisk.Low;

    /// <summary>Short summary of RAG fleet status.</summary>
    public string FleetRagSummary { get; init; } = "Fleet RAG parity is healthy.";
}
