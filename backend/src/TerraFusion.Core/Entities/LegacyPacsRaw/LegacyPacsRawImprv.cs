using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// Slice C1-A: raw PACS <c>imprv</c> landing zone.
///
/// <para>The PACS doctrine: <c>imprv</c> is the per-improvement
/// snapshot — one row per improvement (structure / mobile home /
/// outbuilding) attached to a parcel. Identity is the 4-key
/// composite <c>(prop_val_yr, sup_num, prop_id, imprv_id)</c>.
/// One parcel can have many improvements (e.g. main house +
/// detached garage + shop), which become distinct rows here.</para>
///
/// <para><see cref="ImprvTypeCd"/> is the closed dictionary code
/// (R = residential, MH = mobile home, etc). The full secondary-
/// feature breakdown lives in the <c>imprv_detail</c> table (C1-B)
/// and the per-attribute values in <c>imprv_attr</c> (C1-C). This
/// row is the parent.</para>
///
/// <para>Provenance is non-negotiable: <see cref="LoadBatchId"/> +
/// <see cref="SourceQueryHash"/> on every landed row.</para>
/// </summary>
public sealed class LegacyPacsRawImprv
{
    /// <summary>Synthetic landing-row id.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity (the 4-key composite) ────────────────
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long ImprvId { get; set; }

    // ── Type / classification ────────────────────────────────────
    /// <summary>Improvement type code (R, MH, etc). PACS dictionary.</summary>
    public string? ImprvTypeCd { get; set; }

    /// <summary>State classification code.</summary>
    public string? ImprvStateCd { get; set; }

    /// <summary>Class code (size/quality classification).</summary>
    public string? ImprvClassCd { get; set; }

    /// <summary>Homesite flag ('Y'/'N'). PACS preserves the source CHAR.</summary>
    public string? ImprvHomesite { get; set; }

    // ── Value + description ───────────────────────────────────────
    public decimal? ImprvVal { get; set; }
    public string? ImprvDesc { get; set; }

    // ── Year-built fields (three flavors per PACS) ───────────────
    /// <summary>Calendar year construction completed.</summary>
    public short? YearBuilt { get; set; }

    /// <summary>Effective year for depreciation (post-renovation adjustment).</summary>
    public short? EffectiveYearBuilt { get; set; }

    /// <summary>Actual original construction year.</summary>
    public short? ActualYearBuilt { get; set; }

    // ── Provenance (the doctrine's non-negotiable surface) ────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}
