using System.Runtime.CompilerServices;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsImprvDetail;
using TerraFusion.Data;
using TerraFusion.Data.Services.LegacyPacsRaw;
using Xunit;

namespace TerraFusion.Unit.Tests.LegacyPacsRaw;

/// <summary>
/// Slice C1-B acceptance tests. Same shape as C1-A but with the
/// 5-key uniqueness invariant (year, sup, prop_id, imprv_id,
/// imprv_det_id) and the secondary-feature type-cd surface
/// (ATTGAR, BSMT, MA, COVPATIO, etc).
/// </summary>
public sealed class PacsImprvDetailLandingServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsImprvDetailLandingServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"c1b-{Guid.NewGuid():N}")
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

    private PacsImprvDetailLandingService BuildService()
        => new(_db, NullLogger<PacsImprvDetailLandingService>.Instance);

    private static FakeSource Source(params PacsSourceImprvDetail[] rows) => new(rows);

    private static PacsSourceImprvDetail Detail(
        int propId, long imprvId, long imprvDetId,
        string? typeCd = "MA",
        decimal? area = 1500m,
        decimal? val = 100_000m,
        short year = 2026, short sup = 0)
        => new(year, sup, propId, imprvId, imprvDetId,
            ImprvDetTypeCd: typeCd,
            ImprvDetMethCd: "C",
            ImprvDetClassCd: "B",
            ImprvDetSubClassCd: null,
            ConditionCd: "G",
            ImprvDetArea: area,
            ImprvDetVal: val,
            NumUnits: null,
            YrBuilt: 1990);

    [Fact]
    public async Task HappyPath_LandsRows_OpensBatchPacsOltp_AndAllGatesRecord()
    {
        // A typical Benton residence: main living + basement + attached garage + covered patio.
        var src = Source(
            Detail(propId: 100, imprvId: 1, imprvDetId: 10,
                typeCd: "MA", area: 1800m, val: 250_000m),
            Detail(propId: 100, imprvId: 1, imprvDetId: 11,
                typeCd: "BSMT", area: 900m, val: 60_000m),
            Detail(propId: 100, imprvId: 1, imprvDetId: 12,
                typeCd: "ATTGAR", area: 480m, val: 35_000m),
            Detail(propId: 100, imprvId: 1, imprvDetId: 13,
                typeCd: "COVPATIO", area: 200m, val: 8_000m));

        var result = await BuildService().LandImprvDetailsAsync(src, "c1b-test");

        result.Status.Should().Be("COMPLETED");
        result.RowsLanded.Should().Be(4);
        result.DuplicateKeyViolations.Should().Be(0);
        result.ImprvDetValSum.Should().Be(353_000m);
        result.ImprvDetAreaSum.Should().Be(3380m);
        result.TypeCdHistogram["MA"].Should().Be(1);
        result.TypeCdHistogram["BSMT"].Should().Be(1);
        result.TypeCdHistogram["ATTGAR"].Should().Be(1);
        result.TypeCdHistogram["COVPATIO"].Should().Be(1);

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.SourceFamily.Should().Be(SourceFamilies.PacsOltp);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == batch.LoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "imprv-detail-distribution",
            "imprv-detail-key-uniqueness",
            "provenance-coverage",
            "imprv-detail-aggregate",
        });
        gates.Where(g => g.GateName == "imprv-detail-key-uniqueness")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task DuplicateFiveKey_TripsUniquenessGate_ToFail()
    {
        var src = Source(
            Detail(propId: 100, imprvId: 1, imprvDetId: 10),
            Detail(propId: 100, imprvId: 1, imprvDetId: 10, val: 999m), // dup
            Detail(propId: 100, imprvId: 1, imprvDetId: 11));

        var result = await BuildService().LandImprvDetailsAsync(src, "c1b-test");

        result.RowsLanded.Should().Be(3);
        result.DuplicateKeyViolations.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-detail-key-uniqueness");
        gate.Status.Should().Be("FAIL");
    }

    [Fact]
    public async Task SameImprv_DifferentDetailIds_AreNotDuplicates()
    {
        // One improvement (the house) has many detail rows for its
        // components. Distinct imprv_det_id values are NOT duplicates.
        var src = Source(
            Detail(propId: 100, imprvId: 1, imprvDetId: 10, typeCd: "MA"),
            Detail(propId: 100, imprvId: 1, imprvDetId: 11, typeCd: "BSMT"),
            Detail(propId: 100, imprvId: 1, imprvDetId: 12, typeCd: "ATTGAR"));

        var result = await BuildService().LandImprvDetailsAsync(src, "c1b-test");

        result.DuplicateKeyViolations.Should().Be(0);
        result.RowsLanded.Should().Be(3);
    }

    [Fact]
    public async Task EveryLandedRow_HasLoadBatchId_AndSourceQueryHash()
    {
        var src = Source(Detail(1, 1, 1), Detail(2, 2, 2), Detail(3, 3, 3));
        var result = await BuildService().LandImprvDetailsAsync(src, "c1b-test");

        var rows = await _db.LegacyPacsRawImprvDetails.ToListAsync();
        rows.Should().HaveCount(3);
        rows.Should().OnlyContain(r => r.LoadBatchId == result.LoadBatchId);
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceQueryHash));
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceRowHash));
    }

    [Fact]
    public async Task AggregateGate_ReportsValAndAreaSums()
    {
        var src = Source(
            Detail(1, 1, 10, val: 100_000m, area: 1000m),
            Detail(2, 2, 20, val: 200_000m, area: 2000m),
            Detail(3, 3, 30, val: null, area: null)); // excluded from sums

        await BuildService().LandImprvDetailsAsync(src, "c1b-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-detail-aggregate");
        gate.Detail.Should().Contain("imprvDetValSum=300000");
        gate.Detail.Should().Contain("imprvDetAreaSum=3000");
    }

    [Fact]
    public async Task NullVals_ExcludedFromSums()
    {
        var src = Source(
            Detail(1, 1, 10, val: 100_000m, area: 1000m),
            Detail(2, 2, 20, val: null, area: null));

        var result = await BuildService().LandImprvDetailsAsync(src, "c1b-test");

        result.ImprvDetValSum.Should().Be(100_000m);
        result.ImprvDetAreaSum.Should().Be(1000m);
    }

    [Fact]
    public async Task DistributionGate_RecordsBentonSecondaryFeatures()
    {
        // The user's documented Benton secondary feature codes.
        var src = Source(
            Detail(1, 1, 10, typeCd: "ATTGAR"),
            Detail(2, 1, 11, typeCd: "DETGAR"),
            Detail(3, 1, 12, typeCd: "POLEBLDG"),
            Detail(4, 1, 13, typeCd: "POOL"),
            Detail(5, 1, 14, typeCd: "COVPATIO"),
            Detail(6, 1, 15, typeCd: "BSMT"),
            Detail(7, 1, 16, typeCd: "MA"));

        await BuildService().LandImprvDetailsAsync(src, "c1b-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-detail-distribution");
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("typeATTGAR=1");
        gate.Detail.Should().Contain("typeBSMT=1");
        gate.Detail.Should().Contain("typeCOVPATIO=1");
        gate.Detail.Should().Contain("typeMA=1");
        gate.Detail.Should().Contain("typePOLEBLDG=1");
        gate.Detail.Should().Contain("typePOOL=1");
    }

    [Fact]
    public async Task EmptySource_StillOpensAndClosesBatch_WithGates()
    {
        var src = Source();
        var result = await BuildService().LandImprvDetailsAsync(src, "c1b-test");

        result.RowsLanded.Should().Be(0);
        result.Status.Should().Be("COMPLETED");
        result.ImprvDetValSum.Should().Be(0m);

        var gates = await _db.SyncBridgePromotionGateResults.ToListAsync();
        gates.Should().HaveCount(4);
    }

    [Fact]
    public async Task FailingSource_MarksLoadBatchFailed()
    {
        var src = new ThrowingSource(new InvalidOperationException("simulated"));
        var result = await BuildService().LandImprvDetailsAsync(src, "c1b-test");

        result.Status.Should().Be("FAILED");
        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");
        (await _db.LegacyPacsRawImprvDetails.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SourceQueryHash_IsStable_ForIdenticalQueryText()
    {
        var src1 = Source(Detail(1, 1, 1));
        var src2 = Source(Detail(2, 2, 2));

        var r1 = await BuildService().LandImprvDetailsAsync(src1, "c1b-test");
        var r2 = await BuildService().LandImprvDetailsAsync(src2, "c1b-test");

        var b1 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r1.LoadBatchId);
        var b2 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r2.LoadBatchId);
        b1.SourceQueryHash.Should().Be(b2.SourceQueryHash);
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInC1B()
    {
        var src = Source(Detail(1, 1, 1));
        await BuildService().LandImprvDetailsAsync(src, "c1b-test");

        // C1-B is raw landing only.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.LegacyPacsRawImprvs.CountAsync()).Should().Be(0,
            "C1-B handles imprv_detail only, not parent imprv");
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task NumUnits_AndSubClass_RoundTripVerbatim()
    {
        // POOL is a typical "unit" detail row.
        var src = Source(new PacsSourceImprvDetail(
            PropValYr: 2026, SupNum: 0, PropId: 100, ImprvId: 1, ImprvDetId: 99,
            ImprvDetTypeCd: "POOL",
            ImprvDetMethCd: "U",
            ImprvDetClassCd: "B",
            ImprvDetSubClassCd: "FBR-LINER",
            ConditionCd: "G",
            ImprvDetArea: 360m,
            ImprvDetVal: 18_000m,
            NumUnits: 1,
            YrBuilt: 1995));

        await BuildService().LandImprvDetailsAsync(src, "c1b-test");

        var row = await _db.LegacyPacsRawImprvDetails.SingleAsync();
        row.ImprvDetTypeCd.Should().Be("POOL");
        row.ImprvDetSubClassCd.Should().Be("FBR-LINER");
        row.NumUnits.Should().Be(1);
        row.YrBuilt.Should().Be(1995);
    }

    // ── Test doubles ────────────────────────────────────────────────

    private sealed class FakeSource : IPacsImprvDetailSource
    {
        private readonly IReadOnlyList<PacsSourceImprvDetail> _rows;
        public FakeSource(IEnumerable<PacsSourceImprvDetail> rows) => _rows = rows.ToList();

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText =>
            "SELECT prop_val_yr, sup_num, prop_id, imprv_id, imprv_det_id, imprv_det_type_cd, imprv_det_meth_cd, imprv_det_class_cd, imprv_det_sub_class_cd, condition_cd, imprv_det_area, imprv_det_val, num_units, yr_built FROM dbo.imprv_detail";

        public async IAsyncEnumerable<PacsSourceImprvDetail> StreamImprvDetailsAsync(
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

    private sealed class ThrowingSource : IPacsImprvDetailSource
    {
        private readonly Exception _ex;
        public ThrowingSource(Exception ex) => _ex = ex;

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText => "SELECT 1";

        public async IAsyncEnumerable<PacsSourceImprvDetail> StreamImprvDetailsAsync(
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
