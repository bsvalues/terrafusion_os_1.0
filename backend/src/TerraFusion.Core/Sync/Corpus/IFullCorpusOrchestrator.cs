using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2: orchestrator for durable full-corpus drains.
///
/// <para><see cref="StartAsync"/> creates the run + 6 lane-result
/// rows in <c>"Pending"</c> state and returns immediately; the
/// hosted background worker picks up the queued run.</para>
///
/// <para><see cref="ResumeAsync"/> flips a Failed | Interrupted run
/// back to Queued (worker resumes from <c>NextLaneOnResume</c>).
/// Other states return a non-OK outcome.</para>
///
/// <para>Status / reconciliation reads are read-only.</para>
/// </summary>
public interface IFullCorpusOrchestrator
{
    Task<StartCorpusResult> StartAsync(
        string operatorName,
        short workingYear,
        CancellationToken cancellationToken);

    Task<ResumeCorpusResult> ResumeAsync(
        Guid runId,
        CancellationToken cancellationToken);

    Task<CorpusStatusResult> GetStatusAsync(
        Guid runId,
        CancellationToken cancellationToken);

    Task<CorpusRecentRunsResult> ListRecentAsync(
        int limit,
        CancellationToken cancellationToken);

    Task<CorpusReconciliationViewResult> GetReconciliationAsync(
        Guid runId,
        CancellationToken cancellationToken);
}

public enum CorpusOutcome
{
    Ok,
    NotFound,
    Conflict,
}

public sealed record StartCorpusResult(
    CorpusOutcome Outcome,
    Guid RunId,
    string Status,
    string? ErrorMessage);

public sealed record ResumeCorpusResult(
    CorpusOutcome Outcome,
    Guid RunId,
    string Status,
    string? ErrorMessage);

public sealed record CorpusStatusResult(
    CorpusOutcome Outcome,
    string? ErrorMessage,
    CorpusRunSnapshot? Run,
    IReadOnlyList<CorpusLaneSnapshot>? Lanes);

public sealed record CorpusRecentRunsResult(
    CorpusOutcome Outcome,
    string? ErrorMessage,
    IReadOnlyList<CorpusRunSnapshot> Runs);

public sealed record CorpusReconciliationViewResult(
    CorpusOutcome Outcome,
    string? ErrorMessage,
    CorpusRunSnapshot? Run,
    IReadOnlyList<CorpusReconciliationSnapshot>? Reconciliations);

public sealed record CorpusRunSnapshot(
    Guid RunId,
    string OperatorName,
    short WorkingYear,
    string Status,
    string? CurrentLane,
    string? NextLaneOnResume,
    DateTime StartedAt,
    DateTime? FinishedAt,
    string? ErrorMessage);

public sealed record CorpusLaneSnapshot(
    Guid LaneResultId,
    Guid RunId,
    string Lane,
    string Status,
    DateTime? StartedAt,
    DateTime? FinishedAt,
    string? BatchIdsJson,
    string? CountsJson,
    string? GateSummaryJson,
    string? QuarantineDeltaJson,
    string? ErrorMessage,
    string? LastCompletedStage);

public sealed record CorpusReconciliationSnapshot(
    Guid ReconciliationId,
    Guid RunId,
    string Lane,
    string ExpectedBasis,
    long PacsSourceCount,
    long TfCanonicalCount,
    long Delta,
    decimal DeltaPct,
    decimal TolerancePct,
    string ReconciliationStatus,
    string? Notes,
    DateTime ComputedAt);
