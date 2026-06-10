using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2: lane-runner abstraction the hosted worker uses
/// to invoke each of the six lane drains.
///
/// <para>Implementations may either (a) call into the same DI'd
/// services that <c>DoctrineDrainController</c> uses (preferred,
/// chosen here — direct DI, no localhost roundtrip, easier to test
/// + cleaner error capture) or (b) make an HTTP call against the
/// existing <c>POST /api/sync/doctrine/drain/{lane}</c> endpoint.
/// The worker doesn't care which.</para>
///
/// <para>The result shape mirrors the existing controller's
/// successful-lane response so reconciliation + evidence packets
/// can persist it verbatim.</para>
/// </summary>
public interface ICorpusLaneRunner
{
    Task<CorpusLaneRunResult> RunLaneAsync(
        string lane,
        string operatorName,
        short workingYear,
        bool fullCorpus,
        int? topN,
        CancellationToken cancellationToken);

    /// <summary>
    /// SYNC-COMPLETE-2-V2: stage-level-resume-aware overload. Forwards
    /// <paramref name="laneResultId"/> (always) and
    /// <paramref name="resumeFromStage"/> (when non-null) to the lane
    /// endpoint so it can write per-stage checkpoints back to the
    /// lane-result row and skip already-completed stages on retry.
    /// <para>The default implementation delegates to the no-arg overload
    /// so existing fakes/runners stay compatible — only implementations
    /// that need to thread stage-resume metadata override this.</para>
    /// </summary>
    Task<CorpusLaneRunResult> RunLaneAsync(
        string lane,
        string operatorName,
        short workingYear,
        bool fullCorpus,
        int? topN,
        Guid? laneResultId,
        string? resumeFromStage,
        CancellationToken cancellationToken)
        => RunLaneAsync(lane, operatorName, workingYear, fullCorpus, topN, cancellationToken);
}

public enum CorpusLaneRunOutcome
{
    Completed,
    Failed,
    UnknownLane,
}

public sealed record CorpusLaneRunResult(
    CorpusLaneRunOutcome Outcome,
    IReadOnlyList<Guid> BatchIds,
    string? CountsJson,
    string? GateSummaryJson,
    string? QuarantineDeltaJson,
    string? ErrorMessage);
