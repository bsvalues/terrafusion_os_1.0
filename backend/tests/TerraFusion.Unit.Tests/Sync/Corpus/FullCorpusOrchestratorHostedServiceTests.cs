using System;
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
/// SYNC-COMPLETE-2 unit tests for
/// <see cref="FullCorpusOrchestratorHostedService"/>. We exercise
/// the worker's <c>ProcessRunAsync</c> + <c>RunReconciliationAsync</c>
/// + sweep methods directly via the same scope-factory the host
/// uses, with fakes for <see cref="ICorpusLaneRunner"/> and
/// <see cref="IPacsBaselineReconciler"/>.
///
/// <para>The worker uses fresh DbContext scopes per stage, so a
/// scope-factory wrapping a single in-memory database is the
/// cleanest fixture.</para>
/// </summary>
public sealed class FullCorpusOrchestratorHostedServiceTests : IDisposable
{
    private readonly string _dbName = $"corpus-host-{Guid.NewGuid():N}";
    private readonly ServiceProvider _provider;

    public FullCorpusOrchestratorHostedServiceTests()
    {
        var services = new ServiceCollection();
        services.AddDbContext<TerraFusionDbContext>(opt => opt.UseInMemoryDatabase(_dbName));
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["FullCorpus:Worker:Enabled"] = "true"
            }).Build();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddSingleton<ICorpusLaneRunner>(new SuccessLaneRunner());
        services.AddSingleton<IPacsBaselineReconciler>(new FakeReconciler());
        _provider = services.BuildServiceProvider();
        // Ensure schema created.
        using var scope = _provider.CreateScope();
        scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>().Database.EnsureCreated();
    }

    public void Dispose() => _provider.Dispose();

    private FullCorpusOrchestratorHostedService BuildHost()
    {
        var scopeFactory = _provider.GetRequiredService<IServiceScopeFactory>();
        return new FullCorpusOrchestratorHostedService(
            scopeFactory,
            _provider.GetRequiredService<IConfiguration>(),
            NullLogger<FullCorpusOrchestratorHostedService>.Instance);
    }

    /// <summary>
    /// Read snapshot. The scope is disposed when the test ends via
    /// <see cref="Dispose"/> on the service provider; we don't need
    /// to track it here for in-memory provider correctness.
    /// </summary>
    private TerraFusionDbContext GetReadDb()
    {
        var scope = _provider.CreateScope();
        return scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
    }

    [Fact]
    public async Task StartAsync_sweeps_stale_Running_runs_to_Interrupted()
    {
        // Seed a Running run from a "previous" backend lifetime.
        using (var scope = _provider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            db.FullCorpusRuns.Add(new FullCorpusRun
            {
                RunId = Guid.NewGuid(),
                OperatorName = "stale",
                WorkingYear = 2026,
                Status = FullCorpusOrchestrator.StatusRunning,
                StartedAt = DateTime.UtcNow.AddHours(-3),
            });
            await db.SaveChangesAsync();
        }

        var host = BuildHost();
        await host.StartAsync(CancellationToken.None);
        await host.StopAsync(CancellationToken.None);

        var read = GetReadDb();
        var swept = await read.FullCorpusRuns.SingleAsync();
        swept.Status.Should().Be(FullCorpusOrchestrator.StatusInterrupted);
        swept.ErrorMessage.Should().Contain("backend restarted");
    }

    [Fact]
    public async Task StartAsync_when_worker_disabled_does_not_touch_corpus_tables()
    {
        using (var scope = _provider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
            db.FullCorpusRuns.Add(new FullCorpusRun
            {
                RunId = Guid.NewGuid(),
                OperatorName = "stale",
                WorkingYear = 2026,
                Status = FullCorpusOrchestrator.StatusRunning,
                StartedAt = DateTime.UtcNow.AddHours(-3),
            });
            await db.SaveChangesAsync();
        }

        var disabledConfig = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?>
            {
                ["FullCorpus:Worker:Enabled"] = "false"
            }).Build();
        var host = new FullCorpusOrchestratorHostedService(
            _provider.GetRequiredService<IServiceScopeFactory>(),
            disabledConfig,
            NullLogger<FullCorpusOrchestratorHostedService>.Instance);

        await host.StartAsync(CancellationToken.None);
        await host.StopAsync(CancellationToken.None);

        var read = GetReadDb();
        var untouched = await read.FullCorpusRuns.SingleAsync();
        untouched.Status.Should().Be(FullCorpusOrchestrator.StatusRunning);
        untouched.ErrorMessage.Should().BeNull();
    }

    [Fact]
    public async Task ProcessRunAsync_advances_NextLaneOnResume_after_each_lane()
    {
        var runId = await SeedQueuedRunAsync();
        var host = BuildHost();
        await host.ProcessRunAsync(runId, CancellationToken.None);

        var read = GetReadDb();
        var run = await read.FullCorpusRuns.SingleAsync(r => r.RunId == runId);
        run.Status.Should().Be(FullCorpusOrchestrator.StatusCompleted);
        run.NextLaneOnResume.Should().BeNull();

        var lanes = await read.FullCorpusLaneResults.Where(l => l.RunId == runId).ToListAsync();
        lanes.Should().OnlyContain(l => l.Status == "Completed");
    }

    [Fact]
    public async Task ProcessRunAsync_on_lane_failure_marks_run_Failed_and_preserves_NextLaneOnResume()
    {
        // Use a runner that fails on the third lane (improvement).
        var failingRunner = new FailOnLaneRunner("improvement");
        ReplaceRunner(failingRunner);
        var runId = await SeedQueuedRunAsync();
        var host = BuildHost();
        await host.ProcessRunAsync(runId, CancellationToken.None);

        var read = GetReadDb();
        var run = await read.FullCorpusRuns.SingleAsync(r => r.RunId == runId);
        run.Status.Should().Be(FullCorpusOrchestrator.StatusFailed);
        run.ErrorMessage.Should().Contain("improvement");
        // First two lanes advanced NextLaneOnResume to "improvement"; failure
        // does not advance further. Worker resumes from improvement on retry.
        run.NextLaneOnResume.Should().Be("improvement");
    }

    [Fact]
    public async Task ProcessRunAsync_after_six_lanes_runs_reconciliation_pass()
    {
        var runId = await SeedQueuedRunAsync();
        var host = BuildHost();
        await host.ProcessRunAsync(runId, CancellationToken.None);

        var read = GetReadDb();
        var rec = await read.FullCorpusReconciliations.Where(r => r.RunId == runId).ToListAsync();
        rec.Should().HaveCount(6);
        rec.Select(r => r.Lane).Should().BeEquivalentTo(CorpusReconciliationPolicy.LaneOrder);
    }

    [Fact]
    public async Task ProcessRunAsync_persists_lane_batch_ids_and_counts_json()
    {
        var runId = await SeedQueuedRunAsync();
        var host = BuildHost();
        await host.ProcessRunAsync(runId, CancellationToken.None);

        var read = GetReadDb();
        var lanes = await read.FullCorpusLaneResults.Where(l => l.RunId == runId).ToListAsync();
        lanes.Should().OnlyContain(l => !string.IsNullOrEmpty(l.BatchIdsJson));
        lanes.Should().OnlyContain(l => l.CountsJson != null);
    }

    [Fact]
    public async Task RunReconciliationAsync_records_Investigate_when_reconciler_unreachable()
    {
        ReplaceReconciler(new UnreachableReconciler());
        var runId = await SeedQueuedRunAsync();
        var host = BuildHost();
        await host.RunReconciliationAsync(runId, 2026, CancellationToken.None);

        var read = GetReadDb();
        var rec = await read.FullCorpusReconciliations.Where(r => r.RunId == runId).ToListAsync();
        rec.Should().HaveCount(6);
        rec.Should().OnlyContain(r =>
            r.ReconciliationStatus == CorpusReconciliationPolicy.ReconciliationStatusInvestigate);
        rec.Should().OnlyContain(r => !string.IsNullOrEmpty(r.Notes));
    }

    private async Task<Guid> SeedQueuedRunAsync()
    {
        using var scope = _provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var orchestrator = new FullCorpusOrchestrator(db);
        var result = await orchestrator.StartAsync("test-op", 2026, CancellationToken.None);
        // Flip to Running so worker treats it as a picked run.
        var run = await db.FullCorpusRuns.SingleAsync(r => r.RunId == result.RunId);
        run.Status = FullCorpusOrchestrator.StatusRunning;
        run.CurrentLane = "parcel";
        await db.SaveChangesAsync();
        return result.RunId;
    }

    private void ReplaceRunner(ICorpusLaneRunner runner) =>
        ((SuccessLaneRunner)_provider.GetRequiredService<ICorpusLaneRunner>())
            .OverrideWith = runner;

    private void ReplaceReconciler(IPacsBaselineReconciler reconciler) =>
        ((FakeReconciler)_provider.GetRequiredService<IPacsBaselineReconciler>())
            .OverrideWith = reconciler;

    // ── Fakes ───────────────────────────────────────────────────────

    private sealed class SuccessLaneRunner : ICorpusLaneRunner
    {
        public ICorpusLaneRunner? OverrideWith { get; set; }

        public Task<CorpusLaneRunResult> RunLaneAsync(
            string lane, string operatorName, short workingYear,
            bool fullCorpus, int? topN, CancellationToken cancellationToken)
        {
            if (OverrideWith is not null)
                return OverrideWith.RunLaneAsync(
                    lane, operatorName, workingYear, fullCorpus, topN, cancellationToken);

            return Task.FromResult(new CorpusLaneRunResult(
                CorpusLaneRunOutcome.Completed,
                new[] { Guid.NewGuid() },
                "{\"rowsLanded\":42}",
                "{\"totals\":[]}",
                "{\"before\":0,\"after\":0,\"delta\":0}",
                null));
        }
    }

    private sealed class FailOnLaneRunner : ICorpusLaneRunner
    {
        private readonly string _failLane;
        public FailOnLaneRunner(string failLane) { _failLane = failLane; }

        public Task<CorpusLaneRunResult> RunLaneAsync(
            string lane, string operatorName, short workingYear,
            bool fullCorpus, int? topN, CancellationToken cancellationToken)
        {
            if (string.Equals(lane, _failLane, StringComparison.OrdinalIgnoreCase))
                return Task.FromResult(new CorpusLaneRunResult(
                    CorpusLaneRunOutcome.Failed,
                    Array.Empty<Guid>(),
                    null, null, null,
                    "simulated failure"));

            return Task.FromResult(new CorpusLaneRunResult(
                CorpusLaneRunOutcome.Completed,
                new[] { Guid.NewGuid() },
                "{}", "{}", "{}",
                null));
        }
    }

    private sealed class FakeReconciler : IPacsBaselineReconciler
    {
        public IPacsBaselineReconciler? OverrideWith { get; set; }

        public Task<PacsBaselineResult> QueryAsync(
            string lane, short workingYear, CancellationToken ct)
        {
            if (OverrideWith is not null)
                return OverrideWith.QueryAsync(lane, workingYear, ct);
            return Task.FromResult(new PacsBaselineResult(
                PacsBaselineOutcome.Ok, 100L, null));
        }

        public Task<long> CountTfCanonicalAsync(
            string lane, short workingYear, CancellationToken ct)
        {
            if (OverrideWith is not null)
                return OverrideWith.CountTfCanonicalAsync(lane, workingYear, ct);
            return Task.FromResult(100L);
        }
    }

    private sealed class UnreachableReconciler : IPacsBaselineReconciler
    {
        public Task<PacsBaselineResult> QueryAsync(
            string lane, short workingYear, CancellationToken ct) =>
            Task.FromResult(new PacsBaselineResult(
                PacsBaselineOutcome.Unreachable, 0, "PACS unreachable in test fixture."));

        public Task<long> CountTfCanonicalAsync(
            string lane, short workingYear, CancellationToken ct) =>
            Task.FromResult(0L);
    }
}
