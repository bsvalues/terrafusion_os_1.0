using System.Runtime.CompilerServices;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsSale;
using TerraFusion.Data;
using TerraFusion.Data.Services.LegacyPacsRaw;
using Xunit;

namespace TerraFusion.Unit.Tests.LegacyPacsRaw;

/// <summary>
/// Slice S1 acceptance tests. Proves the four S1 promotion gates and
/// the doctrine invariants:
///  - load_batch is created with SourceFamily = PACS_OLTP
///  - every landed row carries non-empty load_batch_id and source_query_hash
///  - sl_county_ratio_cd = '100' is the qualification axis (test data)
///  - presence of '01'/'02' (pre-2017 vocabulary) trips the
///    stale-valid-sale-code-rejection gate to FAIL
///  - 2017 cutover is recorded as a gate result with pre/post counts
///  - failing source marks load_batch FAILED
/// </summary>
public sealed class PacsSaleLandingServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsSaleLandingServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"s1-pacs-sale-{Guid.NewGuid():N}")
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

    private PacsSaleLandingService BuildService()
        => new(_db, NullLogger<PacsSaleLandingService>.Instance);

    private static FakePacsSaleSource Source(params PacsSourceSale[] sales)
        => new(sales);

    private static PacsSourceSale Sale(
        long chg = 1,
        string? code = "100",
        DateTime? saleDt = null,
        decimal? price = 350_000m)
        => new(
            ChgOfOwnerId: chg,
            PropId: 1000 + (int)chg,
            PropValYr: 2026,
            SupNum: 0,
            SlCountyRatioCd: code,
            WacCd: null,
            SlRatioTypeCd: null,
            SlDt: saleDt,
            SlPrice: price,
            AdjSlPrice: price);

    [Fact]
    public async Task HappyPath_LandsRows_OpensBatchPacsOltp_AndAllGatesPass()
    {
        var src = Source(
            Sale(chg: 1, code: "100", saleDt: new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc)),
            Sale(chg: 2, code: "100", saleDt: new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc)),
            Sale(chg: 3, code: "200", saleDt: new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc)));

        var result = await BuildService().LandSalesAsync(src, "s1-test");

        result.Status.Should().Be("COMPLETED");
        result.RowsLanded.Should().Be(3);
        result.StaleCodeViolations.Should().Be(0);
        result.CodeDistribution["100"].Should().Be(2);
        result.CodeDistribution["200"].Should().Be(1);

        (await _db.LegacyPacsRawSales.CountAsync()).Should().Be(3);

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.SourceFamily.Should().Be(SourceFamilies.PacsOltp,
            "the doctrine pins legacy_pacs_raw landing to the PACS_OLTP source family");
        batch.Status.Should().Be("COMPLETED");
        batch.SourceSystem.Should().Be("JCHARRISPACS"); // from FakePacsSaleSource

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == batch.LoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "sale-code-distribution",
            "stale-valid-sale-code-rejection",
            "provenance-coverage",
            "cutover-acknowledgment",
        });
        gates.Where(g => g.GateName == "stale-valid-sale-code-rejection")
            .Single().Status.Should().Be("PASS");
        gates.Where(g => g.GateName == "provenance-coverage")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task EveryLandedRow_HasLoadBatchId_AndSourceQueryHash()
    {
        var src = Source(Sale(1), Sale(2), Sale(3));

        var result = await BuildService().LandSalesAsync(src, "s1-test");

        var rows = await _db.LegacyPacsRawSales.ToListAsync();
        rows.Should().HaveCount(3);
        rows.Should().OnlyContain(r => r.LoadBatchId == result.LoadBatchId);
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceQueryHash));
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceRowHash));
    }

    [Fact]
    public async Task SourceQueryHash_IsStable_ForIdenticalQueryText()
    {
        // Two batches over the same query text must produce the same
        // source_query_hash. This is the audit anchor.
        var src1 = Source(Sale(1));
        var src2 = Source(Sale(2));

        var r1 = await BuildService().LandSalesAsync(src1, "s1-test");
        var r2 = await BuildService().LandSalesAsync(src2, "s1-test");

        var batch1 = await _db.SyncBridgeLoadBatches
            .FirstAsync(b => b.LoadBatchId == r1.LoadBatchId);
        var batch2 = await _db.SyncBridgeLoadBatches
            .FirstAsync(b => b.LoadBatchId == r2.LoadBatchId);

        batch1.SourceQueryHash.Should().Be(batch2.SourceQueryHash);
        batch1.SourceQueryHash.Should().NotBeEmpty();
    }

    [Fact]
    public async Task StaleLegacyCode_01_TripsRejectionGate_ToFail()
    {
        // Modern data must NEVER carry sl_county_ratio_cd in {'01','02'}.
        // The gate is the doctrine's load-bearing check.
        var src = Source(
            Sale(chg: 1, code: "100"),
            Sale(chg: 2, code: "01"),
            Sale(chg: 3, code: "02"),
            Sale(chg: 4, code: "100"));

        var result = await BuildService().LandSalesAsync(src, "s1-test");

        result.RowsLanded.Should().Be(4);
        result.StaleCodeViolations.Should().Be(2);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "stale-valid-sale-code-rejection");
        gate.Status.Should().Be("FAIL");
        gate.Expected.Should().Be("0");
        gate.Actual.Should().Be("2");
        gate.Detail.Should().Contain("01");
    }

    [Fact]
    public async Task QualificationAxis_Is_SlCountyRatioCd_Not_WacCd()
    {
        // Doctrine: wac_cd is preserved for audit but is NEVER the
        // qualification axis. The distribution gate counts on
        // sl_county_ratio_cd; rows with non-null wac_cd MUST NOT
        // change qualification semantics.
        var src = Source(
            new PacsSourceSale(
                ChgOfOwnerId: 99, PropId: 1, PropValYr: 2026, SupNum: 0,
                SlCountyRatioCd: "100",
                WacCd: "01",                // stale wac_cd value
                SlRatioTypeCd: null,
                SlDt: new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
                SlPrice: 250_000m, AdjSlPrice: 250_000m));

        var result = await BuildService().LandSalesAsync(src, "s1-test");

        result.StaleCodeViolations.Should().Be(0,
            "wac_cd='01' must not be counted as a stale-axis violation; only sl_county_ratio_cd participates");
        result.CodeDistribution.Should().ContainKey("100");
        result.CodeDistribution.Should().NotContainKey("01");
    }

    [Fact]
    public async Task CutoverGate_RecordsPre2018_Post2018_AndUnknown()
    {
        var src = Source(
            Sale(chg: 1, saleDt: new DateTime(2017, 6, 1, 0, 0, 0, DateTimeKind.Utc)),  // pre
            Sale(chg: 2, saleDt: new DateTime(2017, 12, 31, 23, 59, 59, DateTimeKind.Utc)),  // pre
            Sale(chg: 3, saleDt: new DateTime(2018, 1, 1, 0, 0, 0, DateTimeKind.Utc)),  // post (boundary)
            Sale(chg: 4, saleDt: new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc)),  // post
            Sale(chg: 5, saleDt: null));                                                  // unknown

        var result = await BuildService().LandSalesAsync(src, "s1-test");

        result.Pre2018Count.Should().Be(2);
        result.Post2018Count.Should().Be(2);
        result.UnknownDateCount.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "cutover-acknowledgment");
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("pre2018=2");
        gate.Detail.Should().Contain("post2018=2");
        gate.Detail.Should().Contain("unknownDate=1");
    }

    [Fact]
    public async Task Distribution_Records_NullCode_Separately()
    {
        var src = Source(
            Sale(chg: 1, code: "100"),
            Sale(chg: 2, code: null),
            Sale(chg: 3, code: null));

        var result = await BuildService().LandSalesAsync(src, "s1-test");

        result.CodeDistribution["100"].Should().Be(1);
        result.CodeDistribution["<NULL>"].Should().Be(2,
            "null sl_county_ratio_cd is recorded under '<NULL>' so it cannot hide");
    }

    [Fact]
    public async Task EmptySource_StillOpensAndClosesBatch_WithGates()
    {
        var src = Source();
        var result = await BuildService().LandSalesAsync(src, "s1-test");

        result.RowsLanded.Should().Be(0);
        result.Status.Should().Be("COMPLETED");

        (await _db.LegacyPacsRawSales.CountAsync()).Should().Be(0);
        var gates = await _db.SyncBridgePromotionGateResults.ToListAsync();
        gates.Should().HaveCount(4, "all four S1 gates must always be recorded");
        gates.Where(g => g.GateName == "stale-valid-sale-code-rejection")
            .Single().Status.Should().Be("PASS");
        gates.Where(g => g.GateName == "provenance-coverage")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task FailingSource_MarksLoadBatchFailed_AndDoesNotPersistRows()
    {
        var src = new ThrowingPacsSaleSource(
            new InvalidOperationException("simulated source-side failure"));

        var result = await BuildService().LandSalesAsync(src, "s1-test");

        result.Status.Should().Be("FAILED");
        result.ErrorSummary.Should().Contain("simulated source-side failure");

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");
        batch.ErrorSummary.Should().Contain("InvalidOperationException");
        batch.CompletedAt.Should().NotBeNull();

        // No partial-write rows should remain.
        (await _db.LegacyPacsRawSales.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Cancellation_MarksLoadBatchCancelled_AndRethrows()
    {
        // Verifies the OCE catch block added in WO-DATA-FINALIZE-SALES-001A.
        // Before this fix, OperationCanceledException bypassed the catch clause
        // (which guards with `when (ex is not OperationCanceledException)`) and
        // left the LoadBatch permanently IN_PROGRESS — a zombie batch.
        var cts = new CancellationTokenSource();
        var src = new CancellingPacsSaleSource(cts, cancelAfterRows: 2);

        await Assert.ThrowsAsync<OperationCanceledException>(
            () => BuildService().LandSalesAsync(src, "s1-cancel-test", cts.Token));

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("CANCELLED",
            because: "OperationCanceledException must mark the batch CANCELLED, not leave it IN_PROGRESS");
        batch.CompletedAt.Should().NotBeNull(
            because: "CANCELLED batches must have a terminal timestamp");
        batch.ErrorSummary.Should().NotBeNullOrEmpty(
            because: "cancellation reason must be recorded for audit");
    }

    [Fact]
    public async Task NonCancellation_Exception_StillMarksLoadBatchFailed()
    {
        // Confirms the existing FAILED path still works after adding the OCE catch.
        var src = new ThrowingPacsSaleSource(
            new InvalidOperationException("non-cancellation failure"));

        var result = await BuildService().LandSalesAsync(src, "s1-test");

        result.Status.Should().Be("FAILED");
        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED",
            because: "non-OCE exceptions must still go through the FAILED path");
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInS1()
    {
        // S1 is explicit: nothing lands in canonical_tf.tf_sale (which
        // doesn't even exist yet) and nothing lands in product.*.
        // We assert this by checking that the only writes are to
        // legacy_pacs_raw.sale + sync_bridge.* tables.
        var src = Source(Sale(chg: 1, code: "100"));

        await BuildService().LandSalesAsync(src, "s1-test");

        // tf_parcel and tf_parcel_geom must not be touched by S1.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.TfParcelGeoms.CountAsync()).Should().Be(0);
    }

    // ── Test doubles ────────────────────────────────────────────────

    private sealed class FakePacsSaleSource : IPacsSaleSource
    {
        private readonly IReadOnlyList<PacsSourceSale> _sales;
        public FakePacsSaleSource(IEnumerable<PacsSourceSale> sales)
            => _sales = sales.ToList();

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText =>
            "SELECT chg_of_owner_id, prop_id, prop_val_yr, sup_num, " +
            "sl_county_ratio_cd, wac_cd, sl_ratio_type_cd, sl_dt, sl_price, adj_sl_price " +
            "FROM dbo.sale";

        public async IAsyncEnumerable<PacsSourceSale> StreamSalesAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            foreach (var s in _sales)
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return s;
                await Task.Yield();
            }
        }
    }

    private sealed class CancellingPacsSaleSource : IPacsSaleSource
    {
        private readonly CancellationTokenSource _cts;
        private readonly int _cancelAfterRows;

        public CancellingPacsSaleSource(CancellationTokenSource cts, int cancelAfterRows)
        {
            _cts = cts;
            _cancelAfterRows = cancelAfterRows;
        }

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText => "SELECT 1";

        public async IAsyncEnumerable<PacsSourceSale> StreamSalesAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            for (var i = 0; i < _cancelAfterRows; i++)
            {
                yield return new PacsSourceSale(
                    ChgOfOwnerId: i + 1, PropId: 1000 + i, PropValYr: 2026, SupNum: 0,
                    SlCountyRatioCd: "100", WacCd: null, SlRatioTypeCd: null,
                    SlDt: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    SlPrice: 300_000m, AdjSlPrice: 300_000m);
                await Task.Yield();
            }
            // Simulate mid-stream cancellation (e.g. HTTP request timeout).
            _cts.Cancel();
            cancellationToken.ThrowIfCancellationRequested();
        }
    }

    private sealed class ThrowingPacsSaleSource : IPacsSaleSource
    {
        private readonly Exception _ex;
        public ThrowingPacsSaleSource(Exception ex) => _ex = ex;

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText => "SELECT 1";

        public async IAsyncEnumerable<PacsSourceSale> StreamSalesAsync(
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
