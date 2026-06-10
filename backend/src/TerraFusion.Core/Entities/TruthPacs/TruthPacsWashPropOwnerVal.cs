using System;

namespace TerraFusion.Core.Entities.TruthPacs;

/// <summary>
/// Slice B2-B: supp-aware-validated WSDOR-grade per-owner value
/// snapshot. The middle layer of Block B's WSDOR sub-doctrine —
/// <c>legacy_pacs_raw.wash_prop_owner_val</c> JOIN
/// <c>legacy_pacs_raw.prop_supp_assoc</c>, filtered to the active
/// supplement.
///
/// <para>Two invariants hold by construction:
/// <list type="number">
///   <item><see cref="SupNum"/> matches the active supp pointer for
///   <see cref="PropId"/>/<see cref="PropValYr"/> at promotion time.</item>
///   <item>Lineage to BOTH source raw batches is preserved
///   (<see cref="SourceWpovLandedRowId"/> +
///   <see cref="SourceSuppAssocLandedRowId"/>).</item>
/// </list>
/// </para>
///
/// <para>Doctrine: this is NOT canonical. The canonical WSDOR roll
/// (B4 — <c>canonical_tf.tf_assessment_wsdor</c>) is a separate
/// future slice. truth_pacs.wash_prop_owner_val is a stepping
/// stone, not a destination.</para>
/// </summary>
public sealed class TruthPacsWashPropOwnerVal
{
    public Guid TruthWpovId { get; set; } = Guid.NewGuid();

    // ── PACS-side identity (the supp-aware-validated 4-key) ──────
    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long OwnerId { get; set; }

    // ── Core WSDOR values (preserved verbatim) ───────────────────
    public decimal? AssessedVal { get; set; }
    public decimal? MarketVal { get; set; }
    public decimal? AppraisedVal { get; set; }
    public decimal? TaxableClassified { get; set; }
    public decimal? TaxableNonClassified { get; set; }
    public decimal? LandTaxableClassified { get; set; }
    public decimal? LandTaxableNonClassified { get; set; }
    public decimal? ImprvTaxableClassified { get; set; }
    public decimal? ImprvTaxableNonClassified { get; set; }
    public decimal? StateValueClassified { get; set; }
    public decimal? StateValueNonClassified { get; set; }

    public string? BoeStatus { get; set; }
    public decimal? DisasterProrationPct { get; set; }
    public decimal? SnrFrzImprvHs { get; set; }
    public decimal? SnrFrzLandHs { get; set; }

    // ── Lineage (the doctrine's traceback) ────────────────────────
    public Guid SourceWpovLandedRowId { get; set; }
    public Guid SourceSuppAssocLandedRowId { get; set; }

    public Guid WpovLoadBatchId { get; set; }
    public Guid SuppAssocLoadBatchId { get; set; }

    /// <summary>Truth-promotion LoadBatch (the B2-B batch).</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>
    /// Slice G1 (v1.10): conversion-era marker derived from
    /// <see cref="PropValYr"/> at promotion time. See
    /// <see cref="ConversionEras"/>. Nullable for back-compat.
    /// </summary>
    public string? ConversionEra { get; set; }

    public DateTime PromotedAt { get; set; } = DateTime.UtcNow;
}
