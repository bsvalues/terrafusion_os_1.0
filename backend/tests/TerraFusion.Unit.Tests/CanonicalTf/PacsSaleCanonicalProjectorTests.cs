using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsSaleCanonical;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice S3 acceptance tests. Proves the four C-* gates and the
/// doctrine invariants:
///  - truth-pacs source batch must be COMPLETED or projection REFUSED
///  - sales whose parcel resolves via source_xref project into tf_sale
///  - sales whose parcel does NOT resolve are quarantined to
///    legacy_tf_unproven.sale (preserved, not discarded)
///  - every projected tf_sale has a source_xref entry whose
///    SourceKeyJson contains prop_id, prop_val_yr, sup_num, chg_of_owner_id
///  - every projected tf_sale carries the parcel's CountyId
///    (sovereign-county isolation)
///  - re-running the same truth batch is idempotent (no duplicate
///    tf_sale, no duplicate source_xref, no duplicate quarantine row)
/// </summary>
public sealed class PacsSaleCanonicalProjectorTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsSaleCanonicalProjectorTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"s3-{Guid.NewGuid():N}")
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

    private PacsSaleCanonicalProjector BuildProjector()
        => new(_db, NullLogger<PacsSaleCanonicalProjector>.Instance);

    private async Task<Guid> SeedCompletedBatchAsync(string label)
    {
        var b = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "JCHARRISPACS",
            SourceFileOrDatabase = label,
            SourceQueryHash = "abc",
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
            SourceQueryHash = "abc",
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

    private async Task<TruthPacsSale> SeedTruthSaleAsync(
        Guid promotionBatchId,
        long chg, int propId, short year = 2026, short sup = 0,
        decimal? price = 350_000m, DateTime? saleDt = null)
    {
        var t = new TruthPacsSale
        {
            ChgOfOwnerId = chg,
            PropId = propId,
            PropValYr = year,
            SupNum = sup,
            SlCountyRatioCd = "100",
            SlDt = saleDt ?? new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            SlPrice = price,
            AdjSlPrice = price,
            SourceSaleLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            SaleLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = promotionBatchId,
        };
        _db.TruthPacsSales.Add(t);
        await _db.SaveChangesAsync();
        return t;
    }

    private async Task<(Guid TfParcelId, Guid CountyId)> SeedParcelWithXrefAsync(
        int propId, short year = 2026, short sup = 0)
    {
        var countyId = Guid.NewGuid();
        var parcel = new TfParcel
        {
            CountyId = countyId,
            ParcelNumber = $"P{propId}",
            ParcelStatus = "ACTIVE",
            PropertyType = "R",
        };
        _db.TfParcels.Add(parcel);
        await _db.SaveChangesAsync();

        var xref = new SourceXref
        {
            TfEntityType = "parcel",
            TfEntityId = parcel.TfParcelId,
            SourceSystem = "PACS_OLTP",
            SourceTable = "property_val",
            SourceKeyJson = JsonSerializer.Serialize(new
            {
                prop_id = propId,
                prop_val_yr = year,
                sup_num = sup,
            }),
            SourceQueryHash = "qh",
            LoadBatchId = Guid.NewGuid(),
            IsActive = true,
        };
        _db.SyncBridgeSourceXrefs.Add(xref);
        await _db.SaveChangesAsync();
        return (parcel.TfParcelId, countyId);
    }

    [Fact]
    public async Task HappyPath_ProjectsToTfSale_AndWritesSourceXref()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        var (parcelId, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthSaleAsync(truthBatch, chg: 1, propId: 100);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.TruthSalesConsidered.Should().Be(1);
        result.SalesProjected.Should().Be(1);
        result.SalesQuarantined.Should().Be(0);

        var sale = await _db.TfSales.SingleAsync();
        sale.CountyId.Should().Be(countyId);
        sale.TfParcelId.Should().Be(parcelId);
        sale.ChgOfOwnerId.Should().Be(1);
        sale.SaleQualified.Should().BeTrue();
        sale.PromotionLoadBatchId.Should().Be(result.PromotionLoadBatchId);

        var xref = await _db.SyncBridgeSourceXrefs
            .SingleAsync(x => x.TfEntityType == "sale");
        xref.TfEntityId.Should().Be(sale.TfSaleId);
        xref.SourceSystem.Should().Be("PACS_OLTP");
        xref.SourceTable.Should().Be("sale");
        xref.SourceKeyJson.Should().Contain("prop_id");
        xref.SourceKeyJson.Should().Contain("prop_val_yr");
        xref.SourceKeyJson.Should().Contain("sup_num");
        xref.SourceKeyJson.Should().Contain("chg_of_owner_id");

        // Doctrine: the canonical row's lineage round-trips PACS identity.
        using var doc = JsonDocument.Parse(xref.SourceKeyJson);
        doc.RootElement.GetProperty("prop_id").GetInt32().Should().Be(100);
        doc.RootElement.GetProperty("chg_of_owner_id").GetInt64().Should().Be(1);
    }

    [Fact]
    public async Task SaleWithoutParcelXref_IsQuarantined_NotDiscarded()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        // No parcel + xref seeded for prop_id=999.
        await SeedTruthSaleAsync(truthBatch, chg: 1, propId: 999);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.SalesProjected.Should().Be(0);
        result.SalesQuarantined.Should().Be(1);
        (await _db.TfSales.CountAsync()).Should().Be(0);

        var quarantine = await _db.LegacyTfUnprovenSales.SingleAsync();
        quarantine.PropId.Should().Be(999);
        quarantine.QuarantineReason.Should().Be("NO_PARCEL_XREF");
        quarantine.PromotionLoadBatchId.Should().Be(result.PromotionLoadBatchId);
    }

    [Fact]
    public async Task MixedBatch_ProjectsResolvable_QuarantinesUnresolvable()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        // No parcel for prop_id=200.

        await SeedTruthSaleAsync(truthBatch, chg: 1, propId: 100);
        await SeedTruthSaleAsync(truthBatch, chg: 2, propId: 200);
        await SeedTruthSaleAsync(truthBatch, chg: 3, propId: 100);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.TruthSalesConsidered.Should().Be(3);
        result.SalesProjected.Should().Be(2);
        result.SalesQuarantined.Should().Be(1);

        (await _db.TfSales.CountAsync()).Should().Be(2);
        (await _db.LegacyTfUnprovenSales.CountAsync()).Should().Be(1);
        (await _db.SyncBridgeSourceXrefs.CountAsync(x => x.TfEntityType == "sale"))
            .Should().Be(2);
    }

    [Fact]
    public async Task EveryProjectedSale_HasSourceXref_AndCountyId()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedParcelWithXrefAsync(propId: 200);
        await SeedTruthSaleAsync(truthBatch, chg: 1, propId: 100);
        await SeedTruthSaleAsync(truthBatch, chg: 2, propId: 200);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var sales = await _db.TfSales.ToListAsync();
        sales.Should().HaveCount(2);
        sales.Should().OnlyContain(s => s.CountyId != Guid.Empty);

        foreach (var s in sales)
        {
            var xref = await _db.SyncBridgeSourceXrefs.FirstOrDefaultAsync(
                x => x.TfEntityType == "sale" && x.TfEntityId == s.TfSaleId);
            xref.Should().NotBeNull(
                $"every tf_sale must have a source_xref (failed: {s.TfSaleId})");
        }

        var xrefGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-source-xref-coverage"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        xrefGate.Status.Should().Be("PASS");

        var countyGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-county-isolation"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        countyGate.Status.Should().Be("PASS");
    }

    [Fact]
    public async Task FailedTruthBatch_RefusesProjection()
    {
        var truthBatch = await SeedFailedBatchAsync("truth-batch");

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.Status.Should().Be("REFUSED");
        result.ErrorSummary.Should().Contain("FAILED");

        (await _db.TfSales.CountAsync()).Should().Be(0);
        (await _db.LegacyTfUnprovenSales.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task UnknownTruthBatch_RefusesProjection()
    {
        var result = await BuildProjector()
            .ProjectAsync(Guid.NewGuid(), "test-op");

        result.Status.Should().Be("REFUSED");
        var srcGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-source-batch-completed"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        srcGate.Status.Should().Be("FAIL");
        srcGate.Detail.Should().Contain("MISSING");
    }

    [Fact]
    public async Task RePromote_Replaces_PriorCanonicalRows_Idempotently()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthSaleAsync(truthBatch, chg: 1, propId: 100);

        var first = await BuildProjector().ProjectAsync(truthBatch, "test-op");
        var second = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        first.SalesProjected.Should().Be(1);
        first.PriorCanonicalRowsRemoved.Should().Be(0);
        second.SalesProjected.Should().Be(1);
        second.PriorCanonicalRowsRemoved.Should().Be(1);

        // No duplicates in either canonical or source_xref.
        (await _db.TfSales.CountAsync()).Should().Be(1);
        (await _db.SyncBridgeSourceXrefs.CountAsync(x => x.TfEntityType == "sale"))
            .Should().Be(1);
    }

    [Fact]
    public async Task RePromote_Replaces_PriorQuarantineRows_Idempotently()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        // No parcel xref → both runs should produce the same quarantine row.
        await SeedTruthSaleAsync(truthBatch, chg: 1, propId: 999);

        await BuildProjector().ProjectAsync(truthBatch, "test-op");
        var second = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        second.SalesQuarantined.Should().Be(1);
        second.PriorQuarantineRowsRemoved.Should().Be(1);
        (await _db.LegacyTfUnprovenSales.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task AllFourCGates_AreRecorded_OnSuccess()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthSaleAsync(truthBatch, chg: 1, propId: 100);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "canonical-source-batch-completed",
            "canonical-parcel-xref-coverage",
            "canonical-source-xref-coverage",
            "canonical-county-isolation",
        });
        gates.Should().OnlyContain(g => g.GateStage == "TRUTH_TO_CANONICAL"
                                        || g.GateName == "canonical-source-batch-completed");
    }

    [Fact]
    public async Task EmptyTruthBatch_StillCompletes_WithCleanGates()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.TruthSalesConsidered.Should().Be(0);
        result.SalesProjected.Should().Be(0);
        result.SalesQuarantined.Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(4);
        gates.Where(g => g.GateName == "canonical-source-xref-coverage")
            .Single().Status.Should().Be("PASS");
        gates.Where(g => g.GateName == "canonical-county-isolation")
            .Single().Status.Should().Be("PASS");
    }

    [Fact]
    public async Task ParcelXrefCounty_DeterminesCanonicalCounty()
    {
        // Doctrine: the canonical_tf.tf_sale's CountyId comes from the
        // resolved parcel's CountyId, not from the truth-pacs row
        // (which has none).
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        var (_, countyA) = await SeedParcelWithXrefAsync(propId: 100);
        var (_, countyB) = await SeedParcelWithXrefAsync(propId: 200);
        await SeedTruthSaleAsync(truthBatch, chg: 1, propId: 100);
        await SeedTruthSaleAsync(truthBatch, chg: 2, propId: 200);

        await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var sales = await _db.TfSales.ToListAsync();
        sales.Should().Contain(s => s.ChgOfOwnerId == 1 && s.CountyId == countyA);
        sales.Should().Contain(s => s.ChgOfOwnerId == 2 && s.CountyId == countyB);
    }

    [Fact]
    public async Task InactiveParcelXref_IsTreatedAsAbsent()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        var (parcelId, _) = await SeedParcelWithXrefAsync(propId: 100);

        // Deactivate the xref — the doctrine treats this as "no
        // current lineage" so the sale must quarantine.
        var xref = await _db.SyncBridgeSourceXrefs
            .SingleAsync(x => x.TfEntityType == "parcel" && x.TfEntityId == parcelId);
        xref.IsActive = false;
        await _db.SaveChangesAsync();

        await SeedTruthSaleAsync(truthBatch, chg: 1, propId: 100);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.SalesProjected.Should().Be(0);
        result.SalesQuarantined.Should().Be(1);
    }
}
