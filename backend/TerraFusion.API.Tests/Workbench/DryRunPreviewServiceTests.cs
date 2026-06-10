// WORKBENCH-V0.2 SLICE-H STEP-2 — DryRunPreviewService contract tests.
//
// Validates:
//   1. dryRun=false is rejected (InvalidInput).
//   2. Empty lane is rejected (InvalidInput).
//   3. Unknown lane is rejected (UnsupportedLane).
//   4. Negative topN is rejected (InvalidInput).
//   5. Improvement lane with no source data: all counts are zero.
//   6. Improvement lane with source-only data: all are inserts, no updates/deletes.
//   7. Improvement lane with matching truth rows: counts reflect overlap.
//   8. dry_run_log row is written (IsPreview=true, Status="COMPLETE").
//   9. Truth/canonical tables are NOT modified after preview.
//  10. topN limits sourceCount correctly.

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.Workbench;
using TerraFusion.Data;
using TerraFusion.Data.Services.Workbench;
using Xunit;

namespace TerraFusion.API.Tests.Workbench;

public class DryRunPreviewServiceTests
{
    // ── Factory ─────────────────────────────────────────────────────

    private static (DryRunPreviewService svc, TerraFusionDbContext db) Build()
    {
        var dbName = $"DryRunPreviewTest_{Guid.NewGuid():N}";
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={dbName}.db",
            }).Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddDbContext<TerraFusionDbContext>(
            opt => opt.UseInMemoryDatabase(dbName));
        var sp = services.BuildServiceProvider();
        var db = sp.CreateScope().ServiceProvider
            .GetRequiredService<TerraFusionDbContext>();
        var svc = new DryRunPreviewService(
            db, NullLogger<DryRunPreviewService>.Instance);
        return (svc, db);
    }

    private static LegacyPacsRawImprv MakeSourceRow(int propId, long imprvId, short year = 2026)
        => new()
        {
            LandedRowId = Guid.NewGuid(),
            PropId = propId,
            ImprvId = imprvId,
            PropValYr = year,
            SupNum = 0,
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "hash",
            SourceRowHash = "hash",
            LandedAt = DateTime.UtcNow,
        };

    private static TruthPacsImprvCurrent MakeTruthRow(int propId, long imprvId, short year = 2026)
        => new()
        {
            TruthImprvId = Guid.NewGuid(),
            PropId = propId,
            ImprvId = imprvId,
            PropValYr = year,
            SupNum = 0,
            SourceImprvLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            ImprvLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = Guid.NewGuid(),
            PromotedAt = DateTime.UtcNow,
        };

    // ── Guard tests ──────────────────────────────────────────────────

    [Fact]
    public async Task DryRun_False_ReturnsInvalidInput()
    {
        var (svc, _) = Build();
        var result = await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "improvement",
            DryRun = false,
        });
        Assert.Equal(DryRunPreviewOutcome.InvalidInput, result.Outcome);
    }

    [Fact]
    public async Task EmptyLane_ReturnsInvalidInput()
    {
        var (svc, _) = Build();
        var result = await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "",
            DryRun = true,
        });
        Assert.Equal(DryRunPreviewOutcome.InvalidInput, result.Outcome);
    }

    [Fact]
    public async Task UnknownLane_ReturnsUnsupportedLane()
    {
        var (svc, _) = Build();
        var result = await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "parcel",
            DryRun = true,
        });
        Assert.Equal(DryRunPreviewOutcome.UnsupportedLane, result.Outcome);
    }

    [Fact]
    public async Task NegativeTopN_ReturnsInvalidInput()
    {
        var (svc, _) = Build();
        var result = await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "improvement",
            DryRun = true,
            TopN = -1,
        });
        Assert.Equal(DryRunPreviewOutcome.InvalidInput, result.Outcome);
    }

    // ── Improvement lane computation tests ──────────────────────────

    [Fact]
    public async Task EmptyDB_ReturnsAllZeros()
    {
        var (svc, _) = Build();
        var result = await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "improvement",
            DryRun = true,
            OperationalYear = 2026,
        });
        Assert.Equal(DryRunPreviewOutcome.Ok, result.Outcome);
        Assert.Equal(0, result.SourceCount);
        Assert.Equal(0, result.CanonicalCount);
        Assert.Equal(0, result.EstimatedInserts);
        Assert.Equal(0, result.EstimatedUpdates);
        Assert.Equal(0, result.EstimatedDeletes);
        Assert.Equal(0, result.QuarantineCandidateCount);
        Assert.Equal("PREVIEW", result.Status);
    }

    [Fact]
    public async Task SourceOnly_AllInserts_NoUpdatesOrDeletes()
    {
        var (svc, db) = Build();
        db.LegacyPacsRawImprvs.AddRange(
            MakeSourceRow(1, 100),
            MakeSourceRow(2, 200),
            MakeSourceRow(3, 300));
        await db.SaveChangesAsync();

        var result = await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "improvement",
            DryRun = true,
            OperationalYear = 2026,
        });
        Assert.Equal(DryRunPreviewOutcome.Ok, result.Outcome);
        Assert.Equal(3, result.SourceCount);
        Assert.Equal(3, result.EstimatedInserts);
        Assert.Equal(0, result.EstimatedUpdates);
        Assert.Equal(0, result.EstimatedDeletes);
    }

    [Fact]
    public async Task TruthOnly_AllDeletes_NoInserts()
    {
        var (svc, db) = Build();
        db.TruthPacsImprvCurrents.AddRange(
            MakeTruthRow(1, 100),
            MakeTruthRow(2, 200));
        await db.SaveChangesAsync();

        var result = await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "improvement",
            DryRun = true,
            OperationalYear = 2026,
        });
        Assert.Equal(DryRunPreviewOutcome.Ok, result.Outcome);
        Assert.Equal(0, result.SourceCount);
        Assert.Equal(0, result.EstimatedInserts);
        Assert.Equal(0, result.EstimatedUpdates);
        Assert.Equal(2, result.EstimatedDeletes);
    }

    [Fact]
    public async Task PartialOverlap_CorrectDeltaCounts()
    {
        // source: {1,100}, {2,200}, {3,300}  (3 rows)
        // truth:  {1,100}, {2,200}, {4,400}  (3 rows)
        // expected: inserts={3,300}=1, updates={1,100},{2,200}=2, deletes={4,400}=1
        var (svc, db) = Build();
        db.LegacyPacsRawImprvs.AddRange(
            MakeSourceRow(1, 100),
            MakeSourceRow(2, 200),
            MakeSourceRow(3, 300));
        db.TruthPacsImprvCurrents.AddRange(
            MakeTruthRow(1, 100),
            MakeTruthRow(2, 200),
            MakeTruthRow(4, 400));
        await db.SaveChangesAsync();

        var result = await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "improvement",
            DryRun = true,
            OperationalYear = 2026,
        });
        Assert.Equal(DryRunPreviewOutcome.Ok, result.Outcome);
        Assert.Equal(3, result.SourceCount);
        Assert.Equal(1, result.EstimatedInserts);  // {3,300}
        Assert.Equal(2, result.EstimatedUpdates);  // {1,100},{2,200}
        Assert.Equal(1, result.EstimatedDeletes);  // {4,400}
    }

    [Fact]
    public async Task TopN_LimitsSourceCount()
    {
        var (svc, db) = Build();
        db.LegacyPacsRawImprvs.AddRange(
            MakeSourceRow(1, 100),
            MakeSourceRow(2, 200),
            MakeSourceRow(3, 300),
            MakeSourceRow(4, 400));
        await db.SaveChangesAsync();

        var result = await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "improvement",
            DryRun = true,
            OperationalYear = 2026,
            TopN = 2,
        });
        Assert.Equal(DryRunPreviewOutcome.Ok, result.Outcome);
        Assert.Equal(2, result.SourceCount);  // topN=2 limits to 2
        Assert.Equal(2, result.TopN);
    }

    // ── Mutation prohibition test ────────────────────────────────────

    [Fact]
    public async Task Preview_DoesNotMutateTruthOrCanonical()
    {
        var (svc, db) = Build();
        db.LegacyPacsRawImprvs.Add(MakeSourceRow(1, 100));
        db.TruthPacsImprvCurrents.Add(MakeTruthRow(99, 999));
        await db.SaveChangesAsync();

        int truthBefore = await db.TruthPacsImprvCurrents.CountAsync();
        int canonBefore = await db.TfImprovements.CountAsync();

        await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "improvement",
            DryRun = true,
            OperationalYear = 2026,
        });

        int truthAfter = await db.TruthPacsImprvCurrents.CountAsync();
        int canonAfter = await db.TfImprovements.CountAsync();

        Assert.Equal(truthBefore, truthAfter);
        Assert.Equal(canonBefore, canonAfter);
    }

    // ── dry_run_log audit row test ───────────────────────────────────

    [Fact]
    public async Task Preview_WritesDryRunLogRow_IsPreviewTrue()
    {
        var (svc, db) = Build();
        var result = await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "improvement",
            DryRun = true,
            OperationalYear = 2026,
            RequestedBy = "test-operator",
        });
        Assert.Equal(DryRunPreviewOutcome.Ok, result.Outcome);

        var logRow = await db.SyncBridgeDryRunLogs
            .FirstOrDefaultAsync(x => x.PreviewRunId == result.PreviewRunId);
        Assert.NotNull(logRow);
        Assert.True(logRow!.IsPreview);
        Assert.Equal("COMPLETE", logRow.Status);
        Assert.Equal("improvement", logRow.Lane);
        Assert.Equal("test-operator", logRow.RequestedBy);
        Assert.Equal(result.PreviewRunId, logRow.PreviewRunId);
    }

    [Fact]
    public async Task Preview_PreviewRunId_MatchesLogRow()
    {
        var (svc, db) = Build();
        var result = await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "improvement",
            DryRun = true,
            OperationalYear = 2026,
        });
        Assert.Equal(DryRunPreviewOutcome.Ok, result.Outcome);

        // The previewRunId returned must match the dry_run_log row.
        Assert.NotEqual(Guid.Empty, result.PreviewRunId);
        var logExists = await db.SyncBridgeDryRunLogs
            .AnyAsync(x => x.PreviewRunId == result.PreviewRunId);
        Assert.True(logExists);
    }

    [Fact]
    public async Task Preview_OnlyOneDryRunLogRow_PerCall()
    {
        var (svc, db) = Build();
        await svc.ComputePreviewAsync(new DryRunPreviewRequest
        {
            Lane = "improvement",
            DryRun = true,
            OperationalYear = 2026,
        });
        // Only one row should exist after one call.
        int logCount = await db.SyncBridgeDryRunLogs.CountAsync();
        Assert.Equal(1, logCount);
    }
}
