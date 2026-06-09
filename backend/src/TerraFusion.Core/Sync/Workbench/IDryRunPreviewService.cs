using System;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Workbench;

/// <summary>
/// Input for a dry-run preview.
///
/// <para>All lane mutation gates are enforced by the service —
/// callers are not trusted to enforce them.</para>
/// </summary>
public sealed class DryRunPreviewRequest
{
    /// <summary>Lane name. Only "improvement" is supported in Step 2.</summary>
    public string Lane { get; set; } = string.Empty;

    /// <summary>Assessment year to scope the source rows. Defaults to
    /// the most recent year in the landing table.</summary>
    public int? OperationalYear { get; set; }

    /// <summary>Limit source rows scanned. Null = full corpus.</summary>
    public int? TopN { get; set; }

    /// <summary>MUST be <see langword="true"/>. Service rejects
    /// <see langword="false"/> or absent.</summary>
    public bool DryRun { get; set; }

    /// <summary>Operator identity for the audit row.</summary>
    public string RequestedBy { get; set; } = "operator";
}

/// <summary>
/// Outcome categories for a preview request.
/// </summary>
public enum DryRunPreviewOutcome
{
    Ok,
    InvalidInput,
    UnsupportedLane,
    InternalError,
}

/// <summary>
/// Result from a dry-run preview.
///
/// <para>All counts are read-only projections. The service writes
/// exactly one <c>sync_bridge.dry_run_log</c> row (IsPreview = true)
/// and nothing else.</para>
/// </summary>
public sealed class DryRunPreviewResult
{
    public DryRunPreviewOutcome Outcome { get; set; }
    public string? ErrorMessage { get; set; }

    // ── On Ok ────────────────────────────────────────────────────────

    public Guid PreviewRunId { get; set; }
    public string Lane { get; set; } = string.Empty;
    public int OperationalYear { get; set; }
    public int? TopN { get; set; }

    /// <summary>Rows in <c>legacy_pacs_raw.imprv</c> for this year
    /// (honouring TopN when set).</summary>
    public int SourceCount { get; set; }

    /// <summary>Current rows in <c>canonical_tf.tf_improvement</c>.</summary>
    public int CanonicalCount { get; set; }

    /// <summary>Source rows with no matching truth row (would be inserted
    /// on drain execution).</summary>
    public int EstimatedInserts { get; set; }

    /// <summary>Source rows already in truth (would be refreshed on
    /// drain execution).</summary>
    public int EstimatedUpdates { get; set; }

    /// <summary>Truth rows not matched in source (would be cleaned on
    /// drain execution).</summary>
    public int EstimatedDeletes { get; set; }

    /// <summary>Rows in improvement quarantine tables
    /// (<c>legacy_tf_unproven.imprv_current</c> +
    /// <c>legacy_tf_unproven.unresolved_imprv_attr</c>).</summary>
    public int QuarantineCandidateCount { get; set; }

    /// <summary>Always "PREVIEW". Not "COMPLETE" — confirms no drain ran.</summary>
    public string Status { get; set; } = "PREVIEW";

    public long DurationMs { get; set; }
}

/// <summary>
/// Dry-run preview service for Workbench v0.2 Slice H.
///
/// <para>Reads <c>legacy_pacs_raw</c>, <c>truth_pacs</c>,
/// <c>canonical_tf</c>, and <c>legacy_tf_unproven</c> tables to
/// compute what the improvement drain would do, without running it.
/// Writes exactly one <c>sync_bridge.dry_run_log</c> row.</para>
///
/// <para>Per docs/sync/workbench/SLICE_H_DRY_RUN_PREVIEW_CONTRACT.md.</para>
/// </summary>
public interface IDryRunPreviewService
{
    Task<DryRunPreviewResult> ComputePreviewAsync(
        DryRunPreviewRequest request,
        CancellationToken cancellationToken = default);
}
