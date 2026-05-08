using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice E1 (Phase 2 closure): TerraFusion-native canonical
/// dictionary for the PACS land-use code domain
/// (<c>land_use_cd</c>).
///
/// <para>Per <c>docs/pacs/blocks-d-through-h-design.md</c> §E:
/// "E1 canonical_tf.dict_* for: land use code, land state code,
/// neighborhood (hood_cd), improvement type, improvement state,
/// exemption type, situs/legal codes." This row mirrors
/// <see cref="DictNeighborhood"/> exactly for the
/// <c>land_use_cd</c> code domain.</para>
///
/// <para>Sovereign-county isolation: <see cref="LandUseCd"/> is
/// unique within <see cref="CountyId"/>, but the same code string
/// may carry different meanings across counties. Cross-county
/// joins on <see cref="LandUseCd"/> alone are a doctrine
/// violation; always pair with <see cref="CountyId"/>.</para>
///
/// <para>Provenance: every row carries <see cref="LoadBatchId"/>
/// + <see cref="SourceQueryHash"/>, the same provenance shape used
/// by every other PACS-fed entity in the doctrine.</para>
///
/// <para>Lifecycle: rows are never hard-deleted. Setting
/// <see cref="IsActive"/> = false soft-retires a code so that
/// historical references still resolve while new ingestion stops
/// surfacing the code in active panels.</para>
///
/// <para>What this slice does NOT do: no projector currently
/// consumes this dictionary. E1 is a schema lock, not a runtime
/// gate. Operator-driven seeding is a separate slice.</para>
/// </summary>
public sealed class DictLandUse
{
    public Guid DictLandUseId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Required.</summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// PACS <c>land_use_cd</c> verbatim. Up to 10 chars to
    /// accommodate the longest county-defined codes.
    /// </summary>
    public string LandUseCd { get; set; } = string.Empty;

    /// <summary>Free-text description of the land-use code. Optional.</summary>
    public string? Description { get; set; }

    /// <summary>
    /// Soft-retire flag. False = retired but historically valid;
    /// True = currently in use. Rows are never hard-deleted.
    /// </summary>
    public bool IsActive { get; set; } = true;

    // ── Provenance (every PACS-fed row carries this) ─────────────
    /// <summary>The dictionary-loader LoadBatch that produced this row.</summary>
    public Guid LoadBatchId { get; set; }

    /// <summary>
    /// Stable hash of the SELECT statement that pulled this row
    /// from the source PACS dictionary table.
    /// </summary>
    public string SourceQueryHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
