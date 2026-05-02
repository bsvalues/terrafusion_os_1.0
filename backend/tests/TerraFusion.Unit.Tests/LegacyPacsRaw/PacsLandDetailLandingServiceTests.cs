using System.Runtime.CompilerServices;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsLandDetail;
using TerraFusion.Data;
using TerraFusion.Data.Services.LegacyPacsRaw;
using Xunit;

namespace TerraFusion.Unit.Tests.LegacyPacsRaw;

/// <summary>
/// Slice L1 acceptance tests. Mirrors the C1-A pattern; proves the
/// four L1 promotion gates and the doctrine invariants for
/// per-segment land data.
/// </summary>
public sealed class PacsLandDetailLandingServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsLandDetailLandingServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"l1-{Guid.NewGuid():N}")
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

    private PacsLandDetailLandingService BuildService()
        => new(_db, NullLogger<PacsLandDetailLandingService>.Instance);

    private static FakeSource Source(params PacsSourceLandDetail[] rows) => new(rows);

    private static PacsSourceLandDetail Land(
        int propId, long landSegId,
        string? typeCd = "SFR",
        string? useCd = "HOMESITE",
        decimal? acres = 0.5m,
        decimal? marketVal = 100_000m,
        short year = 2026, short sup = 0)
        => new(year, sup, propId, landSegId,
            LandSegTypeCd: typeCd,
            LandSegStateCd: "WA",
            LandSegClassCd: "B",
            LandSegUseCd: useCd,
            SoilCd: null,
            LandSegHomesite: useCd == "HOMESITE" ? "Y" : "N",
            SizeAcres: acres,
            SizeSquareFeet: acres.HasValue ? acres.Value * 43560m : null,
            LandSegMarketVal: marketVal,
            LandSegAgValue: null,
            LandSegAssessedVal: marketVal,
            LandSegEffAge: null);

    [Fact]
    public async Task HappyPath_LandsRows_OpensBatchPacsOltp_AndAllGatesRecord()
    {
        // Realistic ag property: homesite + crop + pasture + timber.
        var src = Source(
            Land(propId: 100, landSegId: 1, typeCd: "AG", useCd: "HOMESITE",
                acres: 0.5m, marketVal: 50_000m),
            Land(propId: 100, landSegId: 2, typeCd: "AG", useCd: "CROP",
                acres: 80m, marketVal: 240_000m),
            Land(propId: 100, landSegId: 3, typeCd: "AG", useCd: "PASTURE",
                acres: 40m, marketVal: 80_000m),
            Land(propId: 100, landSegId: 4, typeCd: "AG", useCd: "TIMBER",
                acres: 20m, marketVal: 30_000m));

        var result = await BuildService().LandLandDetailsAsync(src, "l1-test");

        result.Status.Should().Be("COMPLETED");
        result.RowsLanded.Should().Be(4);
        result.DuplicateKeyViolations.Should().Be(0);
        result.SizeAcresSum.Should().Be(140.5m);
        result.LandSegMarketValSum.Should().Be(400_000m);
        result.TypeCdHistogram["AG"].Should().Be(4);

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.SourceFamily.Should().Be(SourceFamilies.PacsOltp);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == batch.LoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "land-detail-distribution",
            "land-detail-key-uniqueness",
            "provenance-coverage",
            "land-detail-aggregate",
        });
        gates.Where(g => g.GateName == "land-detail-key-uniqueness")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task DuplicateFourKey_TripsUniquenessGate_ToFail()
    {
        var src = Source(
            Land(propId: 100, landSegId: 1),
            Land(propId: 100, landSegId: 1, marketVal: 999m), // dup
            Land(propId: 100, landSegId: 2));

        var result = await BuildService().LandLandDetailsAsync(src, "l1-test");

        result.RowsLanded.Should().Be(3);
        result.DuplicateKeyViolations.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "land-detail-key-uniqueness");
        gate.Status.Should().Be("FAIL");
    }

    [Fact]
    public async Task SamePropId_DifferentLandSegIds_AreNotDuplicates()
    {
        // One ag property has many land segments — homesite + crop + pasture.
        var src = Source(
            Land(propId: 100, landSegId: 1, useCd: "HOMESITE"),
            Land(propId: 100, landSegId: 2, useCd: "CROP"),
            Land(propId: 100, landSegId: 3, useCd: "PASTURE"));

        var result = await BuildService().LandLandDetailsAsync(src, "l1-test");

        result.DuplicateKeyViolations.Should().Be(0);
        result.RowsLanded.Should().Be(3);
    }

    [Fact]
    public async Task EveryLandedRow_HasLoadBatchId_AndSourceQueryHash()
    {
        var src = Source(Land(1, 1), Land(2, 2), Land(3, 3));
        var result = await BuildService().LandLandDetailsAsync(src, "l1-test");

        var rows = await _db.LegacyPacsRawLandDetails.ToListAsync();
        rows.Should().HaveCount(3);
        rows.Should().OnlyContain(r => r.LoadBatchId == result.LoadBatchId);
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceQueryHash));
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceRowHash));
    }

    [Fact]
    public async Task AggregateGate_ReportsAcresAndMarketSums()
    {
        var src = Source(
            Land(1, 1, acres: 1m, marketVal: 100_000m),
            Land(2, 2, acres: 5m, marketVal: 250_000m),
            Land(3, 3, acres: null, marketVal: null)); // null excluded

        await BuildService().LandLandDetailsAsync(src, "l1-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "land-detail-aggregate");
        gate.Detail.Should().Contain("sizeAcresSum=6");
        gate.Detail.Should().Contain("landSegMarketValSum=350000");
    }

    [Fact]
    public async Task NullSizeAndValue_ExcludedFromSums()
    {
        var src = Source(
            Land(1, 1, acres: 1m, marketVal: 100_000m),
            Land(2, 2, acres: null, marketVal: null));

        var result = await BuildService().LandLandDetailsAsync(src, "l1-test");

        result.SizeAcresSum.Should().Be(1m);
        result.LandSegMarketValSum.Should().Be(100_000m);
    }

    [Fact]
    public async Task DistributionGate_RecordsTypeHistogram()
    {
        var src = Source(
            Land(1, 1, typeCd: "SFR"),
            Land(2, 2, typeCd: "AG"),
            Land(3, 3, typeCd: "AG"),
            Land(4, 4, typeCd: "CMRCL"));

        await BuildService().LandLandDetailsAsync(src, "l1-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "land-detail-distribution");
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("typeAG=2");
        gate.Detail.Should().Contain("typeSFR=1");
        gate.Detail.Should().Contain("typeCMRCL=1");
    }

    [Fact]
    public async Task SoilCd_AndAgValue_ArePreserved_Verbatim()
    {
        // Ag lane carries soil_cd + land_seg_ag_value for the
        // current-use ag program calculations.
        var src = Source(new PacsSourceLandDetail(
            PropValYr: 2026, SupNum: 0, PropId: 100, LandSegId: 1,
            LandSegTypeCd: "AG",
            LandSegStateCd: "WA",
            LandSegClassCd: "II",
            LandSegUseCd: "CROP",
            SoilCd: "WALLA-SILT",
            LandSegHomesite: "N",
            SizeAcres: 80m,
            SizeSquareFeet: null,
            LandSegMarketVal: 240_000m,
            LandSegAgValue: 80_000m,        // current-use AG value
            LandSegAssessedVal: 80_000m,    // assessed at AG value
            LandSegEffAge: null));

        await BuildService().LandLandDetailsAsync(src, "l1-test");

        var row = await _db.LegacyPacsRawLandDetails.SingleAsync();
        row.SoilCd.Should().Be("WALLA-SILT");
        row.LandSegAgValue.Should().Be(80_000m);
        row.LandSegMarketVal.Should().Be(240_000m);
        row.LandSegAssessedVal.Should().Be(80_000m);
    }

    [Fact]
    public async Task EmptySource_StillOpensAndClosesBatch_WithGates()
    {
        var src = Source();
        var result = await BuildService().LandLandDetailsAsync(src, "l1-test");

        result.RowsLanded.Should().Be(0);
        result.Status.Should().Be("COMPLETED");
        result.SizeAcresSum.Should().Be(0m);

        var gates = await _db.SyncBridgePromotionGateResults.ToListAsync();
        gates.Should().HaveCount(4);
    }

    [Fact]
    public async Task FailingSource_MarksLoadBatchFailed_NoPartialWrite()
    {
        var src = new ThrowingSource(new InvalidOperationException("simulated"));
        var result = await BuildService().LandLandDetailsAsync(src, "l1-test");

        result.Status.Should().Be("FAILED");
        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");
        (await _db.LegacyPacsRawLandDetails.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SourceQueryHash_IsStable_ForIdenticalQueryText()
    {
        var src1 = Source(Land(1, 1));
        var src2 = Source(Land(2, 2));

        var r1 = await BuildService().LandLandDetailsAsync(src1, "l1-test");
        var r2 = await BuildService().LandLandDetailsAsync(src2, "l1-test");

        var b1 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r1.LoadBatchId);
        var b2 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r2.LoadBatchId);
        b1.SourceQueryHash.Should().Be(b2.SourceQueryHash);
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInL1()
    {
        var src = Source(Land(1, 1));
        await BuildService().LandLandDetailsAsync(src, "l1-test");

        // L1 is raw landing only.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.LegacyPacsRawImprvs.CountAsync()).Should().Be(0,
            "L1 handles land_detail only, not improvements");
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task DifferentSupNumbers_AreNotDuplicates()
    {
        var src = Source(
            new PacsSourceLandDetail(2026, 0, 100, 1, "SFR", "WA", "B", "HOMESITE",
                null, "Y", 0.5m, 21780m, 100_000m, null, 100_000m, null),
            new PacsSourceLandDetail(2026, 1, 100, 1, "SFR", "WA", "B", "HOMESITE",
                null, "Y", 0.5m, 21780m, 105_000m, null, 105_000m, null));

        var result = await BuildService().LandLandDetailsAsync(src, "l1-test");

        result.DuplicateKeyViolations.Should().Be(0);
        result.RowsLanded.Should().Be(2);
    }

    [Fact]
    public async Task AllColumns_RoundTripVerbatim()
    {
        var src = Source(new PacsSourceLandDetail(
            PropValYr: 2026, SupNum: 0, PropId: 100, LandSegId: 42,
            LandSegTypeCd: "AG",
            LandSegStateCd: "WA",
            LandSegClassCd: "II",
            LandSegUseCd: "ORCHARD",
            SoilCd: "WALLA-SILT",
            LandSegHomesite: "N",
            SizeAcres: 35.75m,
            SizeSquareFeet: 1557270m,
            LandSegMarketVal: 525_500m,
            LandSegAgValue: 125_000m,
            LandSegAssessedVal: 125_000m,
            LandSegEffAge: 12));

        await BuildService().LandLandDetailsAsync(src, "l1-test");

        var row = await _db.LegacyPacsRawLandDetails.SingleAsync();
        row.LandSegTypeCd.Should().Be("AG");
        row.LandSegStateCd.Should().Be("WA");
        row.LandSegUseCd.Should().Be("ORCHARD");
        row.SoilCd.Should().Be("WALLA-SILT");
        row.SizeAcres.Should().Be(35.75m);
        row.LandSegMarketVal.Should().Be(525_500m);
        row.LandSegAgValue.Should().Be(125_000m);
        row.LandSegEffAge.Should().Be(12);
    }

    // ── Test doubles ────────────────────────────────────────────────

    private sealed class FakeSource : IPacsLandDetailSource
    {
        private readonly IReadOnlyList<PacsSourceLandDetail> _rows;
        public FakeSource(IEnumerable<PacsSourceLandDetail> rows) => _rows = rows.ToList();

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText =>
            "SELECT prop_val_yr, sup_num, prop_id, land_seg_id, land_seg_type_cd, land_seg_state_cd, land_seg_class_cd, land_seg_use_cd, soil_cd, land_seg_homesite, size_acres, size_square_feet, land_seg_market_val, land_seg_ag_value, land_seg_assessed_val, land_seg_eff_age FROM dbo.land_detail";

        public async IAsyncEnumerable<PacsSourceLandDetail> StreamLandDetailsAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            foreach (var r in _rows)
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return r;
                await Task.Yield();
            }
        }
    }

    private sealed class ThrowingSource : IPacsLandDetailSource
    {
        private readonly Exception _ex;
        public ThrowingSource(Exception ex) => _ex = ex;

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText => "SELECT 1";

        public async IAsyncEnumerable<PacsSourceLandDetail> StreamLandDetailsAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            await Task.Yield();
            throw _ex;
#pragma warning disable CS0162
            yield break;
#pragma warning restore CS0162
        }
    }
}
