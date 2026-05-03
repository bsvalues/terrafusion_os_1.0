using System;

namespace TerraFusion.Core.Entities.Sync.Mapping;

/// <summary>
/// Slice C2: one row per observed source code value within a
/// <see cref="SyncMappingColumn"/>. Captures the operator's per-value
/// decision: what does this raw PACS code mean canonically, and is it
/// included in downstream consumption or excluded.
///
/// <para>Seeded from the column's <c>CandidateCodesJson</c> top-N
/// frequency entries (the same JSON surface the C1 seed used for its
/// "top values" tables). Per-value rows are then editable: an operator
/// can add a row for a value not in the top-N (rare-but-meaningful
/// codes), update <see cref="CanonicalValue"/>, mark
/// <see cref="IsExcluded"/>, or move the <see cref="ReviewStatus"/>
/// forward.</para>
///
/// <para>Identity: <see cref="MappingColumnId"/> + <see cref="SourceValue"/>
/// is the natural key. The unique index on the EF configuration prevents
/// duplicate value rows for the same column.</para>
///
/// <para><see cref="ObservedCount"/> is the count from the seeding
/// candidate's top-N at workbook-creation time — a snapshot, not a live
/// rolling count. If the operator wants fresh counts they re-run B2.7
/// and re-seed.</para>
///
/// <para><see cref="IsExcluded"/> + <see cref="CanonicalValue"/> are the
/// two operator-decision fields:
/// <list type="bullet">
/// <item><c>IsExcluded=true, CanonicalValue=null</c> — value reviewed
/// and intentionally dropped (e.g. exempt-transfer WAC codes that should
/// not feed the comp pool).</item>
/// <item><c>IsExcluded=false, CanonicalValue="…"</c> — mapped to the
/// canonical value in the lane.</item>
/// <item><c>IsExcluded=false, CanonicalValue=null,
/// ReviewStatus="NeedsReview"</c> — default; nothing decided yet.</item>
/// </list>
/// </para>
///
/// <para>This row holds a SOURCE value as observed in PACS — not a
/// secret, not PII, not a credential. The leak-scan policy from
/// SECURITY-1 still applies: any future tool that exports these rows
/// needs to honor the existing <c>%password%</c> probe pattern.</para>
/// </summary>
public sealed class SyncMappingCodeValue
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Denormalized for direct county-scoped queries.</summary>
    public Guid CountyId { get; set; }

    public Guid MappingColumnId { get; set; }
    public SyncMappingColumn MappingColumn { get; set; } = null!;

    /// <summary>
    /// The raw value as observed in PACS, e.g. <c>"11"</c>,
    /// <c>"458-61A-203(1)"</c>, <c>"R    "</c>. Max 512 chars (PACS
    /// strings can be padded varchar; the buffer leaves room for them
    /// without truncation surprises).
    /// </summary>
    public string SourceValue { get; set; } = null!;

    /// <summary>
    /// Optional human-readable label captured at review time, e.g.
    /// "Residential" for source value "11". Max 1024 chars.
    /// </summary>
    public string? SourceLabel { get; set; }

    /// <summary>
    /// Sample count from the candidate's top-N at workbook-creation
    /// time. Snapshot — rerun B2.7 + reseed for fresh counts.
    /// </summary>
    public long? ObservedCount { get; set; }

    /// <summary>
    /// The canonical value the operator mapped this to, free-form. Max
    /// 256 chars. Null = not yet decided OR explicitly excluded
    /// (see <see cref="IsExcluded"/>).
    /// </summary>
    public string? CanonicalValue { get; set; }

    /// <summary>
    /// NeedsReview / InProgress / Mapped / Excluded / Deferred. Default
    /// <c>NeedsReview</c>. Max 32 chars. Mirrors
    /// <see cref="SyncMappingColumn.ReviewStatus"/> at the value level.
    /// </summary>
    public string ReviewStatus { get; set; } = "NeedsReview";

    /// <summary>
    /// True when the operator has reviewed and chosen to drop this
    /// value from downstream consumption (e.g. exempt-transfer WAC
    /// codes for sales-comp filtering). Defaults false.
    /// </summary>
    public bool IsExcluded { get; set; }

    /// <summary>Per-value operator notes; max 2000 chars.</summary>
    public string? Notes { get; set; }

    // FISMA-required audit fields — auto-populated by AuditableEntityInterceptor
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
