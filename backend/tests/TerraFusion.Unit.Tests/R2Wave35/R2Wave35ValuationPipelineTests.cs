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

namespace TerraFusion.Unit.Tests.R2Wave35;

[Trait("Category", "R2Wave35")]
public sealed class R2Wave35ValuationPipelineTests
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

  // ── start pipeline ──

  [Fact]
  public async Task StartPipeline_ValidRequest_ReturnsOk()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(StartPipeline_ValidRequest_ReturnsOk));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.StartPipeline(new PipelineStartRequest
    {
      PipelineName = "2026-annual-reval",
      TaxYear = 2026,
      TotalParcels = 1000,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    ((string)val.pipelineName).Should().Be("2026-annual-reval");
    ((int)val.taxYear).Should().Be(2026);
    ((int)val.totalParcels).Should().Be(1000);
    ((string)val.status).Should().BeOneOf("completed", "failed");
    ((string)val.currentStage).Should().Be("certified");
    ((int)val.completedParcels).Should().BeLessOrEqualTo(1000);
    ((int)val.failedParcels).Should().BeGreaterOrEqualTo(0);
  }

  [Fact]
  public async Task StartPipeline_MissingName_ReturnsBadRequest()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(StartPipeline_MissingName_ReturnsBadRequest));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.StartPipeline(new PipelineStartRequest
    {
      TotalParcels = 100,
    });

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public async Task StartPipeline_ZeroParcels_ReturnsBadRequest()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(StartPipeline_ZeroParcels_ReturnsBadRequest));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.StartPipeline(new PipelineStartRequest
    {
      PipelineName = "test",
      TotalParcels = 0,
    });

    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public async Task StartPipeline_DefaultsTaxYear()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(StartPipeline_DefaultsTaxYear));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.StartPipeline(new PipelineStartRequest
    {
      PipelineName = "default-year",
      TotalParcels = 500,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    ((int)val.taxYear).Should().Be(DateTime.UtcNow.Year);
  }

  [Fact]
  public async Task StartPipeline_QualityMetricsAreReasonable()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(StartPipeline_QualityMetricsAreReasonable));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.StartPipeline(new PipelineStartRequest
    {
      PipelineName = "quality-test",
      TaxYear = 2026,
      TotalParcels = 5000,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    ((double)val.coefficientOfDispersion).Should().BeGreaterOrEqualTo(0);
    ((double)val.priceRelatedDifferential).Should().BeInRange(0.9, 1.1);
  }

  [Fact]
  public async Task StartPipeline_CompletedPlusFailed_EqualsTotalParcels()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(StartPipeline_CompletedPlusFailed_EqualsTotalParcels));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.StartPipeline(new PipelineStartRequest
    {
      PipelineName = "counts-check",
      TaxYear = 2026,
      TotalParcels = 2000,
    });

    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    var completed = (int)val.completedParcels;
    var failed = (int)val.failedParcels;
    (completed + failed).Should().Be(2000);
  }

  // ── persistence & retrieval ──

  [Fact]
  public async Task StartPipeline_PersistsToDatabase()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(StartPipeline_PersistsToDatabase));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    await ctrl.StartPipeline(new PipelineStartRequest
    {
      PipelineName = "persist-test",
      TaxYear = 2026,
      TotalParcels = 100,
    });

    var saved = await db.Set<TerraFusion.Core.Entities.ValuationPipeline>().FirstOrDefaultAsync();
    saved.Should().NotBeNull();
    saved!.PipelineName.Should().Be("persist-test");
    saved.CountyId.Should().Be(cid);
    saved.CreatedBy.Should().Be("test-user");
  }

  [Fact]
  public async Task GetPipeline_ExistingId_ReturnsOk()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(GetPipeline_ExistingId_ReturnsOk));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var createResult = await ctrl.StartPipeline(new PipelineStartRequest
    {
      PipelineName = "get-test",
      TaxYear = 2026,
      TotalParcels = 100,
    });
    var createOk = (OkObjectResult)createResult;
    dynamic created = createOk.Value!;
    int id = (int)created.id;

    var getResult = await ctrl.GetPipeline(id);
    var getOk = getResult.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = getOk.Value!;
    ((string)val.pipelineName).Should().Be("get-test");
    ((string)val.stageDetails).Should().NotBeNullOrEmpty();
  }

  [Fact]
  public async Task GetPipeline_MissingId_ReturnsNotFound()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(GetPipeline_MissingId_ReturnsNotFound));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    var result = await ctrl.GetPipeline(999);
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  // ── county isolation ──

  [Fact]
  public async Task GetPipeline_OtherCounty_ReturnsNotFound()
  {
    var cidA = Guid.NewGuid();
    var cidB = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(GetPipeline_OtherCounty_ReturnsNotFound));
    await SeedCounty(db, cidA);
    await SeedCounty(db, cidB);

    var ctrlA = CreateController(db, CreatePrincipal(cidA));
    var createResult = await ctrlA.StartPipeline(new PipelineStartRequest
    {
      PipelineName = "isolation-test",
      TaxYear = 2026,
      TotalParcels = 100,
    });
    var createOk = (OkObjectResult)createResult;
    dynamic created = createOk.Value!;
    int id = (int)created.id;

    var ctrlB = CreateController(db, CreatePrincipal(cidB));
    var getResult = await ctrlB.GetPipeline(id);
    getResult.Should().BeOfType<NotFoundObjectResult>();
  }

  // ── history ──

  [Fact]
  public async Task GetPipelineHistory_ReturnsItems()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(GetPipelineHistory_ReturnsItems));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    await ctrl.StartPipeline(new PipelineStartRequest { PipelineName = "a", TotalParcels = 100, TaxYear = 2026 });
    await ctrl.StartPipeline(new PipelineStartRequest { PipelineName = "b", TotalParcels = 200, TaxYear = 2026 });

    var result = await ctrl.GetPipelineHistory(null);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    ((int)val.count).Should().Be(2);
  }

  [Fact]
  public async Task GetPipelineHistory_FiltersByTaxYear()
  {
    var cid = Guid.NewGuid();
    await using var db = CreateDbContext(nameof(GetPipelineHistory_FiltersByTaxYear));
    await SeedCounty(db, cid);
    var ctrl = CreateController(db, CreatePrincipal(cid));

    await ctrl.StartPipeline(new PipelineStartRequest { PipelineName = "y25", TotalParcels = 100, TaxYear = 2025 });
    await ctrl.StartPipeline(new PipelineStartRequest { PipelineName = "y26", TotalParcels = 200, TaxYear = 2026 });

    var result = await ctrl.GetPipelineHistory(2025);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    dynamic val = ok.Value!;
    ((int)val.count).Should().Be(1);
  }

  // ── auth ──

  [Fact]
  public async Task StartPipeline_NoAuth_ReturnsUnauthorized()
  {
    await using var db = CreateDbContext(nameof(StartPipeline_NoAuth_ReturnsUnauthorized));
    var ctrl = new CostForgeController(
      new Mock<ICostForgeService>().Object,
      new Mock<ICostForgeAIService>().Object,
      db,
      new Mock<TerraFusion.Abstractions.Interfaces.IAuditLogger>().Object,
      NullLogger<CostForgeController>.Instance)
    {
      ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
    };

    var result = await ctrl.StartPipeline(new PipelineStartRequest
    {
      PipelineName = "unauth",
      TotalParcels = 100,
    });
    result.Should().BeOfType<UnauthorizedObjectResult>();
  }
}
