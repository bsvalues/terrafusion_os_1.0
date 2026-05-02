using System;

namespace TerraFusion.Core.Entities.TruthPacs;

/// <summary>
/// Slice L2: supp-aware-validated current land segment snapshot.
///
/// <para>The middle layer of Block C's land doctrine —
/// <c>legacy_pacs_raw.land_detail</c> JOIN
/// <c>legacy_pacs_raw.prop_supp_assoc</c>, filtered to the active
/// supplement.</para>
///
/// <para>Two invariants hold by construction:
/// <list type="number">
///   <item><see cref="SupNum"/> matches the active supp pointer for
///   <see cref="PropId"/>/<see cref="PropValYr"/> at promotion time.</item>
///   <item>Lineage to BOTH source raw rows is preserved
///   (<see cref="SourceLandLandedRowId"/> +
///   <see cref="SourceSuppAssocLandedRowId"/>).</item>
/// </list>
/// </para>
///
/// <para>Doctrine: this is NOT canonical. Land-use normalization,
/// ag-schedule math, and the Benton Method calibration all happen
/// at canonical layer (L3 — <c>canonical_tf.tf_land</c>) or beyond.
/// truth_pacs.land_current is a stepping stone, not a destination.</para>
/// </summary>
public sealed class TruthPacsLandCurrent
{
    public Guid TruthLandId { get; set; } = Guid.NewGuid();

    // ── PACS-side identity (the supp-aware-validated 4-key) ──────
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long LandSegId { get; set; }

    // ── Type / classification (preserved verbatim) ───────────────
    public string? LandSegTypeCd { get; set; }
    public string? LandSegStateCd { get; set; }
    public string? LandSegClassCd { get; set; }
    public string? LandSegUseCd { get; set; }
    public string? SoilCd { get; set; }
    public string? LandSegHomesite { get; set; }

    // ── Size + value (preserved verbatim) ────────────────────────
    public decimal? SizeAcres { get; set; }
    public decimal? SizeSquareFeet { get; set; }
    public decimal? LandSegMarketVal { get; set; }
    public decimal? LandSegAgValue { get; set; }
    public decimal? LandSegAssessedVal { get; set; }
    public short? LandSegEffAge { get; set; }

    // ── Lineage (the doctrine's traceback) ────────────────────────
    public Guid SourceLandLandedRowId { get; set; }
    public Guid SourceSuppAssocLandedRowId { get; set; }

    public Guid LandLoadBatchId { get; set; }
    public Guid SuppAssocLoadBatchId { get; set; }

    /// <summary>Truth-promotion LoadBatch (the L2 batch).</summary>
    public Guid PromotionLoadBatchId { get; set; }

    public DateTime PromotedAt { get; set; } = DateTime.UtcNow;
}
