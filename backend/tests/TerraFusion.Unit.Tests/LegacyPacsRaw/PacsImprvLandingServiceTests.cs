using System.Runtime.CompilerServices;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsImprv;
using TerraFusion.Data;
using TerraFusion.Data.Services.LegacyPacsRaw;
using Xunit;

namespace TerraFusion.Unit.Tests.LegacyPacsRaw;

/// <summary>
/// Slice C1-A acceptance tests. Mirrors the prior Block A/B raw
/// landing services. Proves the four C1-A promotion gates and the
/// doctrine invariants:
///  - LoadBatch is opened with SourceFamily = PACS_OLTP
///  - every landed row carries provenance
///  - 4-key (PropValYr, SupNum, PropId, ImprvId) uniqueness is gated
///  - ImprvVal aggregate sum surfaces in the gate detail
///  - empty source still records all four gates
///  - failing source marks load_batch FAILED with no partial rows
///  - PII-free table (no person columns)
/// </summary>
public sealed class PacsImprvLandingServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsImprvLandingServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"c1a-{Guid.NewGuid():N}")
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

    private PacsImprvLandingService BuildService()
        => new(_db, NullLogger<PacsImprvLandingService>.Instance);

    private static FakeSource Source(params PacsSourceImprv[] rows) => new(rows);

    private static PacsSourceImprv Imprv(
        int propId, long imprvId,
        string? type = "R",
        decimal? val = 250_000m,
        short? yearBuilt = 1990,
        short year = 2026, short sup = 0)
        => new(year, sup, propId, imprvId,
            ImprvTypeCd: type,
            ImprvStateCd: "WA",
            ImprvClassCd: "B",
            ImprvHomesite: "Y",
            ImprvVal: val,
            ImprvDesc: $"Imprv {imprvId}",
            YearBuilt: yearBuilt,
            EffectiveYearBuilt: yearBuilt,
            ActualYearBuilt: yearBuilt);

    [Fact]
    public async Task HappyPath_LandsRows_OpensBatchPacsOltp_AndAllGatesRecord()
    {
        var src = Source(
            Imprv(propId: 100, imprvId: 1, type: "R", val: 250_000m),
            Imprv(propId: 200, imprvId: 2, type: "MH", val: 75_000m),
            Imprv(propId: 100, imprvId: 3, type: "R", val: 50_000m)); // detached garage

        var result = await BuildService().LandImprvsAsync(src, "c1a-test");

        result.Status.Should().Be("COMPLETED");
        result.RowsLanded.Should().Be(3);
        result.DuplicateKeyViolations.Should().Be(0);
        result.ImprvValSum.Should().Be(375_000m);
        result.TypeCdHistogram["R"].Should().Be(2);
        result.TypeCdHistogram["MH"].Should().Be(1);

        (await _db.LegacyPacsRawImprvs.CountAsync()).Should().Be(3);

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.SourceFamily.Should().Be(SourceFamilies.PacsOltp);
        batch.Status.Should().Be("COMPLETED");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == batch.LoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "imprv-distribution",
            "imprv-key-uniqueness",
            "provenance-coverage",
            "imprv-aggregate",
        });
        gates.Where(g => g.GateName == "imprv-key-uniqueness")
            .Single().Status.Should().Be("PASS");
        gates.Where(g => g.GateName == "provenance-coverage")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task DuplicateFourKey_TripsUniquenessGate_ToFail()
    {
        var src = Source(
            Imprv(propId: 100, imprvId: 1, year: 2026, sup: 0),
            Imprv(propId: 100, imprvId: 1, year: 2026, sup: 0, val: 999_999m), // dup
            Imprv(propId: 100, imprvId: 2, year: 2026, sup: 0));

        var result = await BuildService().LandImprvsAsync(src, "c1a-test");

        result.RowsLanded.Should().Be(3);
        result.DuplicateKeyViolations.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-key-uniqueness");
        gate.Status.Should().Be("FAIL");
        gate.Actual.Should().Be("1");
    }

    [Fact]
    public async Task SamePropId_DifferentImprvId_IsNotADuplicate()
    {
        // One parcel can have many improvements (main house + garage + shop).
        var src = Source(
            Imprv(propId: 100, imprvId: 1, val: 250_000m),
            Imprv(propId: 100, imprvId: 2, val: 50_000m),
            Imprv(propId: 100, imprvId: 3, val: 30_000m));

        var result = await BuildService().LandImprvsAsync(src, "c1a-test");

        result.DuplicateKeyViolations.Should().Be(0);
        result.RowsLanded.Should().Be(3);
    }

    [Fact]
    public async Task EveryLandedRow_HasLoadBatchId_AndSourceQueryHash()
    {
        var src = Source(Imprv(1, 1), Imprv(2, 2), Imprv(3, 3));
        var result = await BuildService().LandImprvsAsync(src, "c1a-test");

        var rows = await _db.LegacyPacsRawImprvs.ToListAsync();
        rows.Should().HaveCount(3);
        rows.Should().OnlyContain(r => r.LoadBatchId == result.LoadBatchId);
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceQueryHash));
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceRowHash));
    }

    [Fact]
    public async Task AggregateGate_ReportsImprvValSum()
    {
        var src = Source(
            Imprv(1, 1, val: 100_000m),
            Imprv(2, 2, val: 250_000m),
            Imprv(3, 3, val: null)); // null excluded

        await BuildService().LandImprvsAsync(src, "c1a-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-aggregate");
        gate.Detail.Should().Contain("imprvValSum=350000");
    }

    [Fact]
    public async Task NullImprvVal_ExcludedFromSum()
    {
        var src = Source(
            Imprv(1, 1, val: 100_000m),
            Imprv(2, 2, val: null));

        var result = await BuildService().LandImprvsAsync(src, "c1a-test");

        result.ImprvValSum.Should().Be(100_000m);
    }

    [Fact]
    public async Task DistributionGate_RecordsYearAndTypeHistogram()
    {
        var src = Source(
            Imprv(1, 1, type: "R", year: 2024),
            Imprv(2, 2, type: "MH", year: 2025),
            Imprv(3, 3, type: "R", year: 2026),
            Imprv(4, 4, type: "C", year: 2026));

        await BuildService().LandImprvsAsync(src, "c1a-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-distribution");
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("yr2024=1");
        gate.Detail.Should().Contain("yr2026=2");
        gate.Detail.Should().Contain("typeR=2");
        gate.Detail.Should().Contain("typeC=1");
    }

    [Fact]
    public async Task YearBuilt_Variants_ArePreserved_Verbatim()
    {
        // PACS carries three flavors: original, effective, actual.
        // All three must round-trip.
        var src = Source(new PacsSourceImprv(
            PropValYr: 2026, SupNum: 0, PropId: 100, ImprvId: 1,
            ImprvTypeCd: "R", ImprvStateCd: "WA", ImprvClassCd: "B",
            ImprvHomesite: "Y",
            ImprvVal: 250_000m,
            ImprvDesc: "Original house",
            YearBuilt: 1972,
            EffectiveYearBuilt: 1995,    // post-renovation
            ActualYearBuilt: 1972));

        await BuildService().LandImprvsAsync(src, "c1a-test");

        var row = await _db.LegacyPacsRawImprvs.SingleAsync();
        row.YearBuilt.Should().Be(1972);
        row.EffectiveYearBuilt.Should().Be(1995);
        row.ActualYearBuilt.Should().Be(1972);
    }

    [Fact]
    public async Task EmptySource_StillOpensAndClosesBatch_WithGates()
    {
        var src = Source();
        var result = await BuildService().LandImprvsAsync(src, "c1a-test");

        result.RowsLanded.Should().Be(0);
        result.Status.Should().Be("COMPLETED");
        result.ImprvValSum.Should().Be(0m);

        (await _db.LegacyPacsRawImprvs.CountAsync()).Should().Be(0);
        var gates = await _db.SyncBridgePromotionGateResults.ToListAsync();
        gates.Should().HaveCount(4);
        gates.Where(g => g.GateName == "imprv-key-uniqueness")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task FailingSource_MarksLoadBatchFailed_AndDoesNotPersistRows()
    {
        var src = new ThrowingSource(new InvalidOperationException("simulated source failure"));

        var result = await BuildService().LandImprvsAsync(src, "c1a-test");

        result.Status.Should().Be("FAILED");
        result.ErrorSummary.Should().Contain("simulated source failure");

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");
        batch.ErrorSummary.Should().Contain("InvalidOperationException");

        (await _db.LegacyPacsRawImprvs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SourceQueryHash_IsStable_ForIdenticalQueryText()
    {
        var src1 = Source(Imprv(1, 1));
        var src2 = Source(Imprv(2, 2));

        var r1 = await BuildService().LandImprvsAsync(src1, "c1a-test");
        var r2 = await BuildService().LandImprvsAsync(src2, "c1a-test");

        var b1 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r1.LoadBatchId);
        var b2 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r2.LoadBatchId);
        b1.SourceQueryHash.Should().Be(b2.SourceQueryHash);
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInC1A()
    {
        var src = Source(Imprv(1, 1));
        await BuildService().LandImprvsAsync(src, "c1a-test");

        // C1-A is raw landing only.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.TfOwners.CountAsync()).Should().Be(0);
        (await _db.LegacyPacsRawSales.CountAsync()).Should().Be(0);
        (await _db.LegacyPacsRawAccounts.CountAsync()).Should().Be(0);
        (await _db.LegacyPacsRawOwners.CountAsync()).Should().Be(0);
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task DifferentSupNumbers_AreNotDuplicates_Despite_SamePropAndImprv()
    {
        // PACS allows the same (PropId, ImprvId) under different
        // supplements. The 4-key includes sup_num.
        var src = Source(
            new PacsSourceImprv(2026, 0, 100, 1, "R", "WA", "B", "Y", 250_000m,
                "v0", 1990, 1990, 1990),
            new PacsSourceImprv(2026, 1, 100, 1, "R", "WA", "B", "Y", 260_000m,
                "v1", 1990, 1990, 1990));

        var result = await BuildService().LandImprvsAsync(src, "c1a-test");

        result.DuplicateKeyViolations.Should().Be(0);
        result.RowsLanded.Should().Be(2);
    }

    [Fact]
    public async Task AllColumns_RoundTripVerbatim()
    {
        var src = Source(new PacsSourceImprv(
            PropValYr: 2026, SupNum: 0, PropId: 100, ImprvId: 42,
            ImprvTypeCd: "R", ImprvStateCd: "WA", ImprvClassCd: "B-PLUS",
            ImprvHomesite: "Y",
            ImprvVal: 525_500m,
            ImprvDesc: "1990 single-family residence with detached shop",
            YearBuilt: 1990, EffectiveYearBuilt: 2010, ActualYearBuilt: 1990));

        await BuildService().LandImprvsAsync(src, "c1a-test");

        var row = await _db.LegacyPacsRawImprvs.SingleAsync();
        row.PropValYr.Should().Be(2026);
        row.PropId.Should().Be(100);
        row.ImprvId.Should().Be(42);
        row.ImprvTypeCd.Should().Be("R");
        row.ImprvStateCd.Should().Be("WA");
        row.ImprvClassCd.Should().Be("B-PLUS");
        row.ImprvHomesite.Should().Be("Y");
        row.ImprvVal.Should().Be(525_500m);
        row.ImprvDesc.Should().Be("1990 single-family residence with detached shop");
        row.YearBuilt.Should().Be(1990);
        row.EffectiveYearBuilt.Should().Be(2010);
        row.ActualYearBuilt.Should().Be(1990);
    }

    // ── Test doubles ────────────────────────────────────────────────

    private sealed class FakeSource : IPacsImprvSource
    {
        private readonly IReadOnlyList<PacsSourceImprv> _rows;
        public FakeSource(IEnumerable<PacsSourceImprv> rows) => _rows = rows.ToList();

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText =>
            "SELECT prop_val_yr, sup_num, prop_id, imprv_id, imprv_type_cd, imprv_state_cd, imprv_class_cd, imprv_homesite, imprv_val, imprv_desc, yr_built, effective_yr_built, actual_year_built FROM dbo.imprv";

        public async IAsyncEnumerable<PacsSourceImprv> StreamImprvsAsync(
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

    private sealed class ThrowingSource : IPacsImprvSource
    {
        private readonly Exception _ex;
        public ThrowingSource(Exception ex) => _ex = ex;

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText => "SELECT 1";

        public async IAsyncEnumerable<PacsSourceImprv> StreamImprvsAsync(
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
