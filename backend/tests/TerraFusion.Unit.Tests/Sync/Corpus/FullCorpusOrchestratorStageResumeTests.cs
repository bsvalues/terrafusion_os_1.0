using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.Workbench;
using TerraFusion.Core.Sync.Corpus;
using TerraFusion.Data;
using TerraFusion.Data.Services.Workbench.Corpus;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2-V2 unit tests for stage-level resume threading
/// inside <see cref="FullCorpusOrchestratorHostedService"/>. We capture
/// every <see cref="ICorpusLaneRunner"/> invocation and assert the
/// expected (LaneResultId, ResumeFromStage) tuple is passed.
/// </summary>
public sealed class FullCorpusOrchestratorStageResumeTests : IDisposable
{
    private readonly string _dbName = $"corpus-stage-resume-{Guid.NewGuid():N}";
    private readonly ServiceProvider _provider;
    private readonly CapturingLaneRunner _capture;

    public FullCorpusOrchestratorStageResumeTests()
    {
        _capture = new CapturingLaneRunner();
        var services = new ServiceCollection();
        services.AddDbContext<TerraFusionDbContext>(opt => opt.UseInMemoryDatabase(_dbName));
        services.AddSingleton<IConfiguration>(
            new ConfigurationBuilder().AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["FullCorpus:Worker:Enabled"] = "true"
                }).Build());
        services.AddSingleton<ICorpusLaneRunner>(_capture);
        services.AddSingleton<IPacsBaselineReconciler>(new OkReconciler());
        _provider = services.BuildServiceProvider();

        using var scope = _provider.CreateScope();
        scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>().Database.EnsureCreated();
    }

    public void Dispose() => _provider.Dispose();

    private FullCorpusOrchestratorHostedService BuildHost()
        => new(_provider.GetRequiredService<IServiceScopeFactory>(),
            _provider.GetRequiredService<IConfiguration>(),
            NullLogger<FullCorpusOrchestratorHostedService>.Instance);

    private TerraFusionDbContext GetReadDb()
    {
        var scope = _provider.CreateScope();
        return scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
    }

    private async Task<Guid> SeedQueuedRunAsync()
    {
        using var scope = _provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var orchestrator = new FullCorpusOrchestrator(db);
        var result = await orchestrator.StartAsync("test-op", 2026, CancellationToken.None);
        var run = await db.FullCorpusRuns.SingleAsync(r => r.RunId == result.RunId);
        run.Status = FullCorpusOrchestrator.StatusRunning;
        run.CurrentLane = "parcel";
        await db.SaveChangesAsync();
        return result.RunId;
    }

    [Fact]
    public async Task First_attempt_passes_LaneResultId_and_no_ResumeFromStage_to_each_lane()
    {
        var runId = await SeedQueuedRunAsync();
        var host = BuildHost();
        await host.ProcessRunAsync(runId, CancellationToken.None);

        _capture.Calls.Should().HaveCount(6);
        foreach (var call in _capture.Calls)
        {
            call.LaneResultId.Should().NotBeNull(
                "every lane invocation must pass a LaneResultId so the endpoint can checkpoint");
            call.ResumeFromStage.Should().BeNull(
                "first attempt has no prior LastCompletedStage to resume from");
        }
    }

    [Fact]
    public async Task LaneResultId_passed_matches_the_actual_lane_row_id()
    {
        var runId = await SeedQueuedRunAsync();
        var host = BuildHost();
        await host.ProcessRunAsync(runId, CancellationToken.None);

        var read = GetReadDb();
        foreach (var call in _capture.Calls)
        {
            var row = await read.FullCorpusLaneResults
                .SingleAsync(l => l.RunId == runId && l.Lane == call.Lane);
            call.LaneResultId.Should().Be(row.LaneResultId,
                $"lane {call.Lane} runner call must reference its own lane row");
        }
    }

    [Fact]
    public async Task Retry_of_Failed_lane_with_persisted_LastCompletedStage_passes_ResumeFromStage()
    {
        var runId = await SeedQueuedRunAsync();

        // Manually mark the improvement lane as Failed with a checkpoint.
        // This simulates a crash mid-improvement during a previous worker pass.
        using (var scope = _provider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var lane = await db.FullCorpusLaneResults.SingleAsync(
                l => l.RunId == runId && l.Lane == "improvement");
            lane.Status = "Failed";
            lane.LastCompletedStage = "Imprv-S1";
            // Mark earlier lanes Completed so the worker reaches improvement.
            foreach (var earlier in db.FullCorpusLaneResults.Where(l =>
                l.RunId == runId && (l.Lane == "parcel" || l.Lane == "owner-wsdor")))
            {
                earlier.Status = "Completed";
            }
            await db.SaveChangesAsync();
        }

        // Skip the parcel/owner-wsdor lanes by overriding the runner to
        // do nothing for those — only assert improvement gets the resume hint.
        _capture.SilentLanes.Add("parcel");
        _capture.SilentLanes.Add("owner-wsdor");

        var host = BuildHost();
        await host.ProcessRunAsync(runId, CancellationToken.None);

        var imprvCall = _capture.Calls.SingleOrDefault(c => c.Lane == "improvement");
        imprvCall.Should().NotBeNull("the improvement lane must be invoked on retry");
        imprvCall!.ResumeFromStage.Should().Be("Imprv-S1",
            "retry of Failed lane with persisted LastCompletedStage must pass ResumeFromStage");
    }

    [Fact]
    public async Task Retry_of_Failed_lane_with_NULL_LastCompletedStage_passes_no_ResumeFromStage()
    {
        var runId = await SeedQueuedRunAsync();

        using (var scope = _provider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var lane = await db.FullCorpusLaneResults.SingleAsync(
                l => l.RunId == runId && l.Lane == "land");
            lane.Status = "Failed";
            lane.LastCompletedStage = null; // crash in stage 1
            foreach (var earlier in db.FullCorpusLaneResults.Where(l =>
                l.RunId == runId &&
                (l.Lane == "parcel" || l.Lane == "owner-wsdor" || l.Lane == "improvement")))
            {
                earlier.Status = "Completed";
            }
            await db.SaveChangesAsync();
        }

        _capture.SilentLanes.Add("parcel");
        _capture.SilentLanes.Add("owner-wsdor");
        _capture.SilentLanes.Add("improvement");

        var host = BuildHost();
        await host.ProcessRunAsync(runId, CancellationToken.None);

        var landCall = _capture.Calls.SingleOrDefault(c => c.Lane == "land");
        landCall.Should().NotBeNull();
        landCall!.ResumeFromStage.Should().BeNull(
            "Failed lane with NULL LastCompletedStage means restart from stage 1");
    }

    [Fact]
    public async Task Pending_lane_status_does_not_send_ResumeFromStage_even_when_stage_persisted()
    {
        // Defensive: a Pending lane is one we haven't tried yet, so any
        // stale LastCompletedStage in the row must NOT trigger resume.
        var runId = await SeedQueuedRunAsync();
        using (var scope = _provider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var lane = await db.FullCorpusLaneResults.SingleAsync(
                l => l.RunId == runId && l.Lane == "parcel");
            lane.Status = "Pending";
            lane.LastCompletedStage = "Owner-Seed-S1"; // stale leftover
            await db.SaveChangesAsync();
        }

        var host = BuildHost();
        await host.ProcessRunAsync(runId, CancellationToken.None);

        var parcelCall = _capture.Calls.SingleOrDefault(c => c.Lane == "parcel");
        parcelCall.Should().NotBeNull();
        parcelCall!.ResumeFromStage.Should().BeNull(
            "Pending lane status means we should run it from stage 1, regardless of any stale checkpoint");
    }

    [Fact]
    public async Task ResumeAsync_preserves_LastCompletedStage_on_failed_lane_rows()
    {
        // Build a Failed run with one lane mid-flight.
        var runId = await SeedQueuedRunAsync();
        using (var scope = _provider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            var run = await db.FullCorpusRuns.SingleAsync(r => r.RunId == runId);
            run.Status = FullCorpusOrchestrator.StatusFailed;
            run.NextLaneOnResume = "improvement";

            var lane = await db.FullCorpusLaneResults.SingleAsync(
                l => l.RunId == runId && l.Lane == "improvement");
            lane.Status = "Failed";
            lane.LastCompletedStage = "Supp-S1";
            await db.SaveChangesAsync();

            var orchestrator = new FullCorpusOrchestrator(db);
            await orchestrator.ResumeAsync(runId, CancellationToken.None);
        }

        var read = GetReadDb();
        var refreshedLane = await read.FullCorpusLaneResults.SingleAsync(
            l => l.RunId == runId && l.Lane == "improvement");
        refreshedLane.LastCompletedStage.Should().Be("Supp-S1",
            "ResumeAsync must NOT clear the lane checkpoint — the worker reads it next pass");
        refreshedLane.Status.Should().Be("Failed",
            "ResumeAsync flips RUN status, not lane status; worker advances lane state");
    }

    [Fact]
    public async Task First_lane_invocation_writes_BatchIdsJson_to_lane_row()
    {
        // Smoke check that the orchestrator persists batch ids back —
        // separate from per-stage checkpointing inside the controller,
        // which would require integration-style mocking to assert.
        var runId = await SeedQueuedRunAsync();
        var host = BuildHost();
        await host.ProcessRunAsync(runId, CancellationToken.None);

        var read = GetReadDb();
        var lanes = await read.FullCorpusLaneResults.Where(l => l.RunId == runId).ToListAsync();
        lanes.Should().OnlyContain(l => !string.IsNullOrEmpty(l.BatchIdsJson),
            "every successful lane should leave its BatchIdsJson set on the row");
    }

    // ── Fakes ────────────────────────────────────────────────────────

    private sealed class CapturingLaneRunner : ICorpusLaneRunner
    {
        public ConcurrentBag<LaneCall> Calls { get; } = new();
        public HashSet<string> SilentLanes { get; } = new(StringComparer.OrdinalIgnoreCase);

        public Task<CorpusLaneRunResult> RunLaneAsync(
            string lane, string operatorName, short workingYear,
            bool fullCorpus, int? topN, CancellationToken cancellationToken)
            => RunLaneAsync(lane, operatorName, workingYear, fullCorpus, topN,
                laneResultId: null, resumeFromStage: null, cancellationToken);

        public Task<CorpusLaneRunResult> RunLaneAsync(
            string lane, string operatorName, short workingYear,
            bool fullCorpus, int? topN,
            Guid? laneResultId, string? resumeFromStage,
            CancellationToken cancellationToken)
        {
            Calls.Add(new LaneCall(lane, laneResultId, resumeFromStage));
            // Silent lanes return a quick OK without surfacing in
            // assertions about real lane routing.
            return Task.FromResult(new CorpusLaneRunResult(
                CorpusLaneRunOutcome.Completed,
                new[] { Guid.NewGuid() },
                "{\"rowsLanded\":1}", "{\"totals\":[]}",
                "{\"before\":0,\"after\":0,\"delta\":0}",
                null));
        }
    }

    public sealed record LaneCall(string Lane, Guid? LaneResultId, string? ResumeFromStage);

    private sealed class OkReconciler : IPacsBaselineReconciler
    {
        public Task<PacsBaselineResult> QueryAsync(
            string lane, short workingYear, CancellationToken ct)
            => Task.FromResult(new PacsBaselineResult(PacsBaselineOutcome.Ok, 1L, null));

        public Task<long> CountTfCanonicalAsync(
            string lane, short workingYear, CancellationToken ct)
            => Task.FromResult(1L);
    }
}
