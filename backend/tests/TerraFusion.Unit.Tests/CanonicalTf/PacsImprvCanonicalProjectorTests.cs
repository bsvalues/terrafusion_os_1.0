using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsImprvCanonical;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice C3 acceptance tests. Proves the five C-* gates and the
/// doctrine invariants:
///  - truth-pacs source batch must be COMPLETED or projection REFUSED
///  - improvements with parcel-xref project to canonical
///  - improvements without parcel-xref quarantine
///  - features (imprv_detail rows) project as children of parents
///  - every tf_improvement has source_xref + non-empty CountyId
///  - SourceKeyJson contains all 4 PACS identity components
///  - re-promoting the same truth batch is idempotent
/// </summary>
public sealed class PacsImprvCanonicalProjectorTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsImprvCanonicalProjectorTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"c3-{Guid.NewGuid():N}")
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

    private PacsImprvCanonicalProjector BuildProjector()
        => new(_db, NullLogger<PacsImprvCanonicalProjector>.Instance);

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
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
    }

    private async Task<TruthPacsImprvCurrent> SeedTruthImprvAsync(
        Guid promotionBatchId,
        int propId, long imprvId,
        string? typeCd = "R",
        decimal? val = 250_000m,
        string? homesite = "Y",
        short year = 2026, short sup = 0)
    {
        var t = new TruthPacsImprvCurrent
        {
            PropValYr = year, SupNum = sup,
            PropId = propId, ImprvId = imprvId,
            ImprvTypeCd = typeCd,
            ImprvClassCd = "B",
            ImprvHomesite = homesite,
            ImprvVal = val,
            ImprvDesc = $"Imprv {imprvId}",
            YearBuilt = 1990,
            EffectiveYearBuilt = 1990,
            ActualYearBuilt = 1990,
            SourceImprvLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            ImprvLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = promotionBatchId,
        };
        _db.TruthPacsImprvCurrents.Add(t);
        await _db.SaveChangesAsync();
        return t;
    }

    private async Task SeedRawDetailAsync(
        int propId, long imprvId, long imprvDetId,
        string typeCd = "MA",
        decimal? area = 1500m,
        decimal? val = 100_000m,
        short year = 2026, short sup = 0)
    {
        _db.LegacyPacsRawImprvDetails.Add(new LegacyPacsRawImprvDetail
        {
            PropValYr = year, SupNum = sup,
            PropId = propId, ImprvId = imprvId, ImprvDetId = imprvDetId,
            ImprvDetTypeCd = typeCd,
            ImprvDetMethCd = "C",
            ImprvDetClassCd = "B",
            ImprvDetArea = area,
            ImprvDetVal = val,
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh",
            SourceRowHash = $"row-{imprvDetId}",
        });
        await _db.SaveChangesAsync();
    }

    private async Task<(Guid TfParcelId, Guid CountyId)> SeedParcelWithXrefAsync(int propId)
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
            IsActive = true,
        });
        await _db.SaveChangesAsync();
        return (parcel.TfParcelId, countyId);
    }

    [Fact]
    public async Task HappyPath_ProjectsToTfImprovement_WithFeatures()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (parcelId, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);
        // Realistic Benton residence: main + basement + garage + patio.
        await SeedRawDetailAsync(propId: 100, imprvId: 1, imprvDetId: 10, typeCd: "MA", area: 1800m, val: 250_000m);
        await SeedRawDetailAsync(propId: 100, imprvId: 1, imprvDetId: 11, typeCd: "BSMT", area: 900m, val: 60_000m);
        await SeedRawDetailAsync(propId: 100, imprvId: 1, imprvDetId: 12, typeCd: "ATTGAR", area: 480m, val: 35_000m);
        await SeedRawDetailAsync(propId: 100, imprvId: 1, imprvDetId: 13, typeCd: "COVPATIO", area: 200m, val: 8_000m);

        var result = await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        result.Status.Should().Be("COMPLETED");
        result.ImprovementsProjected.Should().Be(1);
        result.FeaturesProjected.Should().Be(4);
        result.RowsQuarantined.Should().Be(0);

        var imprv = await _db.TfImprovements.SingleAsync();
        imprv.CountyId.Should().Be(countyId);
        imprv.TfParcelId.Should().Be(parcelId);
        imprv.IsHomesite.Should().BeTrue();

        var features = await _db.TfImprovementFeatures.ToListAsync();
        features.Should().HaveCount(4);
        features.Should().OnlyContain(f => f.TfImprovementId == imprv.TfImprovementId);
        features.Select(f => f.FeatureCode).Should().BeEquivalentTo(new[]
        {
            "MA", "BSMT", "ATTGAR", "COVPATIO",
        });

        var xref = await _db.SyncBridgeSourceXrefs.SingleAsync(x => x.TfEntityType == "improvement");
        using var doc = JsonDocument.Parse(xref.SourceKeyJson);
        doc.RootElement.GetProperty("prop_id").GetInt32().Should().Be(100);
        doc.RootElement.GetProperty("imprv_id").GetInt64().Should().Be(1);
        doc.RootElement.GetProperty("prop_val_yr").GetInt32().Should().Be(2026);
        doc.RootElement.GetProperty("sup_num").GetInt32().Should().Be(0);
    }

    [Fact]
    public async Task NoParcelXref_QuarantinesWith_NoParcelXrefReason()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        // No parcel for prop 100.
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        result.ImprovementsProjected.Should().Be(0);
        result.RowsQuarantined.Should().Be(1);

        var quarantine = await _db.LegacyTfUnprovenImprvCurrents.SingleAsync();
        quarantine.PropId.Should().Be(100);
        quarantine.ImprvId.Should().Be(1);
        quarantine.QuarantineReason.Should().Be("NO_PARCEL_XREF");
    }

    [Fact]
    public async Task ImprovementWithoutDetailRows_StillProjects_NoFeatures()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);
        // No imprv_detail rows for this imprv.

        var result = await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        result.ImprovementsProjected.Should().Be(1);
        result.FeaturesProjected.Should().Be(0);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-imprv-feature-coverage");
        gate.Detail.Should().Contain("improvementsWithoutFeatures=1");
    }

    [Fact]
    public async Task DetailFromUnrelatedImprv_IsNotIncludedAsFeature()
    {
        // imprv 1 in truth batch; detail rows for imprv 2 (untruth) — must not bleed in.
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);
        await SeedRawDetailAsync(propId: 100, imprvId: 2, imprvDetId: 10, typeCd: "MA");

        var result = await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        result.ImprovementsProjected.Should().Be(1);
        result.FeaturesProjected.Should().Be(0);
    }

    [Fact]
    public async Task IsHomesiteFlag_DerivedFrom_YnString()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedParcelWithXrefAsync(propId: 200);
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1, homesite: "Y");
        await SeedTruthImprvAsync(truthBatch, propId: 200, imprvId: 1, homesite: "N");

        await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        var imprvs = await _db.TfImprovements.ToListAsync();
        imprvs.Should().HaveCount(2);
        imprvs.Single(i => i.IsHomesite == true).Should().NotBeNull();
        imprvs.Single(i => i.IsHomesite == false).Should().NotBeNull();
    }

    [Fact]
    public async Task EveryProjectedImprovement_HasSourceXref_AndCountyId()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedParcelWithXrefAsync(propId: 200);
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);
        await SeedTruthImprvAsync(truthBatch, propId: 200, imprvId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        var imprvs = await _db.TfImprovements.ToListAsync();
        imprvs.Should().OnlyContain(c => c.CountyId != Guid.Empty);

        foreach (var i in imprvs)
        {
            var xref = await _db.SyncBridgeSourceXrefs.FirstOrDefaultAsync(
                x => x.TfEntityType == "improvement" && x.TfEntityId == i.TfImprovementId);
            xref.Should().NotBeNull();
        }

        var xrefGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-imprv-source-xref-coverage"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        xrefGate.Status.Should().Be("PASS");

        var countyGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-imprv-county-isolation"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        countyGate.Status.Should().Be("PASS");
    }

    [Fact]
    public async Task FailedTruthBatch_RefusesProjection()
    {
        var truthBatch = await SeedFailedBatchAsync("truth");
        var result = await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        result.Status.Should().Be("REFUSED");
        (await _db.TfImprovements.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task UnknownTruthBatch_RefusesProjection()
    {
        var result = await BuildProjector().ProjectAsync(Guid.NewGuid(), "c3-test");

        result.Status.Should().Be("REFUSED");
        var srcGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-imprv-source-batch-completed"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        srcGate.Status.Should().Be("FAIL");
    }

    [Fact]
    public async Task RePromote_Replaces_PriorImprovementsAndFeatures_Idempotently()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);
        await SeedRawDetailAsync(propId: 100, imprvId: 1, imprvDetId: 10, typeCd: "MA");
        await SeedRawDetailAsync(propId: 100, imprvId: 1, imprvDetId: 11, typeCd: "BSMT");

        var first = await BuildProjector().ProjectAsync(truthBatch, "c3-test");
        var second = await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        first.ImprovementsProjected.Should().Be(1);
        first.FeaturesProjected.Should().Be(2);
        first.PriorImprovementsRemoved.Should().Be(0);
        second.ImprovementsProjected.Should().Be(1);
        second.FeaturesProjected.Should().Be(2);
        second.PriorImprovementsRemoved.Should().Be(1);
        second.PriorFeaturesRemoved.Should().Be(2);

        // No duplicates.
        (await _db.TfImprovements.CountAsync()).Should().Be(1);
        (await _db.TfImprovementFeatures.CountAsync()).Should().Be(2);
        (await _db.SyncBridgeSourceXrefs.CountAsync(x => x.TfEntityType == "improvement"))
            .Should().Be(1);
    }

    [Fact]
    public async Task RePromote_ClearsPriorQuarantineRows()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        // No parcel for prop 999.
        await SeedTruthImprvAsync(truthBatch, propId: 999, imprvId: 1);

        await BuildProjector().ProjectAsync(truthBatch, "c3-test");
        var second = await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        second.PriorQuarantineRowsRemoved.Should().Be(1);
        (await _db.LegacyTfUnprovenImprvCurrents.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task AllFiveCGates_AreRecorded_OnSuccess()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "canonical-imprv-source-batch-completed",
            "canonical-imprv-parcel-xref-coverage",
            "canonical-imprv-source-xref-coverage",
            "canonical-imprv-county-isolation",
            "canonical-imprv-feature-coverage",
        });
    }

    [Fact]
    public async Task EmptyTruthBatch_StillCompletesWithCleanGates()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");

        var result = await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        result.Status.Should().Be("COMPLETED");
        result.TruthRowsConsidered.Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(5);
        gates.Should().OnlyContain(g => g.Status != "FAIL");
    }

    [Fact]
    public async Task ParcelXrefCounty_DeterminesImprovementCounty()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (_, countyA) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);

        await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        var imprv = await _db.TfImprovements.SingleAsync();
        imprv.CountyId.Should().Be(countyA);
    }

    [Fact]
    public async Task DoctrineRejection_ScopeBounded_AtCanonicalLayer()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);

        await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        // C3 only writes improvement-domain canonical rows.
        (await _db.TfSales.CountAsync()).Should().Be(0);
        (await _db.TfOwners.CountAsync()).Should().Be(0);
        (await _db.TfAssessmentWsdors.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task FeatureRows_RoundTripFullShape_FromImprvDetail()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);

        _db.LegacyPacsRawImprvDetails.Add(new LegacyPacsRawImprvDetail
        {
            PropValYr = 2026, SupNum = 0, PropId = 100, ImprvId = 1, ImprvDetId = 99,
            ImprvDetTypeCd = "POOL",
            ImprvDetMethCd = "U",
            ImprvDetClassCd = "B",
            ImprvDetSubClassCd = "FBR-LINER",
            ConditionCd = "G",
            ImprvDetArea = 360m,
            ImprvDetVal = 18_000m,
            NumUnits = 1,
            YrBuilt = 1995,
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh",
            SourceRowHash = "row",
        });
        await _db.SaveChangesAsync();

        await BuildProjector().ProjectAsync(truthBatch, "c3-test");

        var feature = await _db.TfImprovementFeatures.SingleAsync();
        feature.FeatureCode.Should().Be("POOL");
        feature.MethodCd.Should().Be("U");
        feature.SubClassCd.Should().Be("FBR-LINER");
        feature.Area.Should().Be(360m);
        feature.Value.Should().Be(18_000m);
        feature.NumUnits.Should().Be(1);
        feature.YrBuilt.Should().Be(1995);
        feature.SourceImprvDetailLandedRowId.Should().NotBe(Guid.Empty);
    }
}
