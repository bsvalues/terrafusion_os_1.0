using System;

namespace TerraFusion.Core.Entities.TruthPacs;

/// <summary>
/// Slice S2-B: supp-aware-validated PACS sale row. The middle
/// layer of the doctrine —
/// <c>legacy_pacs_raw.sale</c> JOIN <c>legacy_pacs_raw.prop_supp_assoc</c>.
///
/// <para>SYNC-DOCTRINE-2 (B2): the qualification filter is no longer
/// a single hardcoded constant. Two parallel ratio studies are
/// modeled, both written to every truth row:</para>
/// <list type="bullet">
///   <item><see cref="DorRatioQualified"/> — qualified for the
///   Washington DoR ratio study (<c>sale.sl_ratio_type_cd='00'</c>
///   per <c>tf_doctrine_ratio_policy</c>).</item>
///   <item><see cref="CountyRatioReviewed"/> /
///   <see cref="CountyRatioQualified"/> — Benton internal ratio
///   study (started ~2018; uses <c>sale.sl_county_ratio_cd</c>).</item>
/// </list>
/// <para>The raw <see cref="CountyRatioCode"/> and
/// <see cref="CountyRatioDescription"/> from
/// <c>dbo.county_ratio_code</c> are preserved verbatim so canonical
/// consumers can apply ad-hoc policies without re-querying PACS.</para>
///
/// <para>Pre-DOCTRINE-2 invariant — that <see cref="SlCountyRatioCd"/>
/// was always <c>"100"</c> by construction — is REMOVED. Truth rows
/// now exist for sales that fail one or both qualification surfaces;
/// canonical projection (S3) decides what to do with them.</para>
///
/// <para>Two invariants still hold:
/// <list type="number">
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

    /// <summary>
    /// Raw <c>sale.sl_county_ratio_cd</c> verbatim from PACS. NULL
    /// allowed (most-recent sales sit at NULL until the county
    /// reviews them). Pre-DOCTRINE-2 this column was always
    /// <c>"100"</c> by construction; with the policy table in B1 +
    /// promoter rewire in B2 this is now the unfiltered raw value.
    /// </summary>
    public string? SlCountyRatioCd { get; set; }

    // ── SYNC-DOCTRINE-2: dual-surface qualification ───────────────
    /// <summary>
    /// True if the sale qualifies for the Washington DoR ratio study
    /// per <c>tf_doctrine_ratio_policy</c> (<c>StudyName='DOR_RATIO'</c>,
    /// effective always, qualifier <c>sl_ratio_type_cd='00'</c>).
    /// </summary>
    public bool DorRatioQualified { get; set; }

    /// <summary>
    /// True if the county has assigned ANY <c>sl_county_ratio_cd</c>
    /// value (i.e. the county study has reviewed this sale). NULL
    /// codes mean "not yet reviewed". Independent of
    /// <see cref="CountyRatioQualified"/>: a sale can be reviewed
    /// and rejected ('200', '300', etc.).
    /// </summary>
    public bool CountyRatioReviewed { get; set; }

    /// <summary>
    /// True if the sale qualifies for the Benton internal ratio
    /// study per <c>tf_doctrine_ratio_policy</c>
    /// (<c>StudyName='COUNTY_INTERNAL_RATIO'</c>, effective 2018+,
    /// qualifier <c>sl_county_ratio_cd='100'</c>; excluded codes
    /// 200/300/400/500). False for pre-2018 sales by design — the
    /// county study did not exist as a formal program before then.
    /// </summary>
    public bool CountyRatioQualified { get; set; }

    /// <summary>
    /// Raw county ratio code. Same as <see cref="SlCountyRatioCd"/>
    /// (denormalized for canonical-consumer convenience).
    /// </summary>
    public string? CountyRatioCode { get; set; }

    /// <summary>
    /// Human-readable description joined from
    /// <c>dbo.county_ratio_code.ratio_desc</c>. e.g. <c>"Valid Sale"</c>,
    /// <c>"Invalid Sale"</c>, <c>"Land Only Sale"</c>. NULL when
    /// the code itself is unknown or NULL.
    /// </summary>
    public string? CountyRatioDescription { get; set; }

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
