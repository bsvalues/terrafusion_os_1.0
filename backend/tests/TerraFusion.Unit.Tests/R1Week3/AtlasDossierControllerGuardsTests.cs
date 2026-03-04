using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week3;

public class AtlasDossierControllerGuardsTests
{
    private static DataDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase(name)
            .Options;

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        return new DataDbContext(options, config);
    }

    private static ClaimsPrincipal CreatePrincipal(string countyClaim, string userId = "unit-user", string? countyCodeClaim = null)
    {
        var claims = new List<Claim>
        {
            new("countyId", countyClaim),
            new("sub", userId),
            new("userId", userId),
        };

        if (!string.IsNullOrWhiteSpace(countyCodeClaim))
        {
            claims.Add(new Claim("countyCode", countyCodeClaim));
        }

        return new ClaimsPrincipal(new ClaimsIdentity(
            claims, "TestAuth"));
    }

    private static ClaimsPrincipal CreatePrincipal(Guid countyId, string userId = "unit-user")
        => CreatePrincipal(countyId.ToString(), userId);

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
    public async Task Atlas_SameCountyParcel_ReturnsExplicitGeometryUnavailable()
    {
        await using var db = CreateDbContext(nameof(Atlas_SameCountyParcel_ReturnsExplicitGeometryUnavailable));
        var countyA = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
        db.Counties.Add(countyA);
        db.Properties.Add(new Property
        {
            PropertyId = "PROP-10",
            ParcelId = "PARCEL-101",
            ParcelNumber = "PARCEL-101",
            Address = "100 First St",
            PropertyType = "SFR",
            AssessedValue = 110000,
            LandValue = 55000,
            ImprovementValue = 55000,
            MarketValue = 125000,
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            TaxYear = 2026,
            CountyId = countyA.Id,
        });
        await db.SaveChangesAsync();

        var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
        AttachPrincipal(controller, CreatePrincipal(countyA.Id));

        var result = await controller.GetParcelGeometry("PARCEL-101");
        var ok = Assert.IsType<OkObjectResult>(result);

        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
        var root = doc.RootElement;
        Assert.Equal("PARCEL-101", root.GetProperty("parcelId").GetString());
        Assert.Equal(JsonValueKind.Null, root.GetProperty("geometry").ValueKind);
        Assert.Equal(JsonValueKind.Null, root.GetProperty("centroid").ValueKind);
        Assert.Equal(JsonValueKind.Null, root.GetProperty("areaSqft").ValueKind);
        Assert.Equal(JsonValueKind.Null, root.GetProperty("areaAcres").ValueKind);
        Assert.Equal(JsonValueKind.Null, root.GetProperty("zoning").ValueKind);
        Assert.False(root.GetProperty("geometryAvailable").GetBoolean());
    }

    [Fact]
    public async Task Atlas_StringCountyClaim_ResolvesCountyContext()
    {
        await using var db = CreateDbContext(nameof(Atlas_StringCountyClaim_ResolvesCountyContext));
        var countyA = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
        db.Counties.Add(countyA);
        db.Properties.Add(new Property
        {
            PropertyId = "PROP-11",
            ParcelId = "PARCEL-102",
            ParcelNumber = "PARCEL-102",
            Address = "101 First St",
            PropertyType = "SFR",
            AssessedValue = 110000,
            LandValue = 55000,
            ImprovementValue = 55000,
            MarketValue = 125000,
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            TaxYear = 2026,
            CountyId = countyA.Id,
        });
        await db.SaveChangesAsync();

        var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
        AttachPrincipal(controller, CreatePrincipal("benton"));

        var result = await controller.GetParcelGeometry("PARCEL-102");
        var ok = Assert.IsType<OkObjectResult>(result);

        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(ok.Value));
        Assert.Equal("PARCEL-102", doc.RootElement.GetProperty("parcelId").GetString());
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

        var controller = new DossierController(db, new Mock<ICostForgeService>().Object, NullLogger<DossierController>.Instance);
        AttachPrincipal(controller, CreatePrincipal(countyA.Id));

        var result = await controller.CreateNote(
            "PARCEL-200",
            new DossierController.CreateNoteRequest("cross-county note", "case_note"));

        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    [Fact]
    public async Task Dossier_Casefile_CrossCountyParcel_ReturnsNotFound()
    {
        await using var db = CreateDbContext(nameof(Dossier_Casefile_CrossCountyParcel_ReturnsNotFound));
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
            CountyId = countyB.Id,
        });
        await db.SaveChangesAsync();

        var controller = new DossierController(db, new Mock<ICostForgeService>().Object, NullLogger<DossierController>.Instance);
        AttachPrincipal(controller, CreatePrincipal(countyA.Id));

        var result = await controller.GetCasefile("PARCEL-300", include: null);
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal(404, notFound.StatusCode);
    }

    [Fact]
    public async Task Dossier_StringCountyClaim_ResolvesCountyContext()
    {
        await using var db = CreateDbContext(nameof(Dossier_StringCountyClaim_ResolvesCountyContext));
        var countyA = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
        db.Counties.Add(countyA);
        db.Properties.Add(new Property
        {
            PropertyId = "PROP-12",
            ParcelId = "PARCEL-400",
            ParcelNumber = "PARCEL-400",
            Address = "999 River St",
            PropertyType = "SFR",
            AssessedValue = 125000,
            LandValue = 60000,
            ImprovementValue = 65000,
            MarketValue = 130000,
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            TaxYear = 2026,
            CountyId = countyA.Id,
        });
        await db.SaveChangesAsync();

        var controller = new DossierController(db, new Mock<ICostForgeService>().Object, NullLogger<DossierController>.Instance);
        AttachPrincipal(controller, CreatePrincipal("BENTON"));

        var result = await controller.CreateNote(
            "PARCEL-400",
            new DossierController.CreateNoteRequest("note from string county claim", "case_note"));

        var created = Assert.IsType<CreatedResult>(result);
        Assert.Equal(201, created.StatusCode);
    }
}
