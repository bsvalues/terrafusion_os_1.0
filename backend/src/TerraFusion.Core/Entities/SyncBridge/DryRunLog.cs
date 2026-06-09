using System;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Append-only audit record for every dry-run preview call.
///
/// <para>Doctrine invariant: this table records that a preview ran —
/// it does NOT authorize execution, mutate truth_pacs.*, canonical_tf.*,
/// or any other county-data table. <see cref="IsPreview"/> is always
/// <c>true</c> and is enforced via a DB-level check constraint.</para>
///
/// <para>Per docs/sync/workbench/SLICE_H_DRY_RUN_PREVIEW_CONTRACT.md §3
/// (mutation prohibition) and §12 (proposed schema).</para>
/// </summary>
public sealed class DryRunLog
{
    /// <summary>Stable UUID for this preview run. Returned to the caller
    /// as <c>previewRunId</c> in the projection response so the future
    /// approval gate can reference it.</summary>
    public Guid PreviewRunId { get; set; } = Guid.NewGuid();

    /// <summary>Optional county identifier. Populated from session context
    /// when available; null for anonymous workbench sessions.</summary>
    public Guid? CountyId { get; set; }

    /// <summary>Human-readable county code (e.g. "benton"). Nullable for
    /// same reason as <see cref="CountyId"/>.</summary>
    public string? CountyCode { get; set; }

    /// <summary>Drain lane this preview targeted.
    /// Closed vocabulary: parcel | owner | land | improvement | sales |
    /// geometry | assessment | exemption | jurisdiction | revenue-levy |
    /// revenue-assessment-bill.</summary>
    public string Lane { get; set; } = string.Empty;

    /// <summary>Operational year the preview was scoped to.</summary>
    public int OperationalYear { get; set; }

    /// <summary>UTC timestamp when the preview request was received.</summary>
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Operator identity from workbench session context.
    /// OS username or configured operator name — not a multi-user auth token.</summary>
    public string RequestedBy { get; set; } = string.Empty;

    /// <summary>'RUNNING' | 'COMPLETE' | 'FAILED'.</summary>
    public string Status { get; set; } = "RUNNING";

    /// <summary>Always <c>true</c>. Enforced by DB check constraint.
    /// Guards against this row being misread as a real drain execution.</summary>
    public bool IsPreview { get; set; } = true;

    /// <summary>Serialized input parameters (lane, topN, operationalYear, dryRun).
    /// Stored as JSONB in Postgres. Null until the request is fully parsed.</summary>
    public string? InputJson { get; set; }

    /// <summary>Serialized projection result object defined in
    /// SLICE_H_DRY_RUN_PREVIEW_CONTRACT.md §5.
    /// Null while Status = 'RUNNING'; populated on COMPLETE or FAILED.</summary>
    public string? ResultJson { get; set; }

    /// <summary>Row creation timestamp. The only timestamp on this entity —
    /// absence of UpdatedAt signals append-only semantics.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
