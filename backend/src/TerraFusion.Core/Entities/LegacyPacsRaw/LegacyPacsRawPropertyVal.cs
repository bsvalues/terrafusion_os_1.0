using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// SYNC-DOCTRINE-4-IMPL-V4: raw PACS <c>property_val</c> landing zone.
///
/// <para>The PACS doctrine: <c>property_val</c> is the per-year,
/// per-supplement valuation row — keyed by
/// <c>(prop_val_yr, sup_num, prop_id)</c>. One physical parcel
/// (<c>dbo.property</c>) maps to many <c>property_val</c> rows
/// (one per (year, supplement) revision). The supp-aware filter
/// lives on <c>prop_supp_assoc</c>; this layer preserves verbatim.</para>
///
/// <para>SYNC-DOCTRINE-4 reads <see cref="PropertyUseCd"/> for the
/// universe classifier — it lets <c>REAL_COMMERCIAL</c>'s EXCLUDE
/// rule discriminate between residential and commercial code sets
/// among <c>prop_type_cd='R'</c> parcels. Earlier slices (V1/V2/V3)
/// passed NULL for property_use_cd because the column wasn't being
/// landed; V4 closes that gap.</para>
///
/// <para>Lifecycle: <see cref="PropInactiveDt"/> lives here (not on
/// <c>dbo.property</c>) — operator-supplied PACS doctrine confirms
/// active-vs-retired parcel state is determined per-supp-year on
/// this row. Future slices may consume it for parcel-spine retire
/// logic.</para>
///
/// <para>Provenance is non-negotiable: <see cref="LoadBatchId"/> +
/// <see cref="SourceQueryHash"/> on every landed row.</para>
/// </summary>
public sealed class LegacyPacsRawPropertyVal
{
    /// <summary>Synthetic landing-row id.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity (the 3-key composite) ────────────────
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }

    // ── Type / classification ────────────────────────────────────
    /// <summary>
    /// PACS <c>property_val.property_use_cd</c>. Closed vocabulary;
    /// Benton uses 11/12/13/14/18 for residential variants and
    /// distinct codes for commercial / industrial / agricultural.
    /// Used by SYNC-DOCTRINE-4 REAL_COMMERCIAL EXCLUDE rule.
    /// </summary>
    public string? PropertyUseCd { get; set; }

    // ── Lifecycle ────────────────────────────────────────────────
    /// <summary>
    /// PACS <c>property_val.prop_inactive_dt</c>. NULL when the
    /// parcel is active for this (year, supplement). Reserved for
    /// future slices that filter inactive parcels.
    /// </summary>
    public DateTime? PropInactiveDt { get; set; }

    // ── Provenance (the doctrine's non-negotiable surface) ────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}
