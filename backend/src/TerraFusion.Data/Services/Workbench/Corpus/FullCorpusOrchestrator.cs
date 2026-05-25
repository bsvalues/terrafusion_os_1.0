using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TerraFusion.Core.Entities.Workbench;
using TerraFusion.Core.Sync.Corpus;

namespace TerraFusion.Data.Services.Workbench.Corpus;

/// <summary>
/// SYNC-COMPLETE-2: orchestrator implementation. Owns the
/// transition diagram for <see cref="FullCorpusRun"/>:
///
/// <pre>
///   StartAsync   : (none)            → Queued
///   worker pick  : Queued            → Running
///   worker done  : Running           → Completed
///   worker err   : Running           → Failed
///   restart sweep: Running           → Interrupted
///   ResumeAsync  : Failed|Interrupted→ Queued (Resumed bookkeeping)
/// </pre>
///
/// <para>The orchestrator never calls into PACS directly; the hosted
/// worker drives lane execution via <see cref="ICorpusLaneRunner"/>
/// and reconciliation via <see cref="IPacsBaselineReconciler"/>. This
/// service is the persistent state-machine.</para>
/// </summary>
public sealed class FullCorpusOrchestrator : IFullCorpusOrchestrator
{
    public const string StatusQueued = "Queued";
    public const string StatusRunning = "Running";
    public const string StatusCompleted = "Completed";
    public const string StatusFailed = "Failed";
    public const string StatusInterrupted = "Interrupted";
    public const string StatusResumed = "Resumed";

    public const string LaneStatusPending = "Pending";

    private readonly TerraFusionDbContext _db;

    public FullCorpusOrchestrator(TerraFusionDbContext db)
    {
        ArgumentNullException.ThrowIfNull(db);
        _db = db;
    }

    public async Task<StartCorpusResult> StartAsync(
        string operatorName,
        short workingYear,
        CancellationToken cancellationToken)
    {
        var trimmed = string.IsNullOrWhiteSpace(operatorName)
            ? "full-corpus-runner"
            : operatorName.Trim();

        var nowUtc = DateTime.UtcNow;
        var run = new FullCorpusRun
        {
            RunId = Guid.NewGuid(),
            OperatorName = trimmed,
            WorkingYear = workingYear,
            Status = StatusQueued,
            CurrentLane = null,
            NextLaneOnResume = CorpusReconciliationPolicy.LaneOrder[0],
            StartedAt = nowUtc,
            FinishedAt = null,
            ErrorMessage = null,
        };
        _db.FullCorpusRuns.Add(run);

        foreach (var lane in CorpusReconciliationPolicy.LaneOrder)
        {
            _db.FullCorpusLaneResults.Add(new FullCorpusLaneResult
            {
                LaneResultId = Guid.NewGuid(),
                RunId = run.RunId,
                Lane = lane,
                Status = LaneStatusPending,
            });
        }

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return new StartCorpusResult(CorpusOutcome.Ok, run.RunId, run.Status, null);
    }

    public async Task<ResumeCorpusResult> ResumeAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        var run = await _db.FullCorpusRuns
            .FirstOrDefaultAsync(r => r.RunId == runId, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            return new ResumeCorpusResult(
                CorpusOutcome.NotFound,
                runId,
                string.Empty,
                $"Run '{runId}' not found.");

        if (run.Status != StatusFailed && run.Status != StatusInterrupted)
            return new ResumeCorpusResult(
                CorpusOutcome.Conflict,
                runId,
                run.Status,
                $"Run is in status '{run.Status}'; only Failed or Interrupted runs are resumable.");

        run.Status = StatusQueued;
        run.ErrorMessage = null;
        // NextLaneOnResume left intact — worker resumes from there.
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return new ResumeCorpusResult(CorpusOutcome.Ok, runId, run.Status, null);
    }

    public async Task<CorpusStatusResult> GetStatusAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        var run = await _db.FullCorpusRuns
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.RunId == runId, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            return new CorpusStatusResult(
                CorpusOutcome.NotFound,
                $"Run '{runId}' not found.",
                null,
                null);

        var lanes = await _db.FullCorpusLaneResults
            .AsNoTracking()
            .Where(l => l.RunId == runId)
            .OrderBy(l => l.Lane)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new CorpusStatusResult(
            CorpusOutcome.Ok,
            null,
            ToSnapshot(run),
            lanes.Select(ToSnapshot).ToList());
    }

    public async Task<CorpusRecentRunsResult> ListRecentAsync(
        int limit,
        CancellationToken cancellationToken)
    {
        var boundedLimit = Math.Clamp(limit, 1, 50);
        var runs = await _db.FullCorpusRuns
            .AsNoTracking()
            .OrderByDescending(r => r.StartedAt)
            .Take(boundedLimit)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new CorpusRecentRunsResult(
            CorpusOutcome.Ok,
            null,
            runs.Select(ToSnapshot).ToList());
    }

    public async Task<CorpusReconciliationViewResult> GetReconciliationAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        var run = await _db.FullCorpusRuns
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.RunId == runId, cancellationToken)
            .ConfigureAwait(false);

        if (run is null)
            return new CorpusReconciliationViewResult(
                CorpusOutcome.NotFound,
                $"Run '{runId}' not found.",
                null,
                null);

        var rec = await _db.FullCorpusReconciliations
            .AsNoTracking()
            .Where(r => r.RunId == runId)
            .OrderBy(r => r.Lane)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new CorpusReconciliationViewResult(
            CorpusOutcome.Ok,
            null,
            ToSnapshot(run),
            rec.Select(ToSnapshot).ToList());
    }

    private static CorpusRunSnapshot ToSnapshot(FullCorpusRun r) => new(
        r.RunId,
        r.OperatorName,
        r.WorkingYear,
        r.Status,
        r.CurrentLane,
        r.NextLaneOnResume,
        r.StartedAt,
        r.FinishedAt,
        r.ErrorMessage);

    private static CorpusLaneSnapshot ToSnapshot(FullCorpusLaneResult l) => new(
        l.LaneResultId,
        l.RunId,
        l.Lane,
        l.Status,
        l.StartedAt,
        l.FinishedAt,
        l.BatchIdsJson,
        l.CountsJson,
        l.GateSummaryJson,
        l.QuarantineDeltaJson,
        l.ErrorMessage,
        l.LastCompletedStage);

    private static CorpusReconciliationSnapshot ToSnapshot(FullCorpusReconciliation r) => new(
        r.ReconciliationId,
        r.RunId,
        r.Lane,
        r.ExpectedBasis,
        r.PacsSourceCount,
        r.TfCanonicalCount,
        r.Delta,
        r.DeltaPct,
        r.TolerancePct,
        r.ReconciliationStatus,
        r.Notes,
        r.ComputedAt);
}
