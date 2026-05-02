using System.Runtime.CompilerServices;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsWashPropOwnerVal;
using TerraFusion.Data;
using TerraFusion.Data.Services.LegacyPacsRaw;
using Xunit;

namespace TerraFusion.Unit.Tests.LegacyPacsRaw;

/// <summary>
/// Slice B1-C acceptance tests. Mirrors the S1/S2-A/B1-A/B1-B
/// pattern; proves the four B1-C promotion gates and the doctrine
/// invariants:
///  - LoadBatch is opened with SourceFamily = PACS_OLTP
///  - every landed row carries provenance
///  - 4-key (PropValYr, SupNum, PropId, OwnerId) uniqueness is gated
///  - WSDOR aggregate sums round-trip into the gate detail
///  - PII-free table (no person columns to redact)
///  - empty source still records all four gates
///  - failing source marks load_batch FAILED with no partial rows
/// </summary>
public sealed class PacsWashPropOwnerValLandingServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsWashPropOwnerValLandingServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"b1c-{Guid.NewGuid():N}")
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

    private PacsWashPropOwnerValLandingService BuildService()
        => new(_db, NullLogger<PacsWashPropOwnerValLandingService>.Instance);

    private static FakeSource Source(params PacsSourceWashPropOwnerVal[] rows)
        => new(rows);

    private static PacsSourceWashPropOwnerVal Row(
        int propId, long ownerId,
        decimal? assessed = 250_000m,
        decimal? market = 300_000m,
        string? boe = "F",
        decimal? disaster = null,
        decimal? snrFrzImprvHs = null,
        short year = 2026, short sup = 0)
        => new(
            PropValYr: year, SupNum: sup,
            PropId: propId, OwnerId: ownerId,
            AssessedVal: assessed,
            MarketVal: market,
            AppraisedVal: assessed,
            TaxableClassified: assessed,
            TaxableNonClassified: 0m,
            LandTaxableClassified: assessed.HasValue ? assessed.Value / 4 : null,
            LandTaxableNonClassified: 0m,
            ImprvTaxableClassified: assessed.HasValue ? assessed.Value * 3 / 4 : null,
            ImprvTaxableNonClassified: 0m,
            StateValueClassified: assessed,
            StateValueNonClassified: 0m,
            BoeStatus: boe,
            DisasterProrationPct: disaster,
            SnrFrzImprvHs: snrFrzImprvHs,
            SnrFrzLandHs: null);

    [Fact]
    public async Task HappyPath_LandsRows_OpensBatchPacsOltp_AndAllGatesRecord()
    {
        var src = Source(
            Row(propId: 100, ownerId: 1, assessed: 250_000m, market: 300_000m),
            Row(propId: 200, ownerId: 2, assessed: 425_000m, market: 500_000m),
            Row(propId: 300, ownerId: 3, assessed: 100_000m, market: 110_000m));

        var result = await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        result.Status.Should().Be("COMPLETED");
        result.RowsLanded.Should().Be(3);
        result.DuplicateKeyViolations.Should().Be(0);
        result.AssessedValSum.Should().Be(775_000m);
        result.MarketValSum.Should().Be(910_000m);

        (await _db.LegacyPacsRawWashPropOwnerVals.CountAsync()).Should().Be(3);

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.SourceFamily.Should().Be(SourceFamilies.PacsOltp);
        batch.Status.Should().Be("COMPLETED");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == batch.LoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "wash-prop-owner-val-distribution",
            "wash-prop-owner-val-key-uniqueness",
            "provenance-coverage",
            "wash-prop-owner-val-aggregate",
        });
        gates.Where(g => g.GateName == "wash-prop-owner-val-key-uniqueness")
            .Single().Status.Should().Be("PASS");
        gates.Where(g => g.GateName == "provenance-coverage")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task DuplicateFourKey_TripsUniquenessGate_ToFail()
    {
        var src = Source(
            Row(propId: 100, ownerId: 1, year: 2026, sup: 0),
            Row(propId: 100, ownerId: 1, year: 2026, sup: 0, assessed: 999_999m), // dup
            Row(propId: 200, ownerId: 2, year: 2026, sup: 0));

        var result = await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        result.RowsLanded.Should().Be(3);
        result.DuplicateKeyViolations.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "wash-prop-owner-val-key-uniqueness");
        gate.Status.Should().Be("FAIL");
        gate.Actual.Should().Be("1");
    }

    [Fact]
    public async Task DifferentSupNumbers_AreNotDuplicates()
    {
        var src = Source(
            Row(propId: 100, ownerId: 1, year: 2026, sup: 0),
            Row(propId: 100, ownerId: 1, year: 2026, sup: 1));

        var result = await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        result.DuplicateKeyViolations.Should().Be(0,
            "different sup_nums create distinct 4-key tuples");
    }

    [Fact]
    public async Task EveryLandedRow_HasLoadBatchId_AndSourceQueryHash()
    {
        var src = Source(Row(1, 1), Row(2, 2), Row(3, 3));

        var result = await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        var rows = await _db.LegacyPacsRawWashPropOwnerVals.ToListAsync();
        rows.Should().HaveCount(3);
        rows.Should().OnlyContain(r => r.LoadBatchId == result.LoadBatchId);
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceQueryHash));
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceRowHash));
    }

    [Fact]
    public async Task AggregateGate_ReportsAssessedAndMarketSums()
    {
        var src = Source(
            Row(1, 1, assessed: 100_000m, market: 120_000m),
            Row(2, 2, assessed: 200_000m, market: 250_000m),
            Row(3, 3, assessed: null, market: null));

        await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "wash-prop-owner-val-aggregate");
        gate.Detail.Should().Contain("assessedValSum=300000");
        gate.Detail.Should().Contain("marketValSum=370000");
    }

    [Fact]
    public async Task NullMonetaryValues_AreExcluded_FromSums_NotCounted_AsZero()
    {
        // The doctrine: NULL is not zero. The aggregate gate skips
        // NULLs rather than treating them as 0. This is the
        // operator's audit signal — NULL means "not yet valued."
        var src = Source(
            Row(1, 1, assessed: 100_000m, market: 100_000m),
            Row(2, 2, assessed: null, market: null));

        var result = await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        result.AssessedValSum.Should().Be(100_000m,
            "NULL doesn't contribute to the sum");
        result.MarketValSum.Should().Be(100_000m);
    }

    [Fact]
    public async Task DistributionGate_RecordsBoeStatusAndYearHistogram()
    {
        var src = Source(
            Row(1, 1, year: 2024, boe: "F"),
            Row(2, 2, year: 2024, boe: "P"),
            Row(3, 3, year: 2025, boe: "F"),
            Row(4, 4, year: 2026, boe: "A"));

        await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "wash-prop-owner-val-distribution");
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("yr2024=2");
        gate.Detail.Should().Contain("yr2026=1");
        gate.Detail.Should().Contain("boeF=2");
        gate.Detail.Should().Contain("boeA=1");
    }

    [Fact]
    public async Task DisasterProrationAndSnrFrz_ArePreserved_Verbatim()
    {
        var src = Source(Row(
            propId: 100, ownerId: 1,
            disaster: 75.5m,
            snrFrzImprvHs: 350_000m));

        await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        var row = await _db.LegacyPacsRawWashPropOwnerVals.SingleAsync();
        row.DisasterProrationPct.Should().Be(75.5m);
        row.SnrFrzImprvHs.Should().Be(350_000m);
    }

    [Fact]
    public async Task EmptySource_StillOpensAndClosesBatch_WithGates()
    {
        var src = Source();
        var result = await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        result.RowsLanded.Should().Be(0);
        result.Status.Should().Be("COMPLETED");
        result.AssessedValSum.Should().Be(0m);

        (await _db.LegacyPacsRawWashPropOwnerVals.CountAsync()).Should().Be(0);
        var gates = await _db.SyncBridgePromotionGateResults.ToListAsync();
        gates.Should().HaveCount(4);
        gates.Where(g => g.GateName == "wash-prop-owner-val-key-uniqueness")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task FailingSource_MarksLoadBatchFailed_AndDoesNotPersistRows()
    {
        var src = new ThrowingSource(
            new InvalidOperationException("simulated source failure"));

        var result = await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        result.Status.Should().Be("FAILED");
        result.ErrorSummary.Should().Contain("simulated source failure");

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");
        batch.ErrorSummary.Should().Contain("InvalidOperationException");

        (await _db.LegacyPacsRawWashPropOwnerVals.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SourceQueryHash_IsStable_ForIdenticalQueryText()
    {
        var src1 = Source(Row(1, 1));
        var src2 = Source(Row(2, 2));

        var r1 = await BuildService().LandWashPropOwnerValsAsync(src1, "b1c-test");
        var r2 = await BuildService().LandWashPropOwnerValsAsync(src2, "b1c-test");

        var b1 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r1.LoadBatchId);
        var b2 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r2.LoadBatchId);
        b1.SourceQueryHash.Should().Be(b2.SourceQueryHash);
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInB1C()
    {
        var src = Source(Row(1, 1));
        await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        // B1-C is raw landing only.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.TfOwners.CountAsync()).Should().Be(0);
        (await _db.LegacyPacsRawAccounts.CountAsync()).Should().Be(0);
        (await _db.LegacyPacsRawOwners.CountAsync()).Should().Be(0);
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task AllValueColumns_RoundTrip_Verbatim()
    {
        var src = Source(new PacsSourceWashPropOwnerVal(
            PropValYr: 2026, SupNum: 0, PropId: 100, OwnerId: 1,
            AssessedVal: 350_000m, MarketVal: 425_500m, AppraisedVal: 360_000m,
            TaxableClassified: 200_000m, TaxableNonClassified: 50_000m,
            LandTaxableClassified: 80_000m, LandTaxableNonClassified: 20_000m,
            ImprvTaxableClassified: 120_000m, ImprvTaxableNonClassified: 30_000m,
            StateValueClassified: 250_000m, StateValueNonClassified: 50_000m,
            BoeStatus: "F",
            DisasterProrationPct: 50.25m,
            SnrFrzImprvHs: 100_000m, SnrFrzLandHs: 25_000m));

        await BuildService().LandWashPropOwnerValsAsync(src, "b1c-test");

        var row = await _db.LegacyPacsRawWashPropOwnerVals.SingleAsync();
        row.AssessedVal.Should().Be(350_000m);
        row.MarketVal.Should().Be(425_500m);
        row.AppraisedVal.Should().Be(360_000m);
        row.TaxableClassified.Should().Be(200_000m);
        row.TaxableNonClassified.Should().Be(50_000m);
        row.LandTaxableClassified.Should().Be(80_000m);
        row.ImprvTaxableClassified.Should().Be(120_000m);
        row.StateValueClassified.Should().Be(250_000m);
        row.BoeStatus.Should().Be("F");
        row.DisasterProrationPct.Should().Be(50.25m);
        row.SnrFrzImprvHs.Should().Be(100_000m);
        row.SnrFrzLandHs.Should().Be(25_000m);
    }

    // ── Test doubles ────────────────────────────────────────────────

    private sealed class FakeSource : IPacsWashPropOwnerValSource
    {
        private readonly IReadOnlyList<PacsSourceWashPropOwnerVal> _rows;
        public FakeSource(IEnumerable<PacsSourceWashPropOwnerVal> rows)
            => _rows = rows.ToList();

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText =>
            "SELECT prop_val_yr, sup_num, prop_id, owner_id, assessed_val, market_val, appraised_val, taxable_classified, taxable_non_classified, land_taxable_classified, land_taxable_non_classified, imprv_taxable_classified, imprv_taxable_non_classified, state_value_classified, state_value_non_classified, boe_status, disaster_proration_pct, snr_frz_imprv_hs, snr_frz_land_hs FROM dbo.wash_prop_owner_val";

        public async IAsyncEnumerable<PacsSourceWashPropOwnerVal> StreamWashPropOwnerValsAsync(
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

    private sealed class ThrowingSource : IPacsWashPropOwnerValSource
    {
        private readonly Exception _ex;
        public ThrowingSource(Exception ex) => _ex = ex;

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText => "SELECT 1";

        public async IAsyncEnumerable<PacsSourceWashPropOwnerVal> StreamWashPropOwnerValsAsync(
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
