using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Services;
using Xunit;
using AuditLogger = TerraFusion.Abstractions.Interfaces.IAuditLogger;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R1Week4;

public class R1Week4Cx15BackendValidationSuiteTests
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

  private static ClaimsPrincipal CreatePrincipal(string? countyIdClaim, string? countyCodeClaim, string userId = "cx15-user")
  {
    var claims = new List<Claim>
        {
            new("sub", userId),
            new("userId", userId),
        };

    if (!string.IsNullOrWhiteSpace(countyIdClaim))
      claims.Add(new Claim("countyId", countyIdClaim));

    if (!string.IsNullOrWhiteSpace(countyCodeClaim))
      claims.Add(new Claim("countyCode", countyCodeClaim));

    return new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
  }

  private static void AttachPrincipal(ControllerBase controller, ClaimsPrincipal principal)
  {
    controller.ControllerContext = new ControllerContext
    {
      HttpContext = new DefaultHttpContext { User = principal },
    };
  }

  private static Property CreateProperty(Guid countyId, string propertyId, string parcelId)
  {
    return new Property
    {
      Id = Guid.NewGuid(),
      PropertyId = propertyId,
      ParcelId = parcelId,
      ParcelNumber = parcelId,
      Address = "100 Validation Ave",
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

  private static JsonElement ToJson(object? value)
  {
    using var doc = JsonDocument.Parse(JsonSerializer.Serialize(value));
    return doc.RootElement.Clone();
  }

  [Fact]
  public async Task CostForge_ByParcelNumber_SameCounty_ReturnsOkAndInvokesService()
  {
    await using var db = CreateDbContext(nameof(CostForge_ByParcelNumber_SameCounty_ReturnsOkAndInvokesService));
    var benton = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
    var property = CreateProperty(benton.Id, "CX15-PROP-1", "CX15-PARCEL-1");
    db.Counties.Add(benton);
    db.Properties.Add(property);
    await db.SaveChangesAsync();

    var costForgeMock = new Mock<ICostForgeService>();
    costForgeMock
        .Setup(m => m.AnalyzeCostAsync(property.Id))
        .ReturnsAsync(new CostAnalysisDto
        {
          PropertyId = property.Id,
          TotalCost = 100000m,
          AnalysisDate = DateTime.UtcNow,
        });

    var controller = new CostForgeController(
        costForgeMock.Object,
        new Mock<ICostForgeAIService>().Object,
        db,
        CreateAuditLoggerMock().Object,
        NullLogger<CostForgeController>.Instance);

    AttachPrincipal(controller, CreatePrincipal("benton", "BENTON"));

    var result = await controller.CalculatePropertyCost(new PropertyCostCalculationRequest
    {
      PropertyId = Guid.Empty,
      ParcelNumber = "CX15-PARCEL-1",
      CountyCode = "BENTON",
      Region = "BENTON",
      BuildingType = "SFR",
    });

    Assert.IsType<OkObjectResult>(result.Result);
    costForgeMock.Verify(m => m.AnalyzeCostAsync(property.Id), Times.Once);
  }

  [Fact]
  public async Task CostForge_ByParcelNumber_CrossCounty_ReturnsNotFound()
  {
    await using var db = CreateDbContext(nameof(CostForge_ByParcelNumber_CrossCounty_ReturnsNotFound));
    var benton = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
    var yakima = new County { Id = Guid.NewGuid(), Name = "Yakima", State = "WA", FipsCode = "077" };
    db.Counties.AddRange(benton, yakima);
    db.Properties.Add(CreateProperty(yakima.Id, "CX15-PROP-2", "CX15-PARCEL-2"));
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
      PropertyId = Guid.Empty,
      ParcelNumber = "CX15-PARCEL-2",
      CountyCode = "BENTON",
      Region = "BENTON",
      BuildingType = "SFR",
    });

    Assert.IsType<NotFoundObjectResult>(result.Result);
    costForgeMock.Verify(m => m.AnalyzeCostAsync(It.IsAny<Guid>()), Times.Never);
  }

  [Fact]
  public async Task Levy_Batch_AnyCrossCountyItem_ReturnsForbid()
  {
    await using var db = CreateDbContext(nameof(Levy_Batch_AnyCrossCountyItem_ReturnsForbid));
    db.Counties.AddRange(
        new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" },
        new County { Id = Guid.NewGuid(), Name = "Yakima", State = "WA", FipsCode = "077" });
    await db.SaveChangesAsync();

    var controller = new LevyCalculationController(NullLogger<LevyCalculationController>.Instance, db);
    AttachPrincipal(controller, CreatePrincipal("benton", "BENTON"));

    var result = await controller.CalculateBatch(new List<LevyMeasureRequest>
        {
            new()
            {
                DistrictId = "CX15-D1",
                DistrictName = "District One",
                AssessedValue = 1000000,
                BudgetAmount = 10000,
                DistrictType = "county-regular",
                MeasureType = "regular",
                CountyCode = "BENTON",
            },
            new()
            {
                DistrictId = "CX15-D2",
                DistrictName = "District Two",
                AssessedValue = 1000000,
                BudgetAmount = 10000,
                DistrictType = "county-regular",
                MeasureType = "regular",
                CountyCode = "YAKIMA",
            },
        });

    Assert.IsType<ForbidResult>(result.Result);
  }

  [Fact]
  public async Task Atlas_Layers_SameCounty_ReturnsExpectedContractShape()
  {
    await using var db = CreateDbContext(nameof(Atlas_Layers_SameCounty_ReturnsExpectedContractShape));
    var benton = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
    db.Counties.Add(benton);
    db.Properties.Add(CreateProperty(benton.Id, "CX15-PROP-3", "CX15-PARCEL-3"));
    await db.SaveChangesAsync();

    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    AttachPrincipal(controller, CreatePrincipal(benton.Id.ToString(), "BENTON"));

    var result = await controller.GetParcelLayers("CX15-PARCEL-3");
    var ok = Assert.IsType<OkObjectResult>(result);
    var json = ToJson(ok.Value);
    var layers = json.GetProperty("layers").EnumerateArray().ToList();

    Assert.Equal("CX15-PARCEL-3", json.GetProperty("parcelId").GetString());
    Assert.Equal(5, layers.Count);

    var layerIds = layers
        .Select(layer => layer.GetProperty("id").GetString())
        .Where(id => id is not null)
        .Cast<string>()
        .ToHashSet(StringComparer.Ordinal);

    Assert.Equal(
        new HashSet<string>(new[] { "boundary", "zoning", "flood", "aerial", "parcels" }, StringComparer.Ordinal),
        layerIds);
    Assert.All(layers, layer => Assert.True(layer.GetProperty("available").GetBoolean()));
  }

  [Fact]
  public async Task Atlas_MissingCountyClaims_ReturnsForbid()
  {
    await using var db = CreateDbContext(nameof(Atlas_MissingCountyClaims_ReturnsForbid));
    var controller = new AtlasController(db, NullLogger<AtlasController>.Instance);
    AttachPrincipal(controller, CreatePrincipal(null, null));

    var result = await controller.GetParcelGeometry("CX15-PARCEL-4");

    Assert.IsType<ForbidResult>(result);
  }

  [Fact]
  public async Task Dossier_CreateThenGetNotesAndCasefile_ReturnsPersistedData()
  {
    await using var db = CreateDbContext(nameof(Dossier_CreateThenGetNotesAndCasefile_ReturnsPersistedData));
    var benton = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
    db.Counties.Add(benton);
    db.Properties.Add(CreateProperty(benton.Id, "CX15-PROP-5", "CX15-PARCEL-5"));
    await db.SaveChangesAsync();

    var controller = new DossierController(db, new Mock<ICostForgeService>().Object, Mock.Of<IDossierDocumentService>(), NullLogger<DossierController>.Instance, Mock.Of<IHostEnvironment>(e => e.EnvironmentName == "Development"));
    AttachPrincipal(controller, CreatePrincipal("BENTON", "BENTON", "cx15-author"));

    var createdResult = await controller.CreateNote(
        "CX15-PARCEL-5",
        new DossierController.CreateNoteRequest("cx15 validation note", "case_note"));
    Assert.IsType<CreatedResult>(createdResult);

    var notesResult = await controller.GetNotes("CX15-PARCEL-5");
    var notesOk = Assert.IsType<OkObjectResult>(notesResult);
    var notesJson = ToJson(notesOk.Value);
    Assert.Equal(1, notesJson.GetProperty("total").GetInt32());
    Assert.Equal("cx15 validation note", notesJson.GetProperty("notes")[0].GetProperty("content").GetString());
    Assert.Equal("cx15-author", notesJson.GetProperty("notes")[0].GetProperty("createdBy").GetString());

    var casefileResult = await controller.GetCasefile("CX15-PARCEL-5", include: null);
    var casefileOk = Assert.IsType<OkObjectResult>(casefileResult);
    var casefileJson = ToJson(casefileOk.Value);
    Assert.Contains("CX15-PARCEL-5", casefileJson.GetProperty("summary").GetString());
    Assert.Equal(1, casefileJson.GetProperty("sections").GetProperty("notes").GetProperty("count").GetInt32());
  }

  [Fact]
  public async Task Dossier_CrossCountyGetNotes_ReturnsEmptySet()
  {
    await using var db = CreateDbContext(nameof(Dossier_CrossCountyGetNotes_ReturnsEmptySet));
    var benton = new County { Id = Guid.NewGuid(), Name = "Benton", State = "WA", FipsCode = "003" };
    var yakima = new County { Id = Guid.NewGuid(), Name = "Yakima", State = "WA", FipsCode = "077" };
    db.Counties.AddRange(benton, yakima);
    db.Properties.Add(CreateProperty(yakima.Id, "CX15-PROP-6", "CX15-PARCEL-6"));
    db.DossierNotes.Add(new DossierNote
    {
      ParcelId = "CX15-PARCEL-6",
      CountyId = yakima.Id,
      CreatedBy = "yakima-user",
      NoteType = "case_note",
      Content = "yakima-only note",
    });
    await db.SaveChangesAsync();

    var controller = new DossierController(db, new Mock<ICostForgeService>().Object, Mock.Of<IDossierDocumentService>(), NullLogger<DossierController>.Instance, Mock.Of<IHostEnvironment>(e => e.EnvironmentName == "Development"));
    AttachPrincipal(controller, CreatePrincipal(benton.Id.ToString(), "BENTON"));

    var result = await controller.GetNotes("CX15-PARCEL-6");
    var ok = Assert.IsType<OkObjectResult>(result);
    var json = ToJson(ok.Value);

    Assert.Equal("CX15-PARCEL-6", json.GetProperty("parcelId").GetString());
    Assert.Equal(0, json.GetProperty("total").GetInt32());
    Assert.Empty(json.GetProperty("notes").EnumerateArray());
  }

  [Fact]
  public async Task Dossier_InvalidParcelId_ReturnsBadRequest()
  {
    await using var db = CreateDbContext(nameof(Dossier_InvalidParcelId_ReturnsBadRequest));
    var controller = new DossierController(db, new Mock<ICostForgeService>().Object, Mock.Of<IDossierDocumentService>(), NullLogger<DossierController>.Instance, Mock.Of<IHostEnvironment>(e => e.EnvironmentName == "Development"));
    AttachPrincipal(controller, CreatePrincipal(Guid.NewGuid().ToString(), "BENTON"));

    var result = await controller.GetCasefile("bad parcel id!", include: null);

    Assert.IsType<BadRequestObjectResult>(result);
  }
}
