using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsLandCanonical;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice L3 acceptance tests. Proves the five C-* gates and the
/// doctrine invariants for the land canonical projector:
///  - truth-pacs source batch must be COMPLETED or projection REFUSED
///  - lands with parcel-xref project to canonical
///  - lands without (or with inactive) parcel-xref quarantine
///  - every tf_land has source_xref + non-empty CountyId
///  - SourceKeyJson contains all 4 PACS identity components
///    (prop_id, prop_val_yr, sup_num, land_seg_id)
///  - re-promoting the same truth batch is idempotent
///  - aggregate gate records SizeAcres + LandSegMarketVal sums
/// </summary>
public sealed class PacsLandCanonicalProjectorTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsLandCanonicalProjectorTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"l3-{Guid.NewGuid():N}")
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

    private PacsLandCanonicalProjector BuildProjector()
        => new(_db, NullLogger<PacsLandCanonicalProjector>.Instance);

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
            ErrorSummary = "simulated",
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-1),
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
    }

    private async Task<TruthPacsLandCurrent> SeedTruthLandAsync(
        Guid promotionBatchId,
        int propId, long landSegId,
        string? typeCd = "PRIMARY",
        string? useCd = "RES",
        string? homesite = "Y",
        decimal? acres = 1.5m,
        decimal? marketVal = 75_000m,
        decimal? agValue = null,
        short year = 2026, short sup = 0)
    {
        var t = new TruthPacsLandCurrent
        {
            PropValYr = year, SupNum = sup,
            PropId = propId, LandSegId = landSegId,
            LandSegTypeCd = typeCd,
            LandSegStateCd = "WA",
            LandSegClassCd = "R",
            LandSegUseCd = useCd,
            SoilCd = null,
            LandSegHomesite = homesite,
            SizeAcres = acres,
            SizeSquareFeet = acres.HasValue ? acres.Value * 43560m : null,
            LandSegMarketVal = marketVal,
            LandSegAgValue = agValue,
            LandSegAssessedVal = marketVal,
            LandSegEffAge = 0,
            SourceLandLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            LandLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = promotionBatchId,
        };
        _db.TruthPacsLandCurrents.Add(t);
        await _db.SaveChangesAsync();
        return t;
    }

    private async Task<(Guid TfParcelId, Guid CountyId)> SeedParcelWithXrefAsync(
        int propId, bool xrefIsActive = true)
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

        _db.SyncBridgeSourceXrefs.Add(new SourceXref
        {
            TfEntityType = "parcel",
            TfEntityId = parcel.TfParcelId,
            SourceSystem = "PACS_OLTP",
            SourceTable = "property_val",
            SourceKeyJson = JsonSerializer.Serialize(new { prop_id = propId }),
            SourceQueryHash = "qh",
            LoadBatchId = Guid.NewGuid(),
            IsActive = xrefIsActive,
        });
        await _db.SaveChangesAsync();
        return (parcel.TfParcelId, countyId);
    }

    // ─────────────────────────────────────────────────────────────────
    // Acceptance tests
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HappyPath_ProjectsToTfLand_AndWritesSourceXref()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (parcelId, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 1,
            acres: 2.5m, marketVal: 125_000m);

        var result = await BuildProjector().ProjectAsync(truthBatch, "l3-test");

        result.Status.Should().Be("COMPLETED");
        result.TruthRowsConsidered.Should().Be(1);
        result.LandsProjected.Should().Be(1);
        result.RowsQuarantined.Should().Be(0);
        result.SizeAcresProjected.Should().Be(2.5m);
        result.LandSegMarketValProjected.Should().Be(125_000m);

        var land = await _db.TfLands.SingleAsync();
        land.CountyId.Should().Be(countyId);
        land.TfParcelId.Should().Be(parcelId);
        land.LandSegTypeCd.Should().Be("PRIMARY");
        land.LandSegUseCd.Should().Be("RES");
        land.IsHomesite.Should().BeTrue();
        land.SizeAcres.Should().Be(2.5m);
        land.LandSegMarketVal.Should().Be(125_000m);

        var xref = await _db.SyncBridgeSourceXrefs
            .SingleAsync(x => x.TfEntityType == "land");
        xref.TfEntityId.Should().Be(land.TfLandId);
        using var doc = JsonDocument.Parse(xref.SourceKeyJson);
        doc.RootElement.GetProperty("prop_id").GetInt32().Should().Be(100);
        doc.RootElement.GetProperty("land_seg_id").GetInt64().Should().Be(1);
        doc.RootElement.GetProperty("prop_val_yr").GetInt32().Should().Be(2026);
        doc.RootElement.GetProperty("sup_num").GetInt32().Should().Be(0);
    }

    [Fact]
    public async Task MultipleLandSegments_PerParcel_ProjectIndependently()
    {
        // Realistic ag parcel: homesite + crop + pasture + timber.
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (parcelId, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 1,
            typeCd: "HOMESITE", useCd: "RES", homesite: "Y",
            acres: 1.0m, marketVal: 60_000m);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 2,
            typeCd: "CROP", useCd: "AG", homesite: "N",
            acres: 40.0m, marketVal: 200_000m, agValue: 12_000m);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 3,
            typeCd: "PASTURE", useCd: "AG", homesite: "N",
            acres: 80.0m, marketVal: 80_000m, agValue: 4_000m);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 4,
            typeCd: "TIMBER", useCd: "AG", homesite: "N",
            acres: 200.0m, marketVal: 300_000m, agValue: 15_000m);

        var result = await BuildProjector().ProjectAsync(truthBatch, "l3-test");

        result.LandsProjected.Should().Be(4);
        result.SizeAcresProjected.Should().Be(321.0m);
        result.LandSegMarketValProjected.Should().Be(640_000m);

        var lands = await _db.TfLands.ToListAsync();
        lands.Should().HaveCount(4);
        lands.Should().AllSatisfy(l =>
        {
            l.TfParcelId.Should().Be(parcelId);
            l.CountyId.Should().Be(countyId);
        });
        // Only one segment is the homesite.
        lands.Count(l => l.IsHomesite).Should().Be(1);
        lands.Single(l => l.IsHomesite).LandSegTypeCd.Should().Be("HOMESITE");
    }

    [Fact]
    public async Task NoParcelXref_QuarantinesWith_NoParcelXrefReason()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        // No parcel for prop 100.
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "l3-test");

        result.LandsProjected.Should().Be(0);
        result.RowsQuarantined.Should().Be(1);

        var quarantine = await _db.LegacyTfUnprovenLandCurrents.SingleAsync();
        quarantine.PropId.Should().Be(100);
        quarantine.LandSegId.Should().Be(1);
        quarantine.QuarantineReason.Should().Be(QuarantineReasons.NoParcelXref);

        // No canonical row.
        (await _db.TfLands.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task InactiveParcelXref_QuarantinesAsIfMissing()
    {
        // Per BuildParcelIndexAsync's IsActive filter, an inactive
        // parcel xref is treated as no xref at all.
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100, xrefIsActive: false);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "l3-test");

        result.LandsProjected.Should().Be(0);
        result.RowsQuarantined.Should().Be(1);

        var quarantine = await _db.LegacyTfUnprovenLandCurrents.SingleAsync();
        quarantine.QuarantineReason.Should().Be(QuarantineReasons.NoParcelXref);
    }

    [Fact]
    public async Task EveryProjectedLand_HasSourceXref_AndNonEmptyCountyId()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedParcelWithXrefAsync(propId: 200);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 1);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 2);
        await SeedTruthLandAsync(truthBatch, propId: 200, landSegId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "l3-test");

        result.LandsProjected.Should().Be(3);

        // Every canonical row has CountyId.
        var lands = await _db.TfLands.ToListAsync();
        lands.Should().AllSatisfy(l => l.CountyId.Should().NotBe(Guid.Empty));

        // Every canonical row has a source_xref entry of TfEntityType="land".
        var xrefIds = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == "land")
            .Select(x => x.TfEntityId)
            .ToListAsync();
        xrefIds.Should().HaveCount(3);
        xrefIds.Should().BeEquivalentTo(lands.Select(l => l.TfLandId));

        // Source-xref-coverage gate is PASS.
        var coverageGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-land-source-xref-coverage");
        coverageGate.Status.Should().Be("PASS");

        // County-isolation gate is PASS.
        var isolationGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-land-county-isolation");
        isolationGate.Status.Should().Be("PASS");
    }

    [Fact]
    public async Task RerunIsIdempotent_NoDuplicates()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 1,
            acres: 1.0m);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 2,
            acres: 2.0m);

        var run1 = await BuildProjector().ProjectAsync(truthBatch, "l3-run1");
        run1.LandsProjected.Should().Be(2);
        run1.PriorLandsRemoved.Should().Be(0);

        var run2 = await BuildProjector().ProjectAsync(truthBatch, "l3-run2");
        run2.LandsProjected.Should().Be(2);
        run2.PriorLandsRemoved.Should().Be(2,
            "second run cleans up the 2 lands from run 1 before re-inserting");

        // Final state: exactly two canonical rows + two source_xrefs,
        // no duplicates.
        (await _db.TfLands.CountAsync()).Should().Be(2);
        (await _db.SyncBridgeSourceXrefs
            .CountAsync(x => x.TfEntityType == "land")).Should().Be(2);
    }

    [Fact]
    public async Task QuarantineClearsOnRerun_NoDuplicates()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        // No parcel for prop 100 → land goes to quarantine.
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 1);

        var run1 = await BuildProjector().ProjectAsync(truthBatch, "l3-run1");
        run1.RowsQuarantined.Should().Be(1);
        run1.PriorQuarantineRowsRemoved.Should().Be(0);

        var run2 = await BuildProjector().ProjectAsync(truthBatch, "l3-run2");
        run2.RowsQuarantined.Should().Be(1);
        run2.PriorQuarantineRowsRemoved.Should().Be(1,
            "second run clears the 1 quarantine row from run 1");

        // Final state: exactly one quarantine row, no duplicates,
        // no canonical row.
        (await _db.LegacyTfUnprovenLandCurrents.CountAsync()).Should().Be(1);
        (await _db.TfLands.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task EmptyTruthBatch_StillCompletesWithCleanGates()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        // No truth rows for this batch.

        var result = await BuildProjector().ProjectAsync(truthBatch, "l3-test");

        result.Status.Should().Be("COMPLETED");
        result.TruthRowsConsidered.Should().Be(0);
        result.LandsProjected.Should().Be(0);
        result.RowsQuarantined.Should().Be(0);
        result.SizeAcresProjected.Should().Be(0m);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(5);
        gates.Should().OnlyContain(g => g.Status != "FAIL");
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "canonical-land-source-batch-completed",
            "canonical-land-parcel-xref-coverage",
            "canonical-land-source-xref-coverage",
            "canonical-land-county-isolation",
            "canonical-land-aggregate",
        });
    }

    [Fact]
    public async Task FailedTruthBatch_RefusesProjection()
    {
        var truthBatch = await SeedFailedBatchAsync("failed-truth");
        // Even with a parcel + truth row available, FAILED batch is
        // refused.
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "l3-test");

        result.Status.Should().Be("REFUSED");
        result.LandsProjected.Should().Be(0);
        result.RowsQuarantined.Should().Be(0);

        // No canonical or quarantine rows produced.
        (await _db.TfLands.CountAsync()).Should().Be(0);
        (await _db.LegacyTfUnprovenLandCurrents.CountAsync()).Should().Be(0);

        // The source-batch gate is FAIL.
        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.LoadBatchId == result.PromotionLoadBatchId
                              && g.GateName == "canonical-land-source-batch-completed");
        gate.Status.Should().Be("FAIL");
    }

    [Fact]
    public async Task AggregateGate_RecordsAcresAndMarketValSums()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 1,
            acres: 10.5m, marketVal: 50_000m);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 2,
            acres: 5.25m, marketVal: 25_000m);

        var result = await BuildProjector().ProjectAsync(truthBatch, "l3-test");

        result.SizeAcresProjected.Should().Be(15.75m);
        result.LandSegMarketValProjected.Should().Be(75_000m);

        var aggregate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-land-aggregate");
        aggregate.Status.Should().Be("PASS");
        aggregate.GateStage.Should().Be("TRUTH_TO_CANONICAL");
        aggregate.Detail.Should().Contain("sizeAcresSum=15.75");
        aggregate.Detail.Should().Contain("landSegMarketValSum=75000");
    }
}
