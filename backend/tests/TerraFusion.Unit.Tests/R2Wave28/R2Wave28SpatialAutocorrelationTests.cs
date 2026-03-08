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

namespace TerraFusion.Unit.Tests.R2Wave28;

[Trait("Category", "R2Wave28")]
[Trait("Category", "SpatialAutocorrelation")]
public sealed class R2Wave28SpatialAutocorrelationTests
{
  private static readonly Guid BentonCountyId = Guid.NewGuid();

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

  private static ClaimsPrincipal CreatePrincipal(Guid countyId, string code = "BENTON")
    => new(new ClaimsIdentity(
    [
      new Claim("countyId", countyId.ToString()),
      new Claim("countyCode", code),
      new Claim("sub", "w28-test"),
      new Claim("userId", "w28-test"),
    ], "TestAuth"));

  private static ClaimsPrincipal CreateEmptyPrincipal() => new(new ClaimsIdentity());

  private static CostForgeController CreateController(DataDbContext db, ClaimsPrincipal? p = null)
  {
    var c = new CostForgeController(
      new Mock<CostForgeService>(MockBehavior.Strict).Object,
      new Mock<CostForgeAIService>(MockBehavior.Strict).Object,
      db, new Mock<AuditLogger>(MockBehavior.Strict).Object,
      NullLogger<CostForgeController>.Instance);
    c.ControllerContext = new ControllerContext
    {
      HttpContext = new DefaultHttpContext { User = p ?? CreatePrincipal(BentonCountyId) }
    };
    return c;
  }

  private static async Task SeedCounty(DataDbContext db, Guid id)
  {
    if (!await db.Counties.AnyAsync(c => c.Id == id))
    {
      db.Counties.Add(new County { Id = id, Name = "Benton", State = "WA", FipsCode = "003" });
      await db.SaveChangesAsync();
    }
  }

  private static System.Text.Json.JsonDocument Parse(object value)
    => System.Text.Json.JsonDocument.Parse(System.Text.Json.JsonSerializer.Serialize(value));

  // ── Clustered data: high values near each other ──

  private static SpatialAutocorrelationRequest CreateClusteredRequest()
  {
    return new SpatialAutocorrelationRequest
    {
      VariableName = "assessed_value",
      WeightType = "distance",
      Observations = new()
      {
        // Cluster of high values (north)
        new() { X = 0, Y = 10, Value = 500000 },
        new() { X = 1, Y = 10, Value = 510000 },
        new() { X = 0, Y = 11, Value = 505000 },
        new() { X = 1, Y = 11, Value = 520000 },
        // Cluster of low values (south)
        new() { X = 0, Y = 0, Value = 150000 },
        new() { X = 1, Y = 0, Value = 140000 },
        new() { X = 0, Y = 1, Value = 145000 },
        new() { X = 1, Y = 1, Value = 135000 },
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // Global Moran's I
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task MoranI_ClusteredData_PositiveAutocorrelation()
  {
    using var db = CreateDbContext(nameof(MoranI_ClusteredData_PositiveAutocorrelation));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var result = await ctrl.RunGlobalMoranI(CreateClusteredRequest());
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = Parse(ok.Value!);

    // Clustered data should have Moran's I > expected value (positive autocorrelation)
    double moranI = doc.RootElement.GetProperty("moranI").GetDouble();
    double expectedI = doc.RootElement.GetProperty("expectedI").GetDouble();
    moranI.Should().BeGreaterThan(expectedI);
  }

  [Fact]
  public async Task MoranI_ClusteredData_InterpretationIsClustering()
  {
    using var db = CreateDbContext(nameof(MoranI_ClusteredData_InterpretationIsClustering));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var result = await ctrl.RunGlobalMoranI(CreateClusteredRequest());
    var doc = Parse(((OkObjectResult)result).Value!);

    doc.RootElement.GetProperty("interpretation").GetString()
      .Should().Contain("clustering");
  }

  [Fact]
  public async Task MoranI_ReturnsValidZScoreAndPValue()
  {
    using var db = CreateDbContext(nameof(MoranI_ReturnsValidZScoreAndPValue));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var result = await ctrl.RunGlobalMoranI(CreateClusteredRequest());
    var doc = Parse(((OkObjectResult)result).Value!);

    doc.RootElement.GetProperty("pValue").GetDouble()
      .Should().BeGreaterThanOrEqualTo(0).And.BeLessThanOrEqualTo(1);
  }

  [Fact]
  public async Task MoranI_ReturnsClusterSummary()
  {
    using var db = CreateDbContext(nameof(MoranI_ReturnsClusterSummary));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var result = await ctrl.RunGlobalMoranI(CreateClusteredRequest());
    var doc = Parse(((OkObjectResult)result).Value!);

    var clusters = doc.RootElement.GetProperty("clusterSummary");
    clusters.TryGetProperty("highHigh", out _).Should().BeTrue();
    clusters.TryGetProperty("lowLow", out _).Should().BeTrue();
    clusters.TryGetProperty("notSignificant", out _).Should().BeTrue();
  }

  [Fact]
  public async Task MoranI_ReturnsLocalIndicators()
  {
    using var db = CreateDbContext(nameof(MoranI_ReturnsLocalIndicators));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var result = await ctrl.RunGlobalMoranI(CreateClusteredRequest());
    var doc = Parse(((OkObjectResult)result).Value!);

    doc.RootElement.GetProperty("localIndicators").GetArrayLength().Should().Be(8);
    doc.RootElement.GetProperty("clusters").GetArrayLength().Should().Be(8);
  }

  [Fact]
  public async Task MoranI_PersistsToDatabase()
  {
    using var db = CreateDbContext(nameof(MoranI_PersistsToDatabase));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    await ctrl.RunGlobalMoranI(CreateClusteredRequest());
    var stored = await db.SpatialAnalyses.FirstOrDefaultAsync();
    stored.Should().NotBeNull();
    stored!.AnalysisType.Should().Be("global_moran");
    stored.SampleSize.Should().Be(8);
  }

  [Fact]
  public async Task MoranI_TooFewObs_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(MoranI_TooFewObs_ReturnsBadRequest));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new SpatialAutocorrelationRequest
    {
      Observations = new()
      {
        new() { X = 0, Y = 0, Value = 100000 },
        new() { X = 1, Y = 1, Value = 200000 },
      }
    };
    var result = await ctrl.RunGlobalMoranI(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public async Task MoranI_NoCounty_ReturnsUnauthorized()
  {
    using var db = CreateDbContext(nameof(MoranI_NoCounty_ReturnsUnauthorized));
    var ctrl = CreateController(db, CreateEmptyPrincipal());
    var result = await ctrl.RunGlobalMoranI(CreateClusteredRequest());
    result.Should().BeOfType<UnauthorizedObjectResult>();
  }

  // ═══════════════════════════════════════════════════════════════
  // Geary's C
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task GearyC_ClusteredData_LessThanOne()
  {
    using var db = CreateDbContext(nameof(GearyC_ClusteredData_LessThanOne));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var result = await ctrl.RunGearyC(CreateClusteredRequest());
    var doc = Parse(((OkObjectResult)result).Value!);

    // Clustered data: Geary's C < 1 indicates positive autocorrelation
    doc.RootElement.GetProperty("gearyC").GetDouble().Should().BeLessThan(1.0);
  }

  [Fact]
  public async Task GearyC_InterpretationPositive()
  {
    using var db = CreateDbContext(nameof(GearyC_InterpretationPositive));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var result = await ctrl.RunGearyC(CreateClusteredRequest());
    var doc = Parse(((OkObjectResult)result).Value!);

    doc.RootElement.GetProperty("interpretation").GetString()
      .Should().Contain("positive");
  }

  [Fact]
  public async Task GearyC_PersistsAsGearyType()
  {
    using var db = CreateDbContext(nameof(GearyC_PersistsAsGearyType));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    await ctrl.RunGearyC(CreateClusteredRequest());
    var stored = await db.SpatialAnalyses.FirstOrDefaultAsync();
    stored!.AnalysisType.Should().Be("geary_c");
  }

  [Fact]
  public async Task GearyC_TooFewObs_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(GearyC_TooFewObs_ReturnsBadRequest));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new SpatialAutocorrelationRequest
    {
      Observations = new() { new() { X = 0, Y = 0, Value = 100000 } }
    };
    var result = await ctrl.RunGearyC(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // ═══════════════════════════════════════════════════════════════
  // Retrieval endpoints
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task GetSpatialResult_ExistingId_ReturnsStored()
  {
    using var db = CreateDbContext(nameof(GetSpatialResult_ExistingId_ReturnsStored));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var runResult = await ctrl.RunGlobalMoranI(CreateClusteredRequest());
    var id = Parse(((OkObjectResult)runResult).Value!).RootElement.GetProperty("id").GetGuid();

    var getResult = await ctrl.GetSpatialResult(id);
    var doc = Parse(((OkObjectResult)getResult).Value!);
    doc.RootElement.GetProperty("analysisType").GetString().Should().Be("global_moran");
    doc.RootElement.GetProperty("sampleSize").GetInt32().Should().Be(8);
  }

  [Fact]
  public async Task GetSpatialResult_WrongCounty_ReturnsNotFound()
  {
    using var db = CreateDbContext(nameof(GetSpatialResult_WrongCounty_ReturnsNotFound));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var runResult = await ctrl.RunGlobalMoranI(CreateClusteredRequest());
    var id = Parse(((OkObjectResult)runResult).Value!).RootElement.GetProperty("id").GetGuid();

    var otherCounty = Guid.NewGuid();
    await SeedCounty(db, otherCounty);
    var other = CreateController(db, CreatePrincipal(otherCounty, "OTHER"));
    var result = await other.GetSpatialResult(id);
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  public async Task GetSpatialHistory_ReturnsEntries()
  {
    using var db = CreateDbContext(nameof(GetSpatialHistory_ReturnsEntries));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    await ctrl.RunGlobalMoranI(CreateClusteredRequest());
    await ctrl.RunGearyC(CreateClusteredRequest());

    var result = await ctrl.GetSpatialHistory(10);
    var doc = Parse(((OkObjectResult)result).Value!);
    doc.RootElement.GetProperty("count").GetInt32().Should().Be(2);
  }

  [Fact]
  public async Task GetSpatialHistory_Empty_ReturnsZeroCount()
  {
    using var db = CreateDbContext(nameof(GetSpatialHistory_Empty_ReturnsZeroCount));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var result = await ctrl.GetSpatialHistory(10);
    var doc = Parse(((OkObjectResult)result).Value!);
    doc.RootElement.GetProperty("count").GetInt32().Should().Be(0);
  }

  // ═══════════════════════════════════════════════════════════════
  // Weight types
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task MoranI_KnnWeight_ProducesResult()
  {
    using var db = CreateDbContext(nameof(MoranI_KnnWeight_ProducesResult));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = CreateClusteredRequest();
    request.WeightType = "knn";

    var result = await ctrl.RunGlobalMoranI(request);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  public async Task MoranI_InverseDistanceWeight_ProducesResult()
  {
    using var db = CreateDbContext(nameof(MoranI_InverseDistanceWeight_ProducesResult));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = CreateClusteredRequest();
    request.WeightType = "inverse_distance";

    var result = await ctrl.RunGlobalMoranI(request);
    result.Should().BeOfType<OkObjectResult>();
  }
}
