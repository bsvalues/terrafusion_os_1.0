using System;

namespace TerraFusion.Core.Entities.Workbench;

/// <summary>
/// SYNC-WORKBENCH-G: atomic decision-commit record. One row per
/// operator-issued commit. Captures (a) the commit's idempotency
/// key, operator, note; (b) counts of routed and dismissed decisions
/// linked to the commit; (c) snapshot JSON of the universe and
/// ratio gate distributions at decision time.
///
/// <para><b>Doctrine note</b>: this is a <i>decision log + gate
/// snapshot</i> — NOT a truth-table mutator. Slice G never writes
/// into <c>truth_pacs.*</c> or <c>canonical_tf.*</c>. The actual
/// truth/canonical materialization happens via the existing
/// <c>attr-drain-1</c> chain when the dictionary picks up the
/// routed codes. Phase 6 (evidence packet) downloads from this
/// record.</para>
///
/// <para>Audit fields (<see cref="CreatedAt"/>, <see cref="UpdatedAt"/>,
/// <see cref="CreatedBy"/>, <see cref="UpdatedBy"/>) are
/// auto-populated by <c>AuditableEntityInterceptor</c>.</para>
/// </summary>
public sealed class WorkbenchCommit
{
    /// <summary>Commit identity.</summary>
    public Guid CommitId { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Operator-supplied idempotency key. Unique. Re-submission of
    /// the same key returns the existing commit row instead of
    /// creating a new one.
    /// </summary>
    public string IdempotencyKey { get; set; } = string.Empty;

    /// <summary>Operator id supplied by the caller.</summary>
    public string OperatorId { get; set; } = string.Empty;

    /// <summary>Free-form operator note (optional).</summary>
    public string? CommitNote { get; set; }

    /// <summary>Count of <c>"Routed"</c> triage rows linked to this commit.</summary>
    public int RoutedDecisionsApplied { get; set; }

    /// <summary>Count of <c>"Dismissed"</c> triage rows linked to this commit.</summary>
    public int DismissedDecisionsApplied { get; set; }

    /// <summary>
    /// JSON snapshot of <c>truth_pacs.imprv_current</c> universe
    /// distribution at commit time. Schema:
    /// <c>{"REAL_RESIDENTIAL": n, "REAL_COMMERCIAL": n, "MOBILE_HOME": n,
    /// "AG_CURRENT_USE": n, "PERSONAL_PROPERTY": n,
    /// "CONVERSION_LEGACY": n, "UNKNOWN": n}</c>. Missing keys are
    /// zero-filled.
    /// </summary>
    public string UniverseDistributionJson { get; set; } = "{}";

    /// <summary>
    /// JSON snapshot of <c>canonical_tf.tf_sale</c> ratio
    /// distribution at commit time. Four-cell matrix:
    /// <c>{"DorQ_CountyQ": n, "DorQ_CountyN": n, "DorN_CountyQ": n,
    /// "DorN_CountyN": n}</c>. Missing keys are zero-filled.
    /// </summary>
    public string RatioDistributionJson { get; set; } = "{}";

    /// <summary>Wall-clock UTC at which the commit was finalized.</summary>
    public DateTime CommittedAt { get; set; } = DateTime.UtcNow;

    // ── Audit (auto-populated by AuditableEntityInterceptor) ────────
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
