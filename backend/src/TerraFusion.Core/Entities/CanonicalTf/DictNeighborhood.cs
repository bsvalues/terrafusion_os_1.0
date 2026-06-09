using System;

namespace TerraFusion.Core.Entities.CanonicalTf;

/// <summary>
/// Slice E1: TerraFusion-native canonical dictionary for the
/// <c>hood_cd</c> domain — neighborhood / market-area code as
/// recognized by the operator.
///
/// <para>Per the Block-C contract v1.1 addendum
/// (<c>docs/pacs/block-c-contract-v1.1.md</c>) and per the
/// post-Block-C execution spine
/// (<c>docs/pacs/blocks-d-through-h-design.md</c>) §E1, this is
/// the first canonical dictionary table. It locks the closed
/// vocabulary that downstream slices (operator dashboard panels
/// in Block F, neighborhood ratio studies, valuation calibration
/// loops) will dereference.</para>
///
/// <para>Sovereign-county isolation: <see cref="HoodCd"/> is unique
/// within <see cref="CountyId"/>, but the same <see cref="HoodCd"/>
/// string can appear in multiple counties with different meanings.
/// Cross-county joins on <see cref="HoodCd"/> alone are a doctrine
/// violation; always pair with <see cref="CountyId"/>.</para>
///
/// <para>Provenance: every row carries <see cref="LoadBatchId"/>
/// + <see cref="SourceQueryHash"/>, the same provenance shape used
/// by every other PACS-fed entity in the doctrine.</para>
///
/// <para>Lifecycle: rows are never hard-deleted. Setting
/// <see cref="IsActive"/> = false soft-retires a code so that
/// historical references (sales, valuations) still resolve while
/// new ingestion stops surfacing the code in active panels.</para>
///
/// <para>What E1 does NOT do: no projector currently consumes
/// this dictionary. The closed-vocabulary quarantine path
/// (<c>UNKNOWN_NEIGHBORHOOD</c> in <c>legacy_tf_unproven.*</c>)
/// is deferred to the slice that wires a hood_cd-aware projector.
/// E1 is a schema lock, not a runtime gate.</para>
/// </summary>
public sealed class DictNeighborhood
{
    public Guid DictNeighborhoodId { get; set; } = Guid.NewGuid();

    /// <summary>Sovereign-county isolation. Required.</summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// PACS <c>hood_cd</c> verbatim. Up to 10 chars to accommodate
    /// the longest Benton hood codes; tighter limit risks data
    /// loss across counties.
    /// </summary>
    public string HoodCd { get; set; } = string.Empty;

    /// <summary>Operator-friendly display name. Optional in v1.</summary>
    public string? HoodName { get; set; }

    /// <summary>Free-text description. Optional.</summary>
    public string? HoodDescription { get; set; }

    /// <summary>
    /// Optional grouping / category (e.g. "URBAN", "RURAL", "AG",
    /// "COMMERCIAL"). Used by the ratio-study skeleton in F5.
    /// </summary>
    public string? HoodGroupCd { get; set; }

    /// <summary>
    /// Soft-retire flag. False = retired but historically valid;
    /// True = currently in use by ingestion + panels. Rows are
    /// never hard-deleted.
    /// </summary>
    public bool IsActive { get; set; } = true;

    // ── Provenance (every PACS-fed row carries this) ─────────────
    /// <summary>
    /// The dictionary-loader LoadBatch that produced this row.
    /// </summary>
    public Guid LoadBatchId { get; set; }

    /// <summary>
    /// Stable hash of the SELECT statement that pulled this row
    /// from the source PACS dictionary table.
    /// </summary>
    public string SourceQueryHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
