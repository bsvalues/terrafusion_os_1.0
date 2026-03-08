using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Services;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;

namespace TerraFusion.Unit.Tests.R2Wave34;

[Trait("Category", "R2Wave34")]
public sealed class R2Wave34MlIntegrationTests
{
  // ── helpers ──

  private static DataDbContext CreateDbContext(string name)
  {
    var opts = new DbContextOptionsBuilder<DataDbContext>()
      .UseInMemoryDatabase(name).Options;
    var config = new ConfigurationBuilder().Build();
    return new DataDbContext(opts, config);
  }

  private static ClaimsPrincipal CreatePrincipal(Guid countyId) =>
    new(new ClaimsIdentity(new[]
    {
      new Claim("countyId", countyId.ToString()),
      new Claim("sub", "test-user"),
    }, "test"));

  private static CostForgeController CreateController(DataDbContext db, ClaimsPrincipal principal)
  {
    var ctrl = new CostForgeController(
      new Mock<ICostForgeService>().Object,
      new Mock<ICostForgeAIService>().Object,
      db,
      new Mock<TerraFusion.Abstractions.Interfaces.IAuditLogger>().Object,
      NullLogger<CostForgeController>.Instance)
    {
      ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } }
    };
    return ctrl;
  }

  private static async Task SeedCounty(DataDbContext db, Guid countyId)
  {
    db.Counties.Add(new TerraFusion.Core.Entities.County
    {
      Id = countyId,
      Name = "TestCounty",
      State = "WA",
      FipsCode = "00000",
    });
    await db.SaveChangesAsync();
  }

  // ── predict ──

  [Fact]
  public async Task Predict_ValidFeatures_ReturnsOkWithPrediction()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(Predict_ValidFeatures_ReturnsOkWithPrediction));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.MlPredict(new MlPredictRequest
    {
      ModelType = "property_value",
      ParcelId = "P001",
      Features = new() { ["sqft"] = 2000, ["bedrooms"] = 3, ["bathrooms"] = 2 },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    ((string)val.modelType).Should().Be("property_value");
    ((string)val.parcelId).Should().Be("P001");
    ((decimal)val.predictedValue).Should().BeGreaterThan(0);
    ((double)val.confidence).Should().BeInRange(0.5, 1.0);
    ((int)val.featureCount).Should().Be(3);
    ((long)val.inferenceTimeMs).Should().BeGreaterOrEqualTo(0);
  }

  [Fact]
  public async Task Predict_EmptyFeatures_ReturnsBadRequest()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(Predict_EmptyFeatures_ReturnsBadRequest));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.MlPredict(new MlPredictRequest
    {
      ModelType = "property_value",
      Features = new(),
    });

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public async Task Predict_DefaultsModelTypeAndVersion()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(Predict_DefaultsModelTypeAndVersion));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.MlPredict(new MlPredictRequest
    {
      Features = new() { ["value"] = 100 },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    ((string)val.modelType).Should().Be("property_value");
    ((string)val.modelVersion).Should().Be("1.0");
  }

  [Fact]
  public async Task Predict_CustomTrainingSamples_UsesProvided()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(Predict_CustomTrainingSamples_UsesProvided));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.MlPredict(new MlPredictRequest
    {
      Features = new() { ["sqft"] = 1500 },
      TrainingSamples = 5000,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    ((int)val.trainingSamples).Should().Be(5000);
  }

  [Fact]
  public async Task Predict_ManyFeatures_HigherConfidence()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(Predict_ManyFeatures_HigherConfidence));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var fewResult = await ctrl.MlPredict(new MlPredictRequest
    {
      Features = new() { ["sqft"] = 1000 },
    });
    var manyResult = await ctrl.MlPredict(new MlPredictRequest
    {
      Features = new()
      {
        ["sqft"] = 1000, ["beds"] = 3, ["baths"] = 2,
        ["lot"] = 5000, ["age"] = 10, ["garage"] = 2,
      },
    });

    var fewOk = fewResult.Should().BeOfType<OkObjectResult>().Subject;
    var manyOk = manyResult.Should().BeOfType<OkObjectResult>().Subject;
    dynamic fewVal = fewOk.Value!;
    dynamic manyVal = manyOk.Value!;
    ((double)manyVal.confidence).Should().BeGreaterThan((double)fewVal.confidence);
  }

  [Fact]
  public async Task Predict_AccuracyMetricsAreReasonable()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(Predict_AccuracyMetricsAreReasonable));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.MlPredict(new MlPredictRequest
    {
      Features = new() { ["sqft"] = 2000, ["beds"] = 4 },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    ((double)val.modelAccuracy).Should().BeInRange(0.5, 1.0);
    ((decimal)val.meanAbsoluteError).Should().BeGreaterOrEqualTo(0);
    ((decimal)val.rootMeanSquaredError).Should().BeGreaterOrEqualTo((decimal)val.meanAbsoluteError);
  }

  // ── persistence & retrieval ──

  [Fact]
  public async Task Predict_PersistsToDatabase()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(Predict_PersistsToDatabase));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    await ctrl.MlPredict(new MlPredictRequest
    {
      ModelType = "land_classification",
      ParcelId = "P-PERSIST",
      Features = new() { ["sqft"] = 2500 },
    });

    var saved = await db.Set<TerraFusion.Core.Entities.MlPrediction>().FirstOrDefaultAsync();
    saved.Should().NotBeNull();
    saved!.ParcelId.Should().Be("P-PERSIST");
    saved.ModelType.Should().Be("land_classification");
    saved.CountyId.Should().Be(cid);
    saved.CreatedBy.Should().Be("test-user");
  }

  [Fact]
  public async Task GetMlPrediction_ExistingId_ReturnsOk()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(GetMlPrediction_ExistingId_ReturnsOk));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var createResult = await ctrl.MlPredict(new MlPredictRequest
    {
      Features = new() { ["sqft"] = 1000 },
    });
    var createOk = (OkObjectResult)createResult;
    dynamic created = createOk.Value!;
    int id = (int)created.id;

    var getResult = await ctrl.GetMlPrediction(id);
    getResult.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  public async Task GetMlPrediction_MissingId_ReturnsNotFound()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(GetMlPrediction_MissingId_ReturnsNotFound));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.GetMlPrediction(999);
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  // ── county isolation ──

  [Fact]
  public async Task GetMlPrediction_OtherCounty_ReturnsNotFound()
  {
    var cidA = Guid.NewGuid();
    var cidB = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(GetMlPrediction_OtherCounty_ReturnsNotFound));
    await SeedCounty(db, cidA);
    await SeedCounty(db, cidB);

    var ctrlA = CreateController(db, CreatePrincipal(cidA));
    var createResult = await ctrlA.MlPredict(new MlPredictRequest
    {
      Features = new() { ["sqft"] = 1000 },
    });
    var createOk = (OkObjectResult)createResult;
    dynamic created = createOk.Value!;
    int id = (int)created.id;

    // County B cannot see County A's prediction
    var ctrlB = CreateController(db, CreatePrincipal(cidB));
    var getResult = await ctrlB.GetMlPrediction(id);
    getResult.Should().BeOfType<NotFoundObjectResult>();
  }

  // ── history ──

  [Fact]
  public async Task GetMlHistory_ReturnsItems()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(GetMlHistory_ReturnsItems));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    await ctrl.MlPredict(new MlPredictRequest { Features = new() { ["a"] = 1 } });
    await ctrl.MlPredict(new MlPredictRequest { Features = new() { ["b"] = 2 } });

    var result = await ctrl.GetMlHistory(null);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    ((int)val.count).Should().Be(2);
  }

  [Fact]
  public async Task GetMlHistory_FiltersByModelType()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(GetMlHistory_FiltersByModelType));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    await ctrl.MlPredict(new MlPredictRequest { ModelType = "property_value", Features = new() { ["a"] = 1 } });
    await ctrl.MlPredict(new MlPredictRequest { ModelType = "market_trend", Features = new() { ["b"] = 2 } });

    var result = await ctrl.GetMlHistory("market_trend");
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    ((int)val.count).Should().Be(1);
  }

  // ── auth ──

  [Fact]
  public async Task Predict_NoAuth_ReturnsUnauthorized()
  {
    await using var db = CreateDbContext(nameof(Predict_NoAuth_ReturnsUnauthorized));
    var ctrl = new CostForgeController(
      new Mock<ICostForgeService>().Object,
      new Mock<ICostForgeAIService>().Object,
      db,
      new Mock<TerraFusion.Abstractions.Interfaces.IAuditLogger>().Object,
      NullLogger<CostForgeController>.Instance)
    {
      ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
    };

    var result = await ctrl.MlPredict(new MlPredictRequest { Features = new() { ["x"] = 1 } });
    result.Should().BeOfType<UnauthorizedObjectResult>();
  }
}
