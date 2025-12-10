// ═══════════════════════════════════════════════════════════════════════════════
// 🗺️ TerraFusion SystemGPT Atlas Models
// Phase 28: Map-Based AI Health Visualization
// "See the health of your AI valuation fleet across counties in a single glance."
// Government. Transcended.
// ═══════════════════════════════════════════════════════════════════════════════

namespace TerraFusion.AI.Models;

/// <summary>
/// Phase 28: Atlas node representing a county in the map visualization.
/// Aggregates health, capacity, RAG, drift, and guardrail signals.
/// </summary>
public sealed class SystemGptAtlasNodeDto
{
    /// <summary>County code (e.g., "benton", "yakima", "franklin").</summary>
    public string CountyId { get; init; } = string.Empty;

    /// <summary>Display name (e.g., "Benton County").</summary>
    public string CountyName { get; init; } = string.Empty;

    // ─────────────────────────────────────────────────────────────────────────
    // Core Signals
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>Overall system health: "Healthy", "Degraded", "Unhealthy", or "Unknown".</summary>
    public string Health { get; init; } = "Unknown";

    /// <summary>Capacity risk level: "Low", "Medium", "High", or "Unknown".</summary>
    public string CapacityRisk { get; init; } = "Low";

    /// <summary>RAG status: "Ready", "Partial", "Unindexed", "Stale", or "Unknown".</summary>
    public string RagStatus { get; init; } = "Unknown";

    /// <summary>Whether SystemGPT is configured for this county.</summary>
    public bool Configured { get; init; }

    // ─────────────────────────────────────────────────────────────────────────
    // Fleet / Drift Signals
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>Fleet-level RAG drift risk classification for this node: "Low", "Medium", "High".</summary>
    public string FleetRagDriftRisk { get; init; } = "Low";

    /// <summary>Short message if this county contributes to drift.</summary>
    public string? FleetRagNote { get; init; }

    // ─────────────────────────────────────────────────────────────────────────
    // Guardrail Signals
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>True if the last guardrail decision was a deny.</summary>
    public bool RecentGuardrailDeny { get; init; }

    /// <summary>True if guardrails recently recommended safe mode.</summary>
    public bool RecentSafeModeRecommended { get; init; }

    // ─────────────────────────────────────────────────────────────────────────
    // UI Layout Hints
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>Pseudo-map X coordinate (0–1) for positioning.</summary>
    public double? MapX { get; init; }

    /// <summary>Pseudo-map Y coordinate (0–1) for positioning.</summary>
    public double? MapY { get; init; }
}

/// <summary>
/// Phase 28: Atlas response containing all county nodes for map visualization.
/// </summary>
public sealed class SystemGptAtlasResponseDto
{
    /// <summary>Timestamp when this atlas was generated.</summary>
    public DateTimeOffset GeneratedAtUtc { get; init; } = DateTimeOffset.UtcNow;

    /// <summary>All county nodes for the map.</summary>
    public IReadOnlyList<SystemGptAtlasNodeDto> Nodes { get; init; } = Array.Empty<SystemGptAtlasNodeDto>();

    /// <summary>Total number of counties in the federation.</summary>
    public int TotalCounties { get; init; }

    /// <summary>Number of counties with SystemGPT configured.</summary>
    public int ConfiguredCounties { get; init; }

    /// <summary>Number of counties in Healthy status.</summary>
    public int HealthyCounties { get; init; }
}
