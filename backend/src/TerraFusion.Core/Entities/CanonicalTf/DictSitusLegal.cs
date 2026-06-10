using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): TerraFusion-native canonical
/// dictionary for the PACS situs/legal code domain
/// (<c>situs_legal_cd</c>).
///
/// <para>Per <c>docs/pacs/blocks-d-through-h-design.md</c> §E:
/// closes the sixth (and final) dictionary listed in the design.
/// Mirrors <see cref="DictNeighborhood"/> exactly. The
/// "situs/legal" code domain unifies the PACS situs and legal
/// description code lookups under a single canonical handle.</para>
///
/// <para>Sovereign-county isolation: <see cref="SitusLegalCd"/>
/// is unique within <see cref="CountyId"/>.</para>
/// </summary>
public sealed class DictSitusLegal
{
    public Guid DictSitusLegalId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Required.</summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// PACS situs/legal code verbatim. Up to 10 chars to match
    /// the longest county-defined codes seen in this domain.
    /// </summary>
    public string SitusLegalCd { get; set; } = string.Empty;

    /// <summary>Free-text description of the situs/legal code. Optional.</summary>
    public string? Description { get; set; }

    /// <summary>Soft-retire flag.</summary>
    public bool IsActive { get; set; } = true;

    // ── Provenance ──────────────────────────────────────────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
