using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// Slice L1: raw PACS <c>land_detail</c> landing zone.
///
/// <para>The PACS doctrine: <c>land_detail</c> is the per-segment
/// land breakdown attached to a parcel. Identity is the 4-key
/// composite <c>(prop_val_yr, sup_num, prop_id, land_seg_id)</c>.
/// One parcel can have many land segments — for instance an
/// agricultural property might split into homesite + crop + pasture
/// + timber, each as a distinct <c>land_seg_id</c>.</para>
///
/// <para><see cref="LandSegTypeCd"/> is the closed dictionary code
/// (SFR, AG, CMRCL, etc) and <see cref="LandSegUseCd"/> further
/// classifies use category. The full dictionary cross-check is a
/// future slice; this layer preserves codes verbatim.</para>
///
/// <para><see cref="SizeAcres"/> + <see cref="LandSegMarketVal"/>
/// drive Block C's land-schedule calibration. The Benton operator
/// SQL (<c>appraise_hoods.sql</c>, <c>res_condensed.sql</c>) reads
/// these as the per-segment land value contribution.</para>
///
/// <para>Provenance is non-negotiable: <see cref="LoadBatchId"/> +
/// <see cref="SourceQueryHash"/> on every landed row.</para>
/// </summary>
public sealed class LegacyPacsRawLandDetail
{
    /// <summary>Synthetic landing-row id.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity (the 4-key composite) ────────────────
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long LandSegId { get; set; }

    // ── Type / classification ────────────────────────────────────
    /// <summary>Type code (SFR, AG, CMRCL, etc). PACS dictionary.</summary>
    public string? LandSegTypeCd { get; set; }

    /// <summary>State classification code.</summary>
    public string? LandSegStateCd { get; set; }

    /// <summary>Class code — size/quality classification.</summary>
    public string? LandSegClassCd { get; set; }

    /// <summary>Use code — categorical (homesite, crop, pasture, etc).</summary>
    public string? LandSegUseCd { get; set; }

    /// <summary>Soil code — agricultural soil classification.</summary>
    public string? SoilCd { get; set; }

    /// <summary>Homesite flag ('Y'/'N'). Preserved verbatim.</summary>
    public string? LandSegHomesite { get; set; }

    // ── Size + value ─────────────────────────────────────────────
    public decimal? SizeAcres { get; set; }
    public decimal? SizeSquareFeet { get; set; }

    public decimal? LandSegMarketVal { get; set; }
    public decimal? LandSegAgValue { get; set; }
    public decimal? LandSegAssessedVal { get; set; }

    /// <summary>Effective age (depreciation/accrual basis).</summary>
    public short? LandSegEffAge { get; set; }

    // ── Provenance (the doctrine's non-negotiable surface) ────────
    public Guid LoadBatchId { get; set; }
    public string SourceQueryHash { get; set; } = string.Empty;
    public string SourceRowHash { get; set; } = string.Empty;
    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}
