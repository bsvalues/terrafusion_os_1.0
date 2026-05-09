using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Entities.Workbench;
using TerraFusion.Core.Sync.Corpus;

namespace TerraFusion.Data.Services.Workbench.Corpus;

/// <summary>
/// SYNC-COMPLETE-2: durable background worker that drives queued
/// <see cref="FullCorpusRun"/> rows through the six-lane sequence
/// and the post-drain reconciliation pass.
///
/// <para><b>Lifecycle:</b></para>
/// <list type="number">
///   <item>On <c>StartAsync</c>: run the <i>interrupted-run sweep</i>
///   — any row stuck at <c>Status="Running"</c> from before the
///   restart is flipped to <c>Interrupted</c> with an explanatory
///   <c>ErrorMessage</c>. <b>Auto-resume is intentionally NOT done</b>:
///   the operator must call <c>POST /api/sync/corpus/{id}/resume</c>
///   explicitly so a flapping backend can't burn through compute.</item>
///   <item>Spawn a long-running <c>Task.Run</c> background loop that
///   polls every <see cref="PollInterval"/> for the oldest
///   <c>Status="Queued"</c> run; when found, runs each remaining
///   lane sequentially via <see cref="ICorpusLaneRunner"/>; advances
///   <c>NextLaneOnResume</c> after each successful lane; on failure
///   marks the run <c>Status="Failed"</c> and exits the lane loop.</item>
///   <item>After all six lanes complete: invokes
///   <see cref="IPacsBaselineReconciler"/> for each lane, persists
///   <see cref="FullCorpusReconciliation"/> rows, then marks the
///   run <c>Status="Completed"</c>.</item>
///   <item>On <c>StopAsync</c>: cancels the loop. Any in-flight lane
///   continues to its natural finish (we do not abort mid-lane to
///   avoid leaving the doctrine layer in a torn-down state).</item>
/// </list>
///
/// <para>The worker stays alive across the 5-second poll interval by
/// keeping a single <c>Task.Run</c> task active for the host's
/// lifetime; the task itself uses <c>Task.Delay(PollInterval, ct)</c>
/// to wait between polls.</para>
/// </summary>
public sealed class FullCorpusOrchestratorHostedService : IHostedService, IDisposable
{
    /// <summary>How often the worker polls for queued runs.</summary>
    public static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<FullCorpusOrchestratorHostedService> _logger;

    private readonly CancellationTokenSource _stoppingCts = new();
    private Task? _workerLoop;

    public FullCorpusOrchestratorHostedService(
        IServiceScopeFactory scopeFactory,
        ILogger<FullCorpusOrchestratorHostedService> logger)
    {
        ArgumentNullException.ThrowIfNull(scopeFactory);
        ArgumentNullException.ThrowIfNull(logger);
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // Step 1: interrupted-run sweep. Synchronous on startup —
        // must happen before the loop accepts the first poll.
        try
        {
            await SweepInterruptedRunsAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            // Non-fatal: we never want to crash backend startup over
            // a stale sweep. Operator can investigate via the
            // /status endpoint.
            _logger.LogWarning(ex,
                "FullCorpusOrchestratorHostedService: interrupted-run sweep failed; " +
                "continuing to start poll loop.");
        }

        // Step 2: spin up the long-running poll loop on a thread-pool
        // task. We do NOT await the task here — that would block
        // backend startup forever.
        _workerLoop = Task.Run(() => PollLoopAsync(_stoppingCts.Token));
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        try
        {
            _stoppingCts.Cancel();
        }
        catch (ObjectDisposedException) { /* already stopped */ }

        if (_workerLoop is not null)
        {
            try
            {
                await _workerLoop.ConfigureAwait(false);
            }
            catch (OperationCanceledException) { /* expected */ }
        }
    }

    public void Dispose() => _stoppingCts.Dispose();

    // ── Sweep ───────────────────────────────────────────────────────

    /// <summary>
    /// Mark any <c>Status="Running"</c> rows as <c>Interrupted</c>.
    /// The backend was restarted between when the worker flipped
    /// the row to Running and when it finished.
    /// </summary>
    private async Task SweepInterruptedRunsAsync(CancellationToken ct)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();

        var stale = await db.FullCorpusRuns
            .Where(r => r.Status == FullCorpusOrchestrator.StatusRunning)
            .ToListAsync(ct).ConfigureAwait(false);

        if (stale.Count == 0) return;

        foreach (var r in stale)
        {
            r.Status = FullCorpusOrchestrator.StatusInterrupted;
            r.ErrorMessage = "backend restarted before run completed";
        }
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
        _logger.LogInformation(
            "FullCorpusOrchestratorHostedService: swept {Count} stale Running rows → Interrupted.",
            stale.Count);
    }

    // ── Poll loop ───────────────────────────────────────────────────

    private async Task PollLoopAsync(CancellationToken ct)
    {
        _logger.LogInformation(
            "FullCorpusOrchestratorHostedService: poll loop online (interval={Interval}).",
            PollInterval);

        while (!ct.IsCancellationRequested)
        {
            try
            {
                var didWork = await TryProcessNextQueuedRunAsync(ct).ConfigureAwait(false);
                if (!didWork)
                {
                    await Task.Delay(PollInterval, ct).ConfigureAwait(false);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "FullCorpusOrchestratorHostedService: poll loop iteration threw; " +
                    "continuing after delay.");
                try
                {
                    await Task.Delay(PollInterval, ct).ConfigureAwait(false);
                }
                catch (OperationCanceledException) { break; }
            }
        }

        _logger.LogInformation("FullCorpusOrchestratorHostedService: poll loop offline.");
    }

    private async Task<bool> TryProcessNextQueuedRunAsync(CancellationToken ct)
    {
        Guid runId;
        await using (var scope = _scopeFactory.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var run = await db.FullCorpusRuns
                .Where(r => r.Status == FullCorpusOrchestrator.StatusQueued)
                .OrderBy(r => r.StartedAt)
                .FirstOrDefaultAsync(ct).ConfigureAwait(false);
            if (run is null) return false;

            run.Status = FullCorpusOrchestrator.StatusRunning;
            run.CurrentLane = run.NextLaneOnResume;
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
            runId = run.RunId;
        }

        await ProcessRunAsync(runId, ct).ConfigureAwait(false);
        return true;
    }

    /// <summary>
    /// Process the run from <c>NextLaneOnResume</c> through the lane
    /// sequence, then reconciliation. Mutates the run row + per-lane
    /// rows + reconciliation rows via fresh scopes per stage.
    /// </summary>
    public async Task ProcessRunAsync(Guid runId, CancellationToken ct)
    {
        // Determine the starting lane from a fresh scope.
        string? startLane;
        string operatorName;
        short workingYear;
        await using (var scope = _scopeFactory.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var run = await db.FullCorpusRuns
                .FirstOrDefaultAsync(r => r.RunId == runId, ct).ConfigureAwait(false);
            if (run is null) return;
            startLane = run.NextLaneOnResume;
            operatorName = run.OperatorName;
            workingYear = run.WorkingYear;
        }

        var startIdx = startLane is null
            ? CorpusReconciliationPolicy.LaneOrder.Count
            : Math.Max(0, CorpusReconciliationPolicy.LaneOrder
                .ToList()
                .FindIndex(l => string.Equals(l, startLane, StringComparison.OrdinalIgnoreCase)));

        for (var i = startIdx; i < CorpusReconciliationPolicy.LaneOrder.Count; i++)
        {
            ct.ThrowIfCancellationRequested();
            var lane = CorpusReconciliationPolicy.LaneOrder[i];

            var success = await ExecuteLaneAsync(runId, lane, operatorName, workingYear, ct)
                .ConfigureAwait(false);
            if (!success)
                return;  // Run is now Failed; do not reconcile.

            // Advance NextLaneOnResume to the lane after this one (or
            // null when this was the final lane).
            await using var scope = _scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var run = await db.FullCorpusRuns
                .FirstOrDefaultAsync(r => r.RunId == runId, ct).ConfigureAwait(false);
            if (run is null) return;
            run.NextLaneOnResume = i + 1 < CorpusReconciliationPolicy.LaneOrder.Count
                ? CorpusReconciliationPolicy.LaneOrder[i + 1]
                : null;
            run.CurrentLane = run.NextLaneOnResume;
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
        }

        // All six lanes complete → reconciliation pass.
        await RunReconciliationAsync(runId, workingYear, ct).ConfigureAwait(false);

        await using (var scope = _scopeFactory.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var run = await db.FullCorpusRuns
                .FirstOrDefaultAsync(r => r.RunId == runId, ct).ConfigureAwait(false);
            if (run is null) return;
            run.Status = FullCorpusOrchestrator.StatusCompleted;
            run.FinishedAt = DateTime.UtcNow;
            run.CurrentLane = null;
            run.NextLaneOnResume = null;
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
        }
    }

    private async Task<bool> ExecuteLaneAsync(
        Guid runId, string lane, string operatorName, short workingYear, CancellationToken ct)
    {
        // SYNC-COMPLETE-2-V2: read the lane row's prior status +
        // LastCompletedStage BEFORE flipping to Running. We pass
        // ResumeFromStage to the runner only when the prior status was
        // Failed AND a checkpoint was persisted; otherwise the lane
        // endpoint runs from the start (today's behavior).
        Guid laneResultId;
        string? resumeFromStage = null;
        await using (var scope = _scopeFactory.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var laneRow = await db.FullCorpusLaneResults
                .FirstOrDefaultAsync(l => l.RunId == runId && l.Lane == lane, ct)
                .ConfigureAwait(false);
            if (laneRow is null) return false;

            if (string.Equals(laneRow.Status, "Failed", StringComparison.OrdinalIgnoreCase) &&
                !string.IsNullOrEmpty(laneRow.LastCompletedStage))
            {
                resumeFromStage = laneRow.LastCompletedStage;
                _logger.LogInformation(
                    "FullCorpusOrchestratorHostedService: lane={Lane} resuming after stage={Stage}.",
                    lane, resumeFromStage);
            }

            laneRow.Status = "Running";
            laneRow.StartedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
            laneResultId = laneRow.LaneResultId;
        }

        // Run the lane (stage-resume-aware overload).
        CorpusLaneRunResult laneResult;
        await using (var scope = _scopeFactory.CreateAsyncScope())
        {
            var runner = scope.ServiceProvider.GetRequiredService<ICorpusLaneRunner>();
            laneResult = await runner.RunLaneAsync(
                lane, operatorName, workingYear,
                fullCorpus: true, topN: null,
                laneResultId: laneResultId,
                resumeFromStage: resumeFromStage,
                cancellationToken: ct).ConfigureAwait(false);
        }

        // Persist lane result.
        await using (var scope = _scopeFactory.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var laneRow = await db.FullCorpusLaneResults
                .FirstOrDefaultAsync(l => l.LaneResultId == laneResultId, ct)
                .ConfigureAwait(false);
            if (laneRow is null) return false;
            laneRow.Status = laneResult.Outcome == CorpusLaneRunOutcome.Completed
                ? "Completed"
                : "Failed";
            laneRow.FinishedAt = DateTime.UtcNow;
            laneRow.BatchIdsJson = JsonSerializer.Serialize(laneResult.BatchIds);
            laneRow.CountsJson = laneResult.CountsJson;
            laneRow.GateSummaryJson = laneResult.GateSummaryJson;
            laneRow.QuarantineDeltaJson = laneResult.QuarantineDeltaJson;
            laneRow.ErrorMessage = laneResult.ErrorMessage;
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
        }

        if (laneResult.Outcome == CorpusLaneRunOutcome.Completed)
            return true;

        // Lane failed: mark run Failed.
        await using (var scope = _scopeFactory.CreateAsyncScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var run = await db.FullCorpusRuns
                .FirstOrDefaultAsync(r => r.RunId == runId, ct).ConfigureAwait(false);
            if (run is null) return false;
            run.Status = FullCorpusOrchestrator.StatusFailed;
            run.ErrorMessage = $"lane '{lane}' failed: {laneResult.ErrorMessage}";
            run.FinishedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct).ConfigureAwait(false);
        }
        return false;
    }

    /// <summary>
    /// Runs the per-lane reconciliation pass in parallel-by-lane (one
    /// scope per lane). Failures persist as <c>Investigate</c>; the
    /// run is still marked <c>Completed</c> after this pass.
    /// </summary>
    public async Task RunReconciliationAsync(Guid runId, short workingYear, CancellationToken ct)
    {
        var nowUtc = DateTime.UtcNow;
        var rows = new List<FullCorpusReconciliation>();

        await using var scope = _scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var reconciler = scope.ServiceProvider.GetRequiredService<IPacsBaselineReconciler>();

        foreach (var lane in CorpusReconciliationPolicy.LaneOrder)
        {
            ct.ThrowIfCancellationRequested();

            var policy = CorpusReconciliationPolicy.Policies[lane];

            var pacsResult = await reconciler.QueryAsync(lane, workingYear, ct).ConfigureAwait(false);
            var tfCount = await reconciler.CountTfCanonicalAsync(lane, workingYear, ct)
                .ConfigureAwait(false);

            string status;
            string? notes = pacsResult.Notes;
            long pacsCount = pacsResult.Count;
            long delta = tfCount - pacsCount;
            decimal deltaPct;

            if (pacsResult.Outcome != PacsBaselineOutcome.Ok)
            {
                status = CorpusReconciliationPolicy.ReconciliationStatusInvestigate;
                deltaPct = 0m;
            }
            else
            {
                deltaPct = CorpusReconciliationPolicy.ComputeDeltaPct(pacsCount, delta);
                status = CorpusReconciliationPolicy.Classify(delta, deltaPct, policy.TolerancePct);
            }

            rows.Add(new FullCorpusReconciliation
            {
                ReconciliationId = Guid.NewGuid(),
                RunId = runId,
                Lane = lane,
                ExpectedBasis = policy.ExpectedBasis,
                PacsSourceCount = pacsCount,
                TfCanonicalCount = tfCount,
                Delta = delta,
                DeltaPct = deltaPct,
                TolerancePct = policy.TolerancePct,
                ReconciliationStatus = status,
                Notes = notes,
                ComputedAt = nowUtc,
            });
        }

        db.FullCorpusReconciliations.AddRange(rows);
        await db.SaveChangesAsync(ct).ConfigureAwait(false);
    }
}
