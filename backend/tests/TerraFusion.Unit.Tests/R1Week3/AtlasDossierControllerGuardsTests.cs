using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities;
using TerraFusion.Data;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week3;

public class AtlasDossierControllerGuardsTests
{
    private static TerraFusionDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(name)
            .Options;

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        return new TerraFusionDbContext(options, config);
    }

    private static ClaimsPrincipal CreatePrincipal(Guid countyId, string userId = "unit-user")
    {
        return new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim("countyId", countyId.ToString()),
            new Claim("sub", userId),
            new Claim("userId", userId),
        ], "TestAuth"));
    }

    private static void AttachPrincipal(ControllerBase controller, ClaimsPrincipal principal)
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    [Fact]
    public async Task Atlas_InvalidParcelId_ReturnsBadRequest()
    {
        await using var db = CreateDbContext(nameof(Atlas_InvalidParcelId_ReturnsBadRequest));

        var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
        AttachPrincipal(controller, CreatePrincipal(Guid.NewGuid()));

        var result = await controller.GetParcelGeometry("bad parcel id!");

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, badRequest.StatusCode);
    }

    [Fact]
    public async Task Atlas_CrossCountyParcel_ReturnsNotFound()
    {
        await using var db = CreateDbContext(nameof(Atlas_CrossCountyParcel_ReturnsNotFound));
        var countyA = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
        var countyB = new County { Id = Guid.NewGuid(), Name = "Yakima", State = "WA", FipsCode = "077" };

        db.Counties.AddRange(countyA, countyB);
        db.Properties.Add(new Property
        {
            PropertyId = "PROP-1",
            ParcelId = "PARCEL-100",
            ParcelNumber = "PARCEL-100",
            Address = "123 Main St",
            PropertyType = "SFR",
            AssessedValue = 100000,
            LandValue = 50000,
            ImprovementValue = 50000,
            MarketValue = 120000,
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            TaxYear = 2026,
            CountyId = countyB.Id,
        });
        await db.SaveChangesAsync();

        var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
        AttachPrincipal(controller, CreatePrincipal(countyA.Id));

        var result = await controller.GetParcelGeometry("PARCEL-100");

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    [Fact]
    public async Task Dossier_CreateNote_ForCrossCountyParcel_ReturnsNotFound()
    {
        await using var db = CreateDbContext(nameof(Dossier_CreateNote_ForCrossCountyParcel_ReturnsNotFound));
        var countyA = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
        var countyB = new County { Id = Guid.NewGuid(), Name = "Yakima", State = "WA", FipsCode = "077" };

        db.Counties.AddRange(countyA, countyB);
        db.Properties.Add(new Property
        {
            PropertyId = "PROP-2",
            ParcelId = "PARCEL-200",
            ParcelNumber = "PARCEL-200",
            Address = "456 Oak Ave",
            PropertyType = "SFR",
            AssessedValue = 150000,
            LandValue = 70000,
            ImprovementValue = 80000,
            MarketValue = 165000,
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            TaxYear = 2026,
            CountyId = countyB.Id,
        });
        await db.SaveChangesAsync();

        var controller = new DossierController(db, NullLogger<DossierController>.Instance);
        AttachPrincipal(controller, CreatePrincipal(countyA.Id));

        var result = await controller.CreateNote(
            "PARCEL-200",
            new DossierController.CreateNoteRequest("cross-county note", "case_note"));

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    [Fact]
    public async Task Dossier_Casefile_QueryCountyMismatch_ReturnsForbid()
    {
        await using var db = CreateDbContext(nameof(Dossier_Casefile_QueryCountyMismatch_ReturnsForbid));
        var countyA = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
        var countyB = new County { Id = Guid.NewGuid(), Name = "Yakima", State = "WA", FipsCode = "077" };

        db.Counties.AddRange(countyA, countyB);
        db.Properties.Add(new Property
        {
            PropertyId = "PROP-3",
            ParcelId = "PARCEL-300",
            ParcelNumber = "PARCEL-300",
            Address = "789 Pine Rd",
            PropertyType = "SFR",
            AssessedValue = 175000,
            LandValue = 80000,
            ImprovementValue = 95000,
            MarketValue = 185000,
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            TaxYear = 2026,
            CountyId = countyA.Id,
        });
        await db.SaveChangesAsync();

        var controller = new DossierController(db, NullLogger<DossierController>.Instance);
        AttachPrincipal(controller, CreatePrincipal(countyA.Id));

        var result = await controller.GetCasefile(
            "PARCEL-300",
            include: null,
            countyId: countyB.Id.ToString());

        Assert.IsType<ForbidResult>(result);
    }
}
