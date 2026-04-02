using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;
using SystemTask = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public class BentonCountyGisControllerTests
{
    private static TerraFusionDbContext BuildInMemoryDb(IEnumerable<Property> properties)
    {
        var dbName = System.Guid.NewGuid().ToString();

        var configMock = new Mock<IConfiguration>();
        configMock.Setup(c => c["ConnectionStrings:DefaultConnection"]).Returns($"Data Source={dbName}.db");

        var opts = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var db = new TerraFusionDbContext(opts, configMock.Object);
        db.Properties.AddRange(properties);
        db.SaveChanges();
        return db;
    }

    private static Property MakeProperty(int i) => new()
    {
        Id = System.Guid.NewGuid(),
        PropertyId = $"PROP-{i:D5}",
        ParcelId = $"PARCEL-{i:D5}",
        ParcelNumber = $"10184{i:D7}",
        Address = $"{100 + i} Main St, Kennewick WA",
        OwnerName = $"Owner {i}",
        AssessedValue = 150_000m + i * 1000m,
        LandValue = 50_000m,
        ImprovementValue = 100_000m,
        MarketValue = 160_000m + i * 1000m,
        AssessmentDate = System.DateTime.UtcNow,
        LastUpdated = System.DateTime.UtcNow,
        TaxYear = 2024,
        CountyId = BentonCountyGisController.BentonCountyId,
    };

    [Fact]
    public async SystemTask GetParcels_Returns200_WithDefaultLimit()
    {
        var db = BuildInMemoryDb(Enumerable.Range(1, 20).Select(MakeProperty));
        var controller = new BentonCountyGisController(db, NullLogger<BentonCountyGisController>.Instance);

        var result = await controller.GetParcels(limit: 10);

        var ok = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<IEnumerable<object>>(ok.Value);
        Assert.Equal(10, items.Count());
    }

    [Fact]
    public async SystemTask GetParcels_LimitCappedAt500()
    {
        var db = BuildInMemoryDb(Enumerable.Range(1, 600).Select(MakeProperty));
        var controller = new BentonCountyGisController(db, NullLogger<BentonCountyGisController>.Instance);

        var result = await controller.GetParcels(limit: 9999);

        var ok = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<IEnumerable<object>>(ok.Value);
        Assert.True(items.Count() <= 500, "Limit must be capped at 500");
    }

    [Fact]
    public async SystemTask GetParcels_FiltersTobentonCountyOnly()
    {
        var bentonParcels = Enumerable.Range(1, 5).Select(MakeProperty).ToList();
        var otherCounty = new Property
        {
            Id = System.Guid.NewGuid(),
            PropertyId = "OTHER-1",
            ParcelId = "OTHER-1",
            ParcelNumber = "999999999",
            Address = "1 Other St",
            AssessedValue = 100_000m,
            LandValue = 30_000m,
            ImprovementValue = 70_000m,
            MarketValue = 110_000m,
            AssessmentDate = System.DateTime.UtcNow,
            LastUpdated = System.DateTime.UtcNow,
            TaxYear = 2024,
            CountyId = System.Guid.NewGuid(), // different county
        };
        var db = BuildInMemoryDb(bentonParcels.Append(otherCounty));
        var controller = new BentonCountyGisController(db, NullLogger<BentonCountyGisController>.Instance);

        var result = await controller.GetParcels(limit: 100);

        var ok = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<IEnumerable<object>>(ok.Value);
        Assert.Equal(5, items.Count());
    }
}
