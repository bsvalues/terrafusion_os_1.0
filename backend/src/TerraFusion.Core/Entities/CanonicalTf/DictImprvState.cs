using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): TerraFusion-native canonical
/// dictionary for the PACS improvement-state code domain
/// (<c>imprv_state_cd</c>).
///
/// <para>Per <c>docs/pacs/blocks-d-through-h-design.md</c> §E:
/// closes the fourth of six dictionaries listed in the design.
/// Mirrors <see cref="DictNeighborhood"/> exactly.</para>
///
/// <para>Sovereign-county isolation: <see cref="ImprvStateCd"/>
/// is unique within <see cref="CountyId"/>.</para>
/// </summary>
public sealed class DictImprvState
{
    public Guid DictImprvStateId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Required.</summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// PACS <c>imprv_state_cd</c> verbatim. Up to 10 chars.
    /// </summary>
    public string ImprvStateCd { get; set; } = string.Empty;

    /// <summary>Free-text description of the improvement-state code. Optional.</summary>
    public string? Description { get; set; }

    /// <summary>Soft-retire flag.</summary>
    public bool IsActive { get; set; } = true;

    // ── Provenance ──────────────────────────────────────────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
