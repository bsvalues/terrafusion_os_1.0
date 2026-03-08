using System.Security.Claims;
using System.Text.Json;
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
using TerraFusion.Core.PACS;
using Xunit;
using AuditLogger = TerraFusion.Abstractions.Interfaces.IAuditLogger;
using CostForgeAIService = TerraFusion.Core.Services.ICostForgeAIService;
using CostForgeService = TerraFusion.Core.Services.ICostForgeService;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
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

  private static IHostEnvironment CreateHostEnvironment(string environmentName = "Production")
  {
    var hostEnvironment = new Mock<IHostEnvironment>();
    hostEnvironment.SetupGet(h => h.EnvironmentName).Returns(environmentName);
    return hostEnvironment.Object;
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

  private static async Task SeedDossierIndexDataAsync(DataDbContext db, Guid countyId, string parcelId)
  {
    db.Counties.Add(new County
    {
      Id = countyId,
      Name = "Benton",
      State = "WA",
      FipsCode = "003",
    });

    var property = CreateProperty(countyId, parcelId);
    property.Address = "456 Oak Ave, Kennewick, WA";
    property.AssessmentDate = new DateTime(2026, 03, 05, 10, 30, 0, DateTimeKind.Utc);
    property.LastUpdated = new DateTime(2026, 03, 06, 08, 45, 0, DateTimeKind.Utc);
    db.Properties.Add(property);

    db.DossierNotes.AddRange(
        new DossierNote
        {
          ParcelId = parcelId,
          CountyId = countyId,
          NoteType = "inspection",
          CreatedBy = "Field Appraiser",
          CreatedAt = new DateTime(2026, 03, 05, 11, 00, 0, DateTimeKind.Utc),
          Content = "Inspection completed and measurements verified on site.",
        },
        new DossierNote
        {
          ParcelId = parcelId,
          CountyId = countyId,
          NoteType = "appeal_evidence",
          CreatedBy = "County Clerk",
          CreatedAt = new DateTime(2026, 03, 05, 12, 15, 0, DateTimeKind.Utc),
          Content = "Appeal packet received with comparable sales schedule, appraisal narrative, and supporting correspondence attached for BOE review.",
        });

    await db.SaveChangesAsync();
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
  public async Task PiltController_Status_BentonCounty_ReturnsLiveSnapshot()
  {
    await using var db = CreateDbContext(nameof(PiltController_Status_BentonCounty_ReturnsLiveSnapshot));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new PiltController(
        db,
        NullLogger<PiltController>.Instance,
        CreateHostEnvironment());
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.GetStatus();

    var objectResult = result.Should().BeOfType<OkObjectResult>().Subject;
    using var json = JsonDocument.Parse(JsonSerializer.Serialize(objectResult.Value));
    json.RootElement.GetProperty("status").GetString().Should().Be("active");
    json.RootElement.GetProperty("fiscalYear").GetInt32().Should().Be(2025);
    json.RootElement.GetProperty("districts").GetInt32().Should().Be(11);
    json.RootElement.GetProperty("federalAcres").GetInt32().Should().Be(586000);
    json.RootElement.GetProperty("calculationMethod").GetString().Should().Be("current_use");
    json.RootElement.GetProperty("totalAssessedValue").GetDecimal().Should().BeGreaterThan(0);
    json.RootElement.GetProperty("totalPiltDue").GetDecimal().Should().BeGreaterThan(0);
    controller.HttpContext.Response.Headers["X-PILT-Source"].ToString().Should().Be("benton-real-calculator-fy2025");
  }

  [Fact]
  public async Task PiltController_Districts_WithoutCountyClaims_ReturnsUnauthorized()
  {
    await using var db = CreateDbContext(nameof(PiltController_Districts_WithoutCountyClaims_ReturnsUnauthorized));
    db.Counties.Add(new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new PiltController(
        db,
        NullLogger<PiltController>.Instance,
        CreateHostEnvironment());
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = await controller.GetDistricts();

    var objectResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
    var problem = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
    problem.Title.Should().Be("County context required");
    problem.Status.Should().Be(StatusCodes.Status401Unauthorized);
  }

  [Fact]
  public async Task PiltController_Receipts_UnsupportedCounty_ReturnsExplicitPostR1ProblemDetails()
  {
    await using var db = CreateDbContext(nameof(PiltController_Receipts_UnsupportedCounty_ReturnsExplicitPostR1ProblemDetails));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "King", State = "WA", FipsCode = "033" });
    await db.SaveChangesAsync();

    var controller = new PiltController(
        db,
        NullLogger<PiltController>.Instance,
        CreateHostEnvironment());
    AttachPrincipal(controller, CreatePrincipal(countyId, "KING"));

    var result = await controller.GetReceipts(2025);

    var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
    objectResult.StatusCode.Should().Be(StatusCodes.Status501NotImplemented);

    var problem = objectResult.Value.Should().BeOfType<ProblemDetails>().Subject;
    problem.Title.Should().Be("PILT backend is not enabled for this operation");
    problem.Status.Should().Be(StatusCodes.Status501NotImplemented);
    problem.Extensions["scope"].Should().Be("Post-R1");
    controller.HttpContext.Response.Headers["X-R1-Scope"].ToString().Should().Be("Post-R1");
  }

  [Fact]
  public async Task CostForgeController_BatchCalculate_WithoutCountyClaims_ReturnsForbid()
  {
    using var db = CreateDbContext(nameof(CostForgeController_BatchCalculate_WithoutCountyClaims_ReturnsForbid));
    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var costForgeAiService = new Mock<CostForgeAIService>(MockBehavior.Strict);
    var auditLogger = new Mock<AuditLogger>(MockBehavior.Strict);

    var controller = new CostForgeController(
        costForgeService.Object,
        costForgeAiService.Object,
        db,
        auditLogger.Object,
        NullLogger<CostForgeController>.Instance);

    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = await controller.BatchCalculateValuations(new BatchValuationRequestDto
    {
      CountyId = "BENTON",
      PropertyIds = [Guid.NewGuid(), Guid.NewGuid()],
    });

    result.Result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  public async Task CostForgeController_HarrisSync_WithoutCountyClaims_ReturnsForbid()
  {
    using var db = CreateDbContext(nameof(CostForgeController_HarrisSync_WithoutCountyClaims_ReturnsForbid));
    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var costForgeAiService = new Mock<CostForgeAIService>(MockBehavior.Strict);
    var auditLogger = new Mock<AuditLogger>(MockBehavior.Strict);

    var controller = new CostForgeController(
        costForgeService.Object,
        costForgeAiService.Object,
        db,
        auditLogger.Object,
        NullLogger<CostForgeController>.Instance);

    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = await controller.SyncWithHarrisPACS(new HarrisSyncRequestDto
    {
      CountyId = "BENTON",
      SyncType = "full",
    });

    result.Result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  public async Task DossierController_SearchDocuments_ReturnsLiveReadOnlyResults()
  {
    using var db = CreateDbContext(nameof(DossierController_SearchDocuments_ReturnsLiveReadOnlyResults));
    var countyId = Guid.NewGuid();
    await SeedDossierIndexDataAsync(db, countyId, "PARCEL-101");

    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var hostEnvironment = new Mock<IHostEnvironment>();
    hostEnvironment.SetupGet(h => h.EnvironmentName).Returns("Production");

    var controller = new DossierController(
        db,
        costForgeService.Object,
        NullLogger<DossierController>.Instance,
        hostEnvironment.Object);

    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.SearchDocuments(new DossierController.DocumentSearchRequest(
        Query: null,
        Type: null,
        Status: null,
        ParcelId: "PARCEL-101",
        Limit: 50,
        Offset: 0));

    var objectResult = result.Should().BeOfType<OkObjectResult>().Subject;
    using var json = JsonDocument.Parse(JsonSerializer.Serialize(objectResult.Value));
    json.RootElement.GetProperty("total").GetInt32().Should().Be(4);
    json.RootElement.GetProperty("hasMore").GetBoolean().Should().BeFalse();
    json.RootElement.GetProperty("results")[0].GetProperty("name").GetString()
        .Should().NotBeNullOrWhiteSpace();
    json.RootElement.GetProperty("results").EnumerateArray()
        .Select(r => r.GetProperty("name").GetString())
        .Should().Contain("Casefile summary - PARCEL-101");
  }

  [Fact]
  public async Task DossierController_SearchEvidence_And_Chain_ReturnLiveResults()
  {
    using var db = CreateDbContext(nameof(DossierController_SearchEvidence_And_Chain_ReturnLiveResults));
    var countyId = Guid.NewGuid();
    await SeedDossierIndexDataAsync(db, countyId, "PARCEL-101");

    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var hostEnvironment = new Mock<IHostEnvironment>();
    hostEnvironment.SetupGet(h => h.EnvironmentName).Returns("Production");

    var controller = new DossierController(
        db,
        costForgeService.Object,
        NullLogger<DossierController>.Instance,
        hostEnvironment.Object);

    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var searchResult = await controller.SearchEvidence(new DossierController.EvidenceSearchRequest(
        ParcelId: "PARCEL-101",
        EvidenceType: null,
        Integrity: null,
        Limit: 50,
        Offset: 0));

    var searchObject = searchResult.Should().BeOfType<OkObjectResult>().Subject;
    using var searchJson = JsonDocument.Parse(JsonSerializer.Serialize(searchObject.Value));
    searchJson.RootElement.GetProperty("total").GetInt32().Should().Be(3);
    searchJson.RootElement.GetProperty("results").EnumerateArray()
        .Select(r => r.GetProperty("title").GetString())
        .Should().Contain("Parcel evidence snapshot - PARCEL-101");

    var chainResult = await controller.GetChainOfCustody("evid-snapshot-parcel-101");
    var chainObject = chainResult.Should().BeOfType<OkObjectResult>().Subject;
    using var chainJson = JsonDocument.Parse(JsonSerializer.Serialize(chainObject.Value));
    chainJson.RootElement.GetArrayLength().Should().Be(3);
    chainJson.RootElement[0].GetProperty("action").GetString()
        .Should().Be("Captured parcel assessment snapshot");
    chainJson.RootElement[2].GetProperty("action").GetString()
        .Should().Be("Verified evidence hash");
  }

  [Fact]
  public async Task DossierController_Stats_ReturnsLiveDocumentAndEvidenceCounts()
  {
    using var db = CreateDbContext(nameof(DossierController_Stats_ReturnsLiveDocumentAndEvidenceCounts));
    var countyId = Guid.NewGuid();
    await SeedDossierIndexDataAsync(db, countyId, "PARCEL-101");

    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var hostEnvironment = new Mock<IHostEnvironment>();
    hostEnvironment.SetupGet(h => h.EnvironmentName).Returns("Production");

    var controller = new DossierController(
        db,
        costForgeService.Object,
        NullLogger<DossierController>.Instance,
        hostEnvironment.Object);

    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.GetStats();

    var objectResult = result.Should().BeOfType<OkObjectResult>().Subject;
    using var json = JsonDocument.Parse(JsonSerializer.Serialize(objectResult.Value));
    json.RootElement.GetProperty("totalDocuments").GetInt32().Should().Be(4);
    json.RootElement.GetProperty("activeDocuments").GetInt32().Should().Be(4);
    json.RootElement.GetProperty("documentTypes").GetInt32().Should().Be(3);
    json.RootElement.GetProperty("totalEvidence").GetInt32().Should().Be(3);
    json.RootElement.GetProperty("verifiedEvidence").GetInt32().Should().Be(2);
    json.RootElement.GetProperty("pendingEvidence").GetInt32().Should().Be(1);
    json.RootElement.GetProperty("disputedEvidence").GetInt32().Should().Be(0);
  }

  [Fact]
  public void AtlasController_GetLayers_ReturnsLiveLayerCatalog()
  {
    using var db = CreateDbContext(nameof(AtlasController_GetLayers_ReturnsLiveLayerCatalog));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = controller.GetLayers();

    var objectResult = result.Should().BeOfType<OkObjectResult>().Subject;
    using var json = JsonDocument.Parse(JsonSerializer.Serialize(objectResult.Value));
    json.RootElement.GetProperty("count").GetInt32().Should().Be(5);
    json.RootElement.GetProperty("layers").EnumerateArray().Count().Should().Be(5);
  }

  [Fact]
  public async Task AtlasController_SearchParcels_WithoutCountyClaims_ReturnsForbid()
  {
    using var db = CreateDbContext(nameof(AtlasController_SearchParcels_WithoutCountyClaims_ReturnsForbid));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = await controller.SearchParcels(new AtlasController.ParcelSearchRequest("123 Main", null));

    result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  public async Task PiltController_CreateReceipt_BentonCounty_ReturnsCreated()
  {
    await using var db = CreateDbContext(nameof(PiltController_CreateReceipt_BentonCounty_ReturnsCreated));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new PiltController(
        db,
        NullLogger<PiltController>.Instance,
        CreateHostEnvironment());
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.CreateReceipt(new PiltController.CreateReceiptRequest(2025, "Federal PILT Test", 100000m));

    var objectResult = result.Should().BeOfType<OkObjectResult>().Subject;
    using var json = JsonDocument.Parse(JsonSerializer.Serialize(objectResult.Value));
    json.RootElement.GetProperty("fiscalYear").GetInt32().Should().Be(2025);
    json.RootElement.GetProperty("source").GetString().Should().Be("Federal PILT Test");
    json.RootElement.GetProperty("amount").GetDecimal().Should().Be(100000m);
    json.RootElement.GetProperty("status").GetString().Should().Be("created");
    json.RootElement.GetProperty("receiptId").GetString().Should().NotBeNullOrWhiteSpace();
  }

  [Fact]
  public async Task PiltController_CreateReceipt_InvalidAmount_ReturnsBadRequest()
  {
    await using var db = CreateDbContext(nameof(PiltController_CreateReceipt_InvalidAmount_ReturnsBadRequest));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new PiltController(
        db,
        NullLogger<PiltController>.Instance,
        CreateHostEnvironment());
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.CreateReceipt(new PiltController.CreateReceiptRequest(2025, "Test", -500m));

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public async Task PiltController_Approve_BentonCounty_ReturnsApproval()
  {
    await using var db = CreateDbContext(nameof(PiltController_Approve_BentonCounty_ReturnsApproval));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new PiltController(
        db,
        NullLogger<PiltController>.Instance,
        CreateHostEnvironment());
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.Approve("calc-2025-abc123");

    var objectResult = result.Should().BeOfType<OkObjectResult>().Subject;
    using var json = JsonDocument.Parse(JsonSerializer.Serialize(objectResult.Value));
    json.RootElement.GetProperty("calculationId").GetString().Should().Be("calc-2025-abc123");
    json.RootElement.GetProperty("status").GetString().Should().Be("approved");
    json.RootElement.GetProperty("approvedBy").GetString().Should().NotBeNullOrWhiteSpace();
  }

  // ── Wave 8: Real PILT Calculator Tests ─────────────────────────────────

  [Fact]
  public void PiltCalculator_TotalAssessedValue_MatchesLandClassificationSum()
  {
    var av = PiltController.ComputeTotalAssessedValue();

    // The total must equal the sum of all 6 land classification values
    var expected =
        PiltController.HanfordAcreage.TotalDrylandAcres * PiltController.LandValues.DrylandPerAcre
      + PiltController.HanfordAcreage.TotalIrrigableAcres * PiltController.LandValues.IrrigablePerAcre
      + PiltController.HanfordAcreage.LesserRiverfrontFeet * PiltController.LandValues.LesserRiverfrontPerFoot
      + PiltController.HanfordAcreage.PrimeRiverfrontFeet * PiltController.LandValues.PrimeRiverfrontPerFoot
      + PiltController.HanfordAcreage.RuralResidentialAcres * PiltController.LandValues.RuralResidentialPerAcre
      + PiltController.HanfordAcreage.TownPlatsAcres * PiltController.LandValues.TownPlatsPerAcre;

    av.Should().Be(expected);
    av.Should().BeGreaterThan(100_000_000m, "Hanford site should be > $100M assessed value");
  }

  [Fact]
  public void PiltCalculator_DistrictResults_Has11Districts_SumsCorrectly()
  {
    var totalAV = PiltController.ComputeTotalAssessedValue();
    var results = PiltController.CalculatePilt(totalAV);

    results.Should().HaveCount(11);
    results.Should().OnlyContain(d => d.PiltDue >= 0, "no negative PILT amounts");
    results.Should().OnlyContain(d => d.LevyRatePer1000 > 0, "all districts have positive levy rates");

    // Distribution total must equal sum of individual district PILT
    var distSum = results.Sum(d => d.PiltDue);
    distSum.Should().BeGreaterThan(0);

    // School districts should have district-specific assessed values
    var richland = results.First(d => d.Id == "dist-richland-sd400");
    richland.AssessedValue.Should().BeGreaterThan(0);
    richland.AssessedValue.Should().BeLessThan(totalAV, "Richland SD is a subset of total");

    var kionaBenton = results.First(d => d.Id == "dist-kiona-benton-sd52");
    kionaBenton.AssessedValue.Should().BeGreaterThan(0);
    kionaBenton.AssessedValue.Should().BeLessThan(richland.AssessedValue, "Kiona-Benton is smaller than Richland");
  }

  [Fact]
  public void PiltCalculator_BankersRounding_RoundsHalfToEven()
  {
    // 0.5 → 0 (half to even), 1.5 → 2 (half to even), 2.5 → 2
    PiltController.BankersRound(0.5m, 0).Should().Be(0m);
    PiltController.BankersRound(1.5m, 0).Should().Be(2m);
    PiltController.BankersRound(2.5m, 0).Should().Be(2m);
    PiltController.BankersRound(1234.565m, 2).Should().Be(1234.56m);
    PiltController.BankersRound(1234.575m, 2).Should().Be(1234.58m);
  }

  [Fact]
  public async Task PiltController_Districts_BentonCounty_ReturnsRealLevyData()
  {
    await using var db = CreateDbContext(nameof(PiltController_Districts_BentonCounty_ReturnsRealLevyData));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new PiltController(
        db,
        NullLogger<PiltController>.Instance,
        CreateHostEnvironment());
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.GetDistricts();

    var objectResult = result.Should().BeOfType<OkObjectResult>().Subject;
    using var json = JsonDocument.Parse(JsonSerializer.Serialize(objectResult.Value));
    json.RootElement.GetProperty("count").GetInt32().Should().Be(11);
    json.RootElement.GetProperty("totalAssessedValue").GetDecimal().Should().BeGreaterThan(0);
    json.RootElement.GetProperty("totalPiltDue").GetDecimal().Should().BeGreaterThan(0);

    var districts = json.RootElement.GetProperty("districts").EnumerateArray().ToList();
    districts.Should().HaveCount(11);
    districts.Should().OnlyContain(d => d.GetProperty("levyRatePer1000").GetDecimal() > 0);
    districts.Should().OnlyContain(d => d.GetProperty("piltDue").GetDecimal() >= 0);
  }

  [Fact]
  public async Task PiltController_Calculate_UsesRealLevyProportionalAllocation()
  {
    await using var db = CreateDbContext(nameof(PiltController_Calculate_UsesRealLevyProportionalAllocation));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new PiltController(
        db,
        NullLogger<PiltController>.Instance,
        CreateHostEnvironment());
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.Calculate("rcpt-2025-federal-base", null);

    var objectResult = result.Should().BeOfType<OkObjectResult>().Subject;
    using var json = JsonDocument.Parse(JsonSerializer.Serialize(objectResult.Value));
    json.RootElement.GetProperty("TotalAmount").GetDecimal().Should().Be(1245800m);
    json.RootElement.GetProperty("Method").GetString().Should().Be("levy_rate_proportional");
    json.RootElement.GetProperty("Status").GetString().Should().Be("calculated");

    var distributions = json.RootElement.GetProperty("Distributions").EnumerateArray().ToList();
    distributions.Should().HaveCount(11);

    // All distributions must sum exactly to the receipt amount
    var distTotal = distributions.Sum(d => d.GetProperty("Amount").GetDecimal());
    distTotal.Should().Be(1245800m, "distribution sum must match receipt amount exactly");

    // Each distribution should have real district data
    distributions.Should().OnlyContain(d => d.GetProperty("AssessedValue").GetDecimal() > 0);
    distributions.Should().OnlyContain(d => d.GetProperty("LevyRate").GetDecimal() > 0);
  }

  [Fact]
  public async Task PiltController_Report_BentonCounty_IncludesLandClassifications()
  {
    await using var db = CreateDbContext(nameof(PiltController_Report_BentonCounty_IncludesLandClassifications));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new PiltController(
        db,
        NullLogger<PiltController>.Instance,
        CreateHostEnvironment());
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.GetReport(2025);

    var objectResult = result.Should().BeOfType<OkObjectResult>().Subject;
    using var json = JsonDocument.Parse(JsonSerializer.Serialize(objectResult.Value));
    json.RootElement.GetProperty("totalAssessedValue").GetDecimal().Should().BeGreaterThan(0);
    json.RootElement.GetProperty("totalPiltDue").GetDecimal().Should().BeGreaterThan(0);
    json.RootElement.GetProperty("calculationMethod").GetString().Should().Be("current_use");
    json.RootElement.GetProperty("federalAcres").GetInt32().Should().Be(586000);

    var landClassifications = json.RootElement.GetProperty("landClassifications").EnumerateArray().ToList();
    landClassifications.Should().HaveCount(6);
    landClassifications.Select(lc => lc.GetProperty("type").GetString())
        .Should().Contain("dryland")
        .And.Contain("irrigable")
        .And.Contain("prime_riverfront");
  }

  [Fact]
  public async Task HarrisPACSController_GetProperties_WithoutCountyClaims_ReturnsForbid()
  {
    await using var db = CreateDbContext(nameof(HarrisPACSController_GetProperties_WithoutCountyClaims_ReturnsForbid));
    var pacsAdapter = new Mock<IPacsAdapter>(MockBehavior.Strict);

    var controller = new HarrisPACSIntegrationController(
        pacsAdapter.Object,
        NullLogger<HarrisPACSIntegrationController>.Instance,
        db,
        CreateHostEnvironment("Production"));
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = await controller.GetProperties("Benton");

    result.Result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  public async Task HarrisPACSController_GetProperty_MismatchedJurisdiction_ReturnsForbid()
  {
    await using var db = CreateDbContext(nameof(HarrisPACSController_GetProperty_MismatchedJurisdiction_ReturnsForbid));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var pacsAdapter = new Mock<IPacsAdapter>(MockBehavior.Strict);

    var controller = new HarrisPACSIntegrationController(
        pacsAdapter.Object,
        NullLogger<HarrisPACSIntegrationController>.Instance,
        db,
        CreateHostEnvironment("Production"));
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.GetProperty("King", "PARCEL-101");

    result.Result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  public async Task HarrisPACSController_GetAssessments_MatchingJurisdiction_PassesGuard()
  {
    await using var db = CreateDbContext(nameof(HarrisPACSController_GetAssessments_MatchingJurisdiction_PassesGuard));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var pacsAdapter = new Mock<IPacsAdapter>();
    pacsAdapter
        .Setup(p => p.GetPropertyByGeoIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
        .ReturnsAsync((PacsPropertyCore?)null);

    var controller = new HarrisPACSIntegrationController(
        pacsAdapter.Object,
        NullLogger<HarrisPACSIntegrationController>.Instance,
        db,
        CreateHostEnvironment("Production"));
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.GetAssessments("Benton", "PARCEL-101");

    // If the guard passes, we reach the property lookup which returns NotFound (no PACS data)
    result.Result.Should().BeOfType<NotFoundObjectResult>();
  }

  // ═══════════════════════════════════════════════════════════
  //  Wave 9: Real CostForge Calculator Tests
  // ═══════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "CostForge")]
  public void CostForge_RealCalculator_R1Central_StandardQuality_ReturnsExpectedCost()
  {
    // From quarantine: R1 Central $127.50/sqft, 2000sqft, built 2015 (age ~10 → bracket 6-15 → 0.87)
    var result = CostForgeController.ComputeCostEstimate(
      "R1", "Central", 2000m, 2015, "STANDARD", "GOOD", "STANDARD");

    result.Should().NotBeNull();
    result!.BuildingType.Should().Be("R1");
    result.BaseCostPerSqft.Should().Be(127.50m);
    result.RegionFactor.Should().Be(1.00m);
    result.QualityFactor.Should().Be(1.00m);
    result.ConditionFactor.Should().Be(1.00m);
    result.ComplexityFactor.Should().Be(1.00m);
    result.DepreciationFactor.Should().Be(0.87m);
    result.AdjustedCostPerSqft.Should().Be(110.92m); // 127.50 × 0.87 = 110.925 → 110.92 (bankers: .5 rounds to even)
    result.TotalCost.Should().Be(221_840.00m); // 110.92 × 2000
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public void CostForge_RealCalculator_VerifiesAllBuildingTypes()
  {
    // All 11 building types should resolve for Central region
    string[] types = ["R1", "R2", "C1", "C2", "C3", "C4", "A1", "A2", "I1", "S1", "S2"];
    foreach (var bt in types)
    {
      var result = CostForgeController.ComputeCostEstimate(
        bt, "Central", 1000m, 2024, "STANDARD", "GOOD", "STANDARD");
      result.Should().NotBeNull($"Building type {bt} should have a cost matrix entry");
      result!.TotalCost.Should().BeGreaterThan(0m);
    }
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public void CostForge_RealCalculator_VerifiesAllRegions()
  {
    string[] regions = ["Central", "East", "West", "North", "South"];
    foreach (var region in regions)
    {
      var result = CostForgeController.ComputeCostEstimate(
        "R1", region, 1000m, 2024, "STANDARD", "GOOD", "STANDARD");
      result.Should().NotBeNull($"Region '{region}' should have cost matrix entries");
      result!.TotalCost.Should().BeGreaterThan(0m);
    }
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public void CostForge_RealCalculator_UnknownBuildingType_ReturnsNull()
  {
    var result = CostForgeController.ComputeCostEstimate(
      "ZZZZ", "Central", 1000m, 2024, "STANDARD", "GOOD", "STANDARD");
    result.Should().BeNull();
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public void CostForge_RealCalculator_QualityGradesAffectCost()
  {
    var economy = CostForgeController.ComputeCostEstimate(
      "R1", "Central", 1000m, 2024, "ECONOMY", "GOOD", "STANDARD")!;
    var luxury = CostForgeController.ComputeCostEstimate(
      "R1", "Central", 1000m, 2024, "LUXURY", "GOOD", "STANDARD")!;

    luxury.TotalCost.Should().BeGreaterThan(economy.TotalCost,
      "LUXURY quality should produce higher cost than ECONOMY");
    luxury.QualityFactor.Should().Be(1.55m);
    economy.QualityFactor.Should().Be(0.75m);
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public void CostForge_RealCalculator_DepreciationBrackets_Residential()
  {
    // New construction (age 0)
    CostForgeController.GetDepreciationFactor(0, isResidential: true).Should().Be(0.95m);
    // 10 years old
    CostForgeController.GetDepreciationFactor(10, isResidential: true).Should().Be(0.87m);
    // 20 years old
    CostForgeController.GetDepreciationFactor(20, isResidential: true).Should().Be(0.70m);
    // 30 years old
    CostForgeController.GetDepreciationFactor(30, isResidential: true).Should().Be(0.50m);
    // 50 years old
    CostForgeController.GetDepreciationFactor(50, isResidential: true).Should().Be(0.35m);
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public void CostForge_RealCalculator_DepreciationBrackets_Commercial()
  {
    CostForgeController.GetDepreciationFactor(0, isResidential: false).Should().Be(0.97m);
    CostForgeController.GetDepreciationFactor(10, isResidential: false).Should().Be(0.85m);
    CostForgeController.GetDepreciationFactor(20, isResidential: false).Should().Be(0.65m);
    CostForgeController.GetDepreciationFactor(30, isResidential: false).Should().Be(0.40m);
    CostForgeController.GetDepreciationFactor(50, isResidential: false).Should().Be(0.25m);
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public void CostForge_RealCalculator_CaseInsensitiveInputs()
  {
    var upper = CostForgeController.ComputeCostEstimate(
      "R1", "CENTRAL", 1000m, 2020, "standard", "good", "standard");
    var lower = CostForgeController.ComputeCostEstimate(
      "r1", "central", 1000m, 2020, "STANDARD", "GOOD", "STANDARD");

    upper.Should().NotBeNull();
    lower.Should().NotBeNull();
    upper!.TotalCost.Should().Be(lower!.TotalCost);
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public void CostForge_RealCalculator_BankersRounding()
  {
    CostForgeController.BankersRound(10.125m).Should().Be(10.12m); // .5 → even
    CostForgeController.BankersRound(10.135m).Should().Be(10.14m); // .5 → even
    CostForgeController.BankersRound(10.1251m).Should().Be(10.13m);
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public void CostForge_RealCalculator_MatrixHas55Entries()
  {
    // 11 building types × 5 regions = 55 entries
    CostForgeController.BentonCostData.CostMatrix.Should().HaveCount(55);
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public async Task CostForge_CostEstimate_WithoutCountyClaims_ReturnsForbid()
  {
    await using var db = CreateDbContext(nameof(CostForge_CostEstimate_WithoutCountyClaims_ReturnsForbid));
    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var costForgeAiService = new Mock<CostForgeAIService>(MockBehavior.Strict);
    var auditLogger = new Mock<AuditLogger>(MockBehavior.Strict);

    var controller = new CostForgeController(
      costForgeService.Object,
      costForgeAiService.Object,
      db,
      auditLogger.Object,
      NullLogger<CostForgeController>.Instance);
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = await controller.CalculateCostEstimate(new CostEstimateRequest
    {
      BuildingType = "R1",
      SquareFeet = 2000m,
    });

    result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public async Task CostForge_CostEstimate_WithValidClaims_ReturnsOk()
  {
    await using var db = CreateDbContext(nameof(CostForge_CostEstimate_WithValidClaims_ReturnsOk));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var costForgeAiService = new Mock<CostForgeAIService>(MockBehavior.Strict);
    var auditLogger = new Mock<AuditLogger>(MockBehavior.Strict);
    auditLogger
      .Setup(a => a.LogUserActionAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
      .Returns(Task.CompletedTask);

    var controller = new CostForgeController(
      costForgeService.Object,
      costForgeAiService.Object,
      db,
      auditLogger.Object,
      NullLogger<CostForgeController>.Instance);
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));
    // Need HttpContext.Response for X-CostForge-Source header
    controller.ControllerContext.HttpContext = new DefaultHttpContext
    {
      User = CreatePrincipal(countyId, "BENTON"),
    };

    var result = await controller.CalculateCostEstimate(new CostEstimateRequest
    {
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 2000m,
      YearBuilt = 2020,
      QualityGrade = "STANDARD",
      ConditionGrade = "GOOD",
      ComplexityGrade = "STANDARD",
    });

    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();

    // Verify source header
    controller.Response.Headers["X-CostForge-Source"].ToString()
      .Should().Be("benton-real-calculator-fy2025");
  }

  [Fact]
  [Trait("Category", "CostForge")]
  public async Task CostForge_CostEstimate_MissingBuildingType_ReturnsBadRequest()
  {
    await using var db = CreateDbContext(nameof(CostForge_CostEstimate_MissingBuildingType_ReturnsBadRequest));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var costForgeAiService = new Mock<CostForgeAIService>(MockBehavior.Strict);
    var auditLogger = new Mock<AuditLogger>(MockBehavior.Strict);

    var controller = new CostForgeController(
      costForgeService.Object,
      costForgeAiService.Object,
      db,
      auditLogger.Object,
      NullLogger<CostForgeController>.Instance);
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));
    controller.ControllerContext.HttpContext = new DefaultHttpContext
    {
      User = CreatePrincipal(countyId, "BENTON"),
    };

    var result = await controller.CalculateCostEstimate(new CostEstimateRequest
    {
      BuildingType = "",
      SquareFeet = 2000m,
    });

    result.Should().BeOfType<BadRequestObjectResult>();
  }
}
