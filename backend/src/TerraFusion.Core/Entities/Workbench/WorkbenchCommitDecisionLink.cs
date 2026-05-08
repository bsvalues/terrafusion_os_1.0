using System;

namespace TerraFusion.Core.Entities.Workbench;

/// <summary>
/// SYNC-WORKBENCH-G: link row binding one operator triage decision
/// (<see cref="TerraFusion.Core.Entities.LegacyTfUnproven.UnprovenImprvAttrTriage"/>)
/// to one <see cref="WorkbenchCommit"/>. The presence of this link
/// row — not any mutation of the triage row — is the marker that a
/// decision has been committed.
///
/// <para>Many-to-one with <see cref="WorkbenchCommit"/> by
/// <see cref="CommitId"/>. One-to-one with the source triage row
/// by <see cref="TriageId"/> (unique index — a triage decision
/// cannot be committed twice).</para>
///
/// <para><b>Decision branch invariants</b>:
/// <list type="bullet">
///   <item><see cref="DecisionType"/> = <c>"Route"</c> ⇒
///   <see cref="RoutedToUniverse"/> required;
///   <see cref="DismissalReason"/> NULL.</item>
///   <item><see cref="DecisionType"/> = <c>"Dismiss"</c> ⇒
///   <see cref="DismissalReason"/> required;
///   <see cref="RoutedToUniverse"/> +
///   <see cref="RoutedToIAttrValCd"/> NULL.</item>
/// </list>
/// Enforced at the service layer; not as a CHECK constraint.</para>
/// </summary>
public sealed class WorkbenchCommitDecisionLink
{
    /// <summary>Link identity.</summary>
    public Guid LinkId { get; set; } = Guid.NewGuid();

    /// <summary>FK to <see cref="WorkbenchCommit.CommitId"/>.</summary>
    public Guid CommitId { get; set; }

    /// <summary>
    /// FK to <c>UnprovenImprvAttrTriage.TriageId</c>. Unique — a
    /// triage row may be linked to at most one commit.
    /// </summary>
    public Guid TriageId { get; set; }

    /// <summary>
    /// FK back to <c>LegacyTfUnprovenImprvAttr.UnprovenRowId</c>
    /// (the underlying quarantine row). Captured here so downstream
    /// consumers (Phase 6 evidence packet) need not re-join through
    /// the triage table.
    /// </summary>
    public Guid UnprovenRowId { get; set; }

    /// <summary>One of <c>"Route"</c> or <c>"Dismiss"</c>.</summary>
    public string DecisionType { get; set; } = string.Empty;

    /// <summary>
    /// Universe routed to. Mirrors
    /// <c>UnprovenImprvAttrTriage.RoutedToUniverse</c> at commit
    /// time. NULL when <see cref="DecisionType"/> is
    /// <c>"Dismiss"</c>.
    /// </summary>
    public string? RoutedToUniverse { get; set; }

    /// <summary>
    /// Specific dictionary code (within the routed universe)
    /// suggested by the operator. NULL when the operator routed
    /// to a universe without selecting a code, OR when
    /// <see cref="DecisionType"/> is <c>"Dismiss"</c>.
    /// </summary>
    public string? RoutedToIAttrValCd { get; set; }

    /// <summary>
    /// Dismissal reason mirrored from
    /// <c>UnprovenImprvAttrTriage.DismissalReason</c>. NULL when
    /// <see cref="DecisionType"/> is <c>"Route"</c>.
    /// </summary>
    public string? DismissalReason { get; set; }

    /// <summary>UTC at which the link row was inserted (= commit time).</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
