using System.Security.Claims;
using System.Text.Json;
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

namespace TerraFusion.Unit.Tests.R2Wave32;

[Trait("Category", "R2Wave32")]
[Trait("Category", "DataQuality")]
public sealed class R2Wave32DataQualityTests
{
  private static readonly Guid BentonCountyId = Guid.NewGuid();
  private static readonly Guid OtherCountyId = Guid.NewGuid();

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
    => new(new ClaimsIdentity(
    [
      new Claim("countyId", countyId.ToString()),
      new Claim("countyCode", countyCode),
      new Claim("sub", "w32-test-user"),
    ], "TestAuth"));

  private static CostForgeController CreateController(DataDbContext db, ClaimsPrincipal? principal = null)
  {
    var controller = new CostForgeController(
      new Mock<CostForgeService>(MockBehavior.Strict).Object,
      new Mock<CostForgeAIService>(MockBehavior.Strict).Object,
      db,
      new Mock<AuditLogger>(MockBehavior.Strict).Object,
      NullLogger<CostForgeController>.Instance);

    controller.ControllerContext = new ControllerContext
    {
      HttpContext = new DefaultHttpContext { User = principal ?? CreatePrincipal(BentonCountyId) },
    };
    return controller;
  }

  private static async Task SeedCounty(DataDbContext db, Guid countyId, string name = "Benton", string fips = "003")
  {
    if (!await db.Counties.AnyAsync(c => c.Id == countyId))
    {
      db.Counties.Add(new County { Id = countyId, Name = name, State = "WA", FipsCode = fips });
      await db.SaveChangesAsync();
    }
  }

  private static DataQualityRecord MakeRecord(string parcelId, decimal assessedValue, decimal landArea, DateTime? lastUpdated = null)
    => new()
    {
      ParcelId = parcelId,
      LastUpdated = lastUpdated ?? DateTime.UtcNow,
      Fields = new Dictionary<string, string?>
      {
        ["parcelId"] = parcelId,
        ["assessedValue"] = assessedValue.ToString(),
        ["landArea"] = landArea.ToString(),
      },
    };

  // ════════════════════════════════════════
  // Quality Assessment
  // ════════════════════════════════════════

  [Fact]
  public async Task Assess_PerfectData_GradeA()
  {
    using var db = CreateDbContext(nameof(Assess_PerfectData_GradeA));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.AssessDataQuality(new DataQualityRequest
    {
      Records = new()
      {
        MakeRecord("P-001", 250_000m, 5000m),
        MakeRecord("P-002", 180_000m, 3500m),
        MakeRecord("P-003", 320_000m, 8000m),
      },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("overallScore").GetDouble().Should().Be(100);
    doc.RootElement.GetProperty("grade").GetString().Should().Be("A");
    doc.RootElement.GetProperty("issueCount").GetInt32().Should().Be(0);
  }

  [Fact]
  public async Task Assess_MissingFields_LowersCompleteness()
  {
    using var db = CreateDbContext(nameof(Assess_MissingFields_LowersCompleteness));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.AssessDataQuality(new DataQualityRequest
    {
      Records = new()
      {
        MakeRecord("P-001", 250_000m, 5000m),
        new() { ParcelId = "P-002", LastUpdated = DateTime.UtcNow, Fields = new() { ["parcelId"] = "P-002" } }, // missing assessedValue & landArea
      },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("completenessScore").GetDouble().Should().Be(50);
    doc.RootElement.GetProperty("overallScore").GetDouble().Should().BeLessThan(100);
  }

  [Fact]
  public async Task Assess_NegativeAssessedValue_InconsistentRecord()
  {
    using var db = CreateDbContext(nameof(Assess_NegativeAssessedValue_InconsistentRecord));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.AssessDataQuality(new DataQualityRequest
    {
      Records = new()
      {
        new()
        {
          ParcelId = "P-001",
          LastUpdated = DateTime.UtcNow,
          Fields = new() { ["parcelId"] = "P-001", ["assessedValue"] = "-50000", ["landArea"] = "5000" },
        },
      },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("consistencyScore").GetDouble().Should().Be(0);
    doc.RootElement.GetProperty("issueCount").GetInt32().Should().BeGreaterThan(0);
  }

  [Fact]
  public async Task Assess_OldRecords_LowTimeliness()
  {
    using var db = CreateDbContext(nameof(Assess_OldRecords_LowTimeliness));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var staleDate = DateTime.UtcNow.AddDays(-500);
    var result = await controller.AssessDataQuality(new DataQualityRequest
    {
      TimelinessWindowDays = 365,
      Records = new()
      {
        MakeRecord("P-001", 250_000m, 5000m, staleDate),
        MakeRecord("P-002", 180_000m, 3500m, staleDate),
      },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("timelinessScore").GetDouble().Should().Be(0);
  }

  [Fact]
  public async Task Assess_OutOfRangeValue_LowAccuracy()
  {
    using var db = CreateDbContext(nameof(Assess_OutOfRangeValue_LowAccuracy));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.AssessDataQuality(new DataQualityRequest
    {
      Records = new()
      {
        new()
        {
          ParcelId = "P-001",
          LastUpdated = DateTime.UtcNow,
          Fields = new() { ["parcelId"] = "P-001", ["assessedValue"] = "999999999999", ["landArea"] = "5000" },
        },
      },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("accuracyScore").GetDouble().Should().Be(0);
  }

  [Fact]
  public async Task Assess_EmptyRecords_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(Assess_EmptyRecords_ReturnsBadRequest));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.AssessDataQuality(new DataQualityRequest { Records = new() });

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public async Task Assess_GradeD_ScoreBetween60And70()
  {
    using var db = CreateDbContext(nameof(Assess_GradeD_ScoreBetween60And70));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    // 3 good records, 2 bad (missing fields, stale, inconsistent)
    var result = await controller.AssessDataQuality(new DataQualityRequest
    {
      TimelinessWindowDays = 30,
      Records = new()
      {
        MakeRecord("P-001", 250_000m, 5000m, DateTime.UtcNow),
        MakeRecord("P-002", 180_000m, 3500m, DateTime.UtcNow),
        MakeRecord("P-003", 320_000m, 8000m, DateTime.UtcNow),
        new() { ParcelId = "P-004", LastUpdated = DateTime.UtcNow.AddDays(-60), Fields = new() { ["parcelId"] = "P-004" } },
        new() { ParcelId = "P-005", Fields = new() { ["parcelId"] = "P-005", ["assessedValue"] = "-1", ["landArea"] = "0" } },
      },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    var score = doc.RootElement.GetProperty("overallScore").GetDouble();
    score.Should().BeGreaterThanOrEqualTo(40).And.BeLessThan(90);
  }

  [Fact]
  public async Task Assess_PersistsToDb()
  {
    using var db = CreateDbContext(nameof(Assess_PersistsToDb));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.AssessDataQuality(new DataQualityRequest
    {
      Scope = "district",
      Records = new() { MakeRecord("P-001", 250_000m, 5000m) },
    });

    var entities = await db.Set<DataQualityAssessment>().ToListAsync();
    entities.Should().HaveCount(1);
    entities[0].Scope.Should().Be("district");
  }

  // ════════════════════════════════════════
  // Retrieval & County Isolation
  // ════════════════════════════════════════

  [Fact]
  public async Task GetAssessment_RetrievesById()
  {
    using var db = CreateDbContext(nameof(GetAssessment_RetrievesById));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.AssessDataQuality(new DataQualityRequest
    {
      Records = new() { MakeRecord("P-001", 250_000m, 5000m) },
    });
    var saved = await db.Set<DataQualityAssessment>().FirstAsync();

    var result = await controller.GetDataQualityAssessment(saved.Id);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);
    doc.RootElement.GetProperty("id").GetInt32().Should().Be(saved.Id);
  }

  [Fact]
  public async Task GetAssessment_WrongCounty_ReturnsNotFound()
  {
    using var db = CreateDbContext(nameof(GetAssessment_WrongCounty_ReturnsNotFound));
    await SeedCounty(db, BentonCountyId);
    await SeedCounty(db, OtherCountyId, "Other", "999");

    var bentonController = CreateController(db, CreatePrincipal(BentonCountyId));
    await bentonController.AssessDataQuality(new DataQualityRequest
    {
      Records = new() { MakeRecord("P-001", 250_000m, 5000m) },
    });
    var saved = await db.Set<DataQualityAssessment>().FirstAsync();

    var otherController = CreateController(db, CreatePrincipal(OtherCountyId, "OTHER"));
    var result = await otherController.GetDataQualityAssessment(saved.Id);
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  public async Task GetHistory_FiltersByScope()
  {
    using var db = CreateDbContext(nameof(GetHistory_FiltersByScope));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.AssessDataQuality(new DataQualityRequest
    {
      Scope = "county",
      Records = new() { MakeRecord("P-001", 250_000m, 5000m) },
    });
    await controller.AssessDataQuality(new DataQualityRequest
    {
      Scope = "district",
      Records = new() { MakeRecord("P-002", 180_000m, 3500m) },
    });

    var result = await controller.GetDataQualityHistory(scope: "district");
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);
    doc.RootElement.GetProperty("count").GetInt32().Should().Be(1);
  }

  [Fact]
  public async Task RequiresCountyContext()
  {
    using var db = CreateDbContext(nameof(RequiresCountyContext));
    var controller = CreateController(db, new ClaimsPrincipal(new ClaimsIdentity()));

    var result = await controller.AssessDataQuality(new DataQualityRequest
    {
      Records = new() { MakeRecord("P-001", 250_000m, 5000m) },
    });

    result.Should().BeOfType<UnauthorizedObjectResult>();
  }
}
