using System;

namespace TerraFusion.Core.Entities.TruthPacs;

/// <summary>
/// Slice S2-B: supp-aware-validated, qualification-filtered PACS
/// sale row. The middle layer of the doctrine —
/// <c>legacy_pacs_raw.sale</c> JOIN <c>legacy_pacs_raw.prop_supp_assoc</c>
/// FILTER <c>sl_county_ratio_cd = '100'</c>.
///
/// <para>Three invariants hold by construction:
/// <list type="number">
///   <item><see cref="SlCountyRatioCd"/> is always <c>"100"</c>.</item>
///   <item><see cref="SupNum"/> matches the active supplement pointer
///   for <see cref="PropId"/> / <see cref="PropValYr"/> at promotion
///   time.</item>
///   <item>Lineage to BOTH source raw batches is preserved
///   (<see cref="SourceSaleLandedRowId"/> +
///   <see cref="SourceSuppAssocLandedRowId"/>) so any truth row can
///   be traced back to its raw origins without ambiguity.</item>
/// </list>
/// </para>
///
/// <para>Doctrine: this is NOT canonical. <c>canonical_tf.tf_sale</c>
/// is S3, with its own GUID identity and <c>sync_bridge.source_xref</c>
/// row. Truth-pacs is a stepping stone, not a destination.</para>
/// </summary>
public sealed class TruthPacsSale
{
    /// <summary>
    /// Truth-layer surrogate id. Not the canonical TF identity —
    /// that's <c>canonical_tf.tf_sale.tf_sale_id</c> in S3.
    /// </summary>
    public Guid TruthSaleId { get; set; } = Guid.NewGuid();

    // ── PACS supp-aware-validated identity ────────────────────────
    public long ChgOfOwnerId { get; set; }
    public int PropId { get; set; }
    public short PropValYr { get; set; }
    public short SupNum { get; set; }

    // ── Qualification (always '100' by construction) ─────────────
    public string SlCountyRatioCd { get; set; } = "100";

    // ── Sale economics ────────────────────────────────────────────
    public DateTime? SlDt { get; set; }
    public decimal? SlPrice { get; set; }
    public decimal? AdjSlPrice { get; set; }

    // ── Lineage (the doctrine's traceback) ────────────────────────
    /// <summary>FK-style pointer to <c>legacy_pacs_raw.sale.LandedRowId</c>.</summary>
    public Guid SourceSaleLandedRowId { get; set; }

    /// <summary>FK-style pointer to <c>legacy_pacs_raw.prop_supp_assoc.LandedRowId</c>.</summary>
    public Guid SourceSuppAssocLandedRowId { get; set; }

    /// <summary>Sale-side LoadBatch (the S1 batch this truth row was promoted from).</summary>
    public Guid SaleLoadBatchId { get; set; }

    /// <summary>Supp-assoc-side LoadBatch (the S2-A batch).</summary>
    public Guid SuppAssocLoadBatchId { get; set; }

    /// <summary>Truth-promotion LoadBatch.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    /// <summary>
    /// Slice G1 (v1.10): conversion-era marker derived from
    /// <see cref="PropValYr"/> at promotion time. See
    /// <see cref="ConversionEras"/>. Nullable for back-compat.
    /// </summary>
    public string? ConversionEra { get; set; }

    public DateTime PromotedAt { get; set; } = DateTime.UtcNow;
}
