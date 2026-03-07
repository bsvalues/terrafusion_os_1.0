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
        json.RootElement.GetProperty("districts").GetInt32().Should().Be(5);
        json.RootElement.GetProperty("federalAcres").GetInt32().Should().Be(1123800);
        controller.HttpContext.Response.Headers["X-PILT-Source"].ToString().Should().Be("benton-fy2025-snapshot");
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
    public void CostForgeController_BatchCalculate_ReturnsExplicitPostR1ProblemDetails()
    {
        using var db = CreateDbContext(nameof(CostForgeController_BatchCalculate_ReturnsExplicitPostR1ProblemDetails));
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
