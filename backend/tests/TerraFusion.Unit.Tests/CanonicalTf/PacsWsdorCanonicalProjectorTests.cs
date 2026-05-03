using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsWsdorCanonical;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice B4 acceptance tests. Proves the five C-* gates and the
/// doctrine invariants:
///  - truth-pacs source batch must be COMPLETED or projection REFUSED
///  - rows with both parcel + owner xref project to canonical
///  - rows missing parcel xref → quarantine ("NO_PARCEL_XREF")
///  - rows missing owner xref → quarantine ("NO_OWNER_XREF")
///  - rows missing both → quarantine ("BOTH_MISSING")
///  - every projected row has source_xref + non-empty CountyId
///  - SourceKeyJson contains all 4 PACS identity components
///  - re-promoting the same truth batch is idempotent
/// </summary>
public sealed class PacsWsdorCanonicalProjectorTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsWsdorCanonicalProjectorTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"b4-{Guid.NewGuid():N}")
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

    private PacsWsdorCanonicalProjector BuildProjector()
        => new(_db, NullLogger<PacsWsdorCanonicalProjector>.Instance);

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

    private async Task<TruthPacsWashPropOwnerVal> SeedTruthWpovAsync(
        Guid promotionBatchId,
        int propId, long ownerId,
        decimal? assessed = 250_000m, decimal? market = 300_000m,
        string? boe = "F",
        short year = 2026, short sup = 0)
    {
        var t = new TruthPacsWashPropOwnerVal
        {
            PropValYr = year, SupNum = sup,
            PropId = propId, OwnerId = ownerId,
            AssessedVal = assessed, MarketVal = market,
            AppraisedVal = assessed,
            TaxableClassified = assessed,
            BoeStatus = boe,
            SourceWpovLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            WpovLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = promotionBatchId,
            // G2 (v1.11): mirror promoter-stamped era.
            ConversionEra = ConversionEras.FromYear(year),
        };
        _db.TruthPacsWashPropOwnerVals.Add(t);
        await _db.SaveChangesAsync();
        return t;
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

    private async Task<Guid> SeedOwnerWithXrefAsync(Guid countyId, long acctId)
    {
        var owner = new TfOwner
        {
            CountyId = countyId,
            AcctId = acctId,
            DisplayName = $"Owner-{acctId}",
            PromotionLoadBatchId = Guid.NewGuid(),
        };
        _db.TfOwners.Add(owner);
        await _db.SaveChangesAsync();

        _db.SyncBridgeSourceXrefs.Add(new SourceXref
        {
            TfEntityType = "owner",
            TfEntityId = owner.TfOwnerId,
            SourceSystem = "PACS_OLTP",
            SourceTable = "account",
            SourceKeyJson = JsonSerializer.Serialize(new { acct_id = acctId }),
            SourceQueryHash = "qh",
            LoadBatchId = Guid.NewGuid(),
            IsActive = true,
        });
        await _db.SaveChangesAsync();
        return owner.TfOwnerId;
    }

    [Fact]
    public async Task HappyPath_ProjectsToTfAssessmentWsdor_WithLineage()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (parcelId, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        var ownerId = await SeedOwnerWithXrefAsync(countyId, acctId: 1);
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.RowsProjected.Should().Be(1);
        result.RowsQuarantined.Should().Be(0);

        var assessment = await _db.TfAssessmentWsdors.SingleAsync();
        assessment.CountyId.Should().Be(countyId);
        assessment.TfParcelId.Should().Be(parcelId);
        assessment.TfOwnerId.Should().Be(ownerId);
        assessment.AssessmentYear.Should().Be(2026);
        assessment.AssessedVal.Should().Be(250_000m);
        // G2 (v1.11): canonical era from majority-of-truth (single contributor, year=2026).
        assessment.ConversionEra.Should().Be(ConversionEras.PostConversion);

        var xref = await _db.SyncBridgeSourceXrefs
            .SingleAsync(x => x.TfEntityType == "assessment_wsdor");
        xref.TfEntityId.Should().Be(assessment.TfAssessmentWsdorId);
        using var doc = JsonDocument.Parse(xref.SourceKeyJson);
        doc.RootElement.GetProperty("year").GetInt32().Should().Be(2026);
        doc.RootElement.GetProperty("sup_num").GetInt32().Should().Be(0);
        doc.RootElement.GetProperty("prop_id").GetInt32().Should().Be(100);
        doc.RootElement.GetProperty("owner_id").GetInt64().Should().Be(1);
    }

    [Fact]
    public async Task NoParcelXref_QuarantinesWith_NoParcelXrefReason()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (_, countyId) = await SeedParcelWithXrefAsync(propId: 999); // different prop
        await SeedOwnerWithXrefAsync(countyId, acctId: 1);
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1); // prop 100 has no xref

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.RowsProjected.Should().Be(0);
        result.RejectedNoParcelXref.Should().Be(1);
        (await _db.TfAssessmentWsdors.CountAsync()).Should().Be(0);

        var quarantine = await _db.LegacyTfUnprovenWashPropOwnerVals.SingleAsync();
        quarantine.PropId.Should().Be(100);
        quarantine.QuarantineReason.Should().Be("NO_PARCEL_XREF");
    }

    [Fact]
    public async Task NoOwnerXref_QuarantinesWith_NoOwnerXrefReason()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedParcelWithXrefAsync(propId: 100);
        // Owner 1 has no xref.
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.RowsProjected.Should().Be(0);
        result.RejectedNoOwnerXref.Should().Be(1);

        var quarantine = await _db.LegacyTfUnprovenWashPropOwnerVals.SingleAsync();
        quarantine.QuarantineReason.Should().Be("NO_OWNER_XREF");
    }

    [Fact]
    public async Task NoParcel_NoOwner_QuarantinesWith_BothMissingReason()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.RejectedBothMissing.Should().Be(1);
        var quarantine = await _db.LegacyTfUnprovenWashPropOwnerVals.SingleAsync();
        quarantine.QuarantineReason.Should().Be("BOTH_MISSING");
    }

    [Fact]
    public async Task MixedFixture_ProjectsResolvable_QuarantinesUnresolvable()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (_, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedParcelWithXrefAsync(propId: 200);
        await SeedOwnerWithXrefAsync(countyId, acctId: 1);
        await SeedOwnerWithXrefAsync(countyId, acctId: 2);

        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1); // OK
        await SeedTruthWpovAsync(truthBatch, propId: 200, ownerId: 2); // OK
        await SeedTruthWpovAsync(truthBatch, propId: 999, ownerId: 1); // no parcel
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 999); // no owner

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.TruthRowsConsidered.Should().Be(4);
        result.RowsProjected.Should().Be(2);
        result.RowsQuarantined.Should().Be(2);
        result.RejectedNoParcelXref.Should().Be(1);
        result.RejectedNoOwnerXref.Should().Be(1);

        (await _db.TfAssessmentWsdors.CountAsync()).Should().Be(2);
        (await _db.LegacyTfUnprovenWashPropOwnerVals.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task EveryProjectedRow_HasSourceXref_AndCountyId()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (_, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedOwnerWithXrefAsync(countyId, acctId: 1);
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var rows = await _db.TfAssessmentWsdors.ToListAsync();
        rows.Should().OnlyContain(c => c.CountyId != Guid.Empty);

        foreach (var c in rows)
        {
            var xref = await _db.SyncBridgeSourceXrefs.FirstOrDefaultAsync(
                x => x.TfEntityType == "assessment_wsdor" && x.TfEntityId == c.TfAssessmentWsdorId);
            xref.Should().NotBeNull();
        }

        var xrefGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-wsdor-source-xref-coverage"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        xrefGate.Status.Should().Be("PASS");

        var countyGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-wsdor-county-isolation"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        countyGate.Status.Should().Be("PASS");
    }

    [Fact]
    public async Task FailedTruthBatch_RefusesProjection()
    {
        var truthBatch = await SeedFailedBatchAsync("truth");

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.Status.Should().Be("REFUSED");
        (await _db.TfAssessmentWsdors.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task UnknownTruthBatch_RefusesProjection()
    {
        var result = await BuildProjector().ProjectAsync(Guid.NewGuid(), "test-op");

        result.Status.Should().Be("REFUSED");
        var srcGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-wsdor-source-batch-completed"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        srcGate.Status.Should().Be("FAIL");
        srcGate.Detail.Should().Contain("MISSING");
    }

    [Fact]
    public async Task RePromote_Replaces_PriorRowsIdempotently()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (_, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedOwnerWithXrefAsync(countyId, acctId: 1);
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1);

        var first = await BuildProjector().ProjectAsync(truthBatch, "test-op");
        var second = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        first.RowsProjected.Should().Be(1);
        first.PriorRowsRemoved.Should().Be(0);
        second.RowsProjected.Should().Be(1);
        second.PriorRowsRemoved.Should().Be(1);

        // No duplicates.
        (await _db.TfAssessmentWsdors.CountAsync()).Should().Be(1);
        (await _db.SyncBridgeSourceXrefs.CountAsync(x => x.TfEntityType == "assessment_wsdor"))
            .Should().Be(1);
    }

    [Fact]
    public async Task RePromote_ClearsPriorQuarantineRows()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1); // both missing

        await BuildProjector().ProjectAsync(truthBatch, "test-op");
        var second = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        second.PriorQuarantineRowsRemoved.Should().Be(1);
        (await _db.LegacyTfUnprovenWashPropOwnerVals.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task AllFiveCGates_AreRecorded_OnSuccess()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (_, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedOwnerWithXrefAsync(countyId, acctId: 1);
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "canonical-wsdor-source-batch-completed",
            "canonical-wsdor-parcel-xref-coverage",
            "canonical-wsdor-owner-xref-coverage",
            "canonical-wsdor-source-xref-coverage",
            "canonical-wsdor-county-isolation",
        });
    }

    [Fact]
    public async Task EmptyTruthBatch_StillCompletesWithCleanGates()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.TruthRowsConsidered.Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(5);
        gates.Should().OnlyContain(g => g.Status != "FAIL");
    }

    [Fact]
    public async Task ParcelXrefCounty_DeterminesAssessmentCounty()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (_, countyA) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedOwnerWithXrefAsync(countyA, acctId: 1);
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1);

        await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var assessment = await _db.TfAssessmentWsdors.SingleAsync();
        assessment.CountyId.Should().Be(countyA,
            "tf_assessment_wsdor.CountyId comes from the resolved parcel");
    }

    [Fact]
    public async Task DoctrineRejection_Sales_Untouched_AtThisLayer()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (_, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedOwnerWithXrefAsync(countyId, acctId: 1);
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1);

        await BuildProjector().ProjectAsync(truthBatch, "test-op");

        // B4 only writes WSDOR-domain canonical rows.
        (await _db.TfSales.CountAsync()).Should().Be(0);
        (await _db.LegacyTfUnprovenSales.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task FullValueShape_RoundTripsThroughCanonical()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth");
        var (_, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedOwnerWithXrefAsync(countyId, acctId: 1);

        _db.TruthPacsWashPropOwnerVals.Add(new TruthPacsWashPropOwnerVal
        {
            PropValYr = 2026, SupNum = 0, PropId = 100, OwnerId = 1,
            AssessedVal = 350_000m, MarketVal = 425_500m, AppraisedVal = 360_000m,
            TaxableClassified = 200_000m, TaxableNonClassified = 50_000m,
            LandTaxableClassified = 80_000m, ImprvTaxableClassified = 120_000m,
            StateValueClassified = 150_000m, StateValueNonClassified = 0m,
            BoeStatus = "F",
            DisasterProrationPct = 50.5m,
            SnrFrzImprvHs = 100_000m, SnrFrzLandHs = 25_000m,
            SourceWpovLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            WpovLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = truthBatch,
            // G2 (v1.11): mirror promoter-stamped era.
            ConversionEra = ConversionEras.FromYear(2026),
        });
        await _db.SaveChangesAsync();

        await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var c = await _db.TfAssessmentWsdors.SingleAsync();
        c.AssessedVal.Should().Be(350_000m);
        c.AppraisedVal.Should().Be(360_000m);
        c.TaxableClassified.Should().Be(200_000m);
        c.LandTaxableClassified.Should().Be(80_000m);
        c.StateValueClassified.Should().Be(150_000m);
        c.BoeStatus.Should().Be("F");
        c.DisasterProrationPct.Should().Be(50.5m);
        c.SnrFrzImprvHs.Should().Be(100_000m);
        c.SnrFrzLandHs.Should().Be(25_000m);
    }
}
