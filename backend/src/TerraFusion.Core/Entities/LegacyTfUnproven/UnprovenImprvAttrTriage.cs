using System;

namespace TerraFusion.Core.Entities.LegacyTfUnproven;

/// <summary>
/// SYNC-WORKBENCH-F: operator-decision sibling table for
/// <see cref="LegacyTfUnprovenImprvAttr"/>. Records the operator's
/// triage outcome — either <b>route</b> the quarantined attribute
/// to a target universe / dictionary code, or <b>dismiss</b> it as
/// noise / legitimately-missing / conversion artifact.
///
/// <para><b>Why a sibling table:</b> the doctrine-immutable
/// quarantine entity (<see cref="LegacyTfUnprovenImprvAttr"/>) is
/// frozen by C1-C contract. Operator decisions live here so the
/// raw quarantine row remains a faithful record of the landing-time
/// failure while triage state evolves over time.</para>
///
/// <para>One-to-one with <see cref="LegacyTfUnprovenImprvAttr"/> by
/// <see cref="UnprovenRowId"/> (unique index). Audit fields
/// (<see cref="CreatedAt"/>, <see cref="UpdatedAt"/>,
/// <see cref="CreatedBy"/>, <see cref="UpdatedBy"/>) are
/// auto-populated by <c>AuditableEntityInterceptor</c> — do NOT set
/// manually.</para>
/// </summary>
public sealed class UnprovenImprvAttrTriage
{
    /// <summary>Triage record identity.</summary>
    public Guid TriageId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// FK to <see cref="LegacyTfUnprovenImprvAttr.UnprovenRowId"/>.
    /// Unique — at most one triage decision per quarantine row.
    /// </summary>
    public Guid UnprovenRowId { get; set; }

    /// <summary>
    /// Triage status. One of <c>"Open"</c> (default — no decision),
    /// <c>"Routed"</c>, or <c>"Dismissed"</c>. The reader returns
    /// <c>"Open"</c> for any quarantine row without a triage record.
    /// </summary>
    public string Status { get; set; } = "Open";

    // ── Routed branch ───────────────────────────────────────────────
    /// <summary>
    /// Target universe for routed rows. One of
    /// <see cref="TerraFusion.Core.Sync.Doctrine.UniverseCodes"/>.
    /// NULL when <see cref="Status"/> is not <c>"Routed"</c>.
    /// </summary>
    public string? RoutedToUniverse { get; set; }

    /// <summary>
    /// Optional target IAttrValCd code within the routed universe's
    /// dictionary. NULL when the operator routes to a universe but
    /// declines to suggest a specific code.
    /// </summary>
    public string? RoutedToIAttrValCd { get; set; }

    // ── Dismissed branch ────────────────────────────────────────────
    /// <summary>
    /// Reason for dismissal. One of
    /// <c>"IntentionalNoise"</c>, <c>"LegitimateMissing"</c>,
    /// <c>"ConversionArtifact"</c>. NULL unless
    /// <see cref="Status"/> is <c>"Dismissed"</c>.
    /// </summary>
    public string? DismissalReason { get; set; }

    /// <summary>Free-form operator note (optional).</summary>
    public string? OperatorNote { get; set; }

    // ── Audit (auto-populated by AuditableEntityInterceptor) ────────
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
