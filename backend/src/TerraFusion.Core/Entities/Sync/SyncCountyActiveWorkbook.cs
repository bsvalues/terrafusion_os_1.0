using System;

namespace TerraFusion.Core.Entities.Sync;

/// <summary>
/// Slice C41-A pointer surface: names the Mapped
/// <c>SyncMappingWorkbook</c> the operator currently treats as
/// authoritative for a county. Singleton per county; PK =
/// <c>CountyId</c>.
///
/// <para>Strictly metadata. SET / GET / Clear do not trigger any
/// C36 / canonical / PACS work; do not mutate any workbook /
/// canonical row; do not affect comp-pool query results. The
/// pointer is advisory (Hard Guard 10): consumers that ignore it
/// continue to work — just without freshness benefits.</para>
///
/// <para>Audit fields are FISMA-required and auto-populated by the
/// <c>AuditableEntityInterceptor</c> in <c>TerraFusionDbContext</c>.
/// Past pointer values are preserved in <c>AuditLogs</c>, NOT on
/// this row — SET overwrites the prior value in place.</para>
/// </summary>
public sealed class SyncCountyActiveWorkbook
{
    /// <summary>
    /// Sovereign-county scope; PK. Exactly one row per county
    /// (Hard Guard 1).
    /// </summary>
    public Guid CountyId { get; set; }

    /// <summary>
    /// FK → <c>SyncMappingWorkbooks.Id</c>. Per Hard Guard 2 the
    /// target workbook must be <c>Status='Mapped'</c> AND in the
    /// same county. EF config uses
    /// <c>OnDelete(DeleteBehavior.Restrict)</c> per Hard Guard 8 so
    /// a pointed-to workbook cannot be deleted out from under this
    /// pointer.
    /// </summary>
    public Guid ActiveWorkbookId { get; set; }

    /// <summary>
    /// Business timestamp: when the operator promoted this
    /// workbook. Distinct from <see cref="UpdatedAt"/>: the latter
    /// is bumped by any audit-only refresh, while
    /// <see cref="SetAt"/> only changes when
    /// <see cref="ActiveWorkbookId"/> actually rotates.
    /// </summary>
    public DateTime SetAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Operator id who promoted the workbook. Distinct from
    /// <see cref="UpdatedBy"/>: the latter is the most recent
    /// toucher, while <see cref="SetBy"/> only changes when the
    /// pointer actually rotates.
    /// </summary>
    public string SetBy { get; set; } = string.Empty;

    /// <summary>
    /// Optional human note explaining the promotion (e.g. "Fixed
    /// 458-61A-217(1) exclusion after 2026-04-29 review."). Max
    /// 1000 chars.
    /// </summary>
    public string? SetReason { get; set; }

    // FISMA-required audit fields — auto-populated by
    // AuditableEntityInterceptor.
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string?  CreatedBy { get; set; }
    public string?  UpdatedBy { get; set; }
}
