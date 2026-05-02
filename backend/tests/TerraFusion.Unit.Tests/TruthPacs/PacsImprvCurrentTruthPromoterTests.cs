using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsImprvTruth;
using TerraFusion.Data;
using TerraFusion.Data.Services.TruthPacs;
using Xunit;

namespace TerraFusion.Unit.Tests.TruthPacs;

/// <summary>
/// Slice C2 acceptance tests. Mirrors the B2-B pattern (two source
/// batches, supp-aware filter). Proves the four T-* gates and the
/// doctrine invariants for improvement parent-row truth promotion.
/// </summary>
public sealed class PacsImprvCurrentTruthPromoterTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsImprvCurrentTruthPromoterTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"c2-{Guid.NewGuid():N}")
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

    private PacsImprvCurrentTruthPromoter BuildPromoter()
        => new(_db, NullLogger<PacsImprvCurrentTruthPromoter>.Instance);

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

    private async Task SeedImprvAsync(
        Guid imprvBatch, int propId, long imprvId,
        string? typeCd = "R",
        decimal? val = 250_000m,
        short year = 2026, short sup = 0)
    {
        _db.LegacyPacsRawImprvs.Add(new LegacyPacsRawImprv
        {
            PropValYr = year, SupNum = sup,
            PropId = propId, ImprvId = imprvId,
            ImprvTypeCd = typeCd,
            ImprvStateCd = "WA",
            ImprvClassCd = "B",
            ImprvHomesite = "Y",
            ImprvVal = val,
            ImprvDesc = $"Imprv {imprvId}",
            YearBuilt = 1990,
            EffectiveYearBuilt = 1990,
            ActualYearBuilt = 1990,
            LoadBatchId = imprvBatch,
            SourceQueryHash = "qh",
            SourceRowHash = $"imprv-{propId}-{imprvId}",
        });
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task HappyPath_PromotesValidImprvs_WithFullLineage()
    {
        var imprvBatch = await SeedBatchAsync("imprv");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedSuppAsync(suppBatch, propId: 200, year: 2026, sup: 0);
        await SeedImprvAsync(imprvBatch, propId: 100, imprvId: 1, val: 250_000m);
        await SeedImprvAsync(imprvBatch, propId: 100, imprvId: 2, val: 30_000m);
        await SeedImprvAsync(imprvBatch, propId: 200, imprvId: 1, val: 425_000m);

        var result = await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        result.Status.Should().Be("COMPLETED");
        result.ImprvsConsidered.Should().Be(3);
        result.ImprvsPromoted.Should().Be(3);
        result.ImprvValSum.Should().Be(705_000m);

        var truth = await _db.TruthPacsImprvCurrents.ToListAsync();
        truth.Should().HaveCount(3);
        truth.Should().OnlyContain(t => t.ImprvLoadBatchId == imprvBatch);
        truth.Should().OnlyContain(t => t.SuppAssocLoadBatchId == suppBatch);
        truth.Should().OnlyContain(t => t.SourceImprvLandedRowId != Guid.Empty);
        truth.Should().OnlyContain(t => t.SourceSuppAssocLandedRowId != Guid.Empty);
    }

    [Fact]
    public async Task StaleSupNum_IsRejected()
    {
        var imprvBatch = await SeedBatchAsync("imprv");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 1);
        await SeedImprvAsync(imprvBatch, propId: 100, imprvId: 1, sup: 0);

        var result = await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        result.ImprvsPromoted.Should().Be(0);
        result.RejectedStaleSupNum.Should().Be(1);
        (await _db.TruthPacsImprvCurrents.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task NoSuppPointer_IsRejected()
    {
        var imprvBatch = await SeedBatchAsync("imprv");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        // imprv points at prop_id=999, no supp.
        await SeedImprvAsync(imprvBatch, propId: 999, imprvId: 1);

        var result = await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        result.ImprvsPromoted.Should().Be(0);
        result.RejectedNoSuppPointer.Should().Be(1);
    }

    [Fact]
    public async Task AggregateGate_ReportsImprvValSum_AfterSuppFilter()
    {
        var imprvBatch = await SeedBatchAsync("imprv");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedImprvAsync(imprvBatch, propId: 100, imprvId: 1, val: 250_000m);
        // Rejected (no supp for 999) — does NOT contribute to truth aggregate.
        await SeedImprvAsync(imprvBatch, propId: 999, imprvId: 1, val: 999_999m);

        var result = await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        result.ImprvValSum.Should().Be(250_000m,
            "rejected rows do not contribute to the truth-layer aggregate");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-imprv-aggregate");
        gate.Detail.Should().Contain("imprvValSum=250000");
    }

    [Theory]
    [InlineData("FAILED", "COMPLETED")]
    [InlineData("COMPLETED", "FAILED")]
    [InlineData("FAILED", "FAILED")]
    public async Task AnyBatchNotCompleted_RefusesPromotion(string imprvStatus, string suppStatus)
    {
        var imprvBatch = await SeedBatchAsync("imprv", imprvStatus);
        var suppBatch = await SeedBatchAsync("supp", suppStatus);

        var result = await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        result.Status.Should().Be("REFUSED");
        (await _db.TruthPacsImprvCurrents.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task UnknownBatchIds_RefusesPromotion()
    {
        var result = await BuildPromoter()
            .PromoteAsync(Guid.NewGuid(), Guid.NewGuid(), "c2-test");

        result.Status.Should().Be("REFUSED");
        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-imprv-source-batches-completed"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        gate.Status.Should().Be("FAIL");
        gate.Detail.Should().Contain("MISSING");
    }

    [Fact]
    public async Task RePromote_ReplacesPriorTruthRows_Idempotently()
    {
        var imprvBatch = await SeedBatchAsync("imprv");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedImprvAsync(imprvBatch, propId: 100, imprvId: 1);

        var first = await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");
        var second = await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        first.ImprvsPromoted.Should().Be(1);
        first.PriorRowsRemoved.Should().Be(0);
        second.ImprvsPromoted.Should().Be(1);
        second.PriorRowsRemoved.Should().Be(1);

        (await _db.TruthPacsImprvCurrents.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task AllFourGates_AreRecorded_OnSuccess()
    {
        var imprvBatch = await SeedBatchAsync("imprv");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedImprvAsync(imprvBatch, propId: 100, imprvId: 1);

        var result = await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "truth-pacs-imprv-source-batches-completed",
            "truth-pacs-imprv-supp-aware-join",
            "truth-pacs-imprv-promotion-coverage",
            "truth-pacs-imprv-aggregate",
        });
    }

    [Fact]
    public async Task SuppRejectsOnly_GateIsWarn_NotFail()
    {
        var imprvBatch = await SeedBatchAsync("imprv");
        var suppBatch = await SeedBatchAsync("supp");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedImprvAsync(imprvBatch, propId: 100, imprvId: 1);
        await SeedImprvAsync(imprvBatch, propId: 999, imprvId: 1); // no supp

        var result = await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        result.ImprvsPromoted.Should().Be(1);
        result.RejectedNoSuppPointer.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "truth-pacs-imprv-supp-aware-join"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        gate.Status.Should().Be("WARN");
        gate.Detail.Should().Contain("noSuppPointer=1");
    }

    [Fact]
    public async Task EmptyImprvBatch_StillCompletes_WithCleanGates()
    {
        var imprvBatch = await SeedBatchAsync("imprv");
        var suppBatch = await SeedBatchAsync("supp");

        var result = await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        result.Status.Should().Be("COMPLETED");
        result.ImprvsConsidered.Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(4);
        gates.Should().OnlyContain(g => g.Status != "FAIL");
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInC2()
    {
        var imprvBatch = await SeedBatchAsync("imprv");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedImprvAsync(imprvBatch, propId: 100, imprvId: 1);

        await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        // canonical_tf must remain untouched.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task NullImprvVal_ExcludedFromAggregate()
    {
        var imprvBatch = await SeedBatchAsync("imprv");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedSuppAsync(suppBatch, propId: 200, year: 2026, sup: 0);
        await SeedImprvAsync(imprvBatch, propId: 100, imprvId: 1, val: 100_000m);
        await SeedImprvAsync(imprvBatch, propId: 200, imprvId: 1, val: null);

        var result = await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        result.ImprvsPromoted.Should().Be(2);
        result.ImprvValSum.Should().Be(100_000m, "NULL excluded");
    }

    [Fact]
    public async Task ValueShape_RoundTripsThroughTruthLayer()
    {
        var imprvBatch = await SeedBatchAsync("imprv");
        var suppBatch = await SeedBatchAsync("supp");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);

        _db.LegacyPacsRawImprvs.Add(new LegacyPacsRawImprv
        {
            PropValYr = 2026, SupNum = 0, PropId = 100, ImprvId = 42,
            ImprvTypeCd = "R", ImprvStateCd = "WA", ImprvClassCd = "B-PLUS",
            ImprvHomesite = "Y",
            ImprvVal = 525_500m,
            ImprvDesc = "Renovated 1990 residence",
            YearBuilt = 1990, EffectiveYearBuilt = 2010, ActualYearBuilt = 1990,
            LoadBatchId = imprvBatch,
            SourceQueryHash = "qh",
            SourceRowHash = "row",
        });
        await _db.SaveChangesAsync();

        await BuildPromoter().PromoteAsync(imprvBatch, suppBatch, "c2-test");

        var truth = await _db.TruthPacsImprvCurrents.SingleAsync();
        truth.ImprvTypeCd.Should().Be("R");
        truth.ImprvClassCd.Should().Be("B-PLUS");
        truth.ImprvVal.Should().Be(525_500m);
        truth.ImprvDesc.Should().Be("Renovated 1990 residence");
        truth.YearBuilt.Should().Be(1990);
        truth.EffectiveYearBuilt.Should().Be(2010);
        truth.ActualYearBuilt.Should().Be(1990);
    }
}
