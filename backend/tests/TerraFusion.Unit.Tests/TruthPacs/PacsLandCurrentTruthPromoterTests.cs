using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsLandTruth;
using TerraFusion.Data;
using TerraFusion.Data.Services.TruthPacs;
using Xunit;

namespace TerraFusion.Unit.Tests.TruthPacs;

/// <summary>
/// Slice L2 acceptance tests. Mirrors the C2 / B2-B pattern — two
/// source batches (land_detail + prop_supp_assoc), supp-aware
/// filter, four T-* gates, idempotent on land batch.
/// </summary>
public sealed class PacsLandCurrentTruthPromoterTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsLandCurrentTruthPromoterTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"l2-{Guid.NewGuid():N}")
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

    private PacsLandCurrentTruthPromoter BuildPromoter()
        => new(_db, NullLogger<PacsLandCurrentTruthPromoter>.Instance);

    private async Task<Guid> SeedBatchAsync(string label, string status = "COMPLETED")
    {
        var b = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "JCHARRISPACS",
            SourceFileOrDatabase = label,
            SourceQueryHash = "abc",
            Operator = "test",
            Status = status,
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-1),
            ErrorSummary = status == "FAILED" ? "simulated" : null,
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
    }

    private async Task SeedSuppAsync(Guid suppBatch, int propId, short year, short sup)
    {
        _db.LegacyPacsRawPropSuppAssocs.Add(new LegacyPacsRawPropSuppAssoc
        {
            PropValYr = year, PropId = propId, SupNum = sup,
            LoadBatchId = suppBatch, SourceQueryHash = "qh",
            SourceRowHash = $"supp-{propId}-{year}",
        });
        await _db.SaveChangesAsync();
    }

    private async Task SeedLandAsync(
        Guid landBatch, int propId, long landSegId,
        string? typeCd = "SFR", string? useCd = "HOMESITE",
        decimal? acres = 0.5m, decimal? marketVal = 100_000m,
        short year = 2026, short sup = 0)
    {
        _db.LegacyPacsRawLandDetails.Add(new LegacyPacsRawLandDetail
        {
            PropValYr = year, SupNum = sup,
            PropId = propId, LandSegId = landSegId,
            LandSegTypeCd = typeCd,
            LandSegStateCd = "WA",
            LandSegClassCd = "B",
            LandSegUseCd = useCd,
            LandSegHomesite = useCd == "HOMESITE" ? "Y" : "N",
            SizeAcres = acres,
            SizeSquareFeet = acres.HasValue ? acres.Value * 43560m : null,
            LandSegMarketVal = marketVal,
            LandSegAssessedVal = marketVal,
            LoadBatchId = landBatch,
            SourceQueryHash = "qh",
            SourceRowHash = $"land-{propId}-{landSegId}",
        });
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task HappyPath_PromotesValidSegments_WithFullLineage()
    {
        // Realistic ag property: homesite + crop + pasture + timber.
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedLandAsync(landBatch, propId: 100, landSegId: 1,
            typeCd: "AG", useCd: "HOMESITE", acres: 0.5m, marketVal: 50_000m);
        await SeedLandAsync(landBatch, propId: 100, landSegId: 2,
            typeCd: "AG", useCd: "CROP", acres: 80m, marketVal: 240_000m);
        await SeedLandAsync(landBatch, propId: 100, landSegId: 3,
            typeCd: "AG", useCd: "PASTURE", acres: 40m, marketVal: 80_000m);

        var result = await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        result.Status.Should().Be("COMPLETED");
        result.LandSegsConsidered.Should().Be(3);
        result.LandSegsPromoted.Should().Be(3);
        result.SizeAcresSum.Should().Be(120.5m);
        result.LandSegMarketValSum.Should().Be(370_000m);

        var truth = await _db.TruthPacsLandCurrents.ToListAsync();
        truth.Should().HaveCount(3);
        truth.Should().OnlyContain(t => t.LandLoadBatchId == landBatch);
        truth.Should().OnlyContain(t => t.SuppAssocLoadBatchId == suppBatch);
        truth.Should().OnlyContain(t => t.SourceLandLandedRowId != Guid.Empty);
        truth.Should().OnlyContain(t => t.SourceSuppAssocLandedRowId != Guid.Empty);
    }

    [Fact]
    public async Task StaleSupNum_IsRejected()
    {
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 1);
        await SeedLandAsync(landBatch, propId: 100, landSegId: 1, sup: 0);

        var result = await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        result.LandSegsPromoted.Should().Be(0);
        result.RejectedStaleSupNum.Should().Be(1);
        (await _db.TruthPacsLandCurrents.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task NoSuppPointer_IsRejected()
    {
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedLandAsync(landBatch, propId: 999, landSegId: 1);

        var result = await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        result.LandSegsPromoted.Should().Be(0);
        result.RejectedNoSuppPointer.Should().Be(1);
    }

    [Fact]
    public async Task AggregateGate_ReportsAcresAndMarketSums_AfterSuppFilter()
    {
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedLandAsync(landBatch, propId: 100, landSegId: 1, acres: 5m, marketVal: 100_000m);
        // Rejected (no supp for 999) — does NOT contribute.
        await SeedLandAsync(landBatch, propId: 999, landSegId: 1, acres: 999m, marketVal: 999_999m);

        var result = await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        result.SizeAcresSum.Should().Be(5m);
        result.LandSegMarketValSum.Should().Be(100_000m);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-land-aggregate");
        gate.Detail.Should().Contain("sizeAcresSum=5");
        gate.Detail.Should().Contain("landSegMarketValSum=100000");
    }

    [Theory]
    [InlineData("FAILED", "COMPLETED")]
    [InlineData("COMPLETED", "FAILED")]
    [InlineData("FAILED", "FAILED")]
    public async Task AnyBatchNotCompleted_RefusesPromotion(string landStatus, string suppStatus)
    {
        var landBatch = await SeedBatchAsync("land", landStatus);
        var suppBatch = await SeedBatchAsync("supp", suppStatus);

        var result = await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        result.Status.Should().Be("REFUSED");
        (await _db.TruthPacsLandCurrents.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task UnknownBatchIds_RefusesPromotion()
    {
        var result = await BuildPromoter()
            .PromoteAsync(Guid.NewGuid(), Guid.NewGuid(), "l2-test");

        result.Status.Should().Be("REFUSED");
        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-land-source-batches-completed"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        gate.Status.Should().Be("FAIL");
        gate.Detail.Should().Contain("MISSING");
    }

    [Fact]
    public async Task RePromote_ReplacesPriorTruthRows_Idempotently()
    {
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedLandAsync(landBatch, propId: 100, landSegId: 1);

        var first = await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");
        var second = await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        first.LandSegsPromoted.Should().Be(1);
        first.PriorRowsRemoved.Should().Be(0);
        second.LandSegsPromoted.Should().Be(1);
        second.PriorRowsRemoved.Should().Be(1);

        (await _db.TruthPacsLandCurrents.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task AllFourGates_AreRecorded_OnSuccess()
    {
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedLandAsync(landBatch, propId: 100, landSegId: 1);

        var result = await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "truth-pacs-land-source-batches-completed",
            "truth-pacs-land-supp-aware-join",
            "truth-pacs-land-promotion-coverage",
            "truth-pacs-land-aggregate",
        });
    }

    [Fact]
    public async Task SuppRejectsOnly_GateIsWarn_NotFail()
    {
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedLandAsync(landBatch, propId: 100, landSegId: 1);
        await SeedLandAsync(landBatch, propId: 999, landSegId: 1); // no supp

        var result = await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        result.LandSegsPromoted.Should().Be(1);
        result.RejectedNoSuppPointer.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-land-supp-aware-join"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        gate.Status.Should().Be("WARN");
        gate.Detail.Should().Contain("noSuppPointer=1");
    }

    [Fact]
    public async Task EmptyLandBatch_StillCompletes_WithCleanGates()
    {
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");

        var result = await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        result.Status.Should().Be("COMPLETED");
        result.LandSegsConsidered.Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(4);
        gates.Should().OnlyContain(g => g.Status != "FAIL");
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInL2()
    {
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedLandAsync(landBatch, propId: 100, landSegId: 1);

        await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        // canonical_tf must remain untouched.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
        // truth_pacs.imprv_current must also remain untouched (L2 only handles land).
        (await _db.TruthPacsImprvCurrents.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task NullValues_ExcludedFromAggregateSums()
    {
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedSuppAsync(suppBatch, propId: 200, year: 2026, sup: 0);
        await SeedLandAsync(landBatch, propId: 100, landSegId: 1, acres: 1m, marketVal: 100_000m);
        await SeedLandAsync(landBatch, propId: 200, landSegId: 1, acres: null, marketVal: null);

        var result = await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        result.LandSegsPromoted.Should().Be(2);
        result.SizeAcresSum.Should().Be(1m, "NULL excluded");
        result.LandSegMarketValSum.Should().Be(100_000m, "NULL excluded");
    }

    [Fact]
    public async Task ValueShape_RoundTripsThroughTruthLayer()
    {
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);

        _db.LegacyPacsRawLandDetails.Add(new LegacyPacsRawLandDetail
        {
            PropValYr = 2026, SupNum = 0, PropId = 100, LandSegId = 42,
            LandSegTypeCd = "AG",
            LandSegStateCd = "WA",
            LandSegClassCd = "II",
            LandSegUseCd = "ORCHARD",
            SoilCd = "WALLA-SILT",
            LandSegHomesite = "N",
            SizeAcres = 35.75m,
            SizeSquareFeet = 1557270m,
            LandSegMarketVal = 525_500m,
            LandSegAgValue = 125_000m,
            LandSegAssessedVal = 125_000m,
            LandSegEffAge = 12,
            LoadBatchId = landBatch,
            SourceQueryHash = "qh",
            SourceRowHash = "row",
        });
        await _db.SaveChangesAsync();

        await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        var truth = await _db.TruthPacsLandCurrents.SingleAsync();
        truth.LandSegTypeCd.Should().Be("AG");
        truth.LandSegUseCd.Should().Be("ORCHARD");
        truth.SoilCd.Should().Be("WALLA-SILT");
        truth.SizeAcres.Should().Be(35.75m);
        truth.LandSegMarketVal.Should().Be(525_500m);
        truth.LandSegAgValue.Should().Be(125_000m);
        truth.LandSegAssessedVal.Should().Be(125_000m);
        truth.LandSegEffAge.Should().Be(12);
    }

    [Fact]
    public async Task AgValue_DistinctFromMarketVal_IsPreservedThroughTruth()
    {
        // Doctrine: ag value and market value are distinct columns.
        // For current-use ag programs, assessed != market.
        var landBatch = await SeedBatchAsync("land");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);

        _db.LegacyPacsRawLandDetails.Add(new LegacyPacsRawLandDetail
        {
            PropValYr = 2026, SupNum = 0, PropId = 100, LandSegId = 1,
            LandSegTypeCd = "AG",
            LandSegUseCd = "CROP",
            SizeAcres = 80m,
            LandSegMarketVal = 240_000m,
            LandSegAgValue = 80_000m,        // distinct from market
            LandSegAssessedVal = 80_000m,    // assessed at AG value
            LoadBatchId = landBatch,
            SourceQueryHash = "qh",
            SourceRowHash = "row",
        });
        await _db.SaveChangesAsync();

        await BuildPromoter().PromoteAsync(landBatch, suppBatch, "l2-test");

        var truth = await _db.TruthPacsLandCurrents.SingleAsync();
        truth.LandSegMarketVal.Should().Be(240_000m);
        truth.LandSegAgValue.Should().Be(80_000m);
        truth.LandSegAssessedVal.Should().Be(80_000m);
    }
}
