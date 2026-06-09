using System;

namespace TerraFusion.Core.Entities.Workbench;

/// <summary>
/// SYNC-COMPLETE-2: durable full-corpus sync run.
///
/// <para>One row per operator-issued <c>POST /api/sync/corpus/start</c>
/// call. Tracks the run's lifecycle through the six lanes (parcel,
/// owner-wsdor, improvement, land, sales, geometry) and the post-
/// drain reconciliation pass. The hosted background worker
/// (<c>FullCorpusOrchestratorHostedService</c>) polls
/// <see cref="Status"/>=<c>"Queued"</c> rows, advances them through
/// the lanes, and on completion populates
/// <c>FullCorpusReconciliation</c> rows.</para>
///
/// <para>A 6+ hour full-county drain exceeds curl's 6h timeout and any
/// reasonable HTTP timeout. This entity provides the durable state
/// the worker needs to <i>resume</i> after backend restarts: the
/// startup sweep marks any <c>"Running"</c> row as <c>"Interrupted"</c>
/// and waits for an explicit operator <c>POST resume</c>.</para>
///
/// <para>Audit fields auto-populated by <c>AuditableEntityInterceptor</c>.</para>
/// </summary>
public sealed class FullCorpusRun
{
    /// <summary>Run identity.</summary>
    public Guid RunId { get; set; } = Guid.NewGuid();

    /// <summary>Operator identifier supplied at start time.</summary>
    public string OperatorName { get; set; } = string.Empty;

    /// <summary>PACS <c>prop_val_yr</c> filter for year-grain lanes.</summary>
    public short WorkingYear { get; set; }

    /// <summary>Queued | Running | Completed | Failed | Interrupted | Resumed.</summary>
    public string Status { get; set; } = "Queued";

    /// <summary>
    /// Which lane is currently being processed (for in-flight runs).
    /// One of: parcel, owner-wsdor, improvement, land, sales,
    /// geometry, or null.
    /// </summary>
    public string? CurrentLane { get; set; }

    /// <summary>
    /// The next lane the orchestrator will process when resumed.
    /// NULL when the run finished or never started.
    /// </summary>
    public string? NextLaneOnResume { get; set; }

    public DateTime StartedAt { get; set; }
    public DateTime? FinishedAt { get; set; }

    /// <summary>Error summary if <see cref="Status"/> is <c>"Failed"</c>.</summary>
    public string? ErrorMessage { get; set; }

    // ── Audit (auto-populated by AuditableEntityInterceptor) ────────
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
