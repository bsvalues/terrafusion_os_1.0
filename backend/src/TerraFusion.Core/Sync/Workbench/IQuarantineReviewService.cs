using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Workbench;

// ────────────────────────────────────────────────────────────────────────────
// WORKBENCH-V0.2 SLICE-I STEP-2: Quarantine Review Service
//
// Contract:
//  • Browse quarantine source rows (immutable).
//  • Append an operator disposition to sync_bridge.quarantine_review_decision.
//  • Current disposition = latest row by (QuarantineRowRef, Lane) DESC CreatedAt.
//  • ACCEPT_AS_IS does NOT release, promote, or delete the source row.
//  • Source quarantine rows are NEVER mutated by this service.
//
// Per docs/sync/workbench/SLICE_I_QUARANTINE_REVIEW_CONTRACT.md §3 + §7.
// ────────────────────────────────────────────────────────────────────────────

/// <summary>
/// Outcome discriminator for Slice I quarantine review operations.
/// Maps 1:1 to HTTP status codes in the controller.
/// </summary>
public enum QuarantineReviewOutcome
{
    Ok,
    InvalidInput,
    UnsupportedLane,
    NotFound,
    InternalError,
}

// ── Browse ────────────────────────────────────────────────────────────────────

/// <summary>Request parameters for browsing quarantine records.</summary>
public sealed class QuarantineReviewBrowseRequest
{
    /// <summary>Lane to browse. Only "imprv_attr" supported initially.
    /// Value is case-insensitive in the service.</summary>
    public string Lane { get; set; } = string.Empty;

    /// <summary>Filter to rows whose QuarantineReason matches exactly.
    /// Null = no filter.</summary>
    public string? ReasonFilter { get; set; }

    /// <summary>Filter to rows with a specific current disposition.
    /// Null = no filter. "UNREVIEWED" returns rows with no decision yet.</summary>
    public string? DispositionFilter { get; set; }

    /// <summary>Maximum rows to return. Clamped to [1, 500].</summary>
    public int Limit { get; set; } = 50;
}

/// <summary>
/// A single quarantine row joined with its current (latest) disposition.
/// Immutable view — source quarantine fields are never changed.
/// </summary>
public sealed class QuarantineReviewRow
{
    // ── Source quarantine identity ─────────────────────────────────────
    /// <summary>Primary key of the quarantine row (UUID as string).</summary>
    public string QuarantineRowRef { get; set; } = string.Empty;

    public short PropValYr { get; set; }
    public short SupNum { get; set; }
    public int PropId { get; set; }
    public long ImprvId { get; set; }
    public long ImprvDetId { get; set; }
    public long IAttrValId { get; set; }
    public string IAttrValCd { get; set; } = string.Empty;
    public string? AttrValueText { get; set; }
    public decimal? AttrValueNumeric { get; set; }
    public string QuarantineReason { get; set; } = string.Empty;
    public string? QuarantineReasonDetail { get; set; }
    public string? UniverseCode { get; set; }
    public DateTime QuarantinedAt { get; set; }

    // ── Current operator disposition (from latest quarantine_review_decision) ──
    /// <summary>
    /// ACCEPT_AS_IS | REJECT_PERMANENTLY | NEEDS_RESEARCH | UNREVIEWED.
    /// UNREVIEWED = no decision row exists yet.
    /// </summary>
    public string CurrentDisposition { get; set; } = "UNREVIEWED";

    public string? CurrentNote { get; set; }
    public string? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }

    /// <summary>DB identity of the current (latest) decision row.
    /// Null when UNREVIEWED.</summary>
    public long? CurrentDecisionId { get; set; }
}

/// <summary>Result of a browse request.</summary>
public sealed class QuarantineReviewBrowseResult
{
    public QuarantineReviewOutcome Outcome { get; set; }
    public string? ErrorMessage { get; set; }

    public string Lane { get; set; } = string.Empty;
    public IReadOnlyList<QuarantineReviewRow> Items { get; set; } =
        Array.Empty<QuarantineReviewRow>();
    public int TotalSourceCount { get; set; }
    public int ReturnedCount { get; set; }
}

// ── Save Decision ──────────────────────────────────────────────────────────────

/// <summary>Request to record an operator disposition for a quarantine row.</summary>
public sealed class QuarantineReviewSaveRequest
{
    /// <summary>Lane containing the quarantine row. Only "imprv_attr" supported.</summary>
    public string Lane { get; set; } = string.Empty;

    /// <summary>
    /// Operator disposition. Closed vocabulary:
    /// ACCEPT_AS_IS | REJECT_PERMANENTLY | NEEDS_RESEARCH.
    ///
    /// ACCEPT_AS_IS does NOT release or promote the row. It records
    /// that the operator has reviewed and accepted the row's exclusion.
    /// </summary>
    public string Disposition { get; set; } = string.Empty;

    /// <summary>Optional free-text note. Max 500 characters.</summary>
    public string? Note { get; set; }

    /// <summary>Operator identity for the audit row. Defaults to "operator".</summary>
    public string OperatorIdentity { get; set; } = "operator";
}

/// <summary>Result of saving a quarantine review decision.</summary>
public sealed class QuarantineReviewSaveResult
{
    public QuarantineReviewOutcome Outcome { get; set; }
    public string? ErrorMessage { get; set; }

    /// <summary>DB identity (BIGSERIAL) of the newly inserted decision row.</summary>
    public long DecisionId { get; set; }

    /// <summary>Echo of the disposition that was recorded.</summary>
    public string Disposition { get; set; } = string.Empty;

    /// <summary>UTC timestamp of the inserted row.</summary>
    public DateTime SavedAt { get; set; }

    /// <summary>Row count in quarantine source table AFTER save.
    /// Must equal the count BEFORE save — confirms no source mutation.</summary>
    public int SourceRowCountAfterSave { get; set; }
}

// ── Interface ─────────────────────────────────────────────────────────────────

/// <summary>
/// WORKBENCH-V0.2 SLICE-I STEP-2: quarantine review service.
///
/// <para>Browses <c>legacy_tf_unproven.unresolved_imprv_attr</c> and
/// appends operator dispositions to
/// <c>sync_bridge.quarantine_review_decision</c>. Neither method
/// mutates the quarantine source table.</para>
///
/// <para>Per docs/sync/workbench/SLICE_I_QUARANTINE_REVIEW_CONTRACT.md §3 + §7.</para>
/// </summary>
public interface IQuarantineReviewService
{
    /// <summary>
    /// Browse quarantine rows for the given lane, joined with their
    /// current (latest) operator disposition.
    /// </summary>
    Task<QuarantineReviewBrowseResult> BrowseAsync(
        QuarantineReviewBrowseRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Append a new operator disposition row for the specified quarantine row.
    /// Does NOT modify the source quarantine row.
    /// </summary>
    Task<QuarantineReviewSaveResult> SaveDecisionAsync(
        string quarantineRowRef,
        QuarantineReviewSaveRequest request,
        CancellationToken cancellationToken = default);
}
