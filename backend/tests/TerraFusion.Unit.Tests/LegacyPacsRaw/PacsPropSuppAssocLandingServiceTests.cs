using System.Runtime.CompilerServices;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsPropSuppAssoc;
using TerraFusion.Data;
using TerraFusion.Data.Services.LegacyPacsRaw;
using Xunit;

namespace TerraFusion.Unit.Tests.LegacyPacsRaw;

/// <summary>
/// Slice S2-A acceptance tests. Mirrors the S1 pattern; proves the
/// three S2-A promotion gates and the doctrine invariants:
///  - LoadBatch is opened with SourceFamily = PACS_OLTP
///  - every landed row carries non-empty load_batch_id and source_query_hash
///  - the (PropId, PropValYr) uniqueness invariant is enforced via
///    the prop-supp-assoc-uniqueness gate (FAIL on duplicate)
///  - empty source still records all three gates
///  - failing source marks load_batch FAILED with no partial rows
/// </summary>
public sealed class PacsPropSuppAssocLandingServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsPropSuppAssocLandingServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"s2a-{Guid.NewGuid():N}")
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

    private PacsPropSuppAssocLandingService BuildService()
        => new(_db, NullLogger<PacsPropSuppAssocLandingService>.Instance);

    private static FakePropSuppAssocSource Source(params PacsSourcePropSuppAssoc[] rows)
        => new(rows);

    private static PacsSourcePropSuppAssoc Row(int propId, short year = 2026, short sup = 0)
        => new(year, propId, sup);

    [Fact]
    public async Task HappyPath_LandsRows_OpensBatchPacsOltp_AndAllGatesPass()
    {
        var src = Source(
            Row(propId: 1001, year: 2026),
            Row(propId: 1002, year: 2026),
            Row(propId: 1001, year: 2025));

        var result = await BuildService().LandPropSuppAssocsAsync(src, "s2a-test");

        result.Status.Should().Be("COMPLETED");
        result.RowsLanded.Should().Be(3);
        result.DuplicateKeyViolations.Should().Be(0);
        result.DistinctYears.Should().Be(2);

        (await _db.LegacyPacsRawPropSuppAssocs.CountAsync()).Should().Be(3);

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.SourceFamily.Should().Be(SourceFamilies.PacsOltp);
        batch.Status.Should().Be("COMPLETED");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == batch.LoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "prop-supp-assoc-distribution",
            "prop-supp-assoc-uniqueness",
            "provenance-coverage",
        });
        gates.Where(g => g.GateName == "prop-supp-assoc-uniqueness")
            .Single().Status.Should().Be("PASS");
        gates.Where(g => g.GateName == "provenance-coverage")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task DuplicateKey_TripsUniquenessGate_ToFail()
    {
        // Two rows with the same (PropId, PropValYr) but different SupNum.
        // The PACS source enforces UNIQUE on (year, prop_id); if it
        // arrives here, our extract is broken or the source is corrupt.
        var src = Source(
            Row(propId: 7, year: 2026, sup: 0),
            Row(propId: 7, year: 2026, sup: 1),
            Row(propId: 8, year: 2026, sup: 0));

        var result = await BuildService().LandPropSuppAssocsAsync(src, "s2a-test");

        result.RowsLanded.Should().Be(3);
        result.DuplicateKeyViolations.Should().Be(1,
            "(PropId=7, PropValYr=2026) appears twice → 1 violated key");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "prop-supp-assoc-uniqueness");
        gate.Status.Should().Be("FAIL");
        gate.Expected.Should().Be("0");
        gate.Actual.Should().Be("1");
    }

    [Fact]
    public async Task EveryLandedRow_HasLoadBatchId_AndSourceQueryHash()
    {
        var src = Source(Row(1), Row(2), Row(3));

        var result = await BuildService().LandPropSuppAssocsAsync(src, "s2a-test");

        var rows = await _db.LegacyPacsRawPropSuppAssocs.ToListAsync();
        rows.Should().HaveCount(3);
        rows.Should().OnlyContain(r => r.LoadBatchId == result.LoadBatchId);
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceQueryHash));
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceRowHash));
    }

    [Fact]
    public async Task DistributionGate_RecordsYearHistogram()
    {
        var src = Source(
            Row(1, year: 2024),
            Row(2, year: 2024),
            Row(3, year: 2025),
            Row(4, year: 2026),
            Row(5, year: 2026));

        await BuildService().LandPropSuppAssocsAsync(src, "s2a-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "prop-supp-assoc-distribution");
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("2024=2");
        gate.Detail.Should().Contain("2025=1");
        gate.Detail.Should().Contain("2026=2");
    }

    [Fact]
    public async Task EmptySource_StillOpensAndClosesBatch_WithGates()
    {
        var src = Source();
        var result = await BuildService().LandPropSuppAssocsAsync(src, "s2a-test");

        result.RowsLanded.Should().Be(0);
        result.Status.Should().Be("COMPLETED");

        (await _db.LegacyPacsRawPropSuppAssocs.CountAsync()).Should().Be(0);
        var gates = await _db.SyncBridgePromotionGateResults.ToListAsync();
        gates.Should().HaveCount(3);
        gates.Where(g => g.GateName == "prop-supp-assoc-uniqueness")
            .Single().Status.Should().Be("PASS");
        gates.Where(g => g.GateName == "provenance-coverage")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task FailingSource_MarksLoadBatchFailed_AndDoesNotPersistRows()
    {
        var src = new ThrowingPropSuppAssocSource(
            new InvalidOperationException("simulated source failure"));

        var result = await BuildService().LandPropSuppAssocsAsync(src, "s2a-test");

        result.Status.Should().Be("FAILED");
        result.ErrorSummary.Should().Contain("simulated source failure");

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");
        batch.ErrorSummary.Should().Contain("InvalidOperationException");

        (await _db.LegacyPacsRawPropSuppAssocs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SourceQueryHash_IsStable_ForIdenticalQueryText()
    {
        var src1 = Source(Row(1));
        var src2 = Source(Row(2));

        var r1 = await BuildService().LandPropSuppAssocsAsync(src1, "s2a-test");
        var r2 = await BuildService().LandPropSuppAssocsAsync(src2, "s2a-test");

        var b1 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r1.LoadBatchId);
        var b2 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r2.LoadBatchId);
        b1.SourceQueryHash.Should().Be(b2.SourceQueryHash);
        b1.SourceQueryHash.Should().NotBeEmpty();
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInS2A()
    {
        var src = Source(Row(1));
        await BuildService().LandPropSuppAssocsAsync(src, "s2a-test");

        // S2-A is raw landing only. tf_parcel and friends must remain untouched.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.TfParcelGeoms.CountAsync()).Should().Be(0);
        (await _db.LegacyPacsRawSales.CountAsync()).Should().Be(0,
            "S2-A handles prop_supp_assoc only, never sales");
    }

    [Fact]
    public async Task MultipleDuplicateKeys_AreEachCounted()
    {
        // Three keys violated, six rows total (each key appears twice).
        var src = Source(
            Row(propId: 1, year: 2026, sup: 0), Row(propId: 1, year: 2026, sup: 1),
            Row(propId: 2, year: 2026, sup: 0), Row(propId: 2, year: 2026, sup: 1),
            Row(propId: 3, year: 2026, sup: 0), Row(propId: 3, year: 2026, sup: 1));

        var result = await BuildService().LandPropSuppAssocsAsync(src, "s2a-test");

        result.RowsLanded.Should().Be(6);
        result.DuplicateKeyViolations.Should().Be(3,
            "each violated (prop_id, year) pair contributes one to the count");
    }

    // ── Test doubles ────────────────────────────────────────────────

    private sealed class FakePropSuppAssocSource : IPacsPropSuppAssocSource
    {
        private readonly IReadOnlyList<PacsSourcePropSuppAssoc> _rows;
        public FakePropSuppAssocSource(IEnumerable<PacsSourcePropSuppAssoc> rows)
            => _rows = rows.ToList();

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText =>
            "SELECT prop_val_yr, prop_id, sup_num FROM dbo.prop_supp_assoc";

        public async IAsyncEnumerable<PacsSourcePropSuppAssoc> StreamPropSuppAssocsAsync(
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

    private sealed class ThrowingPropSuppAssocSource : IPacsPropSuppAssocSource
    {
        private readonly Exception _ex;
        public ThrowingPropSuppAssocSource(Exception ex) => _ex = ex;

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText => "SELECT 1";

        public async IAsyncEnumerable<PacsSourcePropSuppAssoc> StreamPropSuppAssocsAsync(
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
