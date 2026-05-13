using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities.Canonical;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.Pacs;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;
using SystemTask = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public sealed class CountyRowsControllerTests : IDisposable
{
    private readonly TerraFusionDbContext _db;
    private readonly CountyRowsController _sut;
    private readonly Guid _bentonId = Guid.NewGuid();
    private readonly Guid _pacificId = Guid.NewGuid();
    private readonly Guid _bentonTfParcelId = Guid.NewGuid();
    private readonly Guid _pacificTfParcelId = Guid.NewGuid();

    public CountyRowsControllerTests()
    {
        _db = TestDbContextFactory.CreateInMemoryContext();
        _sut = new CountyRowsController(_db, NullLogger<CountyRowsController>.Instance);

        _db.Counties.AddRange(
            new County { Id = _bentonId, Name = "Benton County", State = "WA", FipsCode = "53005" },
            new County { Id = _pacificId, Name = "Pacific County", State = "WA", FipsCode = "53049" });

        _db.Properties.AddRange(
            MakeProperty(_bentonId, "BENTON-LEGACY-001"),
            MakeProperty(_pacificId, "PACIFIC-LEGACY-001"));

        _db.ComparableSales.AddRange(
            MakeLegacySale(_bentonId, "BENTON-LEGACY-001"),
            MakeLegacySale(_pacificId, "PACIFIC-LEGACY-001"));

        _db.TfParcels.AddRange(
            MakeTfParcel(_bentonId, _bentonTfParcelId, "BENTON-001"),
            MakeTfParcel(_pacificId, _pacificTfParcelId, "PACIFIC-001"),
            MakeTfParcel(_pacificId, Guid.NewGuid(), "PACIFIC-INACTIVE", "INACTIVE"));

        _db.TfSales.AddRange(
            MakeTfSale(_bentonId, _bentonTfParcelId, 42),
            MakeTfSale(_pacificId, _pacificTfParcelId, 43));

        var bentonPacsParcelId = Guid.NewGuid();
        _db.PacsParcel.Add(new PacsParcel
        {
            Id = bentonPacsParcelId,
            CountyId = _bentonId,
            PropId = 1001,
            PropTypeCd = "R",
            GeoId = "BENTON-001",
        });
        _db.PacsSales.Add(new PacsSale
        {
            ParcelId = bentonPacsParcelId,
            PacsChgOfOwnerId = 42,
            PacsPropId = 1001,
            SeqNum = 1,
            SaleDate = DateTime.UtcNow,
            SalePrice = 300_000m,
        });
        _db.CanonicalSaleQualifications.Add(new CanonicalSaleQualification
        {
            CountyId = _bentonId,
            ChgOfOwnerId = 42,
            ComputedDecision = CanonicalSaleQualificationDecision.Qualified,
            WacCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
            SlRatioTypeCdAxisDecision = CanonicalSaleAxisDecision.Qualified,
            SourceWorkbookId = Guid.NewGuid(),
            SourceWorkbookLockedAt = DateTime.UtcNow,
        });

        _db.SaveChanges();
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async SystemTask GetParcels_ReturnsSelectedCountyRowsOnly()
    {
        var result = await _sut.GetParcels("pacific");

        var ok = Assert.IsType<OkObjectResult>(result);
        var text = System.Text.Json.JsonSerializer.Serialize(ok.Value);

        Assert.Contains("Pacific County", text);
        Assert.Contains("PACIFIC-001", text);
        Assert.Contains("canonical_tf.tf_parcel", text);
        Assert.Contains("\"activeOnly\":true", text);
        Assert.Contains("\"duplicateParcelVersionsCollapsed\":true", text);
        Assert.DoesNotContain("BENTON-001", text);
        Assert.DoesNotContain("PACIFIC-LEGACY-001", text);
        Assert.DoesNotContain("PACIFIC-INACTIVE", text);
    }

    [Fact]
    public async SystemTask GetSales_ReturnsSelectedCountyRowsOnly()
    {
        var result = await _sut.GetSales("benton");

        var ok = Assert.IsType<OkObjectResult>(result);
        var text = System.Text.Json.JsonSerializer.Serialize(ok.Value);

        Assert.Contains("Benton County", text);
        Assert.Contains("canonical_tf.tf_sale", text);
        Assert.Contains("BENTON-001", text);
        Assert.DoesNotContain("PACIFIC-001", text);
        Assert.DoesNotContain("BENTON-LEGACY-001", text);
    }

    [Fact]
    public async SystemTask GetParcels_ReturnsNotFoundForUnknownCounty()
    {
        var result = await _sut.GetParcels("not-a-county");

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async SystemTask GetRuntimeLineage_ReturnsTerraFusionCanonicalCountsOnly()
    {
        var result = await _sut.GetRuntimeLineage("benton");

        var ok = Assert.IsType<OkObjectResult>(result);
        var text = System.Text.Json.JsonSerializer.Serialize(ok.Value);

        Assert.Contains("Benton County", text);
        Assert.Contains("terrafusion_canonical_runtime_complete", text);
        Assert.Contains("\"tfParcels\":1", text);
        Assert.Contains("\"tfSales\":1", text);
        Assert.Contains("\"canonicalSaleQualifications\":1", text);
        Assert.Contains("\"containsOwnerOrPartyPii\":false", text);
        Assert.DoesNotContain("pacs_mirror", text);
    }

    private static Property MakeProperty(Guid countyId, string parcelId) => new()
    {
        Id = Guid.NewGuid(),
        PropertyId = parcelId,
        ParcelId = parcelId,
        ParcelNumber = parcelId,
        Address = $"{parcelId} Main St",
        PropertyType = "residential",
        Neighborhood = "100",
        SitusCity = "Test",
        AssessedValue = 250_000m,
        LandValue = 80_000m,
        ImprovementValue = 170_000m,
        MarketValue = 260_000m,
        AssessmentDate = DateTime.UtcNow,
        LastUpdated = DateTime.UtcNow,
        TaxYear = 2026,
        CountyId = countyId,
    };

    private static ComparableSale MakeLegacySale(Guid countyId, string parcelId) => new()
    {
        Id = Guid.NewGuid(),
        CountyId = countyId,
        ParcelId = parcelId,
        SaleDate = DateTime.UtcNow,
        SalePrice = 300_000m,
        PropertyType = "residential",
        Neighborhood = "100",
        QualificationDecision = "qualified",
        IngestedBy = "test",
        IngestedAt = DateTime.UtcNow,
    };

    private static TfParcel MakeTfParcel(
        Guid countyId,
        Guid tfParcelId,
        string parcelNumber,
        string parcelStatus = "ACTIVE") => new()
    {
        TfParcelId = tfParcelId,
        CountyId = countyId,
        ParcelNumber = parcelNumber,
        SitusAddress = $"{parcelNumber} Canonical Way",
        PropertyType = "R",
        ParcelStatus = parcelStatus,
        ConversionEra = "WA_INITIAL_SEED",
        UpdatedAt = DateTime.UtcNow,
    };

    private static TfSale MakeTfSale(Guid countyId, Guid tfParcelId, long chgOfOwnerId) => new()
    {
        TfSaleId = Guid.NewGuid(),
        CountyId = countyId,
        TfParcelId = tfParcelId,
        ChgOfOwnerId = chgOfOwnerId,
        SlDt = DateTime.UtcNow,
        SlPrice = 300_000m,
        SaleQualified = true,
        PromotionLoadBatchId = Guid.NewGuid(),
        ConversionEra = "WA_INITIAL_SEED",
    };
}
