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

namespace TerraFusion.Unit.Tests.R2Wave31;

[Trait("Category", "R2Wave31")]
[Trait("Category", "LevyCertification")]
public sealed class R2Wave31LevyCertificationTests
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
      new Claim("sub", "w31-test-user"),
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

  // ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
  // Levy Calculation
  // ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

  [Fact]
  public async Task CalculateLevy_WithinLimits_ReturnsFullAmount()
  {
    using var db = CreateDbContext(nameof(CalculateLevy_WithinLimits_ReturnsFullAmount));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateLevy(new LevyCalculateRequest
    {
      DistrictCode = "FD-1",
      DistrictName = "Fire District 1",
      PriorYearLevy = 1_000_000m,
      RequestedLevy = 1_005_000m, // 0.5% increase ΓÇö within 1%
      AssessedValue = 500_000_000m,
      TaxYear = 2026,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("certifiedLevy").GetDecimal().Should().Be(1_005_000m);
    doc.RootElement.GetProperty("wasReduced").GetBoolean().Should().BeFalse();
    doc.RootElement.GetProperty("withinConstitutionalLimit").GetBoolean().Should().BeTrue();
    doc.RootElement.GetProperty("status").GetString().Should().Be("draft");
  }

  [Fact]
  public async Task CalculateLevy_Exceeds1Percent_ReducesToStatutoryLimit()
  {
    using var db = CreateDbContext(nameof(CalculateLevy_Exceeds1Percent_ReducesToStatutoryLimit));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateLevy(new LevyCalculateRequest
    {
      PriorYearLevy = 1_000_000m,
      RequestedLevy = 1_100_000m, // 10% increase ΓÇö exceeds 1%
      AssessedValue = 500_000_000m,
      TaxYear = 2026,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("wasReduced").GetBoolean().Should().BeTrue();
    doc.RootElement.GetProperty("certifiedLevy").GetDecimal().Should().BeLessThan(1_100_000m);
    doc.RootElement.GetProperty("reductionAmount").GetDecimal().Should().BeGreaterThan(0);
  }

  [Fact]
  public async Task CalculateLevy_NewConstruction_AddsToLimit()
  {
    using var db = CreateDbContext(nameof(CalculateLevy_NewConstruction_AddsToLimit));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.CalculateLevy(new LevyCalculateRequest
    {
      PriorYearLevy = 1_000_000m,
      RequestedLevy = 1_020_000m,
      AssessedValue = 500_000_000m,
      NewConstructionValue = 10_000_000m, // Adds NC at existing rate
      TaxYear = 2026,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    // Statutory limit = 1,010,000 + (10M * 2.0/1000) = 1,010,000 + 20,000 = 1,030,000
    doc.RootElement.GetProperty("statutoryLimit").GetDecimal().Should().BeGreaterThan(1_010_000m);
    doc.RootElement.GetProperty("wasReduced").GetBoolean().Should().BeFalse();
  }

  [Fact]
  public async Task CalculateLevy_ExceedsConstitutionalLimit_ForcesCompliance()
  {
    using var db = CreateDbContext(nameof(CalculateLevy_ExceedsConstitutionalLimit_ForcesCompliance));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    // Tiny AV ΓåÆ rate would be very high
    var result = await controller.CalculateLevy(new LevyCalculateRequest
    {
      PriorYearLevy = 100_000m,
      RequestedLevy = 100_000m,
      AssessedValue = 5_000_000m, // rate = 20.0 per $1000 ΓÇö exceeds 10.0
      TaxYear = 2026,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("levyRate").GetDouble().Should().Be(10.0);
    doc.RootElement.GetProperty("withinConstitutionalLimit").GetBoolean().Should().BeTrue();
    doc.RootElement.GetProperty("wasReduced").GetBoolean().Should().BeTrue();
    doc.RootElement.GetProperty("certifiedLevy").GetDecimal().Should().Be(50_000m); // 5M * 10/1000
  }

  [Fact]
  public async Task CalculateLevy_PersistsToDb()
  {
    using var db = CreateDbContext(nameof(CalculateLevy_PersistsToDb));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.CalculateLevy(new LevyCalculateRequest
    {
      DistrictCode = "CTY",
      RequestedLevy = 500_000m,
      AssessedValue = 300_000_000m,
    });

    var entities = await db.Set<LevyCertification>().ToListAsync();
    entities.Should().HaveCount(1);
    entities[0].DistrictCode.Should().Be("CTY");
  }

  // ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
  // Balance Test (Prorationing)
  // ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

  [Fact]
  public async Task BalanceTest_WithinAggregate_Passes()
  {
    using var db = CreateDbContext(nameof(BalanceTest_WithinAggregate_Passes));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.LevyBalanceTest(new LevyBalanceTestRequest
    {
      TaxYear = 2026,
      Districts = new()
      {
        new() { DistrictCode = "CTY", RequestedLevy = 1_000_000m, AssessedValue = 1_000_000_000m },
        new() { DistrictCode = "SCH", RequestedLevy = 2_000_000m, AssessedValue = 1_000_000_000m },
      },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("aggregatePass").GetBoolean().Should().BeTrue();
    doc.RootElement.GetProperty("constitutionalPass").GetBoolean().Should().BeTrue();
    doc.RootElement.GetProperty("prorationRequired").GetBoolean().Should().BeFalse();
    doc.RootElement.GetProperty("districtCount").GetInt32().Should().Be(2);
  }

  [Fact]
  public async Task BalanceTest_ExceedsAggregate_RequiresProration()
  {
    using var db = CreateDbContext(nameof(BalanceTest_ExceedsAggregate_RequiresProration));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.LevyBalanceTest(new LevyBalanceTestRequest
    {
      TaxYear = 2026,
      Districts = new()
      {
        new() { DistrictCode = "CTY", RequestedLevy = 3_000_000m, AssessedValue = 500_000_000m }, // 6.0
        new() { DistrictCode = "SCH", RequestedLevy = 1_000_000m, AssessedValue = 500_000_000m }, // 2.0
      },
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("totalRate").GetDouble().Should().BeGreaterThan(5.90);
    doc.RootElement.GetProperty("aggregatePass").GetBoolean().Should().BeFalse();
    doc.RootElement.GetProperty("prorationRequired").GetBoolean().Should().BeTrue();
  }

  [Fact]
  public async Task BalanceTest_EmptyDistricts_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(BalanceTest_EmptyDistricts_ReturnsBadRequest));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.LevyBalanceTest(new LevyBalanceTestRequest
    {
      TaxYear = 2026,
      Districts = new(),
    });

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
  // Certification Workflow
  // ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

  [Fact]
  public async Task CertifyLevy_TransitionsToCertified()
  {
    using var db = CreateDbContext(nameof(CertifyLevy_TransitionsToCertified));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.CalculateLevy(new LevyCalculateRequest
    {
      RequestedLevy = 500_000m,
      AssessedValue = 300_000_000m,
    });
    var saved = await db.Set<LevyCertification>().FirstAsync();

    var result = await controller.CertifyLevy(saved.Id);

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("status").GetString().Should().Be("certified");
  }

  [Fact]
  public async Task CertifyLevy_AlreadyCertified_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(CertifyLevy_AlreadyCertified_ReturnsBadRequest));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.CalculateLevy(new LevyCalculateRequest
    {
      RequestedLevy = 500_000m,
      AssessedValue = 300_000_000m,
    });
    var saved = await db.Set<LevyCertification>().FirstAsync();

    await controller.CertifyLevy(saved.Id);
    var result = await controller.CertifyLevy(saved.Id);

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
  // Retrieval & County Isolation
  // ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ

  [Fact]
  public async Task GetLevyCertification_RetrievesById()
  {
    using var db = CreateDbContext(nameof(GetLevyCertification_RetrievesById));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.CalculateLevy(new LevyCalculateRequest
    {
      DistrictCode = "CTY",
      RequestedLevy = 500_000m,
      AssessedValue = 300_000_000m,
    });
    var saved = await db.Set<LevyCertification>().FirstAsync();

    var result = await controller.GetLevyCertification(saved.Id);

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);
    doc.RootElement.GetProperty("districtCode").GetString().Should().Be("CTY");
  }

  [Fact]
  public async Task GetLevyCertification_WrongCounty_ReturnsNotFound()
  {
    using var db = CreateDbContext(nameof(GetLevyCertification_WrongCounty_ReturnsNotFound));
    await SeedCounty(db, BentonCountyId);
    await SeedCounty(db, OtherCountyId, "Other", "999");

    var bentonController = CreateController(db, CreatePrincipal(BentonCountyId));
    await bentonController.CalculateLevy(new LevyCalculateRequest
    {
      RequestedLevy = 500_000m, AssessedValue = 300_000_000m,
    });
    var saved = await db.Set<LevyCertification>().FirstAsync();

    var otherController = CreateController(db, CreatePrincipal(OtherCountyId, "OTHER"));
    var result = await otherController.GetLevyCertification(saved.Id);

    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  public async Task GetHistory_FiltersOnTaxYear()
  {
    using var db = CreateDbContext(nameof(GetHistory_FiltersOnTaxYear));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.CalculateLevy(new LevyCalculateRequest
    {
      RequestedLevy = 500_000m, AssessedValue = 300_000_000m, TaxYear = 2025,
    });
    await controller.CalculateLevy(new LevyCalculateRequest
    {
      RequestedLevy = 600_000m, AssessedValue = 300_000_000m, TaxYear = 2026,
    });

    var result = await controller.GetLevyHistory(taxYear: 2026, districtCode: null);

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

    var result = await controller.CalculateLevy(new LevyCalculateRequest
    {
      RequestedLevy = 500_000m, AssessedValue = 300_000_000m,
    });

    result.Should().BeOfType<UnauthorizedObjectResult>();
  }
}
