using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): TerraFusion-native canonical
/// dictionary for the PACS exemption-type code domain
/// (<c>exmpt_type_cd</c>).
///
/// <para>Per <c>docs/pacs/blocks-d-through-h-design.md</c> §E:
/// closes the fifth of six dictionaries listed in the design.
/// Mirrors <see cref="DictNeighborhood"/> exactly.</para>
///
/// <para>Sovereign-county isolation: <see cref="ExemptionTypeCd"/>
/// is unique within <see cref="CountyId"/>.</para>
/// </summary>
public sealed class DictExemptionType
{
    public Guid DictExemptionTypeId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Required.</summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// PACS <c>exmpt_type_cd</c> verbatim. Up to 10 chars.
    /// </summary>
    public string ExemptionTypeCd { get; set; } = string.Empty;

    /// <summary>Free-text description of the exemption type. Optional.</summary>
    public string? Description { get; set; }

    /// <summary>Soft-retire flag.</summary>
    public bool IsActive { get; set; } = true;

    // ── Provenance ──────────────────────────────────────────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
