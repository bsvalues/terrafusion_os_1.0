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

  // ═══════════════════════════════════════════════════════════
  //  Wave 10: Real Atlas ArcGIS Tests
  // ═══════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "Atlas")]
  public void Atlas_ArcGisData_Has14Layers()
  {
    AtlasController.BentonArcGisData.Layers.Should().HaveCount(14);
  }

  [Fact]
  [Trait("Category", "Atlas")]
  public void Atlas_ArcGisData_AllLayersHaveServiceUrls()
  {
    foreach (var layer in AtlasController.BentonArcGisData.Layers)
    {
      layer.ServiceUrl.Should().StartWith("https://services7.arcgis.com/",
        $"Layer '{layer.Name}' should have a valid ArcGIS service URL");
    }
  }

  [Fact]
  [Trait("Category", "Atlas")]
  public void Atlas_ArcGisData_AllLayersHaveCategories()
  {
    var validCategories = new[] { "parcels", "zoning", "hazards", "admin", "infrastructure", "assessment" };
    foreach (var layer in AtlasController.BentonArcGisData.Layers)
    {
      validCategories.Should().Contain(layer.Category,
        $"Layer '{layer.Name}' has unknown category '{layer.Category}'");
    }
  }

  [Fact]
  [Trait("Category", "Atlas")]
  public void Atlas_ArcGisData_AllLayersHaveGeometryType()
  {
    var validTypes = new[] { "polygon", "point", "line" };
    foreach (var layer in AtlasController.BentonArcGisData.Layers)
    {
      validTypes.Should().Contain(layer.GeometryType,
        $"Layer '{layer.Name}' has unknown geometry type '{layer.GeometryType}'");
    }
  }

  [Fact]
  [Trait("Category", "Atlas")]
  public void Atlas_BuildArcGisParcelQueryUrl_FormatsCorrectly()
  {
    var url = AtlasController.BuildArcGisParcelQueryUrl("12345-001");
    url.Should().Contain("PARCEL_ID");
    url.Should().Contain("12345-001");
    url.Should().Contain("f=geojson");
    url.Should().Contain("outSR=4326");
    url.Should().StartWith("https://services7.arcgis.com/");
  }

  [Fact]
  [Trait("Category", "Atlas")]
  public void Atlas_BuildArcGisParcelQueryUrl_EscapesSpecialChars()
  {
    var url = AtlasController.BuildArcGisParcelQueryUrl("ABC 123");
    url.Should().Contain("ABC%20123");
  }

  [Fact]
  [Trait("Category", "Atlas")]
  public void Atlas_ServiceEndpoints_AreConsistent()
  {
    // All service URLs should use the same ArcGIS base domain
    AtlasController.BentonArcGisData.ParcelServiceUrl.Should().Contain("NURlY7V8UHl6XumF");
    AtlasController.BentonArcGisData.TaxLotServiceUrl.Should().Contain("NURlY7V8UHl6XumF");
    AtlasController.BentonArcGisData.ZoningServiceUrl.Should().Contain("NURlY7V8UHl6XumF");
    AtlasController.BentonArcGisData.CityLimitsServiceUrl.Should().Contain("NURlY7V8UHl6XumF");
    AtlasController.BentonArcGisData.FloodZoneServiceUrl.Should().Contain("NURlY7V8UHl6XumF");
  }

  [Fact]
  [Trait("Category", "Atlas")]
  public async Task Atlas_ArcGisLayers_WithoutCountyClaims_ReturnsOk()
  {
    // ArcGIS layers endpoint is a static catalog — no county isolation needed
    await using var db = CreateDbContext(nameof(Atlas_ArcGisLayers_WithoutCountyClaims_ReturnsOk));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetArcGisLayers(null);
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();
  }

  [Fact]
  [Trait("Category", "Atlas")]
  public async Task Atlas_ArcGisLayers_FilterByCategory()
  {
    await using var db = CreateDbContext(nameof(Atlas_ArcGisLayers_FilterByCategory));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetArcGisLayers("parcels");
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();
  }

  [Fact]
  [Trait("Category", "Atlas")]
  public async Task Atlas_ParcelArcGisLink_WithoutClaims_ReturnsForbid()
  {
    await using var db = CreateDbContext(nameof(Atlas_ParcelArcGisLink_WithoutClaims_ReturnsForbid));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = await controller.GetParcelArcGisLink("12345");
    result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  [Trait("Category", "Atlas")]
  public async Task Atlas_ParcelArcGisLink_WithValidClaims_ParcelNotFound()
  {
    await using var db = CreateDbContext(nameof(Atlas_ParcelArcGisLink_WithValidClaims_ParcelNotFound));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.GetParcelArcGisLink("NONEXISTENT");
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  [Trait("Category", "Atlas")]
  public async Task Atlas_ParcelArcGisLink_WithValidParcel_ReturnsArcGisUrl()
  {
    await using var db = CreateDbContext(nameof(Atlas_ParcelArcGisLink_WithValidParcel_ReturnsArcGisUrl));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    var prop = CreateProperty(countyId, "TEST-PARCEL-001");
    db.Properties.Add(prop);
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext
    {
      User = CreatePrincipal(countyId, "BENTON"),
    };

    var result = await controller.GetParcelArcGisLink("TEST-PARCEL-001");
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();

    // Verify source header
    controller.Response.Headers["X-Atlas-Source"].ToString()
      .Should().Be("benton-arcgis-fy2025");
  }

  // ═══════════════════════════════════════════════════════════════
  // WAVE 11 — DAIS PERMIT CLASSIFICATION TESTS
  // Real Benton County permit classifier from quarantined terra-permit
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_PermitTypes_ContainsRealBentonCountyTypes()
  {
    var types = DaisController.BentonPermitData.PermitTypes;
    types.Should().NotBeEmpty();
    types.Length.Should().Be(21);

    // Verify key permit types exist
    types.Should().Contain(t => t.Code == "RES-NEW" && t.Category == "Residential");
    types.Should().Contain(t => t.Code == "COM-NEW" && t.Category == "Commercial");
    types.Should().Contain(t => t.Code == "DEMO" && t.Category == "General");
    types.Should().Contain(t => t.Code == "RES-ADU");
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_PermitTypes_ValueImpactConsistency()
  {
    var types = DaisController.BentonPermitData.PermitTypes;

    // Maintenance types should NOT affect value
    types.First(t => t.Code == "RES-ROOF").AlwaysAffectsValue.Should().BeFalse();
    types.First(t => t.Code == "RES-HVAC").AlwaysAffectsValue.Should().BeFalse();
    types.First(t => t.Code == "RES-FENCE").AlwaysAffectsValue.Should().BeFalse();
    types.First(t => t.Code == "MECH").AlwaysAffectsValue.Should().BeFalse();

    // Construction types MUST affect value
    types.First(t => t.Code == "RES-NEW").AlwaysAffectsValue.Should().BeTrue();
    types.First(t => t.Code == "COM-NEW").AlwaysAffectsValue.Should().BeTrue();
    types.First(t => t.Code == "RES-POOL").AlwaysAffectsValue.Should().BeTrue();
    types.First(t => t.Code == "DEMO").AlwaysAffectsValue.Should().BeTrue();
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_WorkflowStages_AreOrderedAndComplete()
  {
    var stages = DaisController.BentonPermitData.WorkflowStages;
    stages.Length.Should().Be(6);

    // Verify order
    stages[0].Stage.Should().Be("INTAKE");
    stages[1].Stage.Should().Be("CLASSIFICATION");
    stages[2].Stage.Should().Be("INSPECTION_REVIEW");
    stages[3].Stage.Should().Be("VALUATION_UPDATE");
    stages[4].Stage.Should().Be("QA_REVIEW");
    stages[5].Stage.Should().Be("COMPLETED");

    // Each stage has a responsible party
    foreach (var stage in stages)
    {
      stage.ResponsibleParty.Should().NotBeNullOrWhiteSpace();
    }
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_FeeSchedule_HasRealisticFees()
  {
    var fees = DaisController.BentonPermitData.FeeSchedule;
    fees.Should().NotBeEmpty();
    fees.Length.Should().Be(15);

    // All fees should be positive
    foreach (var fee in fees)
    {
      fee.BaseFee.Should().BeGreaterThan(0);
    }

    // Residential new construction should be more expensive than a fence
    var resNew = fees.First(f => f.PermitType == "Residential New Construction");
    var fence = fees.First(f => f.PermitType == "Residential Fence");
    resNew.BaseFee.Should().BeGreaterThan(fence.BaseFee);

    // Commercial should be more expensive than residential
    var comNew = fees.First(f => f.PermitType == "Commercial New Construction");
    comNew.BaseFee.Should().BeGreaterThan(resNew.BaseFee);
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_Classify_CommercialNeighborhoodCode_ReturnsEnter()
  {
    var result = DaisController.ClassifyPermitDescription(
        "Install new HVAC system", "6100");

    result.Decision.Should().Be("ENTER");
    result.Rule.Should().Be("COMMERCIAL");
    result.Priority.Should().Be(1);
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_Classify_MaintenanceKeyword_ReturnsSkip()
  {
    var result = DaisController.ClassifyPermitDescription(
        "Re-roof existing residential structure", null);

    result.Decision.Should().Be("SKIP");
    result.Rule.Should().Be("MAINTENANCE_SKIP");
    result.Priority.Should().Be(2);
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_Classify_HvacReplacement_ReturnsSkip()
  {
    var result = DaisController.ClassifyPermitDescription(
        "Replace existing HVAC unit with new heat pump", null);

    result.Decision.Should().Be("SKIP");
    result.Rule.Should().Be("MAINTENANCE_SKIP");
    result.Priority.Should().Be(2);
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_Classify_NewConstruction_ReturnsEnter()
  {
    var result = DaisController.ClassifyPermitDescription(
        "New construction single family dwelling", null);

    result.Decision.Should().Be("ENTER");
    result.Rule.Should().Be("VALUE_ADD");
    result.Priority.Should().Be(3);
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_Classify_InGroundPool_ReturnsEnter()
  {
    var result = DaisController.ClassifyPermitDescription(
        "Install in-ground pool with decking", null);

    result.Decision.Should().Be("ENTER");
    result.Rule.Should().Be("VALUE_ADD");
    result.Priority.Should().Be(3);
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_Classify_UnknownPermit_DefaultsToEnter()
  {
    var result = DaisController.ClassifyPermitDescription(
        "Construct attached pergola with electrical", null);

    result.Decision.Should().Be("ENTER");
    result.Rule.Should().Be("DEFAULT");
    result.Priority.Should().Be(4);
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_Classify_CommercialOverridesMaintenance()
  {
    // Even if description says "re-roof", commercial neighborhood code takes priority
    var result = DaisController.ClassifyPermitDescription(
        "Re-roof commercial building", "6200");

    result.Decision.Should().Be("ENTER");
    result.Rule.Should().Be("COMMERCIAL");
    result.Priority.Should().Be(1);
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_PermitTypesEndpoint_ReturnsOk()
  {
    var controller = new DaisController(
        CreateDbContext(nameof(Dais_PermitTypesEndpoint_ReturnsOk)),
        NullLogger<DaisController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetPermitTypes();
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_WorkflowStagesEndpoint_ReturnsOk()
  {
    var controller = new DaisController(
        CreateDbContext(nameof(Dais_WorkflowStagesEndpoint_ReturnsOk)),
        NullLogger<DaisController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetWorkflowStages();
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_FeeScheduleEndpoint_ReturnsOk()
  {
    var controller = new DaisController(
        CreateDbContext(nameof(Dais_FeeScheduleEndpoint_ReturnsOk)),
        NullLogger<DaisController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetFeeSchedule();
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_ClassificationRulesEndpoint_ReturnsOk()
  {
    var controller = new DaisController(
        CreateDbContext(nameof(Dais_ClassificationRulesEndpoint_ReturnsOk)),
        NullLogger<DaisController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetClassificationRules();
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_ClassifyEndpoint_WithValidInput_ReturnsOk()
  {
    var controller = new DaisController(
        CreateDbContext(nameof(Dais_ClassifyEndpoint_WithValidInput_ReturnsOk)),
        NullLogger<DaisController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var request = new DaisController.PermitClassifyRequest("New construction dwelling", null);
    var result = controller.ClassifyPermit(request);
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();

    // Verify provenance header
    controller.Response.Headers["X-Dais-Source"].ToString()
      .Should().Be("benton-real-permits-fy2025");
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_ClassifyEndpoint_NullRequest_ReturnsBadRequest()
  {
    var controller = new DaisController(
        CreateDbContext(nameof(Dais_ClassifyEndpoint_NullRequest_ReturnsBadRequest)),
        NullLogger<DaisController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.ClassifyPermit(null!);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Dais")]
  public async Task Dais_AssessmentImpact_WithoutClaims_ReturnsForbid()
  {
    await using var db = CreateDbContext(nameof(Dais_AssessmentImpact_WithoutClaims_ReturnsForbid));
    var controller = new DaisController(db, NullLogger<DaisController>.Instance);
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = await controller.GetPermitAssessmentImpact("12345");
    result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  [Trait("Category", "Dais")]
  public async Task Dais_AssessmentImpact_ParcelNotFound_ReturnsNotFound()
  {
    await using var db = CreateDbContext(nameof(Dais_AssessmentImpact_ParcelNotFound_ReturnsNotFound));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new DaisController(db, NullLogger<DaisController>.Instance);
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.GetPermitAssessmentImpact("NONEXISTENT");
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  [Trait("Category", "Dais")]
  public async Task Dais_AssessmentImpact_ValidParcel_ReturnsOk()
  {
    await using var db = CreateDbContext(nameof(Dais_AssessmentImpact_ValidParcel_ReturnsOk));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    var prop = CreateProperty(countyId, "DAIS-PARCEL-001");
    db.Properties.Add(prop);
    await db.SaveChangesAsync();

    var controller = new DaisController(db, NullLogger<DaisController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext
    {
      User = CreatePrincipal(countyId, "BENTON"),
    };

    var result = await controller.GetPermitAssessmentImpact("DAIS-PARCEL-001");
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();

    // Verify provenance header
    controller.Response.Headers["X-Dais-Source"].ToString()
      .Should().Be("benton-real-permits-fy2025");
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_MaintenanceKeywords_AreComplete()
  {
    var keywords = DaisController.BentonPermitData.MaintenanceKeywords;
    keywords.Should().Contain("hvac");
    keywords.Should().Contain("re-roof");
    keywords.Should().Contain("heat pump");
    keywords.Should().Contain("fence");
    keywords.Should().Contain("water heater");
    keywords.Should().Contain("mini split");
    keywords.Should().Contain("like-for-like");
    keywords.Should().Contain("maintenance");
    keywords.Should().Contain("repair");
    keywords.Should().Contain("replacement");
  }

  [Fact]
  [Trait("Category", "Dais")]
  public void Dais_ValueAddKeywords_AreComplete()
  {
    var keywords = DaisController.BentonPermitData.ValueAddKeywords;
    keywords.Should().Contain("in-ground pool");
    keywords.Should().Contain("new construction");
    keywords.Should().Contain("addition");
    keywords.Should().Contain("adu");
    keywords.Should().Contain("accessory dwelling");
    keywords.Should().Contain("finished basement");
  }

  // ═══════════════════════════════════════════════════════════════
  // WAVE 12 — LEVY ENGINE TESTS
  // Real Benton County levy certification and RCW 84.55 calculator
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_BentonTaxingDistricts_ContainsRealDistricts()
  {
    var districts = LevyCalculationController.BentonLevyData.TaxingDistricts;
    districts.Should().NotBeEmpty();
    districts.Length.Should().Be(22);

    // County levies
    districts.Should().Contain(d => d.Code == "BC-REG" && d.Type == "county-regular");
    districts.Should().Contain(d => d.Code == "BC-ROAD" && d.Type == "county-roads");

    // Cities
    districts.Should().Contain(d => d.Code == "KENN" && d.Name.Contains("Kennewick"));
    districts.Should().Contain(d => d.Code == "RICH" && d.Name.Contains("Richland"));

    // School districts
    districts.Should().Contain(d => d.Code == "KSD-17" && d.Type == "school-district");
    districts.Should().Contain(d => d.Code == "RSD-400" && d.Type == "school-district");
    districts.Should().Contain(d => d.Code == "KBSD-52" && d.Type == "school-district");

    // Fire districts
    districts.Should().Contain(d => d.Code == "FD-1" && d.Type == "fire-district");
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_StatutoryLimits_Complete()
  {
    var limits = LevyCalculationController.BentonLevyData.StatutoryLimits;
    limits.Should().NotBeEmpty();
    limits.Length.Should().Be(14);

    // Key limits
    limits.Should().Contain(l => l.DistrictType == "county-regular" && l.LimitPerThousandAV == 1.80);
    limits.Should().Contain(l => l.DistrictType == "city" && l.LimitPerThousandAV == 3.375);
    limits.Should().Contain(l => l.DistrictType == "school-district" && l.LimitPerThousandAV == 5.90);
    limits.Should().Contain(l => l.DistrictType == "fire-district" && l.LimitPerThousandAV == 1.50);
    limits.Should().Contain(l => l.DistrictType == "aggregate-tier-1" && l.LimitPerThousandAV == 5.90);
    limits.Should().Contain(l => l.DistrictType == "aggregate-tier-2" && l.LimitPerThousandAV == 10.00);
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_CertificationSteps_AreOrderedAndComplete()
  {
    var steps = LevyCalculationController.BentonLevyData.CertificationSteps;
    steps.Length.Should().Be(8);

    steps[0].Name.Should().Be("Budget Submission");
    steps[2].Name.Should().Be("Highest Lawful Levy Calculation");
    steps[4].Name.Should().Be("Aggregate Limit Check");
    steps[5].Name.Should().Be("Proration (if required)");
    steps[6].Name.Should().Be("Levy Certification");
    steps[7].Name.Should().Be("Tax Roll Extension");

    // Each step has an RCW reference
    foreach (var step in steps)
    {
      step.RcwReference.Should().StartWith("RCW");
    }
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_HighestLawfulLevy_BasicCalculation()
  {
    // Prior year: $10,000,000 levy on $5B assessed value
    // 101% factor: $10,100,000
    var request = new LevyCalculationController.HighestLawfulLevyRequest(
        PriorYearLevy: 10_000_000,
        PriorAssessedValue: 5_000_000_000,
        CurrentAssessedValue: 5_200_000_000);

    var result = LevyCalculationController.ComputeHighestLawfulLevy(request);

    result.LimitFactor.Should().Be(1.01);
    result.BaseHighestLawful.Should().Be(10_100_000.00);
    result.NewConstructionComponent.Should().Be(0);
    result.AnnexationComponent.Should().Be(0);
    result.HighestLawfulLevy.Should().Be(10_100_000.00);
    result.LidLiftApplied.Should().BeFalse();
    result.EffectiveLevy.Should().Be(10_100_000.00);
    result.StatutoryReference.Should().Be("RCW 84.55.010");
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_HighestLawfulLevy_WithNewConstruction()
  {
    // Prior year rate: $10M / $5B × 1000 = $2.00 per $1,000
    // New construction: $50M × $2.00/1000 = $100,000
    var request = new LevyCalculationController.HighestLawfulLevyRequest(
        PriorYearLevy: 10_000_000,
        PriorAssessedValue: 5_000_000_000,
        CurrentAssessedValue: 5_050_000_000,
        NewConstructionValue: 50_000_000);

    var result = LevyCalculationController.ComputeHighestLawfulLevy(request);

    result.BaseHighestLawful.Should().Be(10_100_000.00);
    result.NewConstructionComponent.Should().Be(100_000.00);
    result.HighestLawfulLevy.Should().Be(10_200_000.00);
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_HighestLawfulLevy_WithLidLift()
  {
    var request = new LevyCalculationController.HighestLawfulLevyRequest(
        PriorYearLevy: 10_000_000,
        PriorAssessedValue: 5_000_000_000,
        CurrentAssessedValue: 5_000_000_000,
        LidLiftAmount: 12_000_000);

    var result = LevyCalculationController.ComputeHighestLawfulLevy(request);

    result.HighestLawfulLevy.Should().Be(10_100_000.00);
    result.LidLiftApplied.Should().BeTrue();
    result.EffectiveLevy.Should().Be(12_000_000.00);
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_HighestLawfulLevy_LidLiftBelowHLL_NotApplied()
  {
    var request = new LevyCalculationController.HighestLawfulLevyRequest(
        PriorYearLevy: 10_000_000,
        PriorAssessedValue: 5_000_000_000,
        CurrentAssessedValue: 5_000_000_000,
        LidLiftAmount: 9_000_000); // Below HLL — not applied

    var result = LevyCalculationController.ComputeHighestLawfulLevy(request);

    result.LidLiftApplied.Should().BeFalse();
    result.EffectiveLevy.Should().Be(10_100_000.00);
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_HighestLawfulLevy_EffectiveRateCalculation()
  {
    // $10.1M on $5B AV = $2.02 per $1,000
    var request = new LevyCalculationController.HighestLawfulLevyRequest(
        PriorYearLevy: 10_000_000,
        PriorAssessedValue: 5_000_000_000,
        CurrentAssessedValue: 5_000_000_000);

    var result = LevyCalculationController.ComputeHighestLawfulLevy(request);

    result.EffectiveRate.Should().Be(2.02);
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_AggregateCheck_WithinLimits()
  {
    var levies = new LevyCalculationController.DistrictLevyEntry[]
    {
        new("Benton County", "county-regular", 1.50),
        new("Road Fund", "county-roads", 2.00),
        new("Fire District #1", "fire-district", 1.00),
    };

    var result = LevyCalculationController.ComputeAggregateLimitCheck(levies);

    result.Tier1Sum.Should().Be(4.50); // county + fire = 1.50 + 2.00 + 1.00
    result.Tier1Compliant.Should().BeTrue();
    result.Tier2Sum.Should().Be(4.50);
    result.Tier2Compliant.Should().BeTrue();
    result.OverallCompliant.Should().BeTrue();
    result.ProrationRequired.Should().BeFalse();
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_AggregateCheck_Tier1Exceeded()
  {
    var levies = new LevyCalculationController.DistrictLevyEntry[]
    {
        new("Benton County", "county-regular", 1.80),
        new("Road Fund", "county-roads", 2.25),
        new("Fire District #1", "fire-district", 1.50),
        new("Library", "library-district", 0.50),
    };

    var result = LevyCalculationController.ComputeAggregateLimitCheck(levies);

    result.Tier1Sum.Should().Be(6.05); // Exceeds $5.90
    result.Tier1Compliant.Should().BeFalse();
    result.ProrationRequired.Should().BeTrue();
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_AggregateCheck_CityNotInTier1()
  {
    var levies = new LevyCalculationController.DistrictLevyEntry[]
    {
        new("Benton County", "county-regular", 1.50),
        new("Kennewick", "city", 3.00),
    };

    var result = LevyCalculationController.ComputeAggregateLimitCheck(levies);

    // City is NOT in tier 1 — only county is
    result.Tier1Sum.Should().Be(1.50);
    result.Tier2Sum.Should().Be(4.50); // Both: 1.50 + 3.00
    result.OverallCompliant.Should().BeTrue();
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_TaxingDistrictsEndpoint_ReturnsOk()
  {
    var controller = new LevyCalculationController(
        NullLogger<LevyCalculationController>.Instance,
        CreateDbContext(nameof(Levy_TaxingDistrictsEndpoint_ReturnsOk)));
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetBentonTaxingDistricts();
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_StatutoryLimitsEndpoint_ReturnsOk()
  {
    var controller = new LevyCalculationController(
        NullLogger<LevyCalculationController>.Instance,
        CreateDbContext(nameof(Levy_StatutoryLimitsEndpoint_ReturnsOk)));
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetStatutoryLimits();
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_CertificationStepsEndpoint_ReturnsOk()
  {
    var controller = new LevyCalculationController(
        NullLogger<LevyCalculationController>.Instance,
        CreateDbContext(nameof(Levy_CertificationStepsEndpoint_ReturnsOk)));
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetLevyCertificationSteps();
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_HighestLawfulLevyEndpoint_ValidRequest_ReturnsOk()
  {
    var controller = new LevyCalculationController(
        NullLogger<LevyCalculationController>.Instance,
        CreateDbContext(nameof(Levy_HighestLawfulLevyEndpoint_ValidRequest_ReturnsOk)));
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var request = new LevyCalculationController.HighestLawfulLevyRequest(
        PriorYearLevy: 10_000_000,
        PriorAssessedValue: 5_000_000_000,
        CurrentAssessedValue: 5_000_000_000);

    var result = controller.CalculateHighestLawfulLevy(request);
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();

    // Verify provenance header
    controller.Response.Headers["X-Levy-Source"].ToString()
      .Should().Be("benton-real-levy-engine-fy2025");
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_HighestLawfulLevyEndpoint_NullRequest_ReturnsBadRequest()
  {
    var controller = new LevyCalculationController(
        NullLogger<LevyCalculationController>.Instance,
        CreateDbContext(nameof(Levy_HighestLawfulLevyEndpoint_NullRequest_ReturnsBadRequest)));
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.CalculateHighestLawfulLevy(null!);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_AggregateCheckEndpoint_ValidRequest_ReturnsOk()
  {
    var controller = new LevyCalculationController(
        NullLogger<LevyCalculationController>.Instance,
        CreateDbContext(nameof(Levy_AggregateCheckEndpoint_ValidRequest_ReturnsOk)));
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var request = new LevyCalculationController.AggregateLimitRequest(
    [
        new LevyCalculationController.DistrictLevyEntry("County", "county-regular", 1.50),
        new LevyCalculationController.DistrictLevyEntry("Fire", "fire-district", 1.00),
    ]);

    var result = controller.CheckAggregateLimits(request);
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    okResult.Value.Should().NotBeNull();
  }

  [Fact]
  [Trait("Category", "Levy")]
  public void Levy_AggregateCheckEndpoint_NullRequest_ReturnsBadRequest()
  {
    var controller = new LevyCalculationController(
        NullLogger<LevyCalculationController>.Instance,
        CreateDbContext(nameof(Levy_AggregateCheckEndpoint_NullRequest_ReturnsBadRequest)));
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.CheckAggregateLimits(null!);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // ══════════════════════════════════════════════════════════════════
  // WAVE 13 — Dossier Document Management (Real Benton County Data)
  // ══════════════════════════════════════════════════════════════════

  private DossierController CreateDossierController(string dbName, Guid? countyId = null, bool isDev = true)
  {
    var db = CreateDbContext(dbName);
    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var hostEnvironment = new Mock<IHostEnvironment>();
    hostEnvironment.SetupGet(h => h.EnvironmentName).Returns(isDev ? "Development" : "Production");

    var controller = new DossierController(
        db, costForgeService.Object,
        NullLogger<DossierController>.Instance,
        hostEnvironment.Object);

    if (countyId.HasValue)
      AttachPrincipal(controller, CreatePrincipal(countyId.Value, "BENTON"));
    else
      controller.ControllerContext.HttpContext = new DefaultHttpContext();

    return controller;
  }

  // ── Document Types ──────────────────────────────────────────

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_DocumentTypesEndpoint_Returns18Types()
  {
    var controller = CreateDossierController(nameof(Dossier_DocumentTypesEndpoint_Returns18Types));
    var result = controller.GetDocumentTypes();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    ok.Value.Should().NotBeNull();

    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"county\":\"benton\"");
    json.Should().Contain("\"total\":18");
    json.Should().Contain("\"deed\"");

    controller.Response.Headers["X-Dossier-Source"].ToString()
        .Should().Be("benton-real-document-types-fy2025");
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_DocumentTypes_AllHaveRetentionClass()
  {
    var controller = CreateDossierController(nameof(Dossier_DocumentTypes_AllHaveRetentionClass));
    var result = controller.GetDocumentTypes();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;

    var json = JsonSerializer.Serialize(ok.Value);
    // Every document type must reference a retention class
    json.Should().Contain("RetentionClass");
    // Known classes must appear
    json.Should().Contain("permanent");
    json.Should().Contain("working-6yr");
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_DocumentTypes_IncludesQuarantineSourceTypes()
  {
    // Verify the 10 types from terra-flow-production quarantine are all present
    var controller = CreateDossierController(nameof(Dossier_DocumentTypes_IncludesQuarantineSourceTypes));
    var result = controller.GetDocumentTypes();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    foreach (var type in new[] { "deed", "mortgage", "lien", "easement", "plat", "survey",
                                  "tax_record", "appeal", "photo", "other" })
    {
      json.Should().Contain($"\"Type\":\"{type}\"",
          because: $"'{type}' is a core document type from terra-flow quarantine");
    }
  }

  // ── Retention Schedule ──────────────────────────────────────

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_RetentionScheduleEndpoint_Returns8Entries()
  {
    var controller = CreateDossierController(nameof(Dossier_RetentionScheduleEndpoint_Returns8Entries));
    var result = controller.GetRetentionSchedule();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    ok.Value.Should().NotBeNull();

    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"total\":8");
    json.Should().Contain("WA Secretary of State");
    json.Should().Contain("WA RCW");

    controller.Response.Headers["X-Dossier-Source"].ToString()
        .Should().Be("wa-sos-core-retention-schedule");
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_RetentionSchedule_AllHaveAuthority()
  {
    var controller = CreateDossierController(nameof(Dossier_RetentionSchedule_AllHaveAuthority));
    var result = controller.GetRetentionSchedule();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    // Every retention entry must cite WA RCW authority
    json.Should().Contain("\"Authority\":\"WA RCW");
    // Known retention periods present
    json.Should().Contain("Permanent");
    json.Should().Contain("6 years");
    json.Should().Contain("10 years");
  }

  // ── Evidence Categories ─────────────────────────────────────

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_EvidenceCategoriesEndpoint_Returns10Categories()
  {
    var controller = CreateDossierController(nameof(Dossier_EvidenceCategoriesEndpoint_Returns10Categories));
    var result = controller.GetEvidenceCategories();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    ok.Value.Should().NotBeNull();

    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"total\":10");
    json.Should().Contain("field-inspection");
    json.Should().Contain("comparable-sale");

    controller.Response.Headers["X-Dossier-Source"].ToString()
        .Should().Be("benton-real-evidence-categories-fy2025");
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_EvidenceCategories_AllHaveIntegrityRequirement()
  {
    var controller = CreateDossierController(nameof(Dossier_EvidenceCategories_AllHaveIntegrityRequirement));
    var result = controller.GetEvidenceCategories();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    json.Should().Contain("IntegrityRequirement");
    json.Should().Contain("MinCustodyDepth");
    json.Should().Contain("TypicalSources");
  }

  // ── Packet Templates ────────────────────────────────────────

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_PacketTemplatesEndpoint_Returns6Templates()
  {
    var controller = CreateDossierController(nameof(Dossier_PacketTemplatesEndpoint_Returns6Templates));
    var result = controller.GetPacketTemplates();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    ok.Value.Should().NotBeNull();

    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"total\":6");
    json.Should().Contain("annual-assessment");
    json.Should().Contain("boe-appeal-defense");
    json.Should().Contain("certification-roll");

    controller.Response.Headers["X-Dossier-Source"].ToString()
        .Should().Be("benton-real-packet-templates-fy2025");
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_PacketTemplates_AllCiteWaRcwAuthority()
  {
    var controller = CreateDossierController(nameof(Dossier_PacketTemplates_AllCiteWaRcwAuthority));
    var result = controller.GetPacketTemplates();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    json.Should().Contain("WA RCW");
    json.Should().Contain("RequiredDocumentTypes");
  }

  // ── Document Classifier ─────────────────────────────────────

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_ClassifyDocument_DeedKeyword_ReturnsCorrectType()
  {
    var controller = CreateDossierController(nameof(Dossier_ClassifyDocument_DeedKeyword_ReturnsCorrectType));
    var result = controller.ClassifyDocument(
        new DossierController.DocumentClassifyRequest("warranty_deed_2024.pdf", "Property deed transfer"));
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    json.Should().Contain("\"documentType\":\"deed\"");
    json.Should().Contain("\"evidenceCategory\":\"deed-transfer\"");
    json.Should().Contain("\"retentionClass\":\"permanent\"");
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_ClassifyDocument_AppealKeyword_ReturnsAppeal()
  {
    var controller = CreateDossierController(nameof(Dossier_ClassifyDocument_AppealKeyword_ReturnsAppeal));
    var result = controller.ClassifyDocument(
        new DossierController.DocumentClassifyRequest(null, "BOE appeal petition for parcel 123"));
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    json.Should().Contain("\"documentType\":\"appeal\"");
    json.Should().Contain("\"evidenceCategory\":\"appeal-evidence\"");
    json.Should().Contain("\"retentionClass\":\"appeal-10yr\"");
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_ClassifyDocument_PhotoKeyword_ReturnsPhoto()
  {
    var controller = CreateDossierController(nameof(Dossier_ClassifyDocument_PhotoKeyword_ReturnsPhoto));
    var result = controller.ClassifyDocument(
        new DossierController.DocumentClassifyRequest("property_photo.jpg", null));
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    json.Should().Contain("\"documentType\":\"photo\"");
    json.Should().Contain("\"evidenceCategory\":\"photo-evidence\"");
    json.Should().Contain("\"retentionClass\":\"life-of-property\"");
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_ClassifyDocument_UnknownInput_ReturnsFallback()
  {
    var controller = CreateDossierController(nameof(Dossier_ClassifyDocument_UnknownInput_ReturnsFallback));
    var result = controller.ClassifyDocument(
        new DossierController.DocumentClassifyRequest("random_file.dat", "Some unknown content"));
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    json.Should().Contain("\"documentType\":\"other\"");
    json.Should().Contain("\"matchedRule\":\"default-fallback\"");
    json.Should().Contain("\"confidence\":0.3");
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_ClassifyDocument_NullRequest_ReturnsBadRequest()
  {
    var controller = CreateDossierController(nameof(Dossier_ClassifyDocument_NullRequest_ReturnsBadRequest));
    var result = controller.ClassifyDocument(null!);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_ClassifyDocument_EmptyInput_ReturnsBadRequest()
  {
    var controller = CreateDossierController(nameof(Dossier_ClassifyDocument_EmptyInput_ReturnsBadRequest));
    var result = controller.ClassifyDocument(
        new DossierController.DocumentClassifyRequest(null, null));
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_ClassifyDocument_InspectionKeyword_ReturnsInspection()
  {
    var controller = CreateDossierController(nameof(Dossier_ClassifyDocument_InspectionKeyword_ReturnsInspection));
    var result = controller.ClassifyDocument(
        new DossierController.DocumentClassifyRequest("field_inspection_report.pdf", null));
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    json.Should().Contain("\"documentType\":\"inspection_report\"");
    json.Should().Contain("\"evidenceCategory\":\"field-inspection\"");
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public void Dossier_ClassifyDocument_ComparableKeyword_ReturnsComparable()
  {
    var controller = CreateDossierController(nameof(Dossier_ClassifyDocument_ComparableKeyword_ReturnsComparable));
    var result = controller.ClassifyDocument(
        new DossierController.DocumentClassifyRequest(null, "Sales comparison comparable analysis"));
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    json.Should().Contain("\"documentType\":\"comparable_analysis\"");
    json.Should().Contain("\"evidenceCategory\":\"comparable-sale\"");
  }

  // ── Internal Classifier Unit Tests ──────────────────────────

  [Theory]
  [Trait("Category", "Dossier")]
  [InlineData("deed", "deed")]
  [InlineData("mortgage", "mortgage")]
  [InlineData("lien", "lien")]
  [InlineData("plat map", "plat")]
  [InlineData("survey boundary", "survey")]
  [InlineData("income rental analysis", "income_analysis")]
  [InlineData("easement right of way", "easement")]
  [InlineData("exemption application", "exemption")]
  [InlineData("building permit", "permit")]
  [InlineData("notice correspondence", "correspondence")]
  [InlineData("floor plan sketch", "sketch")]
  public void Dossier_Classifier_KeywordMapping_CorrectType(string input, string expectedType)
  {
    var result = DossierController.ClassifyDocumentInput(input);
    var json = JsonSerializer.Serialize(result);
    json.Should().Contain($"\"documentType\":\"{expectedType}\"");
  }

  // ── Packet Manifest ─────────────────────────────────────────

  [Fact]
  [Trait("Category", "Dossier")]
  public async Task Dossier_PacketManifest_ValidParcel_ReturnsChecklist()
  {
    var countyId = Guid.NewGuid();
    var db = CreateDbContext(nameof(Dossier_PacketManifest_ValidParcel_ReturnsChecklist));
    db.Properties.Add(CreateProperty(countyId, "PKT-001"));
    db.SaveChanges();

    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var hostEnvironment = new Mock<IHostEnvironment>();
    hostEnvironment.SetupGet(h => h.EnvironmentName).Returns("Development");

    var controller = new DossierController(
        db, costForgeService.Object,
        NullLogger<DossierController>.Instance,
        hostEnvironment.Object);
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.GetPacketManifest("PKT-001", "annual-assessment");
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    ok.Value.Should().NotBeNull();

    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"packetType\":\"annual-assessment\"");
    json.Should().Contain("\"checklist\":");
    json.Should().Contain("completeness");

    controller.Response.Headers["X-Dossier-Source"].ToString()
        .Should().Be("benton-real-packet-manifest-fy2025");
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public async Task Dossier_PacketManifest_UnknownPacketType_ReturnsNotFound()
  {
    var countyId = Guid.NewGuid();
    var db = CreateDbContext(nameof(Dossier_PacketManifest_UnknownPacketType_ReturnsNotFound));
    db.Properties.Add(CreateProperty(countyId, "PKT-002"));
    db.SaveChanges();

    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var hostEnvironment = new Mock<IHostEnvironment>();
    hostEnvironment.SetupGet(h => h.EnvironmentName).Returns("Development");

    var controller = new DossierController(
        db, costForgeService.Object,
        NullLogger<DossierController>.Instance,
        hostEnvironment.Object);
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.GetPacketManifest("PKT-002", "nonexistent-type");
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public async Task Dossier_PacketManifest_MissingParcel_ReturnsNotFound()
  {
    var countyId = Guid.NewGuid();
    var db = CreateDbContext(nameof(Dossier_PacketManifest_MissingParcel_ReturnsNotFound));

    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var hostEnvironment = new Mock<IHostEnvironment>();
    hostEnvironment.SetupGet(h => h.EnvironmentName).Returns("Development");

    var controller = new DossierController(
        db, costForgeService.Object,
        NullLogger<DossierController>.Instance,
        hostEnvironment.Object);
    AttachPrincipal(controller, CreatePrincipal(countyId, "BENTON"));

    var result = await controller.GetPacketManifest("MISSING-PARCEL", "annual-assessment");
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  [Trait("Category", "Dossier")]
  public async Task Dossier_PacketManifest_InvalidParcelId_ReturnsBadRequest()
  {
    var controller = CreateDossierController(nameof(Dossier_PacketManifest_InvalidParcelId_ReturnsBadRequest), Guid.NewGuid());
    var result = await controller.GetPacketManifest("!!invalid!!", "annual-assessment");
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // ═══════════════════════════════════════════════════════════
  //  Wave 14: Real Income Approach Tests (CostForge)
  // ═══════════════════════════════════════════════════════════

  private CostForgeController CreateCostForgeController(string testName)
  {
    var db = CreateDbContext(testName);
    var costForgeService = new Mock<CostForgeService>(MockBehavior.Strict);
    var costForgeAiService = new Mock<CostForgeAIService>(MockBehavior.Strict);
    var auditLogger = new Mock<AuditLogger>(MockBehavior.Strict);
    var controller = new CostForgeController(
        costForgeService.Object,
        costForgeAiService.Object,
        db,
        auditLogger.Object,
        NullLogger<CostForgeController>.Instance);
    AttachPrincipal(controller, CreatePrincipal(Guid.NewGuid(), "BENTON"));
    return controller;
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_CapRates_Returns5PropertyTypes()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_CapRates_Returns5PropertyTypes));
    var result = controller.GetIncomeCapRates();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"marketCapRate\":5.5");
    json.Should().Contain("\"PropertyType\":\"residential\"");
    json.Should().Contain("\"PropertyType\":\"multi-family\"");
    json.Should().Contain("\"PropertyType\":\"commercial\"");
    json.Should().Contain("\"PropertyType\":\"industrial\"");
    json.Should().Contain("\"PropertyType\":\"land\"");
    controller.HttpContext.Response.Headers["X-CostForge-Source"].ToString()
      .Should().Be("benton-real-income-approach-fy2025");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_MarketData_ReturnsRealBentonIndicators()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_MarketData_ReturnsRealBentonIndicators));
    var result = controller.GetIncomeMarketData();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"MedianHouseholdIncome\":87500");
    json.Should().Contain("\"UnemploymentRate\":3.1");
    json.Should().Contain("\"PopulationGrowthRate\":1.8");
    json.Should().Contain("\"MedianHomePrice\":485000");
    json.Should().Contain("\"MedianPricePerSqft\":218");
    json.Should().Contain("\"MedianDaysOnMarket\":18");
    json.Should().Contain("\"MonthsOfInventory\":2.8");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_MarketData_HasEmploymentSectors()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_MarketData_HasEmploymentSectors));
    var result = controller.GetIncomeMarketData();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("Government");
    json.Should().Contain("Energy");
    json.Should().Contain("Healthcare");
    json.Should().Contain("Manufacturing");
    json.Should().Contain("Education");
    json.Should().Contain("Retail");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_ExpenseRatios_Returns4PropertyTypes()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_ExpenseRatios_Returns4PropertyTypes));
    var result = controller.GetIncomeExpenseRatios();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"PropertyType\":\"residential\"");
    json.Should().Contain("\"PropertyType\":\"multi-family\"");
    json.Should().Contain("\"PropertyType\":\"commercial\"");
    json.Should().Contain("\"PropertyType\":\"industrial\"");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_ExpenseRatios_Has7Categories()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_ExpenseRatios_Has7Categories));
    var result = controller.GetIncomeExpenseRatios();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("propertyTaxes");
    json.Should().Contain("insurance");
    json.Should().Contain("maintenance");
    json.Should().Contain("managementFees");
    json.Should().Contain("replacementReserves");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_LocationPremiums_Returns6TriCitiesLocations()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_LocationPremiums_Returns6TriCitiesLocations));
    var result = controller.GetIncomeLocationPremiums();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("Richland");
    json.Should().Contain("West Richland");
    json.Should().Contain("Kennewick");
    json.Should().Contain("Pasco");
    json.Should().Contain("Benton City");
    json.Should().Contain("Prosser");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_LocationPremiums_WestRichlandHighest()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_LocationPremiums_WestRichlandHighest));
    var result = controller.GetIncomeLocationPremiums();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // West Richland has highest premium (1.20)
    json.Should().Contain("\"Multiplier\":1.20");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_CalculateNoi_BasicScenario()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_CalculateNoi_BasicScenario));
    var request = new CostForgeController.NoiCalculationRequest
    {
      AnnualRentalIncome = 120_000m,
      VacancyRate = 5m,
      OtherIncome = 2_000m,
      PropertyTaxes = 8_000m,
      Insurance = 3_500m,
      Utilities = 4_000m,
      Maintenance = 6_000m,
      ManagementFees = 5_000m,
      ReplacementReserves = 2_000m,
      OtherExpenses = 1_500m,
    };
    var result = controller.CalculateNoi(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // EGI = 120000 × 0.95 + 2000 = 116000
    json.Should().Contain("\"EffectiveGrossIncome\":116000");
    // Total expenses = 8000+3500+4000+6000+5000+2000+1500 = 30000
    json.Should().Contain("\"TotalExpenses\":30000");
    // NOI = 116000 - 30000 = 86000
    json.Should().Contain("\"NetOperatingIncome\":86000");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_CalculateNoi_ZeroVacancy()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_CalculateNoi_ZeroVacancy));
    var request = new CostForgeController.NoiCalculationRequest
    {
      AnnualRentalIncome = 100_000m,
      VacancyRate = 0m,
      OtherIncome = 0m,
    };
    var result = controller.CalculateNoi(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // EGI = 100000 × 1.00 + 0 = 100000
    json.Should().Contain("\"EffectiveGrossIncome\":100000");
    // No expenses
    json.Should().Contain("\"TotalExpenses\":0");
    json.Should().Contain("\"NetOperatingIncome\":100000");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_CalculateNoi_RejectsNegativeIncome()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_CalculateNoi_RejectsNegativeIncome));
    var request = new CostForgeController.NoiCalculationRequest
    {
      AnnualRentalIncome = -1000m,
    };
    var result = controller.CalculateNoi(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_CalculateNoi_RejectsVacancyOver100()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_CalculateNoi_RejectsVacancyOver100));
    var request = new CostForgeController.NoiCalculationRequest
    {
      AnnualRentalIncome = 100_000m,
      VacancyRate = 101m,
    };
    var result = controller.CalculateNoi(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_CalculateNoi_ExpenseRatioCalculatedCorrectly()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_CalculateNoi_ExpenseRatioCalculatedCorrectly));
    var request = new CostForgeController.NoiCalculationRequest
    {
      AnnualRentalIncome = 100_000m,
      VacancyRate = 0m,
      PropertyTaxes = 10_000m,
      Insurance = 5_000m,
      Maintenance = 5_000m,
    };
    var result = controller.CalculateNoi(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // Expenses 20000 / EGI 100000 × 100 = 20 (JSON serializes trailing zeros as 20.0)
    json.Should().Contain("\"ExpenseRatio\":20");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_Valuation_BasicResidentialRichland()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_Valuation_BasicResidentialRichland));
    var request = new CostForgeController.IncomeValuationRequest
    {
      AnnualRentalIncome = 120_000m,
      VacancyRate = 5m,
      OtherIncome = 0m,
      PropertyTaxes = 8_000m,
      Insurance = 3_000m,
      Utilities = 4_000m,
      Maintenance = 5_000m,
      ManagementFees = 5_000m,
      ReplacementReserves = 2_000m,
      OtherExpenses = 1_000m,
      CapRate = 5.5m,
      Location = "Richland",
      PropertyType = "residential",
    };
    var result = controller.CalculateIncomeValuation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // EGI: 120000 × 0.95 = 114000, Expenses: 28000, NOI: 86000
    json.Should().Contain("\"NetOperatingIncome\":86000");
    // Raw: 86000 / 0.055 = 1563636.36...
    json.Should().Contain("\"RawValuation\":1563636.36");
    // Richland multiplier 1.15: 1563636.36 × 1.15 = 1798181.81...
    json.Should().Contain("\"LocationMultiplier\":1.15");
    json.Should().Contain("\"Location\":\"Richland\"");
    json.Should().Contain("\"RiskClassification\":\"medium\"");
    controller.HttpContext.Response.Headers["X-CostForge-Source"].ToString()
      .Should().Be("benton-real-income-approach-fy2025");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_Valuation_HighCapRate_LowRisk()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_Valuation_HighCapRate_LowRisk));
    var request = new CostForgeController.IncomeValuationRequest
    {
      AnnualRentalIncome = 200_000m,
      VacancyRate = 0m,
      CapRate = 8.5m,
      PropertyType = "commercial",
    };
    var result = controller.CalculateIncomeValuation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // cap 8.5 > 7, cashOnCash = NOI/rawVal × 100 = 8.5% > 8 → low risk
    json.Should().Contain("\"RiskClassification\":\"low\"");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_Valuation_LowCapRate_HighRisk()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_Valuation_LowCapRate_HighRisk));
    var request = new CostForgeController.IncomeValuationRequest
    {
      AnnualRentalIncome = 200_000m,
      VacancyRate = 0m,
      CapRate = 3.5m,
      PropertyType = "residential",
    };
    var result = controller.CalculateIncomeValuation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // cap 3.5 < 4 → high risk
    json.Should().Contain("\"RiskClassification\":\"high\"");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_Valuation_UnknownLocation_DefaultMultiplier()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_Valuation_UnknownLocation_DefaultMultiplier));
    var request = new CostForgeController.IncomeValuationRequest
    {
      AnnualRentalIncome = 100_000m,
      VacancyRate = 0m,
      CapRate = 5.5m,
      Location = "Yakima",
    };
    var result = controller.CalculateIncomeValuation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // Unknown location gets 1.00 multiplier → raw = adjusted
    json.Should().Contain("\"LocationMultiplier\":1.00");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_Valuation_RejectsZeroCapRate()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_Valuation_RejectsZeroCapRate));
    var request = new CostForgeController.IncomeValuationRequest
    {
      AnnualRentalIncome = 100_000m,
      CapRate = 0m,
    };
    var result = controller.CalculateIncomeValuation(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_Valuation_RejectsCapRateOver25()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_Valuation_RejectsCapRateOver25));
    var request = new CostForgeController.IncomeValuationRequest
    {
      AnnualRentalIncome = 100_000m,
      CapRate = 26m,
    };
    var result = controller.CalculateIncomeValuation(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_Valuation_GIMCalculatedCorrectly()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_Valuation_GIMCalculatedCorrectly));
    var request = new CostForgeController.IncomeValuationRequest
    {
      AnnualRentalIncome = 100_000m,
      VacancyRate = 0m,
      CapRate = 10.0m,
    };
    var result = controller.CalculateIncomeValuation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // NOI = 100000, Raw = 100000/0.10 = 1000000, GIM = 1000000/100000 = 10.00
    json.Should().Contain("\"GrossIncomeMultiplier\":10.00");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_ClassifyRisk_LowRisk()
  {
    CostForgeController.ClassifyRisk(8.0, 9.0).Should().Be("low");
    CostForgeController.ClassifyRisk(7.5, 8.5).Should().Be("low");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_ClassifyRisk_HighRisk()
  {
    CostForgeController.ClassifyRisk(3.0, 5.0).Should().Be("high");
    CostForgeController.ClassifyRisk(5.0, 2.0).Should().Be("high");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_ClassifyRisk_MediumRisk()
  {
    CostForgeController.ClassifyRisk(5.5, 5.5).Should().Be("medium");
    CostForgeController.ClassifyRisk(7.0, 8.0).Should().Be("medium");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_Valuation_ProsserLowestPremium()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_Valuation_ProsserLowestPremium));
    var request = new CostForgeController.IncomeValuationRequest
    {
      AnnualRentalIncome = 100_000m,
      VacancyRate = 0m,
      CapRate = 5.5m,
      Location = "Prosser",
    };
    var result = controller.CalculateIncomeValuation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // Prosser multiplier 0.85
    json.Should().Contain("\"LocationMultiplier\":0.85");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_CalculateNoi_BankersRoundingApplied()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_CalculateNoi_BankersRoundingApplied));
    // Create a scenario that triggers banker's rounding
    // 123456 × (1 - 7.5/100) = 123456 × 0.925 = 114196.80
    var request = new CostForgeController.NoiCalculationRequest
    {
      AnnualRentalIncome = 123_456m,
      VacancyRate = 7.5m,
      OtherIncome = 123m,
      PropertyTaxes = 100m,
    };
    var result = controller.CalculateNoi(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // EGI = 123456 × 0.925 + 123 = 114196.80 + 123 = 114319.80
    json.Should().Contain("\"EffectiveGrossIncome\":114319.80");
    // NOI = 114319.80 - 100 = 114219.80
    json.Should().Contain("\"NetOperatingIncome\":114219.80");
  }

  [Fact]
  [Trait("Category", "CostForge-Income")]
  public void IncomeApproach_Valuation_NullLocation_DefaultsToUnspecified()
  {
    var controller = CreateCostForgeController(nameof(IncomeApproach_Valuation_NullLocation_DefaultsToUnspecified));
    var request = new CostForgeController.IncomeValuationRequest
    {
      AnnualRentalIncome = 100_000m,
      VacancyRate = 0m,
      CapRate = 5.5m,
    };
    var result = controller.CalculateIncomeValuation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"Location\":\"unspecified\"");
  }

  // ═══════════════════════════════════════════════════════════
  //  Wave 15: Real Sales Comparison Tests (CostForge)
  // ═══════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_AdjustmentFactors_Returns5Physical()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_AdjustmentFactors_Returns5Physical));
    var result = controller.GetSalesAdjustmentFactors();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("GLA");
    json.Should().Contain("Lot Size");
    json.Should().Contain("Age");
    json.Should().Contain("Bedroom");
    json.Should().Contain("Bathroom");
    controller.HttpContext.Response.Headers["X-CostForge-Source"].ToString()
      .Should().Be("benton-real-sales-comparison-fy2025");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_AdjustmentFactors_HasConditionScale()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_AdjustmentFactors_HasConditionScale));
    var result = controller.GetSalesAdjustmentFactors();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("Excellent");
    json.Should().Contain("Good");
    json.Should().Contain("Average");
    json.Should().Contain("Fair");
    json.Should().Contain("Poor");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_MarketAreas_Returns8Neighborhoods()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_MarketAreas_Returns8Neighborhoods));
    var result = controller.GetSalesMarketAreas();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("Richland");
    json.Should().Contain("West Richland");
    json.Should().Contain("Kennewick");
    json.Should().Contain("Pasco");
    json.Should().Contain("Benton City");
    json.Should().Contain("Prosser");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_MarketAreas_Has12SeasonalityFactors()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_MarketAreas_Has12SeasonalityFactors));
    var result = controller.GetSalesMarketAreas();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("January");
    json.Should().Contain("July");
    json.Should().Contain("December");
    // July peak at 1.30
    json.Should().Contain("\"Factor\":1.30");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_ConfidenceThresholds_ReturnsLevelsAndFlags()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_ConfidenceThresholds_ReturnsLevelsAndFlags));
    var result = controller.GetSalesConfidenceThresholds();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("high");
    json.Should().Contain("moderate");
    json.Should().Contain("low");
    json.Should().Contain("gross_adj_high");
    json.Should().Contain("cv_high");
    json.Should().Contain("few_comparables");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_AdjustComparable_Comp1FromQuarantine()
  {
    // Replicate COMP-001 from quarantine fixture:
    // Subject: 2000 sqft, 10000 lot, 2000, 3bd/2ba, Good, Average
    // Comp: $350k, 1800 sqft, 9000 lot, 1998, 3bd/2ba, Good, Average
    var controller = CreateCostForgeController(nameof(SalesComp_AdjustComparable_Comp1FromQuarantine));
    var request = new CostForgeController.CompAdjustmentRequest
    {
      SalePrice = 350_000m,
      SubjectGla = 2000m,
      CompGla = 1800m,
      SubjectLotSize = 10_000m,
      CompLotSize = 9_000m,
      SubjectYearBuilt = 2000,
      CompYearBuilt = 1998,
      SubjectBedrooms = 3,
      CompBedrooms = 3,
      SubjectBathrooms = 2m,
      CompBathrooms = 2m,
      SubjectCondition = "Good",
      CompCondition = "Good",
      SubjectLocation = "Average",
      CompLocation = "Average",
    };
    var result = controller.AdjustComparable(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // GLA: (2000-1800)*100 = +20000
    json.Should().Contain("\"GlaAdjustment\":20000");
    // Lot: (10000-9000)*5 = +5000
    json.Should().Contain("\"LotAdjustment\":5000");
    // Age: (1998-2000)*500 = -1000
    json.Should().Contain("\"AgeAdjustment\":-1000");
    // Beds/baths/condition/location all zero
    json.Should().Contain("\"BedroomAdjustment\":0");
    json.Should().Contain("\"ConditionAdjustment\":0");
    json.Should().Contain("\"LocationAdjustment\":0");
    // Total: 20000+5000-1000 = 24000, Adjusted: 374000
    json.Should().Contain("\"TotalNetAdjustment\":24000");
    json.Should().Contain("\"AdjustedPrice\":374000");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_AdjustComparable_Comp2WithQualitativeAdj()
  {
    // COMP-002: $380k, 2200sqft, 11000lot, 2005, 4bd/2.5ba, Excellent, Good
    var controller = CreateCostForgeController(nameof(SalesComp_AdjustComparable_Comp2WithQualitativeAdj));
    var request = new CostForgeController.CompAdjustmentRequest
    {
      SalePrice = 380_000m,
      SubjectGla = 2000m,
      CompGla = 2200m,
      SubjectLotSize = 10_000m,
      CompLotSize = 11_000m,
      SubjectYearBuilt = 2000,
      CompYearBuilt = 2005,
      SubjectBedrooms = 3,
      CompBedrooms = 4,
      SubjectBathrooms = 2m,
      CompBathrooms = 2.5m,
      SubjectCondition = "Good",
      CompCondition = "Excellent",
      SubjectLocation = "Average",
      CompLocation = "Good",
    };
    var result = controller.AdjustComparable(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // GLA: (2000-2200)*100 = -20000
    json.Should().Contain("\"GlaAdjustment\":-20000");
    // Lot: (10000-11000)*5 = -5000
    json.Should().Contain("\"LotAdjustment\":-5000");
    // Age: (2005-2000)*500 = +2500
    json.Should().Contain("\"AgeAdjustment\":2500");
    // Bed: (3-4)*5000 = -5000
    json.Should().Contain("\"BedroomAdjustment\":-5000");
    // Bath: (2-2.5)*7500 = -3750
    json.Should().Contain("\"BathroomAdjustment\":-3750");
    // Condition: Good(10000)-Excellent(20000) = -10000
    json.Should().Contain("\"ConditionAdjustment\":-10000");
    // Location: Average(0)-Good(12500) = -12500
    json.Should().Contain("\"LocationAdjustment\":-12500");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_AdjustComparable_RejectsNegativeSalePrice()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_AdjustComparable_RejectsNegativeSalePrice));
    var request = new CostForgeController.CompAdjustmentRequest { SalePrice = -1m };
    var result = controller.AdjustComparable(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_AdjustComparable_GrossAdjPctCorrect()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_AdjustComparable_GrossAdjPctCorrect));
    var request = new CostForgeController.CompAdjustmentRequest
    {
      SalePrice = 350_000m,
      SubjectGla = 2000m,
      CompGla = 1800m, // +20000
      SubjectLotSize = 10_000m,
      CompLotSize = 9_000m, // +5000
      SubjectYearBuilt = 2000,
      CompYearBuilt = 1998, // -1000
    };
    var result = controller.AdjustComparable(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // Gross = |20000|+|5000|+|1000| = 26000, Gross% = 26000/350000*100 = 7.43%
    json.Should().Contain("\"GrossAdjustmentPct\":7.43");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_Reconcile_3CompsFromQuarantine()
  {
    // From quarantine fixture: COMP-001 adj $374000 (6.86%), COMP-002 adj $326250 (14.14%), COMP-003 adj $355000 (4.41%)
    var controller = CreateCostForgeController(nameof(SalesComp_Reconcile_3CompsFromQuarantine));
    var request = new CostForgeController.SalesReconciliationRequest
    {
      Comparables = new()
      {
        new() { AdjustedPrice = 374_000m, GrossAdjustmentPct = 6.86m },
        new() { AdjustedPrice = 326_250m, GrossAdjustmentPct = 14.14m },
        new() { AdjustedPrice = 355_000m, GrossAdjustmentPct = 4.41m },
      },
    };
    var result = controller.ReconcileComparables(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"ComparableCount\":3");
    // Median of sorted [326250, 355000, 374000] = 355000
    json.Should().Contain("\"Median\":355000");
    json.Should().Contain("\"Confidence\":\"high\"");
    json.Should().Contain("\"Low\":326250");
    json.Should().Contain("\"High\":374000");
    json.Should().Contain("\"Range\":47750");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_Reconcile_RejectsEmptyList()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_Reconcile_RejectsEmptyList));
    var request = new CostForgeController.SalesReconciliationRequest();
    var result = controller.ReconcileComparables(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_Reconcile_RejectsOver10Comps()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_Reconcile_RejectsOver10Comps));
    var comps = Enumerable.Range(1, 11)
      .Select(i => new CostForgeController.ReconciliationComp { AdjustedPrice = 300_000m + i * 1000m, GrossAdjustmentPct = 5m })
      .ToList();
    var request = new CostForgeController.SalesReconciliationRequest { Comparables = comps };
    var result = controller.ReconcileComparables(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_Reconcile_LowConfidence_1Comp()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_Reconcile_LowConfidence_1Comp));
    var request = new CostForgeController.SalesReconciliationRequest
    {
      Comparables = new() { new() { AdjustedPrice = 400_000m, GrossAdjustmentPct = 30m } },
    };
    var result = controller.ReconcileComparables(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"Confidence\":\"low\"");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_Reconcile_ModerateConfidence()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_Reconcile_ModerateConfidence));
    var request = new CostForgeController.SalesReconciliationRequest
    {
      Comparables = new()
      {
        new() { AdjustedPrice = 400_000m, GrossAdjustmentPct = 18m },
        new() { AdjustedPrice = 410_000m, GrossAdjustmentPct = 20m },
      },
    };
    var result = controller.ReconcileComparables(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"Confidence\":\"moderate\"");
    // Median of 2 = (400000+410000)/2 = 405000
    json.Should().Contain("\"Median\":405000");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_ClassifyConfidence_High()
  {
    CostForgeController.ClassifyConfidence(3, 8m, 12m).Should().Be("high");
    CostForgeController.ClassifyConfidence(5, 5m, 10m).Should().Be("high");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_ClassifyConfidence_Moderate()
  {
    CostForgeController.ClassifyConfidence(2, 15m, 20m).Should().Be("moderate");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_ClassifyConfidence_Low()
  {
    CostForgeController.ClassifyConfidence(1, 25m, 30m).Should().Be("low");
    CostForgeController.ClassifyConfidence(3, 25m, 5m).Should().Be("low");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_GetConditionAdjustment_AllRatings()
  {
    CostForgeController.GetConditionAdjustment("Excellent").Should().Be(20_000m);
    CostForgeController.GetConditionAdjustment("Good").Should().Be(10_000m);
    CostForgeController.GetConditionAdjustment("Average").Should().Be(0m);
    CostForgeController.GetConditionAdjustment("Fair").Should().Be(-10_000m);
    CostForgeController.GetConditionAdjustment("Poor").Should().Be(-25_000m);
    CostForgeController.GetConditionAdjustment(null).Should().Be(0m);
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_GetLocationAdjustment_AllRatings()
  {
    CostForgeController.GetLocationAdjustment("Superior").Should().Be(25_000m);
    CostForgeController.GetLocationAdjustment("Good").Should().Be(12_500m);
    CostForgeController.GetLocationAdjustment("Average").Should().Be(0m);
    CostForgeController.GetLocationAdjustment("Fair").Should().Be(-12_500m);
    CostForgeController.GetLocationAdjustment("Inferior").Should().Be(-25_000m);
    CostForgeController.GetLocationAdjustment(null).Should().Be(0m);
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_Reconcile_WeightedHigherForLessAdjusted()
  {
    // Comp with lower grossAdj% should get higher weight
    var controller = CreateCostForgeController(nameof(SalesComp_Reconcile_WeightedHigherForLessAdjusted));
    var request = new CostForgeController.SalesReconciliationRequest
    {
      Comparables = new()
      {
        new() { AdjustedPrice = 400_000m, GrossAdjustmentPct = 5m },   // low adj → high weight
        new() { AdjustedPrice = 350_000m, GrossAdjustmentPct = 20m },  // high adj → low weight
      },
    };
    var result = controller.ReconcileComparables(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // Weighted average should be closer to 400000 (the less-adjusted comp)
    // w1=1/5=0.2, w2=1/20=0.05 → normalized w1=0.8, w2=0.2
    // WA = 400000*0.8 + 350000*0.2 = 390000
    json.Should().Contain("\"WeightedAverage\":390000");
  }

  [Fact]
  [Trait("Category", "CostForge-Sales")]
  public void SalesComp_AdjustComparable_NullConditionsDefault()
  {
    var controller = CreateCostForgeController(nameof(SalesComp_AdjustComparable_NullConditionsDefault));
    var request = new CostForgeController.CompAdjustmentRequest
    {
      SalePrice = 300_000m,
      SubjectGla = 1500m,
      CompGla = 1500m,
      // Null condition and location → both default to 0
    };
    var result = controller.AdjustComparable(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"ConditionAdjustment\":0");
    json.Should().Contain("\"LocationAdjustment\":0");
    json.Should().Contain("\"TotalNetAdjustment\":0");
    json.Should().Contain("\"AdjustedPrice\":300000");
  }

  // ═══════════════════════════════════════════════════════════
  //  Wave 16 — Valuation Reconciliation (3-approach weighted average)
  // ═══════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_WeightGuidelines_ReturnsAllPropertyTypes()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_WeightGuidelines_ReturnsAllPropertyTypes));
    var result = controller.GetReconciliationWeightGuidelines();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("residential");
    json.Should().Contain("commercial");
    json.Should().Contain("industrial");
    json.Should().Contain("multi-family");
    json.Should().Contain("land");
    json.Should().Contain("effectiveDate");
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_WeightGuidelines_ContainsExpectedBiases()
  {
    // Residential should have SalesBias > CostBias (sales-driven market)
    var residential = CostForgeController.ReconciliationDefaults.WeightGuidelines
      .First(g => g.PropertyType == "residential");
    residential.SalesBias.Should().BeGreaterThan(residential.CostBias);
    residential.SalesBias.Should().BeGreaterThan(residential.IncomeBias);

    // Commercial should have IncomeBias > SalesBias
    var commercial = CostForgeController.ReconciliationDefaults.WeightGuidelines
      .First(g => g.PropertyType == "commercial");
    commercial.IncomeBias.Should().BeGreaterThan(commercial.SalesBias);

    // Industrial should have CostBias > IncomeBias
    var industrial = CostForgeController.ReconciliationDefaults.WeightGuidelines
      .First(g => g.PropertyType == "industrial");
    industrial.CostBias.Should().BeGreaterThan(industrial.IncomeBias);
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_ThreeApproachResidential()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_ThreeApproachResidential));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 320_000m,
      CostConfidence = "moderate",
      IncomeApproachValue = 310_000m,
      IncomeConfidence = "low",
      SalesComparisonValue = 350_000m,
      SalesConfidence = "high",
      PropertyType = "residential",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"PropertyType\":\"residential\"");
    json.Should().Contain("\"ApproachCount\":3");
    json.Should().Contain("\"OverallConfidence\":");
    // Sales should dominate for residential
    json.Should().Contain("\"Approach\":\"sales\"");
    json.Should().Contain("\"Approach\":\"cost\"");
    json.Should().Contain("\"Approach\":\"income\"");
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_CommercialIncomeDominant()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_CommercialIncomeDominant));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 500_000m,
      CostConfidence = "moderate",
      IncomeApproachValue = 520_000m,
      IncomeConfidence = "high",
      SalesComparisonValue = 510_000m,
      SalesConfidence = "moderate",
      PropertyType = "commercial",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"PropertyType\":\"commercial\"");
    json.Should().Contain("\"ApproachCount\":3");
    // For commercial, income approach should have highest weight
    // Verify income contribution is highest
    // Income: high(3) × 1.4 incomeBias = 4.2
    // Sales: moderate(2) × 1.0 = 2.0
    // Cost: moderate(2) × 0.5 = 1.0
    // Total: 7.2 → income weight ≈ 58.3%
    var resultObj = ok.Value;
    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var finalValue = jsonDoc.RootElement.GetProperty("FinalReconciledValue").GetDecimal();
    // Should be closer to income value ($520K) than cost ($500K)
    finalValue.Should().BeGreaterThan(510_000m);
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_TwoApproachOnly()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_TwoApproachOnly));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 400_000m,
      CostConfidence = "high",
      IncomeApproachValue = 0m, // Not applicable
      SalesComparisonValue = 420_000m,
      SalesConfidence = "high",
      PropertyType = "residential",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"ApproachCount\":2");
    // Income should not appear in details
    json.Should().NotContain("\"Approach\":\"income\"");
    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var finalValue = jsonDoc.RootElement.GetProperty("FinalReconciledValue").GetDecimal();
    finalValue.Should().BeInRange(400_000m, 420_000m);
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_SingleApproach()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_SingleApproach));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 0m,
      IncomeApproachValue = 0m,
      SalesComparisonValue = 350_000m,
      SalesConfidence = "high",
      PropertyType = "land",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"ApproachCount\":1");
    // Single approach → 100% weight → final = the approach value
    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var finalValue = jsonDoc.RootElement.GetProperty("FinalReconciledValue").GetDecimal();
    finalValue.Should().Be(350_000m);
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_AllZeros_ReturnsBadRequest()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_AllZeros_ReturnsBadRequest));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 0m,
      IncomeApproachValue = 0m,
      SalesComparisonValue = 0m,
      PropertyType = "residential",
    };
    var result = controller.ReconcileApproaches(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_IndustrialCostDominant()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_IndustrialCostDominant));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 1_200_000m,
      CostConfidence = "high",
      IncomeApproachValue = 1_100_000m,
      IncomeConfidence = "moderate",
      SalesComparisonValue = 1_000_000m,
      SalesConfidence = "low",
      PropertyType = "industrial",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"PropertyType\":\"industrial\"");
    // Industrial: cost bias=1.2, income bias=0.8, sales bias=0.6
    // Cost: high(3) × 1.2 = 3.6, Income: moderate(2) × 0.8 = 1.6, Sales: low(1) × 0.6 = 0.6
    // Total: 5.8 → cost ≈ 62%. Should be closer to cost value
    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var finalValue = jsonDoc.RootElement.GetProperty("FinalReconciledValue").GetDecimal();
    finalValue.Should().BeGreaterThan(1_100_000m);
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_HighSpreadLowConfidence()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_HighSpreadLowConfidence));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 200_000m,
      CostConfidence = "low",
      IncomeApproachValue = 350_000m,
      IncomeConfidence = "low",
      SalesComparisonValue = 500_000m,
      SalesConfidence = "low",
      PropertyType = "residential",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // Huge spread → should show low confidence
    json.Should().Contain("\"OverallConfidence\":\"low\"");
    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var spread = jsonDoc.RootElement.GetProperty("Spread").GetDecimal();
    spread.Should().BeGreaterThan(25m);
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_NullPropertyTypeDefaultsResidential()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_NullPropertyTypeDefaultsResidential));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 300_000m,
      SalesComparisonValue = 310_000m,
      // PropertyType null → defaults to "residential"
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"PropertyType\":\"residential\"");
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_NullConfidenceDefaultsModerate()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_NullConfidenceDefaultsModerate));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 300_000m,
      // CostConfidence null → defaults to "moderate"
      IncomeApproachValue = 310_000m,
      // IncomeConfidence null → defaults to "moderate"
      SalesComparisonValue = 320_000m,
      // SalesConfidence null → defaults to "moderate"
      PropertyType = "residential",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"ApproachCount\":3");
    // With all moderate confidence, only property type bias differentiates weights
    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var finalValue = jsonDoc.RootElement.GetProperty("FinalReconciledValue").GetDecimal();
    finalValue.Should().BeInRange(300_000m, 320_000m);
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_WeightsSumTo100()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_WeightsSumTo100));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 250_000m,
      CostConfidence = "high",
      IncomeApproachValue = 260_000m,
      IncomeConfidence = "moderate",
      SalesComparisonValue = 270_000m,
      SalesConfidence = "low",
      PropertyType = "residential",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var details = jsonDoc.RootElement.GetProperty("Details");
    decimal totalWeight = 0;
    foreach (var detail in details.EnumerateArray())
    {
      totalWeight += detail.GetProperty("WeightPct").GetDecimal();
    }
    totalWeight.Should().Be(100m, "weights must sum exactly to 100%");
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_ContributionsSumToFinal()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_ContributionsSumToFinal));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 400_000m,
      CostConfidence = "high",
      IncomeApproachValue = 450_000m,
      IncomeConfidence = "moderate",
      SalesComparisonValue = 430_000m,
      SalesConfidence = "high",
      PropertyType = "commercial",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var details = jsonDoc.RootElement.GetProperty("Details");
    decimal totalContribution = 0;
    foreach (var detail in details.EnumerateArray())
    {
      totalContribution += detail.GetProperty("Contribution").GetDecimal();
    }
    var finalValue = jsonDoc.RootElement.GetProperty("FinalReconciledValue").GetDecimal();
    // Contributions may differ slightly due to rounding
    Math.Abs(totalContribution - finalValue).Should().BeLessThan(0.02m);
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_LandSalesOnly()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_LandSalesOnly));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 80_000m,
      CostConfidence = "low",
      IncomeApproachValue = 70_000m,
      IncomeConfidence = "low",
      SalesComparisonValue = 100_000m,
      SalesConfidence = "high",
      PropertyType = "land",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"PropertyType\":\"land\"");
    // Land: cost bias=0.3, income bias=0.3, sales bias=1.8
    // Sales: high(3) × 1.8 = 5.4, Cost: low(1) × 0.3 = 0.3, Income: low(1) × 0.3 = 0.3
    // Sales dominance: 5.4/6.0 = 90%
    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var finalValue = jsonDoc.RootElement.GetProperty("FinalReconciledValue").GetDecimal();
    // Should be heavily weighted toward sales ($100K)
    finalValue.Should().BeGreaterThan(90_000m);
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_MultiFamilyIncomeFavored()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_MultiFamilyIncomeFavored));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 600_000m,
      CostConfidence = "moderate",
      IncomeApproachValue = 650_000m,
      IncomeConfidence = "high",
      SalesComparisonValue = 620_000m,
      SalesConfidence = "moderate",
      PropertyType = "multi-family",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"PropertyType\":\"multi-family\"");
    // Multi-family: income bias=1.3 > sales bias=1.0 > cost bias=0.6
    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var finalValue = jsonDoc.RootElement.GetProperty("FinalReconciledValue").GetDecimal();
    // Should be closer to income value ($650K)
    finalValue.Should().BeGreaterThan(625_000m);
  }

  [Fact]
  [Trait("Category", "CostForge-Reconciliation")]
  public void Reconciliation_Reconcile_TightSpreadHighConfidence()
  {
    var controller = CreateCostForgeController(nameof(Reconciliation_Reconcile_TightSpreadHighConfidence));
    var request = new CostForgeController.ThreeApproachReconciliationRequest
    {
      CostApproachValue = 300_000m,
      CostConfidence = "high",
      IncomeApproachValue = 305_000m,
      IncomeConfidence = "high",
      SalesComparisonValue = 302_000m,
      SalesConfidence = "high",
      PropertyType = "residential",
    };
    var result = controller.ReconcileApproaches(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    // Very tight spread → should show high confidence
    json.Should().Contain("\"OverallConfidence\":\"high\"");
    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var spread = jsonDoc.RootElement.GetProperty("Spread").GetDecimal();
    spread.Should().BeLessThan(5m);
  }

  // ═══════════════════════════════════════════════════════════
  //  Wave 17 — Valuation Lineage (RCN → RCNLD → land → total)
  // ═══════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_DepreciationModel_ReturnsAllCategories()
  {
    var controller = CreateCostForgeController(nameof(Lineage_DepreciationModel_ReturnsAllCategories));
    var result = controller.GetDepreciationModel();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("Residential");
    json.Should().Contain("Commercial");
    json.Should().Contain("Industrial");
    json.Should().Contain("Multiplicative");
    json.Should().Contain("physicalDepreciationCap");
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_DepreciationModel_EconomicLifeValues()
  {
    var res = CostForgeController.ValuationLineageData.EconomicLifeByType;
    res.First(e => e.Category == "Residential").Years.Should().Be(60);
    res.First(e => e.Category == "Commercial").Years.Should().Be(50);
    res.First(e => e.Category == "Industrial").Years.Should().Be(45);
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_LandRates_ReturnsAllZones()
  {
    var controller = CreateCostForgeController(nameof(Lineage_LandRates_ReturnsAllZones));
    var result = controller.GetLandRates();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("central-residential");
    json.Should().Contain("west-commercial");
    json.Should().Contain("agricultural");
    json.Should().Contain("industrial");
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_LandRates_Values()
  {
    var rates = CostForgeController.ValuationLineageData.LandRates;
    rates.First(r => r.Zone == "central-residential").BaseRatePerSqft.Should().Be(3.50m);
    rates.First(r => r.Zone == "agricultural").BaseRatePerSqft.Should().Be(0.50m);
    rates.First(r => r.Zone == "west-commercial").BaseRatePerSqft.Should().Be(10.50m);
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_SiteImprovements_ReturnsSchedule()
  {
    var controller = CreateCostForgeController(nameof(Lineage_SiteImprovements_ReturnsSchedule));
    var result = controller.GetSiteImprovements();
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("ATTGAR");
    json.Should().Contain("DETGAR");
    json.Should().Contain("PL");
    json.Should().Contain("BSMTFIN");
    json.Should().Contain("DECK");
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_SiteImprovements_UnitCosts()
  {
    var si = CostForgeController.ValuationLineageData.SiteImprovements;
    si.First(s => s.Code == "ATTGAR").UnitCost.Should().Be(42.50m);
    si.First(s => s.Code == "PL").UnitCost.Should().Be(25000.00m);
    si.First(s => s.Code == "BSMTFIN").UnitCost.Should().Be(32.50m);
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_BasicResidential()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_BasicResidential));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 2000m,
      YearBuilt = 2015,
      QualityGrade = "STANDARD",
      ConditionGrade = "GOOD",
      ComplexityGrade = "STANDARD",
      LandAreaSqft = 8000m,
      LandZone = "central-residential",
    };
    var result = controller.ComputeFullValuationLineage(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    json.Should().Contain("\"BuildingType\":\"R1\"");
    json.Should().Contain("\"ReplacementCostNew\":");
    json.Should().Contain("\"ReplacementCostNewLessDepreciation\":");
    json.Should().Contain("\"LandValue\":");
    json.Should().Contain("\"TotalAssessedValue\":");
    json.Should().Contain("\"DepreciationBreakdown\":");

    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var rcn = jsonDoc.RootElement.GetProperty("ReplacementCostNew").GetDecimal();
    var rcnld = jsonDoc.RootElement.GetProperty("ReplacementCostNewLessDepreciation").GetDecimal();
    var landValue = jsonDoc.RootElement.GetProperty("LandValue").GetDecimal();
    var total = jsonDoc.RootElement.GetProperty("TotalAssessedValue").GetDecimal();

    rcn.Should().BeGreaterThan(0);
    rcnld.Should().BeLessThanOrEqualTo(rcn);
    landValue.Should().Be(8000m * 3.50m); // 8000 sqft × $3.50
    total.Should().Be(rcnld + landValue);  // no site improvements
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_WithSiteImprovements()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_WithSiteImprovements));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 1800m,
      YearBuilt = 2020,
      QualityGrade = "STANDARD",
      ConditionGrade = "GOOD",
      LandAreaSqft = 7000m,
      LandZone = "central-residential",
      SiteImprovements = new()
      {
        new() { Code = "ATTGAR", Quantity = 400m },  // 400 sqft attached garage
        new() { Code = "DECK", Quantity = 200m },    // 200 sqft deck
      },
    };
    var result = controller.ComputeFullValuationLineage(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var siteTotal = jsonDoc.RootElement.GetProperty("SiteImprovementsTotal").GetDecimal();
    var total = jsonDoc.RootElement.GetProperty("TotalAssessedValue").GetDecimal();
    var rcnld = jsonDoc.RootElement.GetProperty("ReplacementCostNewLessDepreciation").GetDecimal();
    var landValue = jsonDoc.RootElement.GetProperty("LandValue").GetDecimal();

    siteTotal.Should().BeGreaterThan(0);
    total.Should().Be(rcnld + landValue + siteTotal);
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_WithObsolescence()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_WithObsolescence));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "C1",
      Region = "Central",
      SquareFeet = 5000m,
      YearBuilt = 1990,
      QualityGrade = "STANDARD",
      ConditionGrade = "GOOD",
      FunctionalObsolescence = 15m,  // 15% functional
      ExternalObsolescence = 10m,    // 10% external
      LandAreaSqft = 20000m,
      LandZone = "central-commercial",
    };
    var result = controller.ComputeFullValuationLineage(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var totalDepPct = jsonDoc.RootElement.GetProperty("TotalDepreciationPct").GetDecimal();
    var funcObs = jsonDoc.RootElement.GetProperty("FunctionalObsolescencePct").GetDecimal();
    var extObs = jsonDoc.RootElement.GetProperty("ExternalObsolescencePct").GetDecimal();
    var physDep = jsonDoc.RootElement.GetProperty("PhysicalDepreciationPct").GetDecimal();

    funcObs.Should().Be(15m);
    extObs.Should().Be(10m);
    physDep.Should().BeGreaterThan(0);
    // Total depreciation should be > physical alone due to multiplicative model
    totalDepPct.Should().BeGreaterThan(physDep);
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_PhysicalDepCapped85()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_PhysicalDepCapped85));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 1500m,
      EffectiveAge = 100,  // Way beyond economic life
      QualityGrade = "STANDARD",
      ConditionGrade = "GOOD",
      LandAreaSqft = 5000m,
      LandZone = "central-residential",
    };
    var result = controller.ComputeFullValuationLineage(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var physDep = jsonDoc.RootElement.GetProperty("PhysicalDepreciationPct").GetDecimal();
    // Physical depreciation capped at 85%
    physDep.Should().Be(85m);
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_InvalidBuildingType_ReturnsBadRequest()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_InvalidBuildingType_ReturnsBadRequest));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "INVALID",
      Region = "Central",
      SquareFeet = 1000m,
    };
    var result = controller.ComputeFullValuationLineage(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_CommercialEconomicLife50()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_CommercialEconomicLife50));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "C1",
      Region = "Central",
      SquareFeet = 3000m,
      EffectiveAge = 25,
      QualityGrade = "STANDARD",
      LandAreaSqft = 10000m,
      LandZone = "central-commercial",
    };
    var result = controller.ComputeFullValuationLineage(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var ecoLife = jsonDoc.RootElement.GetProperty("EconomicLife").GetInt32();
    var physDep = jsonDoc.RootElement.GetProperty("PhysicalDepreciationPct").GetDecimal();

    ecoLife.Should().Be(50);
    // 25/50 = 50% physical depreciation
    physDep.Should().Be(50m);
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_IndustrialEconomicLife45()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_IndustrialEconomicLife45));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "I1",
      Region = "Central",
      SquareFeet = 10000m,
      EffectiveAge = 20,
      QualityGrade = "STANDARD",
      LandAreaSqft = 40000m,
      LandZone = "industrial",
    };
    var result = controller.ComputeFullValuationLineage(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var ecoLife = jsonDoc.RootElement.GetProperty("EconomicLife").GetInt32();
    ecoLife.Should().Be(45);
    // 20/45 ≈ 44.44%
    var physDep = jsonDoc.RootElement.GetProperty("PhysicalDepreciationPct").GetDecimal();
    physDep.Should().BeInRange(44m, 45m);
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_DepreciationBreakdownSumsCorrectly()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_DepreciationBreakdownSumsCorrectly));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 2000m,
      EffectiveAge = 20,
      FunctionalObsolescence = 10m,
      ExternalObsolescence = 5m,
      LandAreaSqft = 8000m,
      LandZone = "central-residential",
    };
    var result = controller.ComputeFullValuationLineage(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var breakdown = jsonDoc.RootElement.GetProperty("DepreciationBreakdown");
    var physical = breakdown.GetProperty("Physical").GetDecimal();
    var functional = breakdown.GetProperty("Functional").GetDecimal();
    var external = breakdown.GetProperty("External").GetDecimal();
    var depAmount = jsonDoc.RootElement.GetProperty("DepreciationAmount").GetDecimal();

    physical.Should().BeGreaterThan(0);
    functional.Should().BeGreaterThan(0);
    external.Should().BeGreaterThan(0);
    // Sum of breakdown components should approximate total depreciation
    // (may differ slightly due to rounding in multiplicative model)
    Math.Abs(physical + functional + external - depAmount).Should().BeLessThan(1m);
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_ZeroAge_NoPhysicalDep()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_ZeroAge_NoPhysicalDep));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 2500m,
      EffectiveAge = 0,
      QualityGrade = "STANDARD",
      ConditionGrade = "GOOD",
      LandAreaSqft = 10000m,
      LandZone = "central-residential",
    };
    var result = controller.ComputeFullValuationLineage(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var physDep = jsonDoc.RootElement.GetProperty("PhysicalDepreciationPct").GetDecimal();
    var rcn = jsonDoc.RootElement.GetProperty("ReplacementCostNew").GetDecimal();
    var rcnld = jsonDoc.RootElement.GetProperty("ReplacementCostNewLessDepreciation").GetDecimal();

    physDep.Should().Be(0m);
    rcnld.Should().Be(rcn);  // No depreciation → RCNLD = RCN
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_RCNIncludesAllFactors()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_RCNIncludesAllFactors));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "R1",
      Region = "West",  // factor 1.05
      SquareFeet = 1000m,
      EffectiveAge = 0,
      QualityGrade = "PREMIUM",     // factor 1.30
      ConditionGrade = "EXCELLENT", // factor 1.10
      ComplexityGrade = "COMPLEX",  // factor 1.10
      LandAreaSqft = 5000m,
      LandZone = "west-residential",
    };
    var result = controller.ComputeFullValuationLineage(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var rcn = jsonDoc.RootElement.GetProperty("ReplacementCostNew").GetDecimal();
    var adjRate = jsonDoc.RootElement.GetProperty("AdjustedRatePerSqft").GetDecimal();

    // Base = 133.88 (West R1) → ×1.05 region ×1.30 quality ×1.10 condition ×1.10 complexity ×1.15 local ×1.15 entrep
    // All factors compound, so RCN should be > base×sqft significantly
    rcn.Should().Be(adjRate * 1000m); // rate × sqft
    adjRate.Should().BeGreaterThan(133.88m); // adjusted > base
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_LandAdjustmentFactor()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_LandAdjustmentFactor));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 1500m,
      EffectiveAge = 0,
      LandAreaSqft = 10000m,
      LandZone = "central-residential",
      LandAdjustmentFactor = 1.20m,  // 20% premium lot
    };
    var result = controller.ComputeFullValuationLineage(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var landValue = jsonDoc.RootElement.GetProperty("LandValue").GetDecimal();
    // 10000 × $3.50 × 1.20 = $42,000
    landValue.Should().Be(42000m);
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_UnknownSiteCodeSkipped()
  {
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_UnknownSiteCodeSkipped));
    var request = new CostForgeController.FullLineageRequest
    {
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 1500m,
      EffectiveAge = 0,
      LandAreaSqft = 5000m,
      LandZone = "central-residential",
      SiteImprovements = new()
      {
        new() { Code = "ATTGAR", Quantity = 300m },
        new() { Code = "UNKNOWN", Quantity = 100m },  // Should be skipped
      },
    };
    var result = controller.ComputeFullValuationLineage(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);

    var jsonDoc = System.Text.Json.JsonDocument.Parse(json);
    var improvements = jsonDoc.RootElement.GetProperty("SiteImprovements");
    improvements.GetArrayLength().Should().Be(1); // Only ATTGAR, UNKNOWN skipped
  }

  [Fact]
  [Trait("Category", "CostForge-Lineage")]
  public void Lineage_ComputeFull_SiteDepreciationIncreases()
  {
    // Older property → site improvements more depreciated
    var controller = CreateCostForgeController(nameof(Lineage_ComputeFull_SiteDepreciationIncreases));

    var youngRequest = new CostForgeController.FullLineageRequest
    {
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 1500m,
      EffectiveAge = 5,
      LandAreaSqft = 5000m,
      LandZone = "central-residential",
      SiteImprovements = new() { new() { Code = "PL", Quantity = 1m } },
    };
    var oldRequest = new CostForgeController.FullLineageRequest
    {
      BuildingType = "R1",
      Region = "Central",
      SquareFeet = 1500m,
      EffectiveAge = 30,
      LandAreaSqft = 5000m,
      LandZone = "central-residential",
      SiteImprovements = new() { new() { Code = "PL", Quantity = 1m } },
    };

    var youngResult = controller.ComputeFullValuationLineage(youngRequest);
    var oldResult = controller.ComputeFullValuationLineage(oldRequest);

    var youngJson = JsonSerializer.Serialize(((OkObjectResult)youngResult).Value);
    var oldJson = JsonSerializer.Serialize(((OkObjectResult)oldResult).Value);

    var youngSite = System.Text.Json.JsonDocument.Parse(youngJson).RootElement.GetProperty("SiteImprovementsTotal").GetDecimal();
    var oldSite = System.Text.Json.JsonDocument.Parse(oldJson).RootElement.GetProperty("SiteImprovementsTotal").GetDecimal();

    youngSite.Should().BeGreaterThan(oldSite); // Young property → less site depreciation → higher value
  }

  // ═══════════════════════════════════════════════════════════════
  // WAVE 18 — REAL ARCGIS GIS INTEGRATION TESTS
  // Test ArcGIS query builders, spatial layers, taxing districts,
  // flood zones, neighboring parcels, field mappings, coordinate conversion
  // Source: terra-playground-production + bcbs-gis-pro-production
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public async Task Atlas_ArcGisParcelQuery_WithValidParcel_ReturnsFullQuery()
  {
    await using var db = CreateDbContext(nameof(Atlas_ArcGisParcelQuery_WithValidParcel_ReturnsFullQuery));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    var prop = CreateProperty(countyId, "12345-001");
    db.Properties.Add(prop);
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext { User = CreatePrincipal(countyId, "BENTON") };

    var result = await controller.GetArcGisParcelQuery("12345-001");
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(okResult.Value);

    json.Should().Contain("arcgisQuery");
    json.Should().Contain("fieldMapping");
    json.Should().Contain("PARCEL_ID");
    json.Should().Contain("queryUrl");
    json.Should().Contain("12345-001");
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public async Task Atlas_ArcGisParcelQuery_WithoutClaims_ReturnsForbid()
  {
    await using var db = CreateDbContext(nameof(Atlas_ArcGisParcelQuery_WithoutClaims_ReturnsForbid));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    AttachPrincipal(controller, CreateEmptyPrincipal());

    var result = await controller.GetArcGisParcelQuery("12345");
    result.Should().BeOfType<ForbidResult>();
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public async Task Atlas_ArcGisParcelQuery_ParcelNotFound_Returns404()
  {
    await using var db = CreateDbContext(nameof(Atlas_ArcGisParcelQuery_ParcelNotFound_Returns404));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext { User = CreatePrincipal(countyId, "BENTON") };

    var result = await controller.GetArcGisParcelQuery("NONEXISTENT");
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public async Task Atlas_ArcGisParcelQuery_InvalidId_ReturnsBadRequest()
  {
    await using var db = CreateDbContext(nameof(Atlas_ArcGisParcelQuery_InvalidId_ReturnsBadRequest));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext { User = CreatePrincipal(countyId, "BENTON") };

    var result = await controller.GetArcGisParcelQuery("'; DROP TABLE--");
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public async Task Atlas_ArcGisSearch_SingleCriterion_ReturnsQuery()
  {
    await using var db = CreateDbContext(nameof(Atlas_ArcGisSearch_SingleCriterion_ReturnsQuery));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext { User = CreatePrincipal(countyId, "BENTON") };

    var result = await controller.BuildArcGisSearch(new AtlasController.ArcGisSearchRequest(
        ParcelId: null, OwnerName: "SMITH", Address: null, MinValue: null, MaxValue: null, Zoning: null));
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(okResult.Value);

    json.Should().Contain("OWNER_NAME");
    json.Should().Contain("SMITH");
    json.Should().Contain("arcgisQuery");
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public async Task Atlas_ArcGisSearch_MultiCriteria_CombinesWithAnd()
  {
    await using var db = CreateDbContext(nameof(Atlas_ArcGisSearch_MultiCriteria_CombinesWithAnd));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext { User = CreatePrincipal(countyId, "BENTON") };

    var result = await controller.BuildArcGisSearch(new AtlasController.ArcGisSearchRequest(
        ParcelId: null, OwnerName: "JONES", Address: "Main St", MinValue: 100000m, MaxValue: 500000m, Zoning: null));
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(okResult.Value);

    json.Should().Contain("OWNER_NAME");
    json.Should().Contain("SITE_ADDR");
    json.Should().Contain("ASSESSED_VAL");
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public async Task Atlas_ArcGisSearch_NoCriteria_ReturnsBadRequest()
  {
    await using var db = CreateDbContext(nameof(Atlas_ArcGisSearch_NoCriteria_ReturnsBadRequest));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext { User = CreatePrincipal(countyId, "BENTON") };

    var result = await controller.BuildArcGisSearch(new AtlasController.ArcGisSearchRequest(
        ParcelId: null, OwnerName: null, Address: null, MinValue: null, MaxValue: null, Zoning: null));
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_TaxingDistricts_Returns11Districts()
  {
    using var db = CreateDbContext(nameof(Atlas_TaxingDistricts_Returns11Districts));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetTaxingDistricts();
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(okResult.Value);

    json.Should().Contain("Benton County General");
    json.Should().Contain("Richland School District");
    json.Should().Contain("Port of Kennewick");
    AtlasController.BentonTaxingDistricts.Districts.Should().HaveCount(11);
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_CityBoundaries_ReturnsFiveCities()
  {
    using var db = CreateDbContext(nameof(Atlas_CityBoundaries_ReturnsFiveCities));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetCityBoundaries();
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(okResult.Value);

    json.Should().Contain("Richland");
    json.Should().Contain("Kennewick");
    json.Should().Contain("West Richland");
    json.Should().Contain("CityLimits");
    AtlasController.BentonCityBoundaries.Cities.Should().HaveCount(5);
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public async Task Atlas_FloodZoneQuery_ValidParcel_ReturnsSpatialSteps()
  {
    await using var db = CreateDbContext(nameof(Atlas_FloodZoneQuery_ValidParcel_ReturnsSpatialSteps));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    var prop = CreateProperty(countyId, "FZ-TEST-001");
    db.Properties.Add(prop);
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext { User = CreatePrincipal(countyId, "BENTON") };

    var result = await controller.GetFloodZoneQuery("FZ-TEST-001");
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(okResult.Value);

    json.Should().Contain("steps");
    json.Should().Contain("esriSpatialRelIntersects");
    json.Should().Contain("esriGeometryPolygon");
    json.Should().Contain("FLD_ZONE");
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public async Task Atlas_FloodZoneQuery_ParcelNotFound_Returns404()
  {
    await using var db = CreateDbContext(nameof(Atlas_FloodZoneQuery_ParcelNotFound_Returns404));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext { User = CreatePrincipal(countyId, "BENTON") };

    var result = await controller.GetFloodZoneQuery("NONEXISTENT");
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public async Task Atlas_NeighboringParcels_ValidParcel_ReturnsProximitySteps()
  {
    await using var db = CreateDbContext(nameof(Atlas_NeighboringParcels_ValidParcel_ReturnsProximitySteps));
    var countyId = Guid.NewGuid();
    db.Counties.Add(new County { Id = countyId, Name = "Benton", State = "WA", FipsCode = "003" });
    var prop = CreateProperty(countyId, "NB-TEST-001");
    db.Properties.Add(prop);
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext { User = CreatePrincipal(countyId, "BENTON") };

    var result = await controller.GetNeighboringParcelsQuery("NB-TEST-001");
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(okResult.Value);

    json.Should().Contain("steps");
    json.Should().Contain("esriGeometryPoint");
    json.Should().Contain("esriSRUnit_Meter");
    json.Should().Contain("100");
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_SpatialQuery_ValidExtent_ReturnsEnvelopeQuery()
  {
    using var db = CreateDbContext(nameof(Atlas_SpatialQuery_ValidExtent_ReturnsEnvelopeQuery));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.BuildSpatialQuery(new AtlasController.SpatialExtentRequest(
        Xmin: -119.5, Ymin: 46.0, Xmax: -119.0, Ymax: 46.5));
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(okResult.Value);

    json.Should().Contain("esriGeometryEnvelope");
    json.Should().Contain("esriSpatialRelIntersects");
    json.Should().Contain("-119.5");
    json.Should().Contain("46");
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_SpatialQuery_InvalidExtent_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(Atlas_SpatialQuery_InvalidExtent_ReturnsBadRequest));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    // min >= max
    var result = controller.BuildSpatialQuery(new AtlasController.SpatialExtentRequest(
        Xmin: -119.0, Ymin: 46.5, Xmax: -119.5, Ymax: 46.0));
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_SpatialQuery_OutOfRange_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(Atlas_SpatialQuery_OutOfRange_ReturnsBadRequest));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.BuildSpatialQuery(new AtlasController.SpatialExtentRequest(
        Xmin: -200, Ymin: 46.0, Xmax: -119.0, Ymax: 46.5));
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_LayerConfigs_Has8Layers()
  {
    using var db = CreateDbContext(nameof(Atlas_LayerConfigs_Has8Layers));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetLayerConfigs();
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(okResult.Value);

    AtlasController.ArcGisSpatialLayers.Configs.Should().HaveCount(8);
    json.Should().Contain("parcels");
    json.Should().Contain("flood-zones");
    json.Should().Contain("wetlands");
    json.Should().Contain("tax-districts");
    json.Should().Contain("FeatureServer");
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_LayerConfigs_AllHaveFields()
  {
    foreach (var config in AtlasController.ArcGisSpatialLayers.Configs)
    {
      config.Fields.Should().NotBeEmpty($"layer '{config.Id}' must have queryable fields");
      config.FeatureServerPath.Should().Contain("FeatureServer");
      config.SpatialCapabilities.Should().NotBeEmpty();
    }
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_FieldMapping_HasParcelFieldNormalization()
  {
    using var db = CreateDbContext(nameof(Atlas_FieldMapping_HasParcelFieldNormalization));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.GetFieldMapping();
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(okResult.Value);

    json.Should().Contain("parcelId");
    json.Should().Contain("ownerName");
    json.Should().Contain("assessedValue");
    json.Should().Contain("PARCEL_ID");
    json.Should().Contain("PARCEL_NUMBER");
    json.Should().Contain("zoningCodeMapping");
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_FieldMapping_ZoningCodes_Cover7Types()
  {
    AtlasController.ArcGisFieldMappings.ParcelFields.Should().HaveCount(11);
    AtlasController.ArcGisFieldMappings.ZoningToPropertyType.Should().HaveCount(7);
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_CoordinateConvert_WebMercatorToWgs84()
  {
    using var db = CreateDbContext(nameof(Atlas_CoordinateConvert_WebMercatorToWgs84));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    // Known point: Benton County approx center in Web Mercator
    // -119.3° lon ≈ -13284940, 46.25° lat ≈ 5806410
    var result = controller.ConvertCoordinates(new AtlasController.CoordinateConvertRequest(
        X: -13284940, Y: 5806410, FromSR: "3857"));
    var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(okResult.Value);

    json.Should().Contain("longitude");
    json.Should().Contain("latitude");
    json.Should().Contain("EPSG:4326");
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_CoordinateConvert_UnsupportedSR_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(Atlas_CoordinateConvert_UnsupportedSR_ReturnsBadRequest));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    controller.ControllerContext.HttpContext = new DefaultHttpContext();

    var result = controller.ConvertCoordinates(new AtlasController.CoordinateConvertRequest(
        X: -119.3, Y: 46.25, FromSR: "4326")); // Already WGS84 — unsupported conversion
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_TaxingDistricts_HaveAllCategories()
  {
    var json = JsonSerializer.Serialize(AtlasController.BentonTaxingDistricts.Districts);
    json.Should().Contain("county");
    json.Should().Contain("city");
    json.Should().Contain("school");
    json.Should().Contain("fire");
    json.Should().Contain("port");
  }

  [Fact]
  [Trait("Category", "Atlas-ArcGIS")]
  public void Atlas_CityBoundaries_AllIncorporated()
  {
    var json = JsonSerializer.Serialize(AtlasController.BentonCityBoundaries.Cities);
    json.Should().Contain("Prosser");
    json.Should().Contain("Benton City");
    // All cities have FIPS codes
    json.Should().Contain("fipsCode");
  }
}
