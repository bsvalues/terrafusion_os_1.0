using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): TerraFusion-native canonical
/// dictionary for the PACS improvement-type code domain
/// (<c>imprv_type_cd</c>).
///
/// <para>Per <c>docs/pacs/blocks-d-through-h-design.md</c> §E:
/// closes the third of six dictionaries listed in the design.
/// Real Benton codes the operator already references include
/// <c>CovPatio</c>, <c>ATTGAR</c>, <c>MA</c>, <c>BSMT</c>,
/// <c>POLEBLDG</c>, <c>DETGAR</c>, <c>POOL</c>. Schema is locked
/// here; operator-driven seeding is a separate slice.</para>
///
/// <para>Sovereign-county isolation: <see cref="ImprvTypeCd"/> is
/// unique within <see cref="CountyId"/>.</para>
/// </summary>
public sealed class DictImprvType
{
    public Guid DictImprvTypeId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Required.</summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// PACS <c>imprv_type_cd</c> verbatim. Up to 10 chars; the
    /// canonical <c>tf_improvement.ImprvTypeCd</c> column caps at
    /// 8 but Benton's PACS dictionary domain spans up to 10.
    /// </summary>
    public string ImprvTypeCd { get; set; } = string.Empty;

    /// <summary>Free-text description of the improvement type. Optional.</summary>
    public string? Description { get; set; }

    /// <summary>Soft-retire flag.</summary>
    public bool IsActive { get; set; } = true;

    // ── Provenance ──────────────────────────────────────────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
