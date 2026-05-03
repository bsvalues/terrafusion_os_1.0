using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.LegacyArcGisRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Data;
using TerraFusion.Data.Services.TruthArcGis;
using Xunit;

namespace TerraFusion.Unit.Tests.TruthArcGis;

/// <summary>
/// Slice D2 acceptance tests. Proves the four T-* gates and the
/// truth-promotion doctrine invariants for ArcGIS parcel geometry:
///  - source-batches-completed: refuse promotion when any
///    contributing landing batch is FAILED / IN_PROGRESS
///  - latest-per-(CountyId, ArcGisObjectId) collapse: only the
///    most-recent landing wins
///  - geometry-validity: invalid WKT does not promote
///  - aggregate: counts + AreaSqFt sum match expectation
///  - idempotent on rerun: prior truth rows for the county clear
///  - county isolation: promoting one county does not touch the
///    other's truth rows
/// </summary>
public sealed class ArcGisTruthPromotionServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public ArcGisTruthPromotionServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"d2-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private ArcGisTruthPromotionService BuildService()
        => new(_db, NullLogger<ArcGisTruthPromotionService>.Instance);

    private async Task<Guid> SeedLandingBatchAsync(string status = "COMPLETED")
    {
        var b = new LoadBatch
        {
            SourceFamily = SourceFamilies.ArcGisRest,
            SourceSystem = "arcgis-feature-service",
            SourceFileOrDatabase = "test",
            SourceQueryHash = "qh",
            Operator = "test",
            Status = status,
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = status == "COMPLETED" ? DateTime.UtcNow.AddMinutes(-1) : null,
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
    }

    private async Task SeedRawAsync(
        Guid countyId,
        long objectId,
        Guid landingBatchId,
        string? wkt = "POLYGON((0 0,1 0,1 1,0 1,0 0))",
        double areaSqFt = 1000.0,
        string? apn = "100-001")
    {
        _db.LegacyArcGisRawParcelGeoms.Add(new LegacyArcGisRawParcelGeom
        {
            CountyId = countyId,
            ArcGisObjectId = objectId,
            ArcGisApn = apn,
            GeomWkt = wkt ?? string.Empty,
            CentroidLat = 46.21,
            CentroidLon = -119.13,
            AreaSqFt = areaSqFt,
            SourceServiceUrl = "https://services.arcgis.com/test/Parcels/FeatureServer/0",
            LoadBatchId = landingBatchId,
            SourceQueryHash = "qh",
            SourceRowHash = "0123456789abcdef",
            LandedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
    }

    // ─────────────────────────────────────────────────────────────────
    // Acceptance tests
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HappyPath_PromotesAllRawTuples_WithLineage()
    {
        var countyId = Guid.NewGuid();
        var landing = await SeedLandingBatchAsync();
        await SeedRawAsync(countyId, 1, landing);
        await SeedRawAsync(countyId, 2, landing);
        await SeedRawAsync(countyId, 3, landing);

        var result = await BuildService().PromoteCountyAsync(countyId, "d2-test");

        result.Status.Should().Be("COMPLETED");
        result.TuplesConsidered.Should().Be(3);
        result.RowsPromoted.Should().Be(3);
        result.InvalidGeometrySkipped.Should().Be(0);
        result.PriorTruthRowsRemoved.Should().Be(0);

        var truth = await _db.TruthArcGisParcelGeomCurrents.ToListAsync();
        truth.Should().HaveCount(3);
        truth.Should().AllSatisfy(t =>
        {
            t.CountyId.Should().Be(countyId);
            t.LandingLoadBatchId.Should().Be(landing);
            t.PromotionLoadBatchId.Should().Be(result.PromotionLoadBatchId);
            t.SourceLandedRowId.Should().NotBe(Guid.Empty);
        });
    }

    [Fact]
    public async Task LatestLandingWins_SameTuple_ReplacesEarlier()
    {
        var countyId = Guid.NewGuid();
        var oldBatch = await SeedLandingBatchAsync();
        await Task.Delay(10);
        var newBatch = await SeedLandingBatchAsync();

        // Same OBJECTID landed in both batches — newer should win.
        await SeedRawAsync(countyId, 1, oldBatch, areaSqFt: 1000.0);
        await SeedRawAsync(countyId, 1, newBatch, areaSqFt: 5000.0);

        var result = await BuildService().PromoteCountyAsync(countyId, "d2-test");

        result.RowsPromoted.Should().Be(1,
            "latest-per-tuple collapse: only the newer landing wins");

        var truth = await _db.TruthArcGisParcelGeomCurrents.SingleAsync();
        truth.AreaSqFt.Should().Be(5000.0,
            "the AreaSqFt from the LATER landing was selected");
        truth.LandingLoadBatchId.Should().Be(newBatch);
    }

    [Fact]
    public async Task FailedLandingBatch_RefusesPromotion()
    {
        var countyId = Guid.NewGuid();
        var failedBatch = await SeedLandingBatchAsync("FAILED");
        await SeedRawAsync(countyId, 1, failedBatch);

        var result = await BuildService().PromoteCountyAsync(countyId, "d2-test");

        result.Status.Should().Be("REFUSED");
        result.RowsPromoted.Should().Be(0);
        result.ErrorSummary.Should().Contain("FAILED");

        (await _db.TruthArcGisParcelGeomCurrents.CountAsync()).Should().Be(0);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "arcgis-truth-source-batches-completed");
        gate.Status.Should().Be("FAIL");
    }

    [Fact]
    public async Task InvalidGeometry_NotPromoted_RawPreserved()
    {
        var countyId = Guid.NewGuid();
        var landing = await SeedLandingBatchAsync();
        await SeedRawAsync(countyId, 1, landing); // valid
        await SeedRawAsync(countyId, 2, landing, wkt: ""); // empty WKT
        await SeedRawAsync(countyId, 3, landing,
            wkt: "GIBBERISH 1 2 3"); // bad shape
        await SeedRawAsync(countyId, 4, landing); // valid

        var result = await BuildService().PromoteCountyAsync(countyId, "d2-test");

        result.TuplesConsidered.Should().Be(4);
        result.RowsPromoted.Should().Be(2);
        result.InvalidGeometrySkipped.Should().Be(2);

        // Raw rows stay in place for audit.
        (await _db.LegacyArcGisRawParcelGeoms.CountAsync()).Should().Be(4);

        // Truth has only the valid two.
        (await _db.TruthArcGisParcelGeomCurrents.CountAsync()).Should().Be(2);

        var validityGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "arcgis-truth-geometry-validity");
        validityGate.Status.Should().Be("FAIL");
        validityGate.Actual.Should().Be("2");
    }

    [Theory]
    [InlineData("POLYGON((0 0,1 0,1 1,0 1,0 0))")]
    [InlineData("polygon((0 0,1 0,1 1,0 1,0 0))")] // case-insensitive
    [InlineData("MULTIPOLYGON(((0 0,1 0,1 1,0 1,0 0)))")]
    public async Task ValidGeometryShapes_AllPromote(string wkt)
    {
        var countyId = Guid.NewGuid();
        var landing = await SeedLandingBatchAsync();
        await SeedRawAsync(countyId, 1, landing, wkt: wkt);

        var result = await BuildService().PromoteCountyAsync(countyId, "d2-test");

        result.RowsPromoted.Should().Be(1);
        result.InvalidGeometrySkipped.Should().Be(0);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("null")]
    [InlineData("POLYGON")] // header only
    [InlineData("POLYGON((0 0))")] // not enough vertices
    [InlineData("POINT(0 0)")] // wrong shape type
    public async Task InvalidWktForms_DoNotPromote(string wkt)
    {
        var countyId = Guid.NewGuid();
        var landing = await SeedLandingBatchAsync();
        await SeedRawAsync(countyId, 1, landing, wkt: wkt);

        var result = await BuildService().PromoteCountyAsync(countyId, "d2-test");

        result.RowsPromoted.Should().Be(0);
        result.InvalidGeometrySkipped.Should().Be(1);
    }

    [Fact]
    public async Task RerunSameCounty_ClearsPriorTruth_AndRePromotes()
    {
        var countyId = Guid.NewGuid();
        var landing = await SeedLandingBatchAsync();
        await SeedRawAsync(countyId, 1, landing);
        await SeedRawAsync(countyId, 2, landing);

        var run1 = await BuildService().PromoteCountyAsync(countyId, "d2-run1");
        run1.RowsPromoted.Should().Be(2);
        run1.PriorTruthRowsRemoved.Should().Be(0);

        var run2 = await BuildService().PromoteCountyAsync(countyId, "d2-run2");
        run2.RowsPromoted.Should().Be(2);
        run2.PriorTruthRowsRemoved.Should().Be(2,
            "second run cleans up the 2 truth rows from run 1 before re-inserting");

        // Final state: 2 truth rows total, all from run2.
        var truth = await _db.TruthArcGisParcelGeomCurrents.ToListAsync();
        truth.Should().HaveCount(2);
        truth.Should().AllSatisfy(t =>
            t.PromotionLoadBatchId.Should().Be(run2.PromotionLoadBatchId));
    }

    [Fact]
    public async Task CountyIsolation_PromotingOne_DoesNotTouchOther()
    {
        var benton = Guid.NewGuid();
        var franklin = Guid.NewGuid();
        var landing = await SeedLandingBatchAsync();

        await SeedRawAsync(benton, 1, landing, apn: "benton-1");
        await SeedRawAsync(benton, 2, landing, apn: "benton-2");
        await SeedRawAsync(franklin, 1, landing, apn: "franklin-1");

        // Promote Benton first.
        var bentonRun = await BuildService().PromoteCountyAsync(benton, "d2-test");
        bentonRun.RowsPromoted.Should().Be(2);

        // Promote Franklin — Benton's truth must remain untouched.
        var franklinRun = await BuildService().PromoteCountyAsync(franklin, "d2-test");
        franklinRun.RowsPromoted.Should().Be(1);
        franklinRun.PriorTruthRowsRemoved.Should().Be(0,
            "promoting Franklin should NOT clear Benton's truth rows");

        var allTruth = await _db.TruthArcGisParcelGeomCurrents.ToListAsync();
        allTruth.Should().HaveCount(3,
            "two counties should produce 3 total truth rows after both promote");
        allTruth.Count(t => t.CountyId == benton).Should().Be(2);
        allTruth.Count(t => t.CountyId == franklin).Should().Be(1);
    }

    [Fact]
    public async Task EmptyCounty_PromotesCleanly_WithPassGates()
    {
        var countyId = Guid.NewGuid();
        // No raw rows for this county.

        var result = await BuildService().PromoteCountyAsync(countyId, "d2-test");

        result.Status.Should().Be("COMPLETED");
        result.TuplesConsidered.Should().Be(0);
        result.RowsPromoted.Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(4);
        gates.Should().OnlyContain(g => g.Status != "FAIL");
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "arcgis-truth-source-batches-completed",
            "arcgis-truth-latest-per-objectid",
            "arcgis-truth-geometry-validity",
            "arcgis-truth-aggregate",
        });
    }

    [Fact]
    public async Task AllFourTStarGatesEmitted_OnSuccess()
    {
        var countyId = Guid.NewGuid();
        var landing = await SeedLandingBatchAsync();
        await SeedRawAsync(countyId, 1, landing);

        var result = await BuildService().PromoteCountyAsync(countyId, "d2-test");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(4);
        gates.Should().AllSatisfy(g =>
        {
            g.GateStage.Should().Be("RAW_TO_TRUTH");
        });
    }

    [Fact]
    public async Task AggregateGate_RecordsAreaSum()
    {
        var countyId = Guid.NewGuid();
        var landing = await SeedLandingBatchAsync();
        await SeedRawAsync(countyId, 1, landing, areaSqFt: 1500.5);
        await SeedRawAsync(countyId, 2, landing, areaSqFt: 2500.25);
        await SeedRawAsync(countyId, 3, landing, areaSqFt: 1000.0);

        var result = await BuildService().PromoteCountyAsync(countyId, "d2-test");

        result.AreaSqFtSum.Should().BeApproximately(5000.75, 0.01);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "arcgis-truth-aggregate");
        gate.Detail.Should().Contain("tuplesConsidered=3");
        gate.Detail.Should().Contain("promoted=3");
        gate.Detail.Should().Contain("areaSqFtSum=5000.75");
    }
}
