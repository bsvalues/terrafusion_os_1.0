using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsWashPropOwnerValTruth;
using TerraFusion.Data;
using TerraFusion.Data.Services.TruthPacs;
using Xunit;

namespace TerraFusion.Unit.Tests.TruthPacs;

/// <summary>
/// Slice B2-B acceptance tests. Proves the four T-* gates and the
/// doctrine invariants:
///  - both source batches must be COMPLETED or REFUSED
///  - rows whose sup_num doesn't match the active supp pointer are rejected
///  - rows whose (PropId, Year) has no supp pointer are rejected
///  - aggregate sums report on the supp-filtered set
///  - re-promotion is idempotent
///  - every promoted row carries lineage to both source batches
/// </summary>
public sealed class PacsWashPropOwnerValTruthPromoterTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsWashPropOwnerValTruthPromoterTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"b2b-{Guid.NewGuid():N}")
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

    private PacsWashPropOwnerValTruthPromoter BuildPromoter()
        => new(_db, NullLogger<PacsWashPropOwnerValTruthPromoter>.Instance);

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

    private async Task SeedWpovAsync(
        Guid wpovBatch,
        int propId, long ownerId,
        decimal? assessed = 250_000m, decimal? market = 300_000m,
        string? boe = "F",
        short year = 2026, short sup = 0)
    {
        _db.LegacyPacsRawWashPropOwnerVals.Add(new LegacyPacsRawWashPropOwnerVal
        {
            PropValYr = year, SupNum = sup,
            PropId = propId, OwnerId = ownerId,
            AssessedVal = assessed, MarketVal = market,
            AppraisedVal = assessed, TaxableClassified = assessed,
            BoeStatus = boe,
            LoadBatchId = wpovBatch,
            SourceQueryHash = "qh",
            SourceRowHash = $"wpov-{propId}-{ownerId}",
        });
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task HappyPath_PromotesValidRows_WithFullLineage()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedSuppAsync(suppBatch, propId: 200, year: 2026, sup: 0);
        await SeedWpovAsync(wpovBatch, propId: 100, ownerId: 1, assessed: 250_000m, market: 300_000m);
        await SeedWpovAsync(wpovBatch, propId: 200, ownerId: 2, assessed: 425_000m, market: 500_000m);

        var result = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.RowsConsidered.Should().Be(2);
        result.RowsPromoted.Should().Be(2);
        result.AssessedValSum.Should().Be(675_000m);
        result.MarketValSum.Should().Be(800_000m);

        var truth = await _db.TruthPacsWashPropOwnerVals.ToListAsync();
        truth.Should().HaveCount(2);
        truth.Should().OnlyContain(t => t.WpovLoadBatchId == wpovBatch);
        truth.Should().OnlyContain(t => t.SuppAssocLoadBatchId == suppBatch);
        truth.Should().OnlyContain(t => t.SourceWpovLandedRowId != Guid.Empty);
        truth.Should().OnlyContain(t => t.SourceSuppAssocLandedRowId != Guid.Empty);
        // G1 (v1.10): conversion-era marker is stamped at promotion (year=2026 ⇒ post-conversion).
        truth.Should().OnlyContain(t => t.ConversionEra == ConversionEras.PostConversion);
    }

    [Fact]
    public async Task StaleSupNum_IsRejected()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");

        // Active sup is 1; wpov points at sup 0 → stale.
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 1);
        await SeedWpovAsync(wpovBatch, propId: 100, ownerId: 1, sup: 0);

        var result = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        result.RowsPromoted.Should().Be(0);
        result.RejectedStaleSupNum.Should().Be(1);
        (await _db.TruthPacsWashPropOwnerVals.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task NoSuppPointer_IsRejected()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        // wpov points at prop_id=999, no supp row.
        await SeedWpovAsync(wpovBatch, propId: 999, ownerId: 1);

        var result = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        result.RowsPromoted.Should().Be(0);
        result.RejectedNoSuppPointer.Should().Be(1);
    }

    [Fact]
    public async Task AggregateGate_ReportsAssessedAndMarketSums_AfterSuppFilter()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        // 100 has supp; 200 doesn't (rejected).
        await SeedWpovAsync(wpovBatch, propId: 100, ownerId: 1, assessed: 250_000m, market: 300_000m);
        await SeedWpovAsync(wpovBatch, propId: 200, ownerId: 2, assessed: 999_999m, market: 999_999m);

        var result = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        result.AssessedValSum.Should().Be(250_000m,
            "rejected rows do not contribute to the truth-layer aggregate");
        result.MarketValSum.Should().Be(300_000m);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-wpov-aggregate");
        gate.Detail.Should().Contain("assessedValSum=250000");
        gate.Detail.Should().Contain("marketValSum=300000");
    }

    [Theory]
    [InlineData("FAILED", "COMPLETED")]
    [InlineData("COMPLETED", "FAILED")]
    [InlineData("FAILED", "FAILED")]
    public async Task AnyBatchNotCompleted_RefusesPromotion(string wpovStatus, string suppStatus)
    {
        var wpovBatch = await SeedBatchAsync("wpov", wpovStatus);
        var suppBatch = await SeedBatchAsync("supp", suppStatus);

        var result = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        result.Status.Should().Be("REFUSED");
        (await _db.TruthPacsWashPropOwnerVals.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task UnknownBatchIds_RefusesPromotion()
    {
        var result = await BuildPromoter()
            .PromoteAsync(Guid.NewGuid(), Guid.NewGuid(), "test-op");

        result.Status.Should().Be("REFUSED");
        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-wpov-source-batches-completed"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        gate.Status.Should().Be("FAIL");
        gate.Detail.Should().Contain("MISSING");
    }

    [Fact]
    public async Task RePromote_ReplacesPriorTruthRows_Idempotently()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedWpovAsync(wpovBatch, propId: 100, ownerId: 1);

        var first = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");
        var second = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        first.RowsPromoted.Should().Be(1);
        first.PriorRowsRemoved.Should().Be(0);
        second.RowsPromoted.Should().Be(1);
        second.PriorRowsRemoved.Should().Be(1);

        (await _db.TruthPacsWashPropOwnerVals.CountAsync()).Should().Be(1,
            "re-promoting the same wpov batch produces no duplicates");
    }

    [Fact]
    public async Task AllFourGates_AreRecorded_OnSuccess()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedWpovAsync(wpovBatch, propId: 100, ownerId: 1);

        var result = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "truth-pacs-wpov-source-batches-completed",
            "truth-pacs-wpov-supp-aware-join",
            "truth-pacs-wpov-promotion-coverage",
            "truth-pacs-wpov-aggregate",
        });
    }

    [Fact]
    public async Task SuppRejectsOnly_GateIsWarn_NotFail()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedWpovAsync(wpovBatch, propId: 100, ownerId: 1);
        await SeedWpovAsync(wpovBatch, propId: 999, ownerId: 2); // no supp

        var result = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        result.RowsPromoted.Should().Be(1);
        result.RejectedNoSuppPointer.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-wpov-supp-aware-join"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        gate.Status.Should().Be("WARN");
        gate.Detail.Should().Contain("noSuppPointer=1");
    }

    [Fact]
    public async Task EmptyWpovBatch_StillCompletes_WithCleanGates()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");

        var result = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.RowsConsidered.Should().Be(0);
        result.RowsPromoted.Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        // G4 (v1.13): the new pre-conversion-share gate brings the
        // wpov lane's gate count to 5.
        gates.Should().HaveCount(5);
        gates.Should().OnlyContain(g => g.Status != "FAIL");
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInB2B()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedWpovAsync(wpovBatch, propId: 100, ownerId: 1);

        await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        // canonical_tf must remain untouched.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.TfOwners.CountAsync()).Should().Be(0);
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task NullValues_AreExcluded_FromAggregateSums()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedSuppAsync(suppBatch, propId: 200, year: 2026, sup: 0);

        await SeedWpovAsync(wpovBatch, propId: 100, ownerId: 1, assessed: 100_000m, market: null);
        await SeedWpovAsync(wpovBatch, propId: 200, ownerId: 2, assessed: null, market: 200_000m);

        var result = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        result.RowsPromoted.Should().Be(2);
        result.AssessedValSum.Should().Be(100_000m, "NULL excluded");
        result.MarketValSum.Should().Be(200_000m, "NULL excluded");
    }

    [Fact]
    public async Task ValueColumns_RoundTripVerbatim_ThroughTruthLayer()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);

        _db.LegacyPacsRawWashPropOwnerVals.Add(new LegacyPacsRawWashPropOwnerVal
        {
            PropValYr = 2026, SupNum = 0, PropId = 100, OwnerId = 1,
            AssessedVal = 250_000m, MarketVal = 300_000m, AppraisedVal = 260_000m,
            TaxableClassified = 200_000m, TaxableNonClassified = 50_000m,
            LandTaxableClassified = 80_000m, LandTaxableNonClassified = 20_000m,
            ImprvTaxableClassified = 120_000m, ImprvTaxableNonClassified = 30_000m,
            StateValueClassified = 150_000m, StateValueNonClassified = 0m,
            BoeStatus = "F",
            DisasterProrationPct = 50.5m,
            SnrFrzImprvHs = 100_000m, SnrFrzLandHs = 25_000m,
            LoadBatchId = wpovBatch,
            SourceQueryHash = "qh",
            SourceRowHash = "rowhash",
        });
        await _db.SaveChangesAsync();

        await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        var truth = await _db.TruthPacsWashPropOwnerVals.SingleAsync();
        truth.AssessedVal.Should().Be(250_000m);
        truth.AppraisedVal.Should().Be(260_000m);
        truth.TaxableClassified.Should().Be(200_000m);
        truth.TaxableNonClassified.Should().Be(50_000m);
        truth.LandTaxableClassified.Should().Be(80_000m);
        truth.ImprvTaxableClassified.Should().Be(120_000m);
        truth.StateValueClassified.Should().Be(150_000m);
        truth.BoeStatus.Should().Be("F");
        truth.DisasterProrationPct.Should().Be(50.5m);
        truth.SnrFrzImprvHs.Should().Be(100_000m);
        truth.SnrFrzLandHs.Should().Be(25_000m);
    }

    [Fact]
    public async Task PreConversionShareGate_Trips_WARN_OnPreConversionHeavyBatch()
    {
        // G4 (v1.13): one pre + one post = 50% > 5% ⇒ WARN.
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2010, sup: 0);
        await SeedSuppAsync(suppBatch, propId: 200, year: 2026, sup: 0);
        await SeedWpovAsync(wpovBatch, propId: 100, ownerId: 1, year: 2010);
        await SeedWpovAsync(wpovBatch, propId: 200, ownerId: 2, year: 2026);

        var result = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.LoadBatchId == result.PromotionLoadBatchId
                           && g.GateName == ConversionEraGate.GateNameFor(
                                  ConversionEraGate.Lanes.Wpov));
        gate.Status.Should().Be("WARN");
        gate.GateStage.Should().Be("RAW_TO_TRUTH");
        gate.Detail.Should().Contain("preConversion=1");
        gate.Detail.Should().Contain("total=2");
    }

    [Fact]
    public async Task PreConversionShareGate_Stays_PASS_OnAllPostConversionBatch()
    {
        var wpovBatch = await SeedBatchAsync("wpov");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedWpovAsync(wpovBatch, propId: 100, ownerId: 1);

        var result = await BuildPromoter().PromoteAsync(wpovBatch, suppBatch, "test-op");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.LoadBatchId == result.PromotionLoadBatchId
                           && g.GateName == ConversionEraGate.GateNameFor(
                                  ConversionEraGate.Lanes.Wpov));
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("preConversion=0");
    }
}
