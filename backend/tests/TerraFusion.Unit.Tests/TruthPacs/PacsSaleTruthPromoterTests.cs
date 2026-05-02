using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsSaleTruth;
using TerraFusion.Data;
using TerraFusion.Data.Services.TruthPacs;
using Xunit;

namespace TerraFusion.Unit.Tests.TruthPacs;

/// <summary>
/// Slice S2-B acceptance tests. Proves the five T-* gates and the
/// doctrine invariants:
///  - both source batches must be COMPLETED or promotion REFUSED
///  - only sl_county_ratio_cd='100' rows promote
///  - sale.sup_num must match prop_supp_assoc.sup_num for the
///    (PropId, PropValYr) (supp-aware-join enforcement)
///  - missing supp pointer rejects the sale
///  - stale '01'/'02' codes are rejected at the truth layer too
///    (defense-in-depth over S1)
///  - re-promoting the same sale batch is idempotent
///  - every promoted row carries full lineage to both source batches
///  - failed promotion preserves prior truth-pacs state when possible
/// </summary>
public sealed class PacsSaleTruthPromoterTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsSaleTruthPromoterTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"s2b-{Guid.NewGuid():N}")
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

    private PacsSaleTruthPromoter BuildPromoter()
        => new(_db, NullLogger<PacsSaleTruthPromoter>.Instance);

    /// <summary>Helper: seed a COMPLETED LoadBatch and return its id.</summary>
    private async Task<Guid> SeedCompletedBatchAsync(string label)
    {
        var b = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "JCHARRISPACS",
            SourceFileOrDatabase = label,
            SourceQueryHash = "abc123",
            Operator = "test",
            Status = "COMPLETED",
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-1),
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
    }

    private async Task<Guid> SeedFailedBatchAsync(string label)
    {
        var b = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "JCHARRISPACS",
            SourceFileOrDatabase = label,
            SourceQueryHash = "abc123",
            Operator = "test",
            Status = "FAILED",
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-1),
            ErrorSummary = "simulated",
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
    }

    private async Task SeedSaleAsync(
        Guid saleBatchId,
        long chgOfOwnerId,
        int propId, short year, short sup,
        string? code = "100",
        DateTime? saleDt = null)
    {
        _db.LegacyPacsRawSales.Add(new LegacyPacsRawSale
        {
            ChgOfOwnerId = chgOfOwnerId,
            PropId = propId,
            PropValYr = year,
            SupNum = sup,
            SlCountyRatioCd = code,
            WacCd = null,
            SlRatioTypeCd = null,
            SlDt = saleDt,
            SlPrice = 350_000m,
            AdjSlPrice = 350_000m,
            LoadBatchId = saleBatchId,
            SourceQueryHash = "qhash",
            SourceRowHash = $"row-{chgOfOwnerId}",
        });
        await _db.SaveChangesAsync();
    }

    private async Task SeedSuppAsync(
        Guid suppBatchId, int propId, short year, short sup)
    {
        _db.LegacyPacsRawPropSuppAssocs.Add(new LegacyPacsRawPropSuppAssoc
        {
            PropValYr = year,
            PropId = propId,
            SupNum = sup,
            LoadBatchId = suppBatchId,
            SourceQueryHash = "qhash",
            SourceRowHash = $"supp-{propId}-{year}",
        });
        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task HappyPath_PromotesQualifiedSales_WithFullLineage()
    {
        var saleBatch = await SeedCompletedBatchAsync("sale-batch");
        var suppBatch = await SeedCompletedBatchAsync("supp-batch");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedSuppAsync(suppBatch, propId: 200, year: 2026, sup: 0);

        await SeedSaleAsync(saleBatch, chgOfOwnerId: 1, propId: 100, year: 2026, sup: 0, code: "100");
        await SeedSaleAsync(saleBatch, chgOfOwnerId: 2, propId: 200, year: 2026, sup: 0, code: "100");
        await SeedSaleAsync(saleBatch, chgOfOwnerId: 3, propId: 100, year: 2026, sup: 0, code: "200"); // not qualified

        var result = await BuildPromoter()
            .PromoteAsync(saleBatch, suppBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.SalesConsidered.Should().Be(3);
        result.SalesPromoted.Should().Be(2);
        result.RejectedNotQualified.Should().Be(1);
        result.RejectedNoSuppPointer.Should().Be(0);
        result.RejectedStaleSupNum.Should().Be(0);
        result.RejectedStaleAxis.Should().Be(0);

        var truth = await _db.TruthPacsSales.ToListAsync();
        truth.Should().HaveCount(2);
        truth.Should().OnlyContain(t => t.SlCountyRatioCd == "100");
        truth.Should().OnlyContain(t => t.SaleLoadBatchId == saleBatch);
        truth.Should().OnlyContain(t => t.SuppAssocLoadBatchId == suppBatch);
        truth.Should().OnlyContain(t => t.SourceSaleLandedRowId != Guid.Empty);
        truth.Should().OnlyContain(t => t.SourceSuppAssocLandedRowId != Guid.Empty);
        truth.Should().OnlyContain(t => t.PromotionLoadBatchId == result.PromotionLoadBatchId);
    }

    [Fact]
    public async Task SaleWithStaleSupNum_IsRejected()
    {
        var saleBatch = await SeedCompletedBatchAsync("sale-batch");
        var suppBatch = await SeedCompletedBatchAsync("supp-batch");

        // Active sup is 1; sale points at sup 0 → stale.
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 1);
        await SeedSaleAsync(saleBatch, chgOfOwnerId: 1, propId: 100, year: 2026, sup: 0, code: "100");

        var result = await BuildPromoter().PromoteAsync(saleBatch, suppBatch, "test-op");

        result.SalesPromoted.Should().Be(0);
        result.RejectedStaleSupNum.Should().Be(1);

        (await _db.TruthPacsSales.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SaleWithoutSuppPointer_IsRejected()
    {
        var saleBatch = await SeedCompletedBatchAsync("sale-batch");
        var suppBatch = await SeedCompletedBatchAsync("supp-batch");

        // No supp row for (200, 2026).
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedSaleAsync(saleBatch, chgOfOwnerId: 1, propId: 200, year: 2026, sup: 0, code: "100");

        var result = await BuildPromoter().PromoteAsync(saleBatch, suppBatch, "test-op");

        result.SalesPromoted.Should().Be(0);
        result.RejectedNoSuppPointer.Should().Be(1);
    }

    [Fact]
    public async Task StaleAxisCode_IsRejected_AtTruthLayer_DefenseInDepth()
    {
        var saleBatch = await SeedCompletedBatchAsync("sale-batch");
        var suppBatch = await SeedCompletedBatchAsync("supp-batch");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);

        // The S1 gate would have failed this batch; we still defend
        // in depth at the truth layer. A '01' code never reaches truth.
        await SeedSaleAsync(saleBatch, chgOfOwnerId: 1, propId: 100, year: 2026, sup: 0, code: "01");

        var result = await BuildPromoter().PromoteAsync(saleBatch, suppBatch, "test-op");

        result.SalesPromoted.Should().Be(0);
        result.RejectedStaleAxis.Should().Be(1);

        var staleGate = await _db.SyncBridgePromotionGateResults
            .FirstAsync(g => g.GateName == "truth-pacs-stale-axis-rejected"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        staleGate.Status.Should().Be("FAIL");
        staleGate.Actual.Should().Be("1");
    }

    [Fact]
    public async Task FailedSaleBatch_RefusesPromotion()
    {
        var saleBatch = await SeedFailedBatchAsync("sale-batch");
        var suppBatch = await SeedCompletedBatchAsync("supp-batch");

        var result = await BuildPromoter().PromoteAsync(saleBatch, suppBatch, "test-op");

        result.Status.Should().Be("REFUSED");
        result.ErrorSummary.Should().Contain("FAILED");

        (await _db.TruthPacsSales.CountAsync()).Should().Be(0);

        var srcGate = await _db.SyncBridgePromotionGateResults
            .FirstAsync(g => g.GateName == "truth-pacs-source-batch-completed"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        srcGate.Status.Should().Be("FAIL");
    }

    [Fact]
    public async Task UnknownBatchIds_RefusesPromotion()
    {
        var result = await BuildPromoter()
            .PromoteAsync(Guid.NewGuid(), Guid.NewGuid(), "test-op");

        result.Status.Should().Be("REFUSED");

        var srcGate = await _db.SyncBridgePromotionGateResults
            .FirstAsync(g => g.GateName == "truth-pacs-source-batch-completed"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        srcGate.Status.Should().Be("FAIL");
        srcGate.Detail.Should().Contain("MISSING");
    }

    [Fact]
    public async Task RePromote_Replaces_PriorTruthRows_Idempotently()
    {
        var saleBatch = await SeedCompletedBatchAsync("sale-batch");
        var suppBatch = await SeedCompletedBatchAsync("supp-batch");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedSaleAsync(saleBatch, chgOfOwnerId: 1, propId: 100, year: 2026, sup: 0, code: "100");

        var first = await BuildPromoter().PromoteAsync(saleBatch, suppBatch, "test-op");
        var second = await BuildPromoter().PromoteAsync(saleBatch, suppBatch, "test-op");

        first.SalesPromoted.Should().Be(1);
        first.PriorRowsRemoved.Should().Be(0);
        second.SalesPromoted.Should().Be(1);
        second.PriorRowsRemoved.Should().Be(1, "the first promotion's row is wiped before the second writes");

        (await _db.TruthPacsSales.CountAsync()).Should().Be(1,
            "re-promoting the same sale batch produces no duplicates");
    }

    [Fact]
    public async Task AllFiveGates_AreRecorded_OnSuccess()
    {
        var saleBatch = await SeedCompletedBatchAsync("sale-batch");
        var suppBatch = await SeedCompletedBatchAsync("supp-batch");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedSaleAsync(saleBatch, chgOfOwnerId: 1, propId: 100, year: 2026, sup: 0, code: "100");

        var result = await BuildPromoter().PromoteAsync(saleBatch, suppBatch, "test-op");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "truth-pacs-source-batch-completed",
            "truth-pacs-qualification-filter",
            "truth-pacs-supp-aware-join",
            "truth-pacs-stale-axis-rejected",
            "truth-pacs-promotion-coverage",
        });
        gates.Where(g => g.GateName == "truth-pacs-source-batch-completed")
            .Single().Status.Should().Be("PASS");
        gates.Where(g => g.GateName == "truth-pacs-promotion-coverage")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task SuppJoinGate_IsWarn_WhenSomeOrphans()
    {
        var saleBatch = await SeedCompletedBatchAsync("sale-batch");
        var suppBatch = await SeedCompletedBatchAsync("supp-batch");

        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        // sale 1 is fine
        await SeedSaleAsync(saleBatch, chgOfOwnerId: 1, propId: 100, year: 2026, sup: 0, code: "100");
        // sale 2 has no supp pointer
        await SeedSaleAsync(saleBatch, chgOfOwnerId: 2, propId: 999, year: 2026, sup: 0, code: "100");

        var result = await BuildPromoter().PromoteAsync(saleBatch, suppBatch, "test-op");

        result.SalesPromoted.Should().Be(1);
        result.RejectedNoSuppPointer.Should().Be(1);

        var joinGate = await _db.SyncBridgePromotionGateResults
            .FirstAsync(g => g.GateName == "truth-pacs-supp-aware-join"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        joinGate.Status.Should().Be("WARN");
        joinGate.Detail.Should().Contain("noSuppPointer=1");
    }

    [Fact]
    public async Task NoSalesInBatch_StillCompletes_WithCleanGates()
    {
        var saleBatch = await SeedCompletedBatchAsync("sale-batch");
        var suppBatch = await SeedCompletedBatchAsync("supp-batch");

        var result = await BuildPromoter().PromoteAsync(saleBatch, suppBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.SalesConsidered.Should().Be(0);
        result.SalesPromoted.Should().Be(0);

        (await _db.TruthPacsSales.CountAsync()).Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(5);
        gates.Where(g => g.GateName == "truth-pacs-stale-axis-rejected")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInS2B()
    {
        var saleBatch = await SeedCompletedBatchAsync("sale-batch");
        var suppBatch = await SeedCompletedBatchAsync("supp-batch");
        await SeedSuppAsync(suppBatch, propId: 100, year: 2026, sup: 0);
        await SeedSaleAsync(saleBatch, chgOfOwnerId: 1, propId: 100, year: 2026, sup: 0, code: "100");

        await BuildPromoter().PromoteAsync(saleBatch, suppBatch, "test-op");

        // canonical_tf must remain untouched.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.TfParcelGeoms.CountAsync()).Should().Be(0);
        // sync_bridge.source_xref also untouched (canonical lineage is S3).
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }
}
