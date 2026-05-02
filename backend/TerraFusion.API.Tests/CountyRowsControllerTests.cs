using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.API.Tests.TestHelpers;
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

    public CountyRowsControllerTests()
    {
        _db = TestDbContextFactory.CreateInMemoryContext();
        _sut = new CountyRowsController(_db, NullLogger<CountyRowsController>.Instance);

        _db.Counties.AddRange(
            new County { Id = _bentonId, Name = "Benton County", State = "WA", FipsCode = "53005" },
            new County { Id = _pacificId, Name = "Pacific County", State = "WA", FipsCode = "53049" });

        _db.Properties.AddRange(
            MakeProperty(_bentonId, "BENTON-001"),
            MakeProperty(_pacificId, "PACIFIC-001"));

        _db.ComparableSales.AddRange(
            MakeSale(_bentonId, "BENTON-001"),
            MakeSale(_pacificId, "PACIFIC-001"));

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
        Assert.DoesNotContain("BENTON-001", text);
    }

    [Fact]
    public async SystemTask GetSales_ReturnsSelectedCountyRowsOnly()
    {
        var result = await _sut.GetSales("benton");

        var ok = Assert.IsType<OkObjectResult>(result);
        var text = System.Text.Json.JsonSerializer.Serialize(ok.Value);

        Assert.Contains("Benton County", text);
        Assert.Contains("BENTON-001", text);
        Assert.DoesNotContain("PACIFIC-001", text);
    }

    [Fact]
    public async SystemTask GetParcels_ReturnsNotFoundForUnknownCounty()
    {
        var result = await _sut.GetParcels("not-a-county");

        Assert.IsType<NotFoundObjectResult>(result);
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

    private static ComparableSale MakeSale(Guid countyId, string parcelId) => new()
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
}
