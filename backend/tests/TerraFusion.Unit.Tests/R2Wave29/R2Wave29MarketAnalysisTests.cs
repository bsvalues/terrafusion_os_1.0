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

namespace TerraFusion.Unit.Tests.R2Wave29;

[Trait("Category", "R2Wave29")]
[Trait("Category", "MarketAnalysis")]
public sealed class R2Wave29MarketAnalysisTests
{
  private static readonly Guid BentonCountyId = Guid.NewGuid();
  private static readonly Guid OtherCountyId = Guid.NewGuid();
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
    => new(new ClaimsIdentity(
    [
      new Claim("countyId", countyId.ToString()),
      new Claim("countyCode", countyCode),
      new Claim("sub", "w29-test-user"),
      new Claim("userId", "w29-test-user"),
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

  private static async Task SeedCounty(DataDbContext db, Guid countyId, string name = "Benton", string fips = BentonFips)
  {
    if (!await db.Counties.AnyAsync(c => c.Id == countyId))
    {
      db.Counties.Add(new County { Id = countyId, Name = name, State = "WA", FipsCode = fips });
      await db.SaveChangesAsync();
    }
  }

  private static List<SaleRecord> MakeSales(int count = 10, decimal basePrice = 250_000m)
  {
    var sales = new List<SaleRecord>();
    for (int i = 0; i < count; i++)
    {
      sales.Add(new SaleRecord
      {
        ParcelId = $"P-{i:000}",
        SalePrice = basePrice + i * 10_000m,
        AssessedValue = (basePrice + i * 10_000m) * 0.95m,
        SquareFeet = 1500m + i * 100m,
        SaleDate = new DateTime(2025, 1, 1).AddMonths(i),
      });
    }
    return sales;
  }

  // ════════════════════════════════════════
  // Comparable Sales Analysis
  // ════════════════════════════════════════

  [Fact]
  public async Task ComparableSales_ReturnsMedianAndMean()
  {
    using var db = CreateDbContext(nameof(ComparableSales_ReturnsMedianAndMean));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunComparableSalesAnalysis(
      new MarketAnalysisRequest { MarketAreaName = "NW Kennewick", Sales = MakeSales(5) });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);
    var root = doc.RootElement;

    root.GetProperty("analysisType").GetString().Should().Be("comparable_sales");
    root.GetProperty("sampleSize").GetInt32().Should().Be(5);
    root.GetProperty("medianSalePrice").GetDecimal().Should().BeGreaterThan(0);
    root.GetProperty("meanSalePrice").GetDecimal().Should().BeGreaterThan(0);
    root.GetProperty("marketAreaName").GetString().Should().Be("NW Kennewick");
  }

  [Fact]
  public async Task ComparableSales_ComputesPricePerSqft()
  {
    using var db = CreateDbContext(nameof(ComparableSales_ComputesPricePerSqft));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunComparableSalesAnalysis(
      new MarketAnalysisRequest { Sales = MakeSales(4) });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("medianPricePerSqft").GetDecimal().Should().BeGreaterThan(0);
  }

  [Fact]
  public async Task ComparableSales_ComputesCodAndPrd()
  {
    using var db = CreateDbContext(nameof(ComparableSales_ComputesCodAndPrd));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunComparableSalesAnalysis(
      new MarketAnalysisRequest { Sales = MakeSales(10) });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("coefficientOfDispersion").GetDouble().Should().BeGreaterThanOrEqualTo(0);
    doc.RootElement.GetProperty("priceRelatedDifferential").GetDouble().Should().BeGreaterThan(0);
    doc.RootElement.GetProperty("medianRatio").GetDouble().Should().BeGreaterThan(0);
  }

  [Fact]
  public async Task ComparableSales_PersistsToDb()
  {
    using var db = CreateDbContext(nameof(ComparableSales_PersistsToDb));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.RunComparableSalesAnalysis(
      new MarketAnalysisRequest { Sales = MakeSales(5) });

    var entities = await db.Set<MarketAnalysis>().ToListAsync();
    entities.Should().HaveCount(1);
    entities[0].AnalysisType.Should().Be("comparable_sales");
    entities[0].CountyId.Should().Be(BentonCountyId);
  }

  [Fact]
  public async Task ComparableSales_RejectsTooFewSales()
  {
    using var db = CreateDbContext(nameof(ComparableSales_RejectsTooFewSales));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunComparableSalesAnalysis(
      new MarketAnalysisRequest { Sales = MakeSales(2) });

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // ════════════════════════════════════════
  // Time Trend Analysis
  // ════════════════════════════════════════

  [Fact]
  public async Task TimeTrend_ComputesPositiveTrendForRisingPrices()
  {
    using var db = CreateDbContext(nameof(TimeTrend_ComputesPositiveTrendForRisingPrices));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    // Prices rise each month
    var sales = MakeSales(6);

    var result = await controller.RunTimeTrendAnalysis(
      new TimeTrendRequest { MarketAreaName = "Richland", Sales = sales });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("analysisType").GetString().Should().Be("time_trend");
    doc.RootElement.GetProperty("timeTrendCoefficient").GetDouble().Should().BeGreaterThan(0,
        "prices are monotonically increasing, so the trend should be positive");
    doc.RootElement.GetProperty("timeTrendRSquared").GetDouble().Should().BeGreaterThan(0.5);
  }

  [Fact]
  public async Task TimeTrend_RecordsPeriodStartAndEnd()
  {
    using var db = CreateDbContext(nameof(TimeTrend_RecordsPeriodStartAndEnd));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var sales = MakeSales(4);
    var result = await controller.RunTimeTrendAnalysis(
      new TimeTrendRequest { Sales = sales });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("periodStart").GetDateTime().Should().Be(new DateTime(2025, 1, 1));
    doc.RootElement.GetProperty("periodEnd").GetDateTime().Should().Be(new DateTime(2025, 4, 1));
  }

  [Fact]
  public async Task TimeTrend_PersistsToDb()
  {
    using var db = CreateDbContext(nameof(TimeTrend_PersistsToDb));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.RunTimeTrendAnalysis(
      new TimeTrendRequest { Sales = MakeSales(5) });

    var entities = await db.Set<MarketAnalysis>().ToListAsync();
    entities.Should().HaveCount(1);
    entities[0].AnalysisType.Should().Be("time_trend");
  }

  [Fact]
  public async Task TimeTrend_RejectsTooFewSales()
  {
    using var db = CreateDbContext(nameof(TimeTrend_RejectsTooFewSales));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunTimeTrendAnalysis(
      new TimeTrendRequest { Sales = MakeSales(2) });

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // ════════════════════════════════════════
  // Ratio Study
  // ════════════════════════════════════════

  [Fact]
  public async Task RatioStudy_ComputesMedianRatioAndCod()
  {
    using var db = CreateDbContext(nameof(RatioStudy_ComputesMedianRatioAndCod));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunRatioStudy(
      new MarketAnalysisRequest { Sales = MakeSales(8) });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.GetProperty("analysisType").GetString().Should().Be("ratio_study");
    // 0.95 ratio since assessed = 0.95 * salePrice
    doc.RootElement.GetProperty("medianRatio").GetDouble().Should().BeApproximately(0.95, 0.01);
    doc.RootElement.GetProperty("coefficientOfDispersion").GetDouble().Should().BeGreaterThanOrEqualTo(0);
    doc.RootElement.GetProperty("priceRelatedDifferential").GetDouble().Should().BeGreaterThan(0);
  }

  [Fact]
  public async Task RatioStudy_IncludesIaaoCompliance()
  {
    using var db = CreateDbContext(nameof(RatioStudy_IncludesIaaoCompliance));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunRatioStudy(
      new MarketAnalysisRequest { Sales = MakeSales(8) });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    doc.RootElement.TryGetProperty("iaaoCompliant", out _).Should().BeTrue();
  }

  [Fact]
  public async Task RatioStudy_IncludesPercentiles()
  {
    using var db = CreateDbContext(nameof(RatioStudy_IncludesPercentiles));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    var result = await controller.RunRatioStudy(
      new MarketAnalysisRequest { Sales = MakeSales(10) });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);

    var metricsStr = doc.RootElement.GetProperty("additionalMetrics").GetString();
    metricsStr.Should().NotBeNullOrEmpty();
    var metrics = JsonDocument.Parse(metricsStr!);
    metrics.RootElement.TryGetProperty("p10", out _).Should().BeTrue();
    metrics.RootElement.TryGetProperty("p25", out _).Should().BeTrue();
    metrics.RootElement.TryGetProperty("p75", out _).Should().BeTrue();
    metrics.RootElement.TryGetProperty("p90", out _).Should().BeTrue();
  }

  [Fact]
  public async Task RatioStudy_RejectsTooFewValidSales()
  {
    using var db = CreateDbContext(nameof(RatioStudy_RejectsTooFewValidSales));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    // 2 valid sales (below min of 3)
    var sales = MakeSales(2);
    var result = await controller.RunRatioStudy(
      new MarketAnalysisRequest { Sales = sales });

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  // ════════════════════════════════════════
  // Retrieval Endpoints
  // ════════════════════════════════════════

  [Fact]
  public async Task GetMarketAnalysis_RetrievesById()
  {
    using var db = CreateDbContext(nameof(GetMarketAnalysis_RetrievesById));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    // Create one analysis
    await controller.RunComparableSalesAnalysis(
      new MarketAnalysisRequest { MarketAreaName = "Test Area", Sales = MakeSales(5) });
    var saved = await db.Set<MarketAnalysis>().FirstAsync();

    var result = await controller.GetMarketAnalysis(saved.Id);

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);
    doc.RootElement.GetProperty("id").GetInt32().Should().Be(saved.Id);
    doc.RootElement.GetProperty("marketAreaName").GetString().Should().Be("Test Area");
  }

  [Fact]
  public async Task GetMarketAnalysis_ReturnsNotFoundForWrongCounty()
  {
    using var db = CreateDbContext(nameof(GetMarketAnalysis_ReturnsNotFoundForWrongCounty));
    await SeedCounty(db, BentonCountyId);
    await SeedCounty(db, OtherCountyId, "Other", "999");

    // Create an analysis as Benton
    var bentonController = CreateController(db, CreatePrincipal(BentonCountyId));
    await bentonController.RunComparableSalesAnalysis(
      new MarketAnalysisRequest { Sales = MakeSales(5) });
    var saved = await db.Set<MarketAnalysis>().FirstAsync();

    // Try to retrieve as Other county
    var otherController = CreateController(db, CreatePrincipal(OtherCountyId, "OTHER"));
    var result = await otherController.GetMarketAnalysis(saved.Id);

    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  public async Task GetHistory_ReturnsCountyScopedResults()
  {
    using var db = CreateDbContext(nameof(GetHistory_ReturnsCountyScopedResults));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.RunComparableSalesAnalysis(
      new MarketAnalysisRequest { Sales = MakeSales(5) });
    await controller.RunTimeTrendAnalysis(
      new TimeTrendRequest { Sales = MakeSales(4) });

    var result = await controller.GetMarketAnalysisHistory();

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);
    doc.RootElement.GetProperty("count").GetInt32().Should().Be(2);
  }

  [Fact]
  public async Task GetHistory_FiltersOnAnalysisType()
  {
    using var db = CreateDbContext(nameof(GetHistory_FiltersOnAnalysisType));
    await SeedCounty(db, BentonCountyId);
    var controller = CreateController(db);

    await controller.RunComparableSalesAnalysis(
      new MarketAnalysisRequest { Sales = MakeSales(5) });
    await controller.RunTimeTrendAnalysis(
      new TimeTrendRequest { Sales = MakeSales(4) });

    var result = await controller.GetMarketAnalysisHistory(analysisType: "time_trend");

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);
    doc.RootElement.GetProperty("count").GetInt32().Should().Be(1);
  }

  // ════════════════════════════════════════
  // County Isolation
  // ════════════════════════════════════════

  [Fact]
  public async Task ComparableSales_RequiresCountyContext()
  {
    using var db = CreateDbContext(nameof(ComparableSales_RequiresCountyContext));
    var controller = CreateController(db, new ClaimsPrincipal(new ClaimsIdentity()));

    var result = await controller.RunComparableSalesAnalysis(
      new MarketAnalysisRequest { Sales = MakeSales(5) });

    result.Should().BeOfType<UnauthorizedObjectResult>();
  }

  [Fact]
  public async Task History_IsolatesCounties()
  {
    using var db = CreateDbContext(nameof(History_IsolatesCounties));
    await SeedCounty(db, BentonCountyId);
    await SeedCounty(db, OtherCountyId, "Other", "999");

    var bentonController = CreateController(db, CreatePrincipal(BentonCountyId));
    await bentonController.RunComparableSalesAnalysis(
      new MarketAnalysisRequest { Sales = MakeSales(5) });

    var otherController = CreateController(db, CreatePrincipal(OtherCountyId, "OTHER"));
    var result = await otherController.GetMarketAnalysisHistory();

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var json = JsonSerializer.Serialize(ok.Value);
    var doc = JsonDocument.Parse(json);
    doc.RootElement.GetProperty("count").GetInt32().Should().Be(0);
  }
}
