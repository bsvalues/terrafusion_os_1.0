using System;

namespace TerraFusion.Core.Entities.TruthPacs;

/// <summary>
/// ASSESSMENT-VALUE-SEAL (2026-06-07): doctrine-promoted current
/// assessment value, one live row per (PropId, AssessmentYear) at the
/// ACTIVE supplement.
///
/// <para>PACS doctrine (proven, mirrors the Owner sup_num lesson):
/// <c>property_val</c> is per-(year, supplement). The CURRENT value for
/// a parcel-year is the row at the ACTIVE supplement =
/// MAX(<c>sup_num</c>) for that (prop_id, prop_val_yr) — NOT
/// <c>sup_num=0</c>. For the 2025 operational year, 1,041 of 95,455
/// parcel-years carry a non-zero active supplement; taking sup=0 would
/// land a stale assessed value for those.</para>
///
/// <para>Scope: current operational year only (the first
/// Assessment Value Seal). Full 1968-2026 history is a deliberately
/// deferred follow-on "Assessment Value History" lane.</para>
///
/// <para>Identity is TF-native (<see cref="TruthAssessmentId"/>); the
/// PACS keys are the natural key used for idempotent clear-then-insert.
/// Lineage back to the landed row is non-negotiable.</para>
/// </summary>
public sealed class TruthPacsAssessmentCurrent
{
    public Guid TruthAssessmentId { get; set; } = Guid.NewGuid();

    // ── PACS natural key (supp-aware) ─────────────────────────────
    public int PropId { get; set; }
    public short AssessmentYear { get; set; }
    public short SupNum { get; set; }

    // ── Assessment values (verbatim from the active-supplement row) ─
    public decimal? AssessedVal { get; set; }
    public decimal? AppraisedVal { get; set; }
    public decimal? MarketVal { get; set; }
    public decimal? LandHstdVal { get; set; }
    public decimal? LandNonHstdVal { get; set; }
    public decimal? ImprvHstdVal { get; set; }
    public decimal? ImprvNonHstdVal { get; set; }
    public decimal? AgUseVal { get; set; }
    public decimal? AgMarketVal { get; set; }
    public decimal? TimberUseVal { get; set; }
    public decimal? TimberMarketVal { get; set; }
    public decimal? HsCapNewVal { get; set; }
    public decimal? HsCapPrevVal { get; set; }

    /// <summary>Classification link (property_use_cd), carried for downstream join.</summary>
    public string? PropertyUseCd { get; set; }

    // ── Lineage (doctrine traceback) ──────────────────────────────
    public Guid SourcePropertyValLandedRowId { get; set; }
    public Guid PropertyValLoadBatchId { get; set; }
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>Conversion-era marker derived from AssessmentYear.</summary>
    public string? ConversionEra { get; set; }

    public DateTime PromotedAt { get; set; } = DateTime.UtcNow;
}
