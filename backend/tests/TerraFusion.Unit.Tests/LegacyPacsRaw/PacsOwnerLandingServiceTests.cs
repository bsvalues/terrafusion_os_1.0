using System.Runtime.CompilerServices;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsOwner;
using TerraFusion.Data;
using TerraFusion.Data.Services.LegacyPacsRaw;
using Xunit;

namespace TerraFusion.Unit.Tests.LegacyPacsRaw;

/// <summary>
/// Slice B1-B acceptance tests. Mirrors the S1/S2-A/B1-A pattern;
/// proves the four B1-B promotion gates and the doctrine invariants:
///  - LoadBatch is opened with SourceFamily = PACS_OLTP
///  - every landed row carries provenance
///  - the 4-key (OwnerTaxYr, SupNum, PropId, OwnerId) uniqueness
///    invariant is enforced by the owner-key-uniqueness gate
///  - per-group pct totals are surfaced informationally (not failing)
///    so the truth-pacs.owner_current promoter (B2-A) can tighten
///  - PII (BirthDt) lands verbatim
///  - empty source still records all four gates
///  - failing source marks load_batch FAILED with no partial rows
/// </summary>
public sealed class PacsOwnerLandingServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsOwnerLandingServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"b1b-{Guid.NewGuid():N}")
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

    private PacsOwnerLandingService BuildService()
        => new(_db, NullLogger<PacsOwnerLandingService>.Instance);

    private static FakeOwnerSource Source(params PacsSourceOwner[] rows)
        => new(rows);

    private static PacsSourceOwner Owner(
        int propId,
        long ownerId,
        decimal? pct = 100m,
        string? type = "I",
        DateTime? birthDt = null,
        short year = 2026,
        short sup = 0)
        => new(year, sup, propId, ownerId, pct, type, null, birthDt);

    [Fact]
    public async Task HappyPath_LandsRows_OpensBatchPacsOltp_AndAllGatesRecord()
    {
        var src = Source(
            Owner(propId: 100, ownerId: 1, pct: 100m),
            Owner(propId: 200, ownerId: 2, pct: 100m),
            Owner(propId: 300, ownerId: 3, pct: 100m));

        var result = await BuildService().LandOwnersAsync(src, "b1b-test");

        result.Status.Should().Be("COMPLETED");
        result.RowsLanded.Should().Be(3);
        result.DuplicateKeyViolations.Should().Be(0);
        result.DistinctOwnershipGroups.Should().Be(3);
        result.GroupsWithFullPctSum.Should().Be(3);

        (await _db.LegacyPacsRawOwners.CountAsync()).Should().Be(3);

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.SourceFamily.Should().Be(SourceFamilies.PacsOltp);
        batch.Status.Should().Be("COMPLETED");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == batch.LoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "owner-distribution",
            "owner-key-uniqueness",
            "provenance-coverage",
            "owner-pct-completeness",
        });
        gates.Where(g => g.GateName == "owner-key-uniqueness")
            .Single().Status.Should().Be("PASS");
        gates.Where(g => g.GateName == "provenance-coverage")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task DuplicateFourKey_TripsUniquenessGate_ToFail()
    {
        // Same (OwnerTaxYr, SupNum, PropId, OwnerId) twice → violation.
        var src = Source(
            Owner(propId: 100, ownerId: 1),
            Owner(propId: 100, ownerId: 1, pct: 50m), // same 4-key
            Owner(propId: 200, ownerId: 2));

        var result = await BuildService().LandOwnersAsync(src, "b1b-test");

        result.RowsLanded.Should().Be(3);
        result.DuplicateKeyViolations.Should().Be(1,
            "(2026, 0, 100, 1) appears twice → 1 violated key");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "owner-key-uniqueness");
        gate.Status.Should().Be("FAIL");
        gate.Expected.Should().Be("0");
        gate.Actual.Should().Be("1");
    }

    [Fact]
    public async Task SamePropId_DifferentOwnerId_IsNotADuplicate()
    {
        // Co-ownership: same parcel, different owner_ids. Each row
        // is a distinct 4-key tuple — uniqueness MUST hold.
        var src = Source(
            Owner(propId: 100, ownerId: 1, pct: 60m),
            Owner(propId: 100, ownerId: 2, pct: 40m));

        var result = await BuildService().LandOwnersAsync(src, "b1b-test");

        result.DuplicateKeyViolations.Should().Be(0);
        result.DistinctOwnershipGroups.Should().Be(1,
            "two co-owners share one (PropId, Year, Sup) group");
        result.GroupsWithFullPctSum.Should().Be(1,
            "60 + 40 = 100 rounds to a full group");
    }

    [Fact]
    public async Task PctSumPartial_IsCountedSeparately_NotFailed()
    {
        // 60 + 30 = 90 → partial. The gate stays informational.
        var src = Source(
            Owner(propId: 100, ownerId: 1, pct: 60m),
            Owner(propId: 100, ownerId: 2, pct: 30m));

        var result = await BuildService().LandOwnersAsync(src, "b1b-test");

        result.GroupsWithFullPctSum.Should().Be(0);
        result.GroupsWithPartialPctSum.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "owner-pct-completeness");
        gate.Status.Should().Be("PASS",
            "B1-B is informational only; B2-A tightens this");
        gate.Detail.Should().Contain("partialPctSum=1");
    }

    [Fact]
    public async Task NullPctOwnership_GroupIsCountedAsPartial()
    {
        // The doctrine: NULL infects the group's sum.
        var src = Source(
            Owner(propId: 100, ownerId: 1, pct: null),
            Owner(propId: 100, ownerId: 2, pct: 100m));

        var result = await BuildService().LandOwnersAsync(src, "b1b-test");

        result.GroupsWithFullPctSum.Should().Be(0);
        result.GroupsWithPartialPctSum.Should().Be(1);
    }

    [Fact]
    public async Task BirthDt_PII_IsPreservedVerbatim()
    {
        var birth = new DateTime(1965, 3, 15, 0, 0, 0, DateTimeKind.Utc);
        var src = Source(Owner(propId: 100, ownerId: 1, birthDt: birth));

        await BuildService().LandOwnersAsync(src, "b1b-test");

        var row = await _db.LegacyPacsRawOwners.SingleAsync();
        row.BirthDt.Should().Be(birth,
            "PII lands verbatim at raw layer; redaction is canonical-layer's job");
    }

    [Fact]
    public async Task EveryLandedRow_HasLoadBatchId_AndSourceQueryHash()
    {
        var src = Source(Owner(1, 1), Owner(2, 2), Owner(3, 3));
        var result = await BuildService().LandOwnersAsync(src, "b1b-test");

        var rows = await _db.LegacyPacsRawOwners.ToListAsync();
        rows.Should().HaveCount(3);
        rows.Should().OnlyContain(r => r.LoadBatchId == result.LoadBatchId);
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceQueryHash));
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceRowHash));
    }

    [Fact]
    public async Task DistributionGate_RecordsYearAndTypeHistogram()
    {
        var src = Source(
            Owner(propId: 1, ownerId: 1, year: 2024, type: "I"),
            Owner(propId: 2, ownerId: 2, year: 2024, type: "C"),
            Owner(propId: 3, ownerId: 3, year: 2025, type: "I"),
            Owner(propId: 4, ownerId: 4, year: 2026, type: "I"));

        await BuildService().LandOwnersAsync(src, "b1b-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "owner-distribution");
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("yr2024=2");
        gate.Detail.Should().Contain("yr2026=1");
        gate.Detail.Should().Contain("typeI=3");
        gate.Detail.Should().Contain("typeC=1");
    }

    [Fact]
    public async Task EmptySource_StillOpensAndClosesBatch_WithGates()
    {
        var src = Source();
        var result = await BuildService().LandOwnersAsync(src, "b1b-test");

        result.RowsLanded.Should().Be(0);
        result.Status.Should().Be("COMPLETED");

        (await _db.LegacyPacsRawOwners.CountAsync()).Should().Be(0);
        var gates = await _db.SyncBridgePromotionGateResults.ToListAsync();
        gates.Should().HaveCount(4);
        gates.Where(g => g.GateName == "owner-key-uniqueness")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task FailingSource_MarksLoadBatchFailed_AndDoesNotPersistRows()
    {
        var src = new ThrowingOwnerSource(
            new InvalidOperationException("simulated source failure"));

        var result = await BuildService().LandOwnersAsync(src, "b1b-test");

        result.Status.Should().Be("FAILED");
        result.ErrorSummary.Should().Contain("simulated source failure");

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");
        batch.ErrorSummary.Should().Contain("InvalidOperationException");

        (await _db.LegacyPacsRawOwners.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SourceQueryHash_IsStable_ForIdenticalQueryText()
    {
        var src1 = Source(Owner(1, 1));
        var src2 = Source(Owner(2, 2));

        var r1 = await BuildService().LandOwnersAsync(src1, "b1b-test");
        var r2 = await BuildService().LandOwnersAsync(src2, "b1b-test");

        var b1 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r1.LoadBatchId);
        var b2 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r2.LoadBatchId);
        b1.SourceQueryHash.Should().Be(b2.SourceQueryHash);
        b1.SourceQueryHash.Should().NotBeEmpty();
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInB1B()
    {
        var src = Source(Owner(1, 1));
        await BuildService().LandOwnersAsync(src, "b1b-test");

        // B1-B is raw landing only.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.TfSales.CountAsync()).Should().Be(0);
        (await _db.LegacyPacsRawSales.CountAsync()).Should().Be(0);
        (await _db.LegacyPacsRawAccounts.CountAsync()).Should().Be(0,
            "B1-B handles owner only, not account");
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task DifferentSupNumbers_AreNotDuplicates_Despite_SamePropAndOwner()
    {
        // PACS allows the same (PropId, OwnerId) under different
        // supplements within the same year. The 4-key includes
        // sup_num so this is NOT a duplicate.
        var src = Source(
            new PacsSourceOwner(2026, 0, 100, 1, 100m, "I", null, null),
            new PacsSourceOwner(2026, 1, 100, 1, 100m, "I", null, null));

        var result = await BuildService().LandOwnersAsync(src, "b1b-test");

        result.DuplicateKeyViolations.Should().Be(0);
        result.DistinctOwnershipGroups.Should().Be(2,
            "different sup_nums create distinct (PropId, Year, Sup) groups");
    }

    // ── Test doubles ────────────────────────────────────────────────

    private sealed class FakeOwnerSource : IPacsOwnerSource
    {
        private readonly IReadOnlyList<PacsSourceOwner> _rows;
        public FakeOwnerSource(IEnumerable<PacsSourceOwner> rows)
            => _rows = rows.ToList();

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText =>
            "SELECT owner_tax_yr, sup_num, prop_id, owner_id, pct_ownership, type_of_owner, udi_status, birth_dt FROM dbo.owner";

        public async IAsyncEnumerable<PacsSourceOwner> StreamOwnersAsync(
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

    private sealed class ThrowingOwnerSource : IPacsOwnerSource
    {
        private readonly Exception _ex;
        public ThrowingOwnerSource(Exception ex) => _ex = ex;

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText => "SELECT 1";

        public async IAsyncEnumerable<PacsSourceOwner> StreamOwnersAsync(
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
