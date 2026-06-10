using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Workbench;

/// <summary>
/// SYNC-WORKBENCH-G: atomic decision-commit service.
///
/// <para>Provides three operator surfaces:</para>
/// <list type="number">
///   <item><see cref="CommitAsync"/> — atomic, idempotent commit of
///   all pending Routed/Dismissed triage decisions plus a snapshot
///   of doctrine gate distributions.</item>
///   <item><see cref="ListCommitsAsync"/> — paged list of recent
///   commits (newest first).</item>
///   <item><see cref="GetCommitAsync"/> — single commit + linked
///   decisions.</item>
/// </list>
///
/// <para><b>Boundary invariant</b>: this service does NOT mutate
/// triage rows, does NOT mutate quarantine rows, and does NOT write
/// into <c>truth_pacs.*</c> or <c>canonical_tf.*</c>. The link-row
/// presence is the marker that a triage decision has been
/// committed. Truth/canonical materialization is handled separately
/// by the existing attr-drain chain.</para>
/// </summary>
public interface IWorkbenchCommitService
{
    Task<CommitResult> CommitAsync(
        CommitRequest request,
        CancellationToken cancellationToken = default);

    Task<CommitListResult> ListCommitsAsync(
        int limit,
        int offset,
        CancellationToken cancellationToken = default);

    Task<CommitDetailResult> GetCommitAsync(
        Guid commitId,
        CancellationToken cancellationToken = default);
}

/// <summary>Discriminator over commit-service outcomes mapped 1:1 to HTTP status by the controller.</summary>
public enum CommitOutcome
{
    Ok,
    InvalidInput,
    NotFound,
    Conflict,
}

// ── Commit ───────────────────────────────────────────────────────────

/// <summary>Body of <c>POST /api/sync/workbench/g/commit</c>.</summary>
public sealed record CommitRequest(
    string IdempotencyKey,
    string OperatorId,
    string? CommitNote);

public sealed record CommitResult(
    CommitOutcome Outcome,
    string? ErrorMessage,
    CommitResponse? Payload);

/// <summary>
/// Commit response. <see cref="Status"/> is <c>"Created"</c> for a
/// fresh commit and <c>"Idempotent"</c> when the idempotency key
/// matched an existing commit row.
/// </summary>
public sealed record CommitResponse(
    Guid CommitId,
    string Status,
    int RoutedDecisionsApplied,
    int DismissedDecisionsApplied,
    DateTime CommittedAt,
    string UniverseDistributionJson,
    string RatioDistributionJson);

/// <summary>Closed vocabulary for <see cref="CommitResponse.Status"/>.</summary>
public static class CommitStatuses
{
    public const string Created = "Created";
    public const string Idempotent = "Idempotent";
}

// ── List ─────────────────────────────────────────────────────────────

public sealed record CommitListResult(
    CommitOutcome Outcome,
    string? ErrorMessage,
    IReadOnlyList<CommitSummaryResponse> Items,
    int Limit,
    int Offset);

public sealed record CommitSummaryResponse(
    Guid CommitId,
    DateTime CommittedAt,
    string OperatorId,
    string IdempotencyKey,
    int RoutedDecisionsApplied,
    int DismissedDecisionsApplied,
    string? CommitNote);

// ── Detail ───────────────────────────────────────────────────────────

public sealed record CommitDetailResult(
    CommitOutcome Outcome,
    string? ErrorMessage,
    CommitDetailResponse? Payload);

public sealed record CommitDetailResponse(
    Guid CommitId,
    DateTime CommittedAt,
    string OperatorId,
    string IdempotencyKey,
    int RoutedDecisionsApplied,
    int DismissedDecisionsApplied,
    string? CommitNote,
    string UniverseDistributionJson,
    string RatioDistributionJson,
    IReadOnlyList<DecisionLinkResponse> Decisions);

public sealed record DecisionLinkResponse(
    Guid LinkId,
    Guid TriageId,
    Guid UnprovenRowId,
    string DecisionType,
    string? RoutedToUniverse,
    string? RoutedToIAttrValCd,
    string? DismissalReason);

/// <summary>Closed vocabulary for <see cref="DecisionLinkResponse.DecisionType"/> / link row column.</summary>
public static class DecisionTypes
{
    public const string Route = "Route";
    public const string Dismiss = "Dismiss";
}

// ── Distribution-snapshot keys (kept here so tests can reference them) ──

/// <summary>
/// Closed vocabulary for the four cells of the ratio-distribution
/// JSON snapshot. Names are <c>Dor{Q|N}_County{Q|N}</c> where
/// <c>Q</c> = qualified, <c>N</c> = not qualified.
/// </summary>
public static class RatioDistributionCells
{
    public const string DorQ_CountyQ = "DorQ_CountyQ";
    public const string DorQ_CountyN = "DorQ_CountyN";
    public const string DorN_CountyQ = "DorN_CountyQ";
    public const string DorN_CountyN = "DorN_CountyN";

    public static IReadOnlyList<string> All { get; } = new[]
    {
        DorQ_CountyQ,
        DorQ_CountyN,
        DorN_CountyQ,
        DorN_CountyN,
    };
}
