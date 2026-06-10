using System;

namespace TerraFusion.Core.Entities.Workbench;

/// <summary>
/// SYNC-COMPLETE-2: per-lane reconciliation row recording the
/// PACS-side baseline count vs. the TerraFusion canonical count
/// after a full-corpus run completes.
///
/// <para>Six rows per run, one per lane (or fewer when an upstream
/// lane fails before reconciliation runs). Per-lane policy lives in
/// <c>CorpusReconciliationPolicy</c>; tolerance is decimal pct.</para>
///
/// <para>Statuses: <c>Match</c> (delta == 0), <c>AcceptableDelta</c>
/// (|deltaPct| ≤ TolerancePct), <c>Investigate</c> (over tolerance,
/// or PACS/external feature service unreachable). PACS unreachability
/// is diagnostic — never fatal.</para>
///
/// <para>Audit fields auto-populated.</para>
/// </summary>
public sealed class FullCorpusReconciliation
{
    public Guid ReconciliationId { get; set; } = Guid.NewGuid();

    /// <summary>FK to <see cref="FullCorpusRun.RunId"/>.</summary>
    public Guid RunId { get; set; }

    /// <summary>parcel | owner-wsdor | improvement | land | sales | geometry.</summary>
    public string Lane { get; set; } = string.Empty;

    /// <summary>
    /// Per-lane reconciliation policy basis. One of
    /// <c>RAW_SOURCE</c>, <c>DOCTRINE_FILTERED</c>,
    /// <c>DEDUPED_CANONICAL</c>, <c>EXTERNAL_FEATURE_COUNT</c>.
    /// </summary>
    public string ExpectedBasis { get; set; } = string.Empty;

    public long PacsSourceCount { get; set; }
    public long TfCanonicalCount { get; set; }

    /// <summary>Signed: <c>TfCanonicalCount - PacsSourceCount</c>.</summary>
    public long Delta { get; set; }

    /// <summary><c>|Delta| / max(PacsSourceCount, 1) * 100</c>.</summary>
    public decimal DeltaPct { get; set; }

    /// <summary>Per-lane policy tolerance (pct).</summary>
    public decimal TolerancePct { get; set; }

    /// <summary>Match | AcceptableDelta | Investigate.</summary>
    public string ReconciliationStatus { get; set; } = string.Empty;

    /// <summary>Optional notes (e.g. "PACS unreachable", aggregation explanation).</summary>
    public string? Notes { get; set; }

    public DateTime ComputedAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}
