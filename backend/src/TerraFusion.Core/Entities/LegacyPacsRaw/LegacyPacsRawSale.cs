using System;

namespace TerraFusion.Core.Entities.LegacyPacsRaw;

/// <summary>
/// Slice S1: raw PACS sale row landing zone.
///
/// <para>Doctrine: this is the FIRST stop for PACS sale data. Rows
/// are landed verbatim from the source (preserving stale columns like
/// <see cref="WacCd"/> for verification — NOT for use as truth) and
/// MUST carry full provenance (<see cref="LoadBatchId"/> +
/// <see cref="SourceQueryHash"/>) before any downstream slice can
/// reference them. There is no canonical promotion in this slice;
/// <c>truth_pacs.sale</c> and <c>canonical_tf.tf_sale</c> arrive in
/// later slices.</para>
///
/// <para>Identity preserved: the PACS sale identity is
/// <see cref="ChgOfOwnerId"/>; the parcel-side context is
/// <see cref="PropId"/> / <see cref="PropValYr"/> /
/// <see cref="SupNum"/>. None of these is an identity here — the
/// landing-row identity is the synthetic <see cref="LandedRowId"/>.
/// The doctrine reserves canonical identity for
/// <c>canonical_tf.tf_sale</c> (out-of-scope for S1).</para>
///
/// <para>Qualification axis lives in <see cref="SlCountyRatioCd"/>.
/// The doctrine and the operator's working SQL agree: the modern
/// "Valid Sale" code is <c>'100'</c>. The pre-2017 codes
/// <c>'01'</c>/<c>'02'</c> do NOT appear in modern production data;
/// any landing run that finds them indicates either (a) a stale
/// source or (b) a cutover-handling bug. The S1 stale-code gate
/// enforces this.</para>
///
/// <para>2017 cutover acknowledgment: <see cref="SlDt"/> is
/// preserved exactly as it arrives so downstream consumers can
/// filter pre-2018 sales. S1 records the split as a gate result;
/// it does NOT discard pre-2018 rows.</para>
/// </summary>
public sealed class LegacyPacsRawSale
{
    /// <summary>Synthetic landing-row id. Not exposed beyond this layer.</summary>
    public Guid LandedRowId { get; set; } = Guid.NewGuid();

    // ── PACS source identity (denormalized for query convenience) ──
    public long ChgOfOwnerId { get; set; }
    public int PropId { get; set; }
    public short PropValYr { get; set; }
    public short SupNum { get; set; }

    // ── Qualification axes ────────────────────────────────────────
    /// <summary>The qualification axis. <c>'100'</c> = Valid Sale.</summary>
    public string? SlCountyRatioCd { get; set; }

    /// <summary>
    /// Stale Tyler-era column. Preserved for audit, NEVER used as
    /// truth. The S1 stale-code gate verifies it is empty in modern
    /// data.
    /// </summary>
    public string? WacCd { get; set; }

    /// <summary>Stale axis, preserved for audit, never used as truth.</summary>
    public string? SlRatioTypeCd { get; set; }

    // ── Sale economics ────────────────────────────────────────────
    public DateTime? SlDt { get; set; }
    public decimal? SlPrice { get; set; }
    public decimal? AdjSlPrice { get; set; }

    // ── Provenance (the doctrine's non-negotiable surface) ────────
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
