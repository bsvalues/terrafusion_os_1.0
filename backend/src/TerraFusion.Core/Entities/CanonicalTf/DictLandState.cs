using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): TerraFusion-native canonical
/// dictionary for the PACS land-state code domain
/// (<c>land_state_cd</c>).
///
/// <para>Per <c>docs/pacs/blocks-d-through-h-design.md</c> §E:
/// closes the second of six dictionaries listed in the design.
/// This row mirrors <see cref="DictNeighborhood"/> exactly for the
/// <c>land_state_cd</c> code domain.</para>
///
/// <para>Sovereign-county isolation: <see cref="LandStateCd"/> is
/// unique within <see cref="CountyId"/>; the same code may carry
/// different meanings across counties.</para>
///
/// <para>Provenance: every row carries <see cref="LoadBatchId"/>
/// + <see cref="SourceQueryHash"/>.</para>
///
/// <para>Lifecycle: rows are never hard-deleted. Setting
/// <see cref="IsActive"/> = false soft-retires a code.</para>
/// </summary>
public sealed class DictLandState
{
    public Guid DictLandStateId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Required.</summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// PACS <c>land_state_cd</c> verbatim. Up to 10 chars to
    /// accommodate the longest county-defined codes.
    /// </summary>
    public string LandStateCd { get; set; } = string.Empty;

    /// <summary>Free-text description of the land-state code. Optional.</summary>
    public string? Description { get; set; }

    /// <summary>Soft-retire flag.</summary>
    public bool IsActive { get; set; } = true;

    // ── Provenance ──────────────────────────────────────────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
