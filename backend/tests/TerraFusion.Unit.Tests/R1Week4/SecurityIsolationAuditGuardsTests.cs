using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Services;
using Xunit;
using AuditLogger = TerraFusion.Abstractions.Interfaces.IAuditLogger;
using CountyEntity = TerraFusion.Core.Entities.County;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using PropertyEntity = TerraFusion.Core.Entities.Property;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week4;

public class SecurityIsolationAuditGuardsTests
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

    private static ClaimsPrincipal CreatePrincipal(string? countyIdClaim, string? countyCodeClaim, string userId = "unit-user")
    {
        var claims = new List<Claim>
        {
            new("sub", userId),
            new("userId", userId),
        };

        if (!string.IsNullOrWhiteSpace(countyIdClaim))
        {
            claims.Add(new Claim("countyId", countyIdClaim));
        }

        if (!string.IsNullOrWhiteSpace(countyCodeClaim))
        {
            claims.Add(new Claim("countyCode", countyCodeClaim));
        }

        return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
    }

    private static void AttachPrincipal(ControllerBase controller, ClaimsPrincipal principal)
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private static PropertyEntity CreateProperty(Guid countyId, string propertyId, string parcelNumber)
    {
        return new PropertyEntity
        {
            Id = Guid.NewGuid(),
            PropertyId = propertyId,
            ParcelId = parcelNumber,
            ParcelNumber = parcelNumber,
            Address = "123 Main St",
            PropertyType = "SFR",
            AssessedValue = 100000,
            LandValue = 50000,
            ImprovementValue = 50000,
            MarketValue = 120000,
            AssessmentDate = DateTime.UtcNow,
            LastUpdated = DateTime.UtcNow,
            TaxYear = 2026,
            CountyId = countyId,
        };
    }

    private static Mock<AuditLogger> CreateAuditLoggerMock()
    {
        var mock = new Mock<AuditLogger>();
        mock.Setup(m => m.LogUserActionAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);
        mock.Setup(m => m.LogApiCallAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int>(), It.IsAny<double>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);
        mock.Setup(m => m.LogErrorAsync(It.IsAny<string>(), It.IsAny<Exception>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);
        mock.Setup(m => m.LogDataAccessAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>()))
            .Returns(Task.CompletedTask);
        mock.Setup(m => m.LogSystemEventAsync(It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        return mock;
    }

    [Fact]
    public async Task CostForge_SameCountyRequest_ReturnsOk()
    {
        await using var db = CreateDbContext(nameof(CostForge_SameCountyRequest_ReturnsOk));
        var benton = new CountyEntity { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
        var property = CreateProperty(benton.Id, "PROP-1", "PARCEL-100");
        db.Counties.Add(benton);
        db.Properties.Add(property);
        await db.SaveChangesAsync();

        var costForgeMock = new Mock<ICostForgeService>();
        costForgeMock
            .Setup(m => m.AnalyzeCostAsync(property.Id))
            .ReturnsAsync(new CostAnalysisDto { PropertyId = property.Id, TotalCost = 100000m, AnalysisDate = DateTime.UtcNow });

        var aiMock = new Mock<ICostForgeAIService>();
        var auditMock = CreateAuditLoggerMock();

        var controller = new CostForgeController(
            costForgeMock.Object,
            aiMock.Object,
            db,
            auditMock.Object,
            NullLogger<CostForgeController>.Instance);

        AttachPrincipal(controller, CreatePrincipal("benton", "BENTON"));

        var result = await controller.CalculatePropertyCost(new PropertyCostCalculationRequest
        {
            PropertyId = property.Id,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "SFR",
        });

        Assert.IsType<OkObjectResult>(result.Result);
        costForgeMock.Verify(m => m.AnalyzeCostAsync(property.Id), Times.Once);
    }

    [Fact]
    public async Task CostForge_CrossCountyRequest_ReturnsForbid()
    {
        await using var db = CreateDbContext(nameof(CostForge_CrossCountyRequest_ReturnsForbid));
        var benton = new CountyEntity { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
        var yakima = new CountyEntity { Id = Guid.NewGuid(), Name = "Yakima", State = "WA", FipsCode = "077" };
        var property = CreateProperty(benton.Id, "PROP-2", "PARCEL-200");
        db.Counties.AddRange(benton, yakima);
        db.Properties.Add(property);
        await db.SaveChangesAsync();

        var costForgeMock = new Mock<ICostForgeService>();
        var aiMock = new Mock<ICostForgeAIService>();
        var auditMock = CreateAuditLoggerMock();

        var controller = new CostForgeController(
            costForgeMock.Object,
            aiMock.Object,
            db,
            auditMock.Object,
            NullLogger<CostForgeController>.Instance);

        AttachPrincipal(controller, CreatePrincipal("yakima", "YAKIMA"));

        var result = await controller.CalculatePropertyCost(new PropertyCostCalculationRequest
        {
            PropertyId = property.Id,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "SFR",
        });

        Assert.IsType<ForbidResult>(result.Result);
        costForgeMock.Verify(m => m.AnalyzeCostAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task CostForge_MissingCountyClaims_ReturnsForbid()
    {
        await using var db = CreateDbContext(nameof(CostForge_MissingCountyClaims_ReturnsForbid));
        var benton = new CountyEntity { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
        var property = CreateProperty(benton.Id, "PROP-3", "PARCEL-300");
        db.Counties.Add(benton);
        db.Properties.Add(property);
        await db.SaveChangesAsync();

        var controller = new CostForgeController(
            new Mock<ICostForgeService>().Object,
            new Mock<ICostForgeAIService>().Object,
            db,
            CreateAuditLoggerMock().Object,
            NullLogger<CostForgeController>.Instance);

        AttachPrincipal(controller, CreatePrincipal(null, null));

        var result = await controller.CalculatePropertyCost(new PropertyCostCalculationRequest
        {
            PropertyId = property.Id,
            CountyCode = "BENTON",
            Region = "BENTON",
            BuildingType = "SFR",
        });

        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task CostForge_MissingCountyCodeAndRegion_ReturnsBadRequest()
    {
        await using var db = CreateDbContext(nameof(CostForge_MissingCountyCodeAndRegion_ReturnsBadRequest));
        var benton = new CountyEntity { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
        var property = CreateProperty(benton.Id, "PROP-4", "PARCEL-400");
        db.Counties.Add(benton);
        db.Properties.Add(property);
        await db.SaveChangesAsync();

        var costForgeMock = new Mock<ICostForgeService>();
        var controller = new CostForgeController(
            costForgeMock.Object,
            new Mock<ICostForgeAIService>().Object,
            db,
            CreateAuditLoggerMock().Object,
            NullLogger<CostForgeController>.Instance);

        AttachPrincipal(controller, CreatePrincipal("benton", "BENTON"));

        var result = await controller.CalculatePropertyCost(new PropertyCostCalculationRequest
        {
            PropertyId = property.Id,
            CountyCode = " ",
            Region = " ",
            BuildingType = "SFR",
        });

        Assert.IsType<BadRequestObjectResult>(result.Result);
        costForgeMock.Verify(m => m.AnalyzeCostAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task Levy_SameCountyRequest_ReturnsOk()
    {
        await using var db = CreateDbContext(nameof(Levy_SameCountyRequest_ReturnsOk));
        db.Counties.Add(new CountyEntity { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" });
        await db.SaveChangesAsync();

        var controller = new LevyCalculationController(NullLogger<LevyCalculationController>.Instance, db);
        AttachPrincipal(controller, CreatePrincipal("benton", "BENTON"));

        var result = await controller.CalculateOptimalRate(new LevyMeasureRequest
        {
            DistrictId = "D-1",
            DistrictName = "District One",
            AssessedValue = 1000000,
            BudgetAmount = 10000,
            DistrictType = "county-regular",
            MeasureType = "regular",
            CountyCode = "BENTON",
        });

        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task Levy_CrossCountyRequest_ReturnsForbid()
    {
        await using var db = CreateDbContext(nameof(Levy_CrossCountyRequest_ReturnsForbid));
        db.Counties.AddRange(
            new CountyEntity { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" },
            new CountyEntity { Id = Guid.NewGuid(), Name = "Yakima", State = "WA", FipsCode = "077" });
        await db.SaveChangesAsync();

        var controller = new LevyCalculationController(NullLogger<LevyCalculationController>.Instance, db);
        AttachPrincipal(controller, CreatePrincipal("yakima", "YAKIMA"));

        var result = await controller.CalculateOptimalRate(new LevyMeasureRequest
        {
            DistrictId = "D-2",
            DistrictName = "District Two",
            AssessedValue = 1000000,
            BudgetAmount = 10000,
            DistrictType = "county-regular",
            MeasureType = "regular",
            CountyCode = "BENTON",
        });

        Assert.IsType<ForbidResult>(result.Result);
    }

    [Fact]
    public async Task Levy_MissingCountyClaims_ReturnsForbid()
    {
        await using var db = CreateDbContext(nameof(Levy_MissingCountyClaims_ReturnsForbid));
        db.Counties.Add(new CountyEntity { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" });
        await db.SaveChangesAsync();

        var controller = new LevyCalculationController(NullLogger<LevyCalculationController>.Instance, db);
        AttachPrincipal(controller, CreatePrincipal(null, null));

        var result = await controller.CalculateOptimalRate(new LevyMeasureRequest
        {
            DistrictId = "D-3",
            DistrictName = "District Three",
            AssessedValue = 1000000,
            BudgetAmount = 10000,
            DistrictType = "county-regular",
            MeasureType = "regular",
            CountyCode = "BENTON",
        });

        Assert.IsType<ForbidResult>(result.Result);
    }
}
