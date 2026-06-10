using System;

namespace TerraFusion.Core.Entities.TruthPacs;

/// <summary>
/// Slice S2-B (SYNC-POP-4b): qualification-filtered, identity-stable
/// PACS parcel master row. The middle layer of the doctrine parcel
/// pipeline:
/// <c>legacy_pacs_raw.property → truth_pacs.parcel_spine → canonical_tf.tf_parcel</c>.
///
/// <para>Two invariants hold by construction:
/// <list type="number">
///   <item><see cref="PropTypeCd"/> is always <c>"R"</c> (real
///   property). The doctrine's downstream consumers — sale
///   projection, owner attachment, improvement aggregation — all
///   target real-property parcels. Personal-property and mobile-home
///   rows are intentionally NOT promoted to the spine; they remain
///   visible in <c>legacy_pacs_raw.property</c> for audit.</item>
///   <item>Lineage to the source raw batch is preserved
///   (<see cref="SourcePropertyLandedRowId"/> +
///   <see cref="PropertyLoadBatchId"/>) so any spine row can be
///   traced back to its raw origin without ambiguity.</item>
/// </list>
/// </para>
///
/// <para>Doctrine: this is NOT canonical. <c>canonical_tf.tf_parcel</c>
/// is S3, with its own GUID identity and <c>sync_bridge.source_xref</c>
/// row. Truth-pacs is a stepping stone, not a destination.</para>
///
/// <para>Lifecycle deferred: the doctrine intentionally does NOT join
/// <c>dbo.property_val.prop_inactive_dt</c> at this layer. Retired-
/// parcel filtering is a future refinement; for now the spine carries
/// every real-property parcel surfaced by the source batch.</para>
/// </summary>
public sealed class TruthPacsParcelSpine
{
    /// <summary>
    /// Truth-layer surrogate id. Not the canonical TF identity —
    /// that's <c>canonical_tf.tf_parcel.tf_parcel_id</c> in S3.
    /// </summary>
    public Guid TruthParcelId { get; set; } = Guid.NewGuid();

    // ── PACS identity ────────────────────────────────────────────
    /// <summary>The PACS parcel identity (stable across all PACS tables).</summary>
    public int PropId { get; set; }

    // ── Qualification (always 'R' by construction) ──────────────
    /// <summary>Always <c>"R"</c> — see class doctrine.</summary>
    public string PropTypeCd { get; set; } = "R";

    // ── Identifying surface (preserved verbatim) ─────────────────
    public string? GeoId { get; set; }
    public string? RefId1 { get; set; }
    public string? RefId2 { get; set; }
    public string? DbaName { get; set; }
    public string? AltDbaName { get; set; }
    public DateTime? PropCreateDt { get; set; }

    // ── Lineage (the doctrine's traceback) ───────────────────────
    /// <summary>FK-style pointer to <c>legacy_pacs_raw.property.LandedRowId</c>.</summary>
    public Guid SourcePropertyLandedRowId { get; set; }

    /// <summary>Property-side LoadBatch (the S1 batch this row was promoted from).</summary>
    public Guid PropertyLoadBatchId { get; set; }

    /// <summary>Truth-promotion LoadBatch.</summary>
    public Guid PromotionLoadBatchId { get; set; }

    public DateTime PromotedAt { get; set; } = DateTime.UtcNow;
}
