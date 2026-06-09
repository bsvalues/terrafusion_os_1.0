using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.Workbench;
using TerraFusion.Core.Sync.Corpus;
using TerraFusion.Data;
using TerraFusion.Data.Services.Workbench.Corpus;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2 unit tests for
/// <see cref="FullCorpusOrchestrator"/>. In-memory DbContext fixture
/// mirrors the WORKBENCH-G test pattern.
/// </summary>
public sealed class FullCorpusOrchestratorTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public FullCorpusOrchestratorTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"corpus-orch-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["ConnectionStrings:DefaultConnection"] = "InMemory" })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private FullCorpusOrchestrator Build() => new(_db);

    [Fact]
    public async Task StartAsync_creates_run_with_status_Queued()
    {
        var svc = Build();
        var result = await svc.StartAsync("op", 2026, CancellationToken.None);

        result.Outcome.Should().Be(CorpusOutcome.Ok);
        var run = await _db.FullCorpusRuns.SingleAsync(r => r.RunId == result.RunId);
        run.Status.Should().Be(FullCorpusOrchestrator.StatusQueued);
        run.OperatorName.Should().Be("op");
        run.WorkingYear.Should().Be((short)2026);
    }

    [Fact]
    public async Task StartAsync_creates_six_lane_result_rows_in_Pending()
    {
        var svc = Build();
        var result = await svc.StartAsync("op", 2026, CancellationToken.None);

        var lanes = await _db.FullCorpusLaneResults
            .Where(l => l.RunId == result.RunId).ToListAsync();
        lanes.Should().HaveCount(6);
        lanes.Select(l => l.Lane).Should().BeEquivalentTo(
            new[] { "parcel", "owner-wsdor", "improvement", "land", "sales", "geometry" });
        lanes.Should().OnlyContain(l => l.Status == FullCorpusOrchestrator.LaneStatusPending);
    }

    [Fact]
    public async Task StartAsync_sets_NextLaneOnResume_to_parcel()
    {
        var svc = Build();
        var result = await svc.StartAsync("op", 2026, CancellationToken.None);

        var run = await _db.FullCorpusRuns.SingleAsync(r => r.RunId == result.RunId);
        run.NextLaneOnResume.Should().Be("parcel");
    }

    [Fact]
    public async Task StartAsync_normalizes_blank_operator_to_default_value()
    {
        var svc = Build();
        var result = await svc.StartAsync("   ", 2026, CancellationToken.None);

        var run = await _db.FullCorpusRuns.SingleAsync(r => r.RunId == result.RunId);
        run.OperatorName.Should().Be("full-corpus-runner");
    }

    [Fact]
    public async Task ResumeAsync_on_Failed_run_flips_to_Queued()
    {
        var run = await SeedRunAsync(FullCorpusOrchestrator.StatusFailed);
        var result = await Build().ResumeAsync(run.RunId, CancellationToken.None);

        result.Outcome.Should().Be(CorpusOutcome.Ok);
        var refreshed = await _db.FullCorpusRuns.SingleAsync(r => r.RunId == run.RunId);
        refreshed.Status.Should().Be(FullCorpusOrchestrator.StatusQueued);
        refreshed.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public async Task ResumeAsync_on_Interrupted_run_flips_to_Queued()
    {
        var run = await SeedRunAsync(FullCorpusOrchestrator.StatusInterrupted);
        var result = await Build().ResumeAsync(run.RunId, CancellationToken.None);

        result.Outcome.Should().Be(CorpusOutcome.Ok);
        var refreshed = await _db.FullCorpusRuns.SingleAsync(r => r.RunId == run.RunId);
        refreshed.Status.Should().Be(FullCorpusOrchestrator.StatusQueued);
    }

    [Fact]
    public async Task ResumeAsync_on_Running_run_returns_Conflict()
    {
        var run = await SeedRunAsync(FullCorpusOrchestrator.StatusRunning);
        var result = await Build().ResumeAsync(run.RunId, CancellationToken.None);

        result.Outcome.Should().Be(CorpusOutcome.Conflict);
        result.Status.Should().Be(FullCorpusOrchestrator.StatusRunning);
    }

    [Fact]
    public async Task ResumeAsync_on_Completed_run_returns_Conflict()
    {
        var run = await SeedRunAsync(FullCorpusOrchestrator.StatusCompleted);
        var result = await Build().ResumeAsync(run.RunId, CancellationToken.None);

        result.Outcome.Should().Be(CorpusOutcome.Conflict);
    }

    [Fact]
    public async Task ResumeAsync_on_Queued_run_returns_Conflict()
    {
        var run = await SeedRunAsync(FullCorpusOrchestrator.StatusQueued);
        var result = await Build().ResumeAsync(run.RunId, CancellationToken.None);

        result.Outcome.Should().Be(CorpusOutcome.Conflict);
    }

    [Fact]
    public async Task ResumeAsync_on_unknown_run_returns_NotFound()
    {
        var result = await Build().ResumeAsync(Guid.NewGuid(), CancellationToken.None);
        result.Outcome.Should().Be(CorpusOutcome.NotFound);
    }

    [Fact]
    public async Task ResumeAsync_preserves_NextLaneOnResume()
    {
        var run = await SeedRunAsync(FullCorpusOrchestrator.StatusFailed, nextLane: "improvement");
        await Build().ResumeAsync(run.RunId, CancellationToken.None);

        var refreshed = await _db.FullCorpusRuns.SingleAsync(r => r.RunId == run.RunId);
        refreshed.NextLaneOnResume.Should().Be("improvement");
    }

    [Fact]
    public async Task GetStatusAsync_returns_run_and_six_lane_rows()
    {
        var svc = Build();
        var startResult = await svc.StartAsync("op", 2026, CancellationToken.None);
        var status = await svc.GetStatusAsync(startResult.RunId, CancellationToken.None);

        status.Outcome.Should().Be(CorpusOutcome.Ok);
        status.Run.Should().NotBeNull();
        status.Lanes.Should().HaveCount(6);
    }

    [Fact]
    public async Task GetStatusAsync_on_unknown_run_returns_NotFound()
    {
        var status = await Build().GetStatusAsync(Guid.NewGuid(), CancellationToken.None);
        status.Outcome.Should().Be(CorpusOutcome.NotFound);
    }

    [Fact]
    public async Task GetStatusAsync_surfaces_LastCompletedStage_from_db_row()
    {
        // SYNC-COMPLETE-2-V2: stage-resume persists LastCompletedStage on
        // the lane row; the API status projection must expose it so
        // operators querying GET /api/sync/corpus/{runId} see the
        // checkpoint, not null.
        var svc = Build();
        var start = await svc.StartAsync("op", 2026, CancellationToken.None);

        var improvementLane = await _db.FullCorpusLaneResults
            .SingleAsync(l => l.RunId == start.RunId && l.Lane == "improvement");
        improvementLane.LastCompletedStage = "promote-truth";
        await _db.SaveChangesAsync();

        var status = await svc.GetStatusAsync(start.RunId, CancellationToken.None);

        status.Outcome.Should().Be(CorpusOutcome.Ok);
        status.Lanes.Should().NotBeNull();
        var snapshot = status.Lanes!.Single(s => s.Lane == "improvement");
        snapshot.LastCompletedStage.Should().Be("promote-truth");

        // Other lanes still report null — fresh-start sentinel preserved.
        status.Lanes!
            .Where(s => s.Lane != "improvement")
            .Should()
            .OnlyContain(s => s.LastCompletedStage == null);
    }

    [Fact]
    public async Task GetReconciliationAsync_returns_empty_when_not_yet_run()
    {
        var run = await SeedRunAsync(FullCorpusOrchestrator.StatusRunning);
        var result = await Build().GetReconciliationAsync(run.RunId, CancellationToken.None);

        result.Outcome.Should().Be(CorpusOutcome.Ok);
        result.Reconciliations.Should().BeEmpty();
    }

    [Fact]
    public async Task GetReconciliationAsync_returns_six_rows_when_complete()
    {
        var run = await SeedRunAsync(FullCorpusOrchestrator.StatusCompleted);
        foreach (var lane in CorpusReconciliationPolicy.LaneOrder)
        {
            _db.FullCorpusReconciliations.Add(new FullCorpusReconciliation
            {
                ReconciliationId = Guid.NewGuid(),
                RunId = run.RunId,
                Lane = lane,
                ExpectedBasis = CorpusReconciliationPolicy.Policies[lane].ExpectedBasis,
                ReconciliationStatus = CorpusReconciliationPolicy.ReconciliationStatusMatch,
                ComputedAt = DateTime.UtcNow,
            });
        }
        await _db.SaveChangesAsync();

        var result = await Build().GetReconciliationAsync(run.RunId, CancellationToken.None);
        result.Outcome.Should().Be(CorpusOutcome.Ok);
        result.Reconciliations.Should().HaveCount(6);
    }

    [Fact]
    public async Task GetReconciliationAsync_on_unknown_run_returns_NotFound()
    {
        var result = await Build().GetReconciliationAsync(Guid.NewGuid(), CancellationToken.None);
        result.Outcome.Should().Be(CorpusOutcome.NotFound);
    }

    private async Task<FullCorpusRun> SeedRunAsync(
        string status,
        string? nextLane = "parcel")
    {
        var run = new FullCorpusRun
        {
            RunId = Guid.NewGuid(),
            OperatorName = "test-op",
            WorkingYear = 2026,
            Status = status,
            NextLaneOnResume = nextLane,
            StartedAt = DateTime.UtcNow,
        };
        _db.FullCorpusRuns.Add(run);
        await _db.SaveChangesAsync();
        return run;
    }
}
