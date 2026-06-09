using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// Slice S1 (SYNC-POP-4a): raw PACS property/parcel master row landing
/// zone.
///
/// <para>Doctrine: this is the FIRST stop for PACS <c>dbo.property</c>
/// rows — the master parcel identity table that anchors every downstream
/// sale, owner, improvement, land, and value record. The doctrine
/// pipeline for parcels is:
/// <c>legacy_pacs_raw.property → truth_pacs.parcel_spine →
/// canonical_tf.tf_parcel + sync_bridge.source_xref</c>. Only S1 (raw
/// landing) is in scope for SYNC-POP-4a; S2-B and S3 are SYNC-POP-4b/c.</para>
///
/// <para>Identity preserved: <see cref="PropId"/> is the PACS parcel
/// identity. It is NOT the entity key here — the landing-row identity
/// is the synthetic <see cref="LandedRowId"/>. Canonical identity
/// (<c>tf_parcel.tf_parcel_id</c>) is reserved for the S3 projection.</para>
///
/// <para>Type axis lives in <see cref="PropTypeCd"/>. Real Benton PACS
/// (verified by SYNC-POP-4a TopN=1000 proof run, 2026-05-04) uses:
/// <c>'R'</c> for real property (~61%), <c>'P'</c> for personal (~38%),
/// and <c>'MH'</c> for mobile-home (~1%). The 2-character <c>'MH'</c>
/// is why this column is widened to 8 chars rather than the schema-
/// declared char(5). The S1 distribution gate records the histogram
/// so downstream slices can filter without re-counting at the source.</para>
///
/// <para>Lifecycle note: real Benton Harris PACS <c>dbo.property</c>
/// does NOT carry <c>prop_inactive_dt</c> — that column lives on
/// <c>dbo.property_val</c> (the per-year, per-supplement valuation
/// row). The truth promoter (SYNC-POP-4b) joins property_val to
/// determine retired-vs-active state. This landing tier preserves
/// only the master identity surface, leaving lifecycle resolution to
/// the next slice.</para>
/// </summary>
public sealed class LegacyPacsRawProperty
{
    /// <summary>Synthetic landing-row id. Not exposed beyond this layer.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity ─────────────────────────────────────
    /// <summary>The PACS parcel identity (<c>dbo.property.prop_id</c>).</summary>
    public int PropId { get; set; }

    // ── Type axis ────────────────────────────────────────────────
    /// <summary>
    /// PACS property type code. Benton vocabulary:
    /// <c>R</c>/<c>P</c>/<c>M</c>/<c>A</c>/<c>MN</c>. Width 5 to
    /// accommodate any county that extends the vocabulary.
    /// </summary>
    public string? PropTypeCd { get; set; }

    // ── Identifying surface (preserved verbatim) ─────────────────
    /// <summary>Geographic / legal parcel number (<c>geo_id</c>).</summary>
    public string? GeoId { get; set; }

    /// <summary>Alternate reference id 1 (county-defined).</summary>
    public string? RefId1 { get; set; }

    /// <summary>Alternate reference id 2 (county-defined).</summary>
    public string? RefId2 { get; set; }

    /// <summary>"Doing business as" name; null for most real-property rows.</summary>
    public string? DbaName { get; set; }

    /// <summary>Alternate dba name.</summary>
    public string? AltDbaName { get; set; }

    // ── Lifecycle ────────────────────────────────────────────────
    /// <summary>When PACS first created the parcel record.</summary>
    public DateTime? PropCreateDt { get; set; }

    // ── Provenance (the doctrine's non-negotiable surface) ───────
    /// <summary>
    /// Required FK to <c>sync_bridge.load_batch.load_batch_id</c>.
    /// The provenance gate fails any row whose value is the empty
    /// Guid.
    /// </summary>
    public Guid LoadBatchId { get; set; }

    /// <summary>
    /// Hash of the source query that produced this row's batch. The
    /// provenance gate fails any row whose value is null or empty.
    /// </summary>
    public string SourceQueryHash { get; set; } = string.Empty;

    /// <summary>
    /// Stable hash of the row's source values. Used by future slices
    /// for change detection without comparing every column.
    /// </summary>
    public string SourceRowHash { get; set; } = string.Empty;

    public DateTime LandedAt { get; set; } = DateTime.UtcNow;
}
