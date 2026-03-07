using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Models;
using Xunit;
using AuditLogger = TerraFusion.Abstractions.Interfaces.IAuditLogger;
using CostForgeAIService = TerraFusion.Core.Services.ICostForgeAIService;
using CostForgeService = TerraFusion.Core.Services.ICostForgeService;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using IncomeApproachService = TerraFusion.Core.Services.IIncomeApproachService;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week5;

[Trait("Category", "R1Week5")]
[Trait("Category", "CXR1")]
public sealed class R1Week5CxR1ClosureTests
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

  private static ClaimsPrincipal CreatePrincipal(Guid countyId, string countyCode = "BENTON", string userId = "cx-r1-user")
  {
    return new ClaimsPrincipal(new ClaimsIdentity(
    [
        new Claim("countyId", countyId.ToString()),
            new Claim("countyCode", countyCode),
            new Claim("sub", userId),
            new Claim("userId", userId),
        ], "TestAuth"));
  }

  private static ClaimsPrincipal CreateEmptyPrincipal()
  {
    return new ClaimsPrincipal(new ClaimsIdentity());
  }

  private static void AttachPrincipal(ControllerBase controller, ClaimsPrincipal principal)
  {
    controller.ControllerContext = new ControllerContext
    {
      HttpContext = new DefaultHttpContext { User = principal }
    };
  }

  private static Property CreateProperty(Guid countyId, string parcelId)
  {
    return new Property
    {
      PropertyId = $"PROP-{parcelId}",
      ParcelId = parcelId,
      ParcelNumber = parcelId,
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

  [Fact]
  public void PropertyValuationController_HasAuthorizeAttribute()
  {
    typeof(PropertyValuationController)
        .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
        .Should()
        .NotBeEmpty();
  }

  [Fact]
  public async Task PropertyValuationController_Enhance_WithoutCountyClaims_ReturnsForbid()
  {
    await using var db = CreateDbContext(nameof(PropertyValuationController_Enhance_WithoutCountyClaims_ReturnsForbid));
    var service = new Mock<IPropertyValuationAIEnhancementService>(MockBehavior.Strict);
    var controller = new PropertyValuationController(service.Object, db, NullLogger<PropertyValuationController>.Instance);
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = await controller.EnhancePropertyValuation(new PropertyValuationRequest
    {
      CountyCode = "BENTON",
      ParcelId = "PARCEL-100",
    });

    result.Result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  public async Task PropertyValuationController_Enhance_MismatchedCounty_ReturnsForbid()
  {
    await using var db = CreateDbContext(nameof(PropertyValuationController_Enhance_MismatchedCounty_ReturnsForbid));
    var bentonCountyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = bentonCountyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var service = new Mock<IPropertyValuationAIEnhancementService>(MockBehavior.Strict);
    var controller = new PropertyValuationController(service.Object, db, NullLogger<PropertyValuationController>.Instance);
    AttachPrincipal(controller, CreatePrincipal(bentonCountyId, "BENTON"));

    var result = await controller.EnhancePropertyValuation(new PropertyValuationRequest
    {
      CountyCode = "KING",
      ParcelId = "PARCEL-100",
    });

    result.Result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  public async Task PropertyValuationController_Enhance_SameCountyParcel_ReturnsOk()
  {
    await using var db = CreateDbContext(nameof(PropertyValuationController_Enhance_SameCountyParcel_ReturnsOk));
    var bentonCountyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = bentonCountyId, Name = "Benton", State = "WA", FipsCode = "003" });
    db.Properties.Add(CreateProperty(bentonCountyId, "PARCEL-101"));
    await db.SaveChangesAsync();

    var service = new Mock<IPropertyValuationAIEnhancementService>();
    service.Setup(s => s.ExecuteAIEnhancedValuationAsync(It.IsAny<PropertyValuationRequest>()))
        .ReturnsAsync(new PropertyValuationResult
        {
          CountyCode = "BENTON",
          ParcelId = "PARCEL-101",
          EstimatedValue = 250000m,
          ConfidenceScore = 0.99m,
          Status = ValuationStatus.Success,
          TotalDuration = TimeSpan.FromMilliseconds(25),
        });

    var controller = new PropertyValuationController(service.Object, db, NullLogger<PropertyValuationController>.Instance);
    AttachPrincipal(controller, CreatePrincipal(bentonCountyId, "BENTON"));

    var result = await controller.EnhancePropertyValuation(new PropertyValuationRequest
    {
      CountyCode = "BENTON",
      ParcelId = "PARCEL-101",
    });

    var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
    ok.StatusCode.Should().Be(StatusCodes.Status200OK);
    service.Verify(s => s.ExecuteAIEnhancedValuationAsync(It.Is<PropertyValuationRequest>(r =>
        r.CountyCode == "BENTON" && r.ParcelId == "PARCEL-101")), Times.Once);
  }

  [Fact]
  public async Task PropertyValuationController_Bulk_MixedCountyBatch_ReturnsBadRequest()
  {
    await using var db = CreateDbContext(nameof(PropertyValuationController_Bulk_MixedCountyBatch_ReturnsBadRequest));
    var bentonCountyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = bentonCountyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var service = new Mock<IPropertyValuationAIEnhancementService>(MockBehavior.Strict);
    var controller = new PropertyValuationController(service.Object, db, NullLogger<PropertyValuationController>.Instance);
    AttachPrincipal(controller, CreatePrincipal(bentonCountyId, "BENTON"));

    var result = await controller.EnhanceBulkPropertyValuations(
    [
        new PropertyValuationRequest { CountyCode = "BENTON", ParcelId = "PARCEL-101" },
            new PropertyValuationRequest { CountyCode = "KING", ParcelId = "PARCEL-202" },
        ]);

    result.Result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public void PiltController_HasAuthorizeAttribute()
  {
    typeof(PiltController)
        .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
        .Should()
        .NotBeEmpty();
  }

  [Fact]
  public void PiltController_Status_ReturnsExplicitPostR1ProblemDetails()
  {
    var controller = new PiltController(NullLogger<PiltController>.Instance);
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = controller.GetStatus();

    var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
    objectResult.StatusCode.Should().Be(StatusCodes.Status501NotImplemented);

    var problem = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
    problem.Title.Should().Be("PILT backend is not enabled for R1");
    problem.Status.Should().Be(StatusCodes.Status501NotImplemented);
    problem.Extensions["scope"].Should().Be("Post-R1");
    controller.HttpContext.Response.Headers["X-R1-Scope"].ToString().Should().Be("Post-R1");
  }

  [Fact]
  public void CostForgeController_BatchCalculate_ReturnsExplicitPostR1ProblemDetails()
  {
    using var db = CreateDbContext(nameof(CostForgeController_BatchCalculate_ReturnsExplicitPostR1ProblemDetails));
    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var costForgeAiService = new Mock<CostForgeAIService>(MockBehavior.Strict);
    var auditLogger = new Mock<AuditLogger>(MockBehavior.Strict);

    var controller = new CostForgeController(
        costForgeService.Object,
        costForgeAiService.Object,
        new Mock<IncomeApproachService>(MockBehavior.Strict).Object,
        db,
        auditLogger.Object,
        NullLogger<CostForgeController>.Instance);

    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = controller.BatchCalculateValuations(new BatchValuationRequestDto
    {
      CountyId = "BENTON",
      PropertyIds = [Guid.NewGuid(), Guid.NewGuid()],
    });

    var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
    objectResult.StatusCode.Should().Be(StatusCodes.Status501NotImplemented);

    var problem = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
    problem.Title.Should().Be("CostForge batch valuation is not enabled for R1");
    problem.Status.Should().Be(StatusCodes.Status501NotImplemented);
    problem.Extensions["scope"].Should().Be("Post-R1");
    problem.Extensions["feature"].Should().Be("CostForge batch valuation");
    controller.HttpContext.Response.Headers["X-R1-Scope"].ToString().Should().Be("Post-R1");
  }

  [Fact]
  public void CostForgeController_HarrisSync_ReturnsExplicitPostR1ProblemDetails()
  {
    using var db = CreateDbContext(nameof(CostForgeController_HarrisSync_ReturnsExplicitPostR1ProblemDetails));
    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var costForgeAiService = new Mock<CostForgeAIService>(MockBehavior.Strict);
    var auditLogger = new Mock<AuditLogger>(MockBehavior.Strict);

    var controller = new CostForgeController(
        costForgeService.Object,
        costForgeAiService.Object,
        new Mock<IncomeApproachService>(MockBehavior.Strict).Object,
        db,
        auditLogger.Object,
        NullLogger<CostForgeController>.Instance);

    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = controller.SyncWithHarrisPACS(new HarrisSyncRequestDto
    {
      CountyId = "BENTON",
      SyncType = "full",
    });

    var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
    objectResult.StatusCode.Should().Be(StatusCodes.Status501NotImplemented);

    var problem = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
    problem.Title.Should().Be("Harris PACS sync is not enabled for R1");
    problem.Status.Should().Be(StatusCodes.Status501NotImplemented);
    problem.Extensions["scope"].Should().Be("Post-R1");
    problem.Extensions["feature"].Should().Be("Harris PACS sync");
    controller.HttpContext.Response.Headers["X-R1-Scope"].ToString().Should().Be("Post-R1");
  }

  [Fact]
  public void DossierController_SearchDocuments_ReturnsExplicitPostR1ProblemDetails()
  {
    using var db = CreateDbContext(nameof(DossierController_SearchDocuments_ReturnsExplicitPostR1ProblemDetails));
    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var hostEnvironment = new Mock<IHostEnvironment>();
    hostEnvironment.SetupGet(h => h.EnvironmentName).Returns("Production");

    var controller = new DossierController(
        db,
        costForgeService.Object,
        NullLogger<DossierController>.Instance,
        hostEnvironment.Object);

    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = controller.SearchDocuments(new { limit = 50 });

    var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
    objectResult.StatusCode.Should().Be(StatusCodes.Status501NotImplemented);

    var problem = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
    problem.Title.Should().Be("Dossier document search is not enabled for R1");
    problem.Status.Should().Be(StatusCodes.Status501NotImplemented);
    problem.Extensions["scope"].Should().Be("Post-R1");
    problem.Extensions["feature"].Should().Be("Dossier document search");
    controller.HttpContext.Response.Headers["X-R1-Scope"].ToString().Should().Be("Post-R1");
  }

  [Fact]
  public void DossierController_Stats_ReturnsExplicitPostR1ProblemDetails()
  {
    using var db = CreateDbContext(nameof(DossierController_Stats_ReturnsExplicitPostR1ProblemDetails));
    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var hostEnvironment = new Mock<IHostEnvironment>();
    hostEnvironment.SetupGet(h => h.EnvironmentName).Returns("Production");

    var controller = new DossierController(
        db,
        costForgeService.Object,
        NullLogger<DossierController>.Instance,
        hostEnvironment.Object);

    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = controller.GetStats();

    var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
    objectResult.StatusCode.Should().Be(StatusCodes.Status501NotImplemented);

    var problem = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
    problem.Title.Should().Be("Dossier document-management stats is not enabled for R1");
    problem.Status.Should().Be(StatusCodes.Status501NotImplemented);
    problem.Extensions["scope"].Should().Be("Post-R1");
    problem.Extensions["feature"].Should().Be("Dossier document-management stats");
    controller.HttpContext.Response.Headers["X-R1-Scope"].ToString().Should().Be("Post-R1");
  }

  [Fact]
  public void AtlasController_GetLayers_ReturnsExplicitPostR1ProblemDetails()
  {
    using var db = CreateDbContext(nameof(AtlasController_GetLayers_ReturnsExplicitPostR1ProblemDetails));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = controller.GetLayers();

    var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
    objectResult.StatusCode.Should().Be(StatusCodes.Status501NotImplemented);

    var problem = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
    problem.Title.Should().Be("Atlas layer catalog is not enabled for R1");
    problem.Status.Should().Be(StatusCodes.Status501NotImplemented);
    problem.Extensions["scope"].Should().Be("Post-R1");
    problem.Extensions["feature"].Should().Be("Atlas layer catalog");
    controller.HttpContext.Response.Headers["X-R1-Scope"].ToString().Should().Be("Post-R1");
  }

  [Fact]
  public void AtlasController_SearchParcels_ReturnsExplicitPostR1ProblemDetails()
  {
    using var db = CreateDbContext(nameof(AtlasController_SearchParcels_ReturnsExplicitPostR1ProblemDetails));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = controller.SearchParcels(new { query = "123 Main", limit = 10 });

    var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
    objectResult.StatusCode.Should().Be(StatusCodes.Status501NotImplemented);

    var problem = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
    problem.Title.Should().Be("Atlas parcel search is not enabled for R1");
    problem.Status.Should().Be(StatusCodes.Status501NotImplemented);
    problem.Extensions["scope"].Should().Be("Post-R1");
    problem.Extensions["feature"].Should().Be("Atlas parcel search");
    controller.HttpContext.Response.Headers["X-R1-Scope"].ToString().Should().Be("Post-R1");
  }
}
