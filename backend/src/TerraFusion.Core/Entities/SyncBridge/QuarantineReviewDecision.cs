using System;

namespace TerraFusion.Core.Entities.SyncBridge;

/// <summary>
/// Append-only operator disposition record for a quarantine row.
///
/// <para>Doctrine invariant: this table records operator annotations only —
/// it does NOT release, promote, or delete quarantine rows; does NOT write to
/// <c>truth_pacs.*</c>, <c>canonical_tf.*</c>, or any county-data table;
/// does NOT authorize a drain execution.</para>
///
/// <para><b>Current disposition</b> = the most recent row for a given
/// <c>(QuarantineId, Lane)</c> pair by <c>CreatedAt DESC</c>. Prior rows
/// are retained for audit. Updating a disposition means inserting a new row,
/// which supersedes the prior row by recency.</para>
///
/// <para>Per docs/sync/workbench/SLICE_I_QUARANTINE_REVIEW_CONTRACT.md §3 + §7.</para>
/// </summary>
public sealed class QuarantineReviewDecision
{
    /// <summary>Auto-incrementing identity. Stable row identifier for
    /// audit trail queries.</summary>
    public long Id { get; set; }

    /// <summary>Primary key of the quarantine row being annotated — bigint form.
    /// Set for future lanes whose quarantine table uses a bigint PK.
    /// For UUID-keyed lanes (e.g. imprv_attr), set to 0; use
    /// <see cref="QuarantineRowRef"/> for the actual key.
    /// No FK constraint is imposed.</summary>
    public long QuarantineId { get; set; }

    /// <summary>String-form primary key of the quarantine row, used for
    /// UUID-keyed quarantine tables (e.g. imprv_attr uses
    /// <c>UnprovenRowId uuid</c> as PK). Null for bigint-keyed lanes.
    /// Together with <see cref="Lane"/>, this uniquely identifies the
    /// source quarantine row.</summary>
    public string? QuarantineRowRef { get; set; }

    /// <summary>Lane whose quarantine table holds the row identified by
    /// <see cref="QuarantineId"/>. Closed vocabulary matches the drain lane
    /// names: imprv_attr | sales | geometry | land | owner | …</summary>
    public string Lane { get; set; } = string.Empty;

    /// <summary>Operator's classification of this quarantine record.
    /// Closed vocabulary: ACCEPT_AS_IS | REJECT_PERMANENTLY | NEEDS_RESEARCH.
    ///
    /// <para>ACCEPT_AS_IS — reviewed; legitimate exclusion, no immediate action.</para>
    /// <para>REJECT_PERMANENTLY — noise / invalid data; exclude from future release.</para>
    /// <para>NEEDS_RESEARCH — unclear; needs investigation before any disposition.</para>
    ///
    /// None of these values causes automatic release or promotion.</summary>
    public string Disposition { get; set; } = string.Empty;

    /// <summary>Optional free-text annotation supplied by the operator.
    /// Max 500 characters. May be null.</summary>
    public string? OperatorNote { get; set; }

    /// <summary>Identity of the operator who saved this disposition.
    /// OS username or configured workbench operator name.
    /// Not a multi-user auth token — the workbench is a single-operator local tool.</summary>
    public string OperatorIdentity { get; set; } = string.Empty;

    /// <summary>UTC timestamp when this disposition row was inserted.
    /// The only timestamp on this entity — absence of UpdatedAt signals
    /// append-only semantics.</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
