using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities;
using Xunit;
using AuditLogger = TerraFusion.Abstractions.Interfaces.IAuditLogger;
using CostForgeAIService = TerraFusion.Core.Services.ICostForgeAIService;
using CostForgeService = TerraFusion.Core.Services.ICostForgeService;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R2Wave26;

[Trait("Category", "R2Wave26")]
[Trait("Category", "OlsRegression")]
public sealed class R2Wave26OlsRegressionTests
{
  private static readonly Guid BentonCountyId = Guid.NewGuid();
  private const string BentonFips = "003";

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

  private static ClaimsPrincipal CreatePrincipal(Guid countyId, string countyCode = "BENTON")
  {
    return new ClaimsPrincipal(new ClaimsIdentity(
    [
      new Claim("countyId", countyId.ToString()),
      new Claim("countyCode", countyCode),
      new Claim("sub", "w26-test-user"),
      new Claim("userId", "w26-test-user"),
    ], "TestAuth"));
  }

  private static ClaimsPrincipal CreateEmptyPrincipal()
    => new(new ClaimsIdentity());

  private static void AttachPrincipal(ControllerBase controller, ClaimsPrincipal principal)
  {
    controller.ControllerContext = new ControllerContext
    {
      HttpContext = new DefaultHttpContext { User = principal },
    };
  }

  private static CostForgeController CreateController(DataDbContext db, ClaimsPrincipal? principal = null)
  {
    var costForge = new Mock<CostForgeService>(MockBehavior.Strict);
    var costForgeAi = new Mock<CostForgeAIService>(MockBehavior.Strict);
    var auditLogger = new Mock<AuditLogger>(MockBehavior.Strict);

    var controller = new CostForgeController(
      costForge.Object, costForgeAi.Object, db, auditLogger.Object,
      NullLogger<CostForgeController>.Instance);

    AttachPrincipal(controller, principal ?? CreatePrincipal(BentonCountyId));
    return controller;
  }

  private static async Task SeedCounty(DataDbContext db, Guid countyId)
  {
    if (!await db.Counties.AnyAsync(c => c.Id == countyId))
    {
      db.Counties.Add(new County
      {
        Id = countyId,
        Name = "Benton",
        State = "WA",
        FipsCode = BentonFips,
      });
      await db.SaveChangesAsync();
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Perfect linear relationship: value = 100 + 2*sqft + 3*acreage - 0.5*age
  // ═══════════════════════════════════════════════════════════════

  private static OlsRegressionRequest CreatePerfectLinearRequest()
  {
    // value = 100 + 2*sqft + 3*acreage - 0.5*age
    return new OlsRegressionRequest
    {
      FeatureNames = new[] { "sqft", "acreage", "age" },
      DependentVariable = "assessed_value",
      Observations = new List<RegressionObservation>
      {
        new() { Features = new[] { 1000.0, 0.5, 10.0 }, Value = 100 + 2 * 1000 + 3 * 0.5 - 0.5 * 10 },   // 2096.5
        new() { Features = new[] { 1500.0, 1.0, 20.0 }, Value = 100 + 2 * 1500 + 3 * 1.0 - 0.5 * 20 },   // 3093.0
        new() { Features = new[] { 2000.0, 0.25, 5.0 }, Value = 100 + 2 * 2000 + 3 * 0.25 - 0.5 * 5 },   // 4098.25
        new() { Features = new[] { 800.0, 2.0, 30.0 }, Value = 100 + 2 * 800 + 3 * 2.0 - 0.5 * 30 },     // 1691.0
        new() { Features = new[] { 2500.0, 0.75, 15.0 }, Value = 100 + 2 * 2500 + 3 * 0.75 - 0.5 * 15 }, // 5094.75
      }
    };
  }

  [Fact]
  public async Task RunOlsRegression_PerfectLinear_ReturnsRSquaredNearOne()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_PerfectLinear_ReturnsRSquaredNearOne));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunOlsRegression(CreatePerfectLinearRequest());

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    doc.RootElement.GetProperty("rSquared").GetDouble().Should().BeGreaterThan(0.999);
  }

  [Fact]
  public async Task RunOlsRegression_PerfectLinear_RecoversCorrectCoefficients()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_PerfectLinear_RecoversCorrectCoefficients));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunOlsRegression(CreatePerfectLinearRequest());

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    var intercept = doc.RootElement.GetProperty("intercept").GetDouble();
    intercept.Should().BeApproximately(100.0, 1.0);

    var coeffArray = doc.RootElement.GetProperty("coefficients");
    var sqftCoeff = coeffArray[0].GetProperty("coefficient").GetDouble();
    sqftCoeff.Should().BeApproximately(2.0, 0.1);

    var acreageCoeff = coeffArray[1].GetProperty("coefficient").GetDouble();
    acreageCoeff.Should().BeApproximately(3.0, 0.1);

    var ageCoeff = coeffArray[2].GetProperty("coefficient").GetDouble();
    ageCoeff.Should().BeApproximately(-0.5, 0.1);
  }

  [Fact]
  public async Task RunOlsRegression_PerfectLinear_HasCorrectSampleSize()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_PerfectLinear_HasCorrectSampleSize));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunOlsRegression(CreatePerfectLinearRequest());

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    doc.RootElement.GetProperty("sampleSize").GetInt32().Should().Be(5);
  }

  [Fact]
  public async Task RunOlsRegression_PerfectLinear_ReturnsPredictions()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_PerfectLinear_ReturnsPredictions));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunOlsRegression(CreatePerfectLinearRequest());

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    var predictions = doc.RootElement.GetProperty("predictions");
    predictions.GetArrayLength().Should().Be(5);
  }

  [Fact]
  public async Task RunOlsRegression_PerfectLinear_FStatNonNegative()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_PerfectLinear_FStatNonNegative));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunOlsRegression(CreatePerfectLinearRequest());

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    // Perfect fit: R²=1.0, F-stat → ∞ (clamped to 0 to avoid division by zero)
    doc.RootElement.GetProperty("fStatistic").GetDouble().Should().BeGreaterThanOrEqualTo(0);
  }

  [Fact]
  public async Task RunOlsRegression_PerfectLinear_PersistsToDatabase()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_PerfectLinear_PersistsToDatabase));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.RunOlsRegression(CreatePerfectLinearRequest());

    var stored = await db.RegressionAnalyses.FirstOrDefaultAsync();
    stored.Should().NotBeNull();
    stored!.CountyId.Should().Be(BentonCountyId);
    stored.SampleSize.Should().Be(5);
    stored.RSquared.Should().BeGreaterThan(0.99);
  }

  // ═══════════════════════════════════════════════════════════════
  // Noisy data — R² should be moderate (not 1.0)
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task RunOlsRegression_NoisyData_RSquaredBelowOne()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_NoisyData_RSquaredBelowOne));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var request = new OlsRegressionRequest
    {
      FeatureNames = new[] { "sqft", "acreage", "age" },
      Observations = new List<RegressionObservation>
      {
        new() { Features = new[] { 1200.0, 0.3, 12.0 }, Value = 250000 },
        new() { Features = new[] { 1800.0, 0.5, 8.0 },  Value = 350000 },
        new() { Features = new[] { 2200.0, 1.0, 25.0 }, Value = 310000 },
        new() { Features = new[] { 900.0, 0.2, 40.0 },  Value = 180000 },
        new() { Features = new[] { 3000.0, 2.0, 5.0 },  Value = 520000 },
        new() { Features = new[] { 1500.0, 0.4, 18.0 }, Value = 285000 },
        new() { Features = new[] { 2600.0, 1.5, 3.0 },  Value = 470000 },
      }
    };

    var result = await controller.RunOlsRegression(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    var r2 = doc.RootElement.GetProperty("rSquared").GetDouble();
    r2.Should().BeGreaterThan(0.5).And.BeLessThan(1.0);
  }

  [Fact]
  public async Task RunOlsRegression_NoisyData_AdjustedRSquaredLessThanRSquared()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_NoisyData_AdjustedRSquaredLessThanRSquared));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var request = new OlsRegressionRequest
    {
      FeatureNames = new[] { "sqft", "acreage", "age" },
      Observations = new List<RegressionObservation>
      {
        new() { Features = new[] { 1200.0, 0.3, 12.0 }, Value = 250000 },
        new() { Features = new[] { 1800.0, 0.5, 8.0 },  Value = 350000 },
        new() { Features = new[] { 2200.0, 1.0, 25.0 }, Value = 310000 },
        new() { Features = new[] { 900.0, 0.2, 40.0 },  Value = 180000 },
        new() { Features = new[] { 3000.0, 2.0, 5.0 },  Value = 520000 },
        new() { Features = new[] { 1500.0, 0.4, 18.0 }, Value = 285000 },
        new() { Features = new[] { 2600.0, 1.5, 3.0 },  Value = 470000 },
      }
    };

    var result = await controller.RunOlsRegression(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    var r2 = doc.RootElement.GetProperty("rSquared").GetDouble();
    var adjR2 = doc.RootElement.GetProperty("adjustedRSquared").GetDouble();
    adjR2.Should().BeLessThanOrEqualTo(r2);
  }

  // ═══════════════════════════════════════════════════════════════
  // Edge cases
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task RunOlsRegression_TooFewObservations_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_TooFewObservations_ReturnsBadRequest));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var request = new OlsRegressionRequest
    {
      Observations = new List<RegressionObservation>
      {
        new() { Features = new[] { 1000.0, 0.5, 10.0 }, Value = 250000 },
        new() { Features = new[] { 2000.0, 1.0, 20.0 }, Value = 350000 },
      }
    };

    var result = await controller.RunOlsRegression(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public async Task RunOlsRegression_EmptyObservations_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_EmptyObservations_ReturnsBadRequest));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var request = new OlsRegressionRequest { Observations = new() };
    var result = await controller.RunOlsRegression(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public async Task RunOlsRegression_NoCountyContext_ReturnsUnauthorized()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_NoCountyContext_ReturnsUnauthorized));
    var controller = CreateController(db, CreateEmptyPrincipal());

    var result = await controller.RunOlsRegression(CreatePerfectLinearRequest());
    result.Should().BeOfType<UnauthorizedObjectResult>();
  }

  [Fact]
  public async Task RunOlsRegression_SingleFeature_Works()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_SingleFeature_Works));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var request = new OlsRegressionRequest
    {
      FeatureNames = new[] { "sqft" },
      Observations = new List<RegressionObservation>
      {
        new() { Features = new[] { 1000.0 }, Value = 200000 },
        new() { Features = new[] { 1500.0 }, Value = 300000 },
        new() { Features = new[] { 2000.0 }, Value = 400000 },
        new() { Features = new[] { 2500.0 }, Value = 500000 },
      }
    };

    var result = await controller.RunOlsRegression(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    // Perfect linear: R² should be ~1.0
    doc.RootElement.GetProperty("rSquared").GetDouble().Should().BeGreaterThan(0.99);
    doc.RootElement.GetProperty("coefficients").GetArrayLength().Should().Be(1);
  }

  // ═══════════════════════════════════════════════════════════════
  // Retrieval endpoints
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task GetRegressionResult_ExistingId_ReturnsStored()
  {
    using var db = CreateDbContext(nameof(GetRegressionResult_ExistingId_ReturnsStored));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    // First run a regression
    var runResult = await controller.RunOlsRegression(CreatePerfectLinearRequest());
    var ok = runResult.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);
    var id = doc.RootElement.GetProperty("id").GetGuid();

    // Retrieve it
    var getResult = await controller.GetRegressionResult(id);
    var getOk = getResult.Should().BeOfType<OkObjectResult>().Subject;
    var getJson = System.Text.Json.JsonSerializer.Serialize(getOk.Value);
    var getDoc = System.Text.Json.JsonDocument.Parse(getJson);

    getDoc.RootElement.GetProperty("rSquared").GetDouble().Should().BeGreaterThan(0.99);
    getDoc.RootElement.GetProperty("sampleSize").GetInt32().Should().Be(5);
  }

  [Fact]
  public async Task GetRegressionResult_NonexistentId_ReturnsNotFound()
  {
    using var db = CreateDbContext(nameof(GetRegressionResult_NonexistentId_ReturnsNotFound));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.GetRegressionResult(Guid.NewGuid());
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  public async Task GetRegressionResult_WrongCounty_ReturnsNotFound()
  {
    using var db = CreateDbContext(nameof(GetRegressionResult_WrongCounty_ReturnsNotFound));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    // Run from Benton
    var runResult = await controller.RunOlsRegression(CreatePerfectLinearRequest());
    var ok = runResult.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);
    var id = doc.RootElement.GetProperty("id").GetGuid();

    // Try from different county
    var otherCountyId = Guid.NewGuid();
    await SeedCounty(db, otherCountyId);
    var otherController = CreateController(db, CreatePrincipal(otherCountyId, "OTHER"));

    var result = await otherController.GetRegressionResult(id);
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  public async Task GetRegressionDiagnostics_ExistingId_ReturnsDiagnostics()
  {
    using var db = CreateDbContext(nameof(GetRegressionDiagnostics_ExistingId_ReturnsDiagnostics));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var runResult = await controller.RunOlsRegression(CreatePerfectLinearRequest());
    var ok = runResult.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);
    var id = doc.RootElement.GetProperty("id").GetGuid();

    var diagResult = await controller.GetRegressionDiagnostics(id);
    var diagOk = diagResult.Should().BeOfType<OkObjectResult>().Subject;
    var diagJson = System.Text.Json.JsonSerializer.Serialize(diagOk.Value);
    var diagDoc = System.Text.Json.JsonDocument.Parse(diagJson);

    diagDoc.RootElement.GetProperty("rSquared").GetDouble().Should().BeGreaterThan(0.99);
    diagDoc.RootElement.GetProperty("sampleSize").GetInt32().Should().Be(5);
  }

  [Fact]
  public async Task GetRegressionHistory_EmptyInitially_ReturnsEmptyList()
  {
    using var db = CreateDbContext(nameof(GetRegressionHistory_EmptyInitially_ReturnsEmptyList));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.GetRegressionHistory(10);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    doc.RootElement.GetProperty("count").GetInt32().Should().Be(0);
  }

  [Fact]
  public async Task GetRegressionHistory_AfterRun_ContainsEntry()
  {
    using var db = CreateDbContext(nameof(GetRegressionHistory_AfterRun_ContainsEntry));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.RunOlsRegression(CreatePerfectLinearRequest());

    var result = await controller.GetRegressionHistory(10);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    doc.RootElement.GetProperty("count").GetInt32().Should().Be(1);
  }

  // ═══════════════════════════════════════════════════════════════
  // R² bounds and mathematical properties
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task RunOlsRegression_RSquared_BoundedZeroToOne()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_RSquared_BoundedZeroToOne));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var request = new OlsRegressionRequest
    {
      FeatureNames = new[] { "sqft", "acreage" },
      Observations = new List<RegressionObservation>
      {
        new() { Features = new[] { 1000.0, 0.5 }, Value = 200000 },
        new() { Features = new[] { 1500.0, 0.8 }, Value = 340000 },
        new() { Features = new[] { 1200.0, 1.0 }, Value = 220000 },
        new() { Features = new[] { 2000.0, 0.3 }, Value = 380000 },
        new() { Features = new[] { 1800.0, 1.5 }, Value = 410000 },
      }
    };

    var result = await controller.RunOlsRegression(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    var r2 = doc.RootElement.GetProperty("rSquared").GetDouble();
    r2.Should().BeGreaterThanOrEqualTo(0.0).And.BeLessThanOrEqualTo(1.0);
  }

  [Fact]
  public async Task RunOlsRegression_Diagnostics_ContainsExpectedKeys()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_Diagnostics_ContainsExpectedKeys));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunOlsRegression(CreatePerfectLinearRequest());
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    var diag = doc.RootElement.GetProperty("diagnostics");
    diag.TryGetProperty("heteroskedasticity", out _).Should().BeTrue();
    diag.TryGetProperty("autocorrelation", out _).Should().BeTrue();
    diag.TryGetProperty("normality", out _).Should().BeTrue();
    diag.TryGetProperty("residualStd", out _).Should().BeTrue();
    diag.TryGetProperty("maxAbsResidual", out _).Should().BeTrue();
  }

  [Fact]
  public async Task RunOlsRegression_StandardErrors_AllPositive()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_StandardErrors_AllPositive));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var request = new OlsRegressionRequest
    {
      FeatureNames = new[] { "sqft", "acreage", "age" },
      Observations = new List<RegressionObservation>
      {
        new() { Features = new[] { 1200.0, 0.3, 12.0 }, Value = 250000 },
        new() { Features = new[] { 1800.0, 0.5, 8.0 },  Value = 350000 },
        new() { Features = new[] { 2200.0, 1.0, 25.0 }, Value = 310000 },
        new() { Features = new[] { 900.0, 0.2, 40.0 },  Value = 180000 },
        new() { Features = new[] { 3000.0, 2.0, 5.0 },  Value = 520000 },
        new() { Features = new[] { 1500.0, 0.4, 18.0 }, Value = 285000 },
        new() { Features = new[] { 2600.0, 1.5, 3.0 },  Value = 470000 },
      }
    };

    var result = await controller.RunOlsRegression(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    var coeffs = doc.RootElement.GetProperty("coefficients");
    foreach (var coeff in coeffs.EnumerateArray())
    {
      coeff.GetProperty("standardError").GetDouble().Should().BeGreaterThanOrEqualTo(0);
    }
  }

  [Fact]
  public async Task RunOlsRegression_ReturnedId_IsValidGuid()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_ReturnedId_IsValidGuid));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunOlsRegression(CreatePerfectLinearRequest());
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    var id = doc.RootElement.GetProperty("id").GetGuid();
    id.Should().NotBeEmpty();
  }

  [Fact]
  public async Task RunOlsRegression_CustomFeatureNames_Persisted()
  {
    using var db = CreateDbContext(nameof(RunOlsRegression_CustomFeatureNames_Persisted));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var request = new OlsRegressionRequest
    {
      FeatureNames = new[] { "bedroom_count", "bathroom_count" },
      DependentVariable = "sale_price",
      Observations = new List<RegressionObservation>
      {
        new() { Features = new[] { 3.0, 2.0 }, Value = 300000 },
        new() { Features = new[] { 4.0, 3.0 }, Value = 450000 },
        new() { Features = new[] { 2.0, 1.0 }, Value = 200000 },
        new() { Features = new[] { 5.0, 3.0 }, Value = 500000 },
      }
    };

    var result = await controller.RunOlsRegression(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = System.Text.Json.JsonSerializer.Serialize(ok.Value);
    var doc = System.Text.Json.JsonDocument.Parse(json);

    var coeffs = doc.RootElement.GetProperty("coefficients");
    coeffs[0].GetProperty("feature").GetString().Should().Be("bedroom_count");
    coeffs[1].GetProperty("feature").GetString().Should().Be("bathroom_count");
  }
}
