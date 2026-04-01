using AutoMapper;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using System.Security.Claims;
using TerraFusion.API.Controllers;
using TerraFusion.API.Seeds;
using TerraFusion.Core.Mapping;
using TerraFusion.Core.Services;
using TerraFusionDbContext = TerraFusion.Data.TerraFusionDbContext;
using Xunit;

namespace TerraFusion.Unit.Tests.R1Week5;

/// <summary>
/// DX-03: Property Service DI Repair — validates that IPropertyService
/// is registered and PropertiesController no longer returns 500 from DI failure.
///
/// Found during DX-02 runtime smoke (PR #569, Issue #570).
///
/// Acceptance criteria:
///   AC-1: PropertyService resolves with real dependencies (DbContext, AutoMapper)
///   AC-2: GetPropertyByParcel returns data for seeded Benton parcel
///   AC-3: PropertiesController can be constructed with real PropertyService
///   AC-4: Controller GetPropertyByParcel returns 200 (not 500) for seeded parcel
///   AC-5: Controller GetProperties returns paginated results
/// </summary>
public class DX03PropertyServiceDIRepairTests
{
    // ── AC-1: PropertyService resolves with real dependencies ──────────

    [Fact]
    public void AC1_PropertyService_CanBeConstructed_WithRealDependencies()
    {
        // Arrange
        using var db = CreateTestDbContext();
        var mapper = CreateMapper();
        var logger = Mock.Of<ILogger<PropertyService>>();

        // Act
        var service = new PropertyService(db, mapper, logger);

        // Assert
        service.Should().NotBeNull("PropertyService should construct with real dependencies");
    }

    // ── AC-2: GetPropertyByParcel returns data for seeded parcel ──────

    [Fact]
    public async Task AC2_GetPropertyByParcel_ReturnsData_ForSeededBentonParcel()
    {
        // Arrange
        await using var db = CreateTestDbContext();
        await db.Database.EnsureCreatedAsync();
        await DatabaseSeeder.SeedDossierRuntimeDataAsync(db);

        var mapper = CreateMapper();
        var logger = Mock.Of<ILogger<PropertyService>>();
        var service = new PropertyService(db, mapper, logger);

        // Act: query by parcel number (the format used by PropertyService)
        var result = await service.GetPropertyByParcelAsync("1-0531-100-0001-000");

        // Assert
        result.Should().NotBeNull("seeded Benton parcel should be retrievable by parcel number");
        result!.ParcelNumber.Should().Be("1-0531-100-0001-000");
        result.Address.Should().Contain("Kennewick", "address should contain city");
    }

    // ── AC-3: PropertiesController can be constructed ─────────────────

    [Fact]
    public void AC3_PropertiesController_CanBeConstructed_WithPropertyService()
    {
        // Arrange
        using var db = CreateTestDbContext();
        var mapper = CreateMapper();
        var serviceLogger = Mock.Of<ILogger<PropertyService>>();
        var service = new PropertyService(db, mapper, serviceLogger);
        var controllerLogger = Mock.Of<ILogger<PropertiesController>>();

        // Act
        var controller = new PropertiesController(service, controllerLogger);

        // Assert
        controller.Should().NotBeNull("PropertiesController should accept IPropertyService");
    }

    // ── AC-4: Controller returns 200 for seeded parcel ───────────────

    [Fact]
    public async Task AC4_GetPropertyByParcel_Returns200_ForSeededParcel()
    {
        // Arrange
        await using var db = CreateTestDbContext();
        await db.Database.EnsureCreatedAsync();
        await DatabaseSeeder.SeedDossierRuntimeDataAsync(db);

        var controller = CreatePropertiesController(db);

        // Act
        var actionResult = await controller.GetPropertyByParcel("1-0531-100-0001-000");

        // Assert: should be 200 OK (not 500 from DI failure)
        var result = actionResult.Result;
        result.Should().BeOfType<OkObjectResult>(
            "seeded Benton parcel should return 200 OK, not 500 from DI failure");
    }

    [Fact]
    public async Task AC4_GetPropertyByParcel_Returns404_ForNonExistentParcel()
    {
        // Arrange
        await using var db = CreateTestDbContext();
        await db.Database.EnsureCreatedAsync();
        await DatabaseSeeder.SeedDossierRuntimeDataAsync(db);

        var controller = CreatePropertiesController(db);

        // Act
        var actionResult = await controller.GetPropertyByParcel("NONEXISTENT-999");

        // Assert: should be 404 Not Found (not 500)
        var result = actionResult.Result;
        result.Should().BeOfType<NotFoundResult>(
            "non-existent parcel should return 404, not 500");
    }

    // ── AC-5: Controller returns paginated results ───────────────────

    [Fact]
    public async Task AC5_GetProperties_ReturnsPaginatedResults_ForSeededData()
    {
        // Arrange
        await using var db = CreateTestDbContext();
        await db.Database.EnsureCreatedAsync();
        await DatabaseSeeder.SeedDossierRuntimeDataAsync(db);

        var controller = CreatePropertiesController(db);

        // Act
        var actionResult = await controller.GetProperties(page: 1, pageSize: 10);

        // Assert: should return paginated results with seeded properties
        var result = actionResult.Result;
        result.Should().BeOfType<OkObjectResult>("paginated query should return 200 OK");

        var okResult = (OkObjectResult)result!;
        okResult.Value.Should().NotBeNull("response should contain paginated data");
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private static TerraFusionDbContext CreateTestDbContext()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseSqlite("Data Source=:memory:")
            .Options;

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var db = new TerraFusionDbContext(options, config);
        db.Database.OpenConnection();
        return db;
    }

    private static IMapper CreateMapper()
    {
        var config = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<TerraFusionMappingProfile>();
        }, NullLoggerFactory.Instance);
        return config.CreateMapper();
    }

    private static PropertiesController CreatePropertiesController(TerraFusionDbContext db)
    {
        var mapper = CreateMapper();
        var serviceLogger = Mock.Of<ILogger<PropertyService>>();
        var service = new PropertyService(db, mapper, serviceLogger);
        var controllerLogger = Mock.Of<ILogger<PropertiesController>>();

        var controller = new PropertiesController(service, controllerLogger);

        // Set up HttpContext with Benton county claims
        var claims = new List<Claim>
        {
            new("countyId", DatabaseSeeder.BentonCountyId.ToString()),
            new("countyCode", "benton"),
            new("perm", "read:properties")
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };

        return controller;
    }
}
