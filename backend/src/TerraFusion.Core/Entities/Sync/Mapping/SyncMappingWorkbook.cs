using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Entities.Sync.Mapping;

/// <summary>
/// Slice C2 root: a county-scoped workbook capturing the assessor's
/// canonical-mapping decisions over a single B2.7 deep-profile batch.
///
/// <para>One <see cref="SyncMappingWorkbook"/> = one durable place to
/// record "from this PACS profile run, here are the columns we care
/// about, here is what they mean canonically, and here is the review
/// state of every code value we observed." It does NOT apply the
/// mappings to any business data — Slice C3+ owns transform consumption.</para>
///
/// <para>Lifecycle: an operator opens the C1-style mapping seed, picks a
/// <see cref="ProfileBatchId"/> (the most recent successful B2.7-OLTP
/// batch is the typical seed), creates a workbook, and proceeds to add
/// <see cref="SyncMappingColumn"/> rows for the columns they're
/// reviewing. The workbook reuses the existing
/// <c>SyncProfileCodeCandidate</c> / <c>SyncProfileColumnStats</c> rows
/// as evidence — it does not duplicate distribution data.</para>
///
/// <para>County isolation: every row carries its own <see cref="CountyId"/>
/// (denormalized) so multi-county queries can filter at the workbook
/// level without joining through. Sovereign County model — the workbook
/// must never appear in a query scoped to a different county.</para>
///
/// <para>Audit fields are FISMA-required and auto-populated by the
/// <c>AuditableEntityInterceptor</c> in <c>TerraFusionDbContext</c>.</para>
/// </summary>
public sealed class SyncMappingWorkbook
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>County the workbook belongs to. Sovereign County isolation.</summary>
    public Guid CountyId { get; set; }
    public County County { get; set; } = null!;

    /// <summary>
    /// The <c>SyncSourceConnection</c> the seeded profile batch came from
    /// (e.g. "Benton PACS OLTP (tf-mssql)"). Recorded so a later reader can
    /// trace back without re-querying the batch row. Not a foreign-key
    /// constraint — connections may be retired while their workbooks live on.
    /// </summary>
    public Guid SourceConnectionId { get; set; }

    /// <summary>
    /// The <c>SyncBatch</c> Id whose <c>SyncProfileTableStats</c> /
    /// <c>SyncProfileColumnStats</c> / <c>SyncProfileCodeCandidate</c>
    /// rows seeded this workbook. Set once at workbook creation; later
    /// edits don't move the seed pointer.
    /// </summary>
    public Guid ProfileBatchId { get; set; }

    /// <summary>
    /// Operator-friendly label, e.g. "Benton PACS OLTP — 2026-04-27
    /// canonical-use-code review". Required, max 200 chars. Unique per
    /// (CountyId, Name) — see EF configuration.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Workbook lifecycle: <c>Draft</c> (default — open for review),
    /// <c>InReview</c> (assessor working through it), <c>Approved</c>
    /// (decisions locked, can be referenced by C3+ transforms),
    /// <c>Archived</c> (superseded by a later workbook on the same
    /// county). String-typed for forward-compat — extending the lifecycle
    /// later doesn't require a migration.
    /// </summary>
    public string Status { get; set; } = "Draft";

    /// <summary>Free-text operator notes; max 4000 chars.</summary>
    public string? Notes { get; set; }

    public ICollection<SyncMappingColumn> Columns { get; set; } = new List<SyncMappingColumn>();

    // FISMA-required audit fields — auto-populated by AuditableEntityInterceptor
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
