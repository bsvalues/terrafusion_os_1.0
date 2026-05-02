using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// Slice C1-B: raw PACS <c>imprv_detail</c> landing zone.
///
/// <para>The PACS doctrine: <c>imprv_detail</c> is the per-component
/// breakdown of an improvement. For a single residence, this table
/// carries rows like main living area (MA), basement (BSMT),
/// attached garage (ATTGAR), detached garage (DETGAR), covered
/// patio (COVPATIO), pole building (POLEBLDG), pool (POOL), etc.
/// Identity is the 5-key composite
/// <c>(prop_val_yr, sup_num, prop_id, imprv_id, imprv_det_id)</c>.</para>
///
/// <para><see cref="ImprvDetTypeCd"/> is the closed dictionary code
/// — the operator's "secondary feature" vocabulary. The full
/// dictionary cross-check (i_attr_val_cd validation against the
/// PACS dictionary table) is a future C1-C concern; this layer
/// preserves type codes verbatim.</para>
///
/// <para><see cref="ImprvDetVal"/> + <see cref="ImprvDetArea"/> are
/// the operator's per-component value and footprint. The Benton
/// Method's % of BIV (Base Improvement Value) calculation reads
/// these to derive secondary-feature contributions like patios = 3%,
/// basements = 13%, shops = 18%.</para>
///
/// <para>Provenance is non-negotiable: <see cref="LoadBatchId"/> +
/// <see cref="SourceQueryHash"/> on every landed row.</para>
/// </summary>
public sealed class LegacyPacsRawImprvDetail
{
    /// <summary>Synthetic landing-row id.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity (the 5-key composite) ────────────────
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long ImprvId { get; set; }
    public long ImprvDetId { get; set; }

    // ── Secondary-feature classification ─────────────────────────
    /// <summary>
    /// Detail-type code (ATTGAR, BSMT, COVPATIO, MA, POLEBLDG, etc).
    /// PACS dictionary; preserved verbatim.
    /// </summary>
    public string? ImprvDetTypeCd { get; set; }

    /// <summary>Calculation method code (e.g. residential cost approach).</summary>
    public string? ImprvDetMethCd { get; set; }

    /// <summary>Class code — size/quality classification.</summary>
    public string? ImprvDetClassCd { get; set; }

    /// <summary>Sub-class refinement.</summary>
    public string? ImprvDetSubClassCd { get; set; }

    /// <summary>Condition code (e.g. excellent, good, fair, poor).</summary>
    public string? ConditionCd { get; set; }

    // ── Quantity + value ─────────────────────────────────────────
    /// <summary>Square footage / area for this detail row.</summary>
    public decimal? ImprvDetArea { get; set; }

    /// <summary>Computed per-detail value.</summary>
    public decimal? ImprvDetVal { get; set; }

    /// <summary>Unit count (relevant for items like POOL, FIREPLACE).</summary>
    public int? NumUnits { get; set; }

    /// <summary>Year of construction for this detail (may differ from parent).</summary>
    public short? YrBuilt { get; set; }

    // ── Provenance (the doctrine's non-negotiable surface) ────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}
