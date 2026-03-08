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

namespace TerraFusion.Unit.Tests.R2Wave27;

[Trait("Category", "R2Wave27")]
[Trait("Category", "BayesianMonteCarlo")]
public sealed class R2Wave27BayesianMonteCarloTests
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
      new Claim("sub", "w27-test"),
      new Claim("userId", "w27-test"),
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

  // ═══════════════════════════════════════════════════════════════
  // Bayesian estimation
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task Bayesian_VaguePrior_PosteriorApproachesSampleMean()
  {
    using var db = CreateDbContext(nameof(Bayesian_VaguePrior_PosteriorApproachesSampleMean));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new BayesianEstimationRequest
    {
      Observations = new() { 250000, 260000, 255000, 248000, 262000 },
      PriorMean = 0,
      PriorVariance = 1e12, // very vague
    };

    var result = await ctrl.RunBayesianEstimation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = Parse(ok.Value!);

    double sampleMean = request.Observations.Average();
    doc.RootElement.GetProperty("posteriorMean").GetDouble()
      .Should().BeApproximately(sampleMean, 1000);
  }

  [Fact]
  public async Task Bayesian_StrongPrior_PosteriorPulledTowardPrior()
  {
    using var db = CreateDbContext(nameof(Bayesian_StrongPrior_PosteriorPulledTowardPrior));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new BayesianEstimationRequest
    {
      Observations = new() { 300000, 310000, 305000 },
      PriorMean = 200000,
      PriorVariance = 100, // very tight prior
    };

    var result = await ctrl.RunBayesianEstimation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = Parse(ok.Value!);

    // Posterior should be pulled closer to prior than sample mean
    double posterior = doc.RootElement.GetProperty("posteriorMean").GetDouble();
    double sampleMean = request.Observations.Average();
    Math.Abs(posterior - 200000).Should().BeLessThan(Math.Abs(sampleMean - 200000));
  }

  [Fact]
  public async Task Bayesian_CredibleInterval_ContainsPosteriorMean()
  {
    using var db = CreateDbContext(nameof(Bayesian_CredibleInterval_ContainsPosteriorMean));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new BayesianEstimationRequest
    {
      Observations = new() { 180000, 190000, 185000, 192000 }
    };

    var result = await ctrl.RunBayesianEstimation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = Parse(ok.Value!);

    double mean = doc.RootElement.GetProperty("posteriorMean").GetDouble();
    var ci = doc.RootElement.GetProperty("credibleInterval95");
    double lower = ci[0].GetDouble();
    double upper = ci[1].GetDouble();

    mean.Should().BeGreaterThanOrEqualTo(lower);
    mean.Should().BeLessThanOrEqualTo(upper);
  }

  [Fact]
  public async Task Bayesian_PosteriorStd_IsPositive()
  {
    using var db = CreateDbContext(nameof(Bayesian_PosteriorStd_IsPositive));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new BayesianEstimationRequest
    {
      Observations = new() { 100000, 120000, 110000 },
    };

    var result = await ctrl.RunBayesianEstimation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = Parse(ok.Value!);

    doc.RootElement.GetProperty("posteriorStd").GetDouble().Should().BeGreaterThan(0);
  }

  [Fact]
  public async Task Bayesian_TooFewObservations_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(Bayesian_TooFewObservations_ReturnsBadRequest));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new BayesianEstimationRequest { Observations = new() { 250000 } };
    var result = await ctrl.RunBayesianEstimation(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public async Task Bayesian_NoCounty_ReturnsUnauthorized()
  {
    using var db = CreateDbContext(nameof(Bayesian_NoCounty_ReturnsUnauthorized));
    var ctrl = CreateController(db, CreateEmptyPrincipal());

    var request = new BayesianEstimationRequest { Observations = new() { 100, 200, 300 } };
    var result = await ctrl.RunBayesianEstimation(request);
    result.Should().BeOfType<UnauthorizedObjectResult>();
  }

  [Fact]
  public async Task Bayesian_PersistsToDatabase()
  {
    using var db = CreateDbContext(nameof(Bayesian_PersistsToDatabase));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new BayesianEstimationRequest
    {
      Observations = new() { 200000, 210000, 205000 },
      ParameterName = "sqft_coeff",
    };

    await ctrl.RunBayesianEstimation(request);
    var stored = await db.BayesianAnalyses.FirstOrDefaultAsync();
    stored.Should().NotBeNull();
    stored!.ParameterName.Should().Be("sqft_coeff");
    stored.SampleSize.Should().Be(3);
  }

  [Fact]
  public async Task Bayesian_GetById_ReturnsStored()
  {
    using var db = CreateDbContext(nameof(Bayesian_GetById_ReturnsStored));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var runResult = await ctrl.RunBayesianEstimation(new BayesianEstimationRequest
    {
      Observations = new() { 100, 200, 300 }
    });
    var runDoc = Parse(((OkObjectResult)runResult).Value!);
    var id = runDoc.RootElement.GetProperty("id").GetGuid();

    var getResult = await ctrl.GetBayesianResult(id);
    var ok = getResult.Should().BeOfType<OkObjectResult>().Subject;
    var doc = Parse(ok.Value!);
    doc.RootElement.GetProperty("sampleSize").GetInt32().Should().Be(3);
  }

  [Fact]
  public async Task Bayesian_GetById_WrongCounty_ReturnsNotFound()
  {
    using var db = CreateDbContext(nameof(Bayesian_GetById_WrongCounty_ReturnsNotFound));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var runResult = await ctrl.RunBayesianEstimation(new BayesianEstimationRequest
    {
      Observations = new() { 100, 200, 300 }
    });
    var id = Parse(((OkObjectResult)runResult).Value!).RootElement.GetProperty("id").GetGuid();

    var otherId = Guid.NewGuid();
    await SeedCounty(db, otherId);
    var other = CreateController(db, CreatePrincipal(otherId, "OTHER"));
    var result = await other.GetBayesianResult(id);
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  // ═══════════════════════════════════════════════════════════════
  // Monte Carlo simulation
  // ═══════════════════════════════════════════════════════════════

  [Fact]
  public async Task MonteCarlo_NormalDist_MeanNearInputMean()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_NormalDist_MeanNearInputMean));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new MonteCarloRequest
    {
      Iterations = 50_000,
      Seed = 42,
      Variables = new() { new McVariable { Name = "value", Distribution = "normal", Mean = 300000, Std = 20000 } }
    };

    var result = await ctrl.RunMonteCarloSimulation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = Parse(ok.Value!);

    doc.RootElement.GetProperty("mean").GetDouble()
      .Should().BeApproximately(300000, 5000);
  }

  [Fact]
  public async Task MonteCarlo_UniformDist_MeanNearMidpoint()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_UniformDist_MeanNearMidpoint));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new MonteCarloRequest
    {
      Iterations = 50_000,
      Seed = 42,
      Variables = new() { new McVariable { Name = "val", Distribution = "uniform", Min = 100000, Max = 200000 } }
    };

    var result = await ctrl.RunMonteCarloSimulation(request);
    var ok = result.Should().BeOfType<OkObjectResult>().Subject;
    var doc = Parse(ok.Value!);

    doc.RootElement.GetProperty("mean").GetDouble()
      .Should().BeApproximately(150000, 5000);
  }

  [Fact]
  public async Task MonteCarlo_TriangularDist_ReturnsResults()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_TriangularDist_ReturnsResults));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new MonteCarloRequest
    {
      Iterations = 10_000,
      Seed = 42,
      Variables = new() { new McVariable { Name = "val", Distribution = "triangular", Min = 100000, Max = 300000, Mode = 200000 } }
    };

    var result = await ctrl.RunMonteCarloSimulation(request);
    result.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  public async Task MonteCarlo_PercentilesOrdered()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_PercentilesOrdered));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new MonteCarloRequest
    {
      Iterations = 10_000,
      Seed = 42,
      Variables = new() { new McVariable { Name = "v", Distribution = "normal", Mean = 250000, Std = 30000 } }
    };

    var result = await ctrl.RunMonteCarloSimulation(request);
    var doc = Parse(((OkObjectResult)result).Value!);

    double p5 = doc.RootElement.GetProperty("percentile5").GetDouble();
    double p25 = doc.RootElement.GetProperty("percentile25").GetDouble();
    double median = doc.RootElement.GetProperty("median").GetDouble();
    double p75 = doc.RootElement.GetProperty("percentile75").GetDouble();
    double p95 = doc.RootElement.GetProperty("percentile95").GetDouble();

    p5.Should().BeLessThanOrEqualTo(p25);
    p25.Should().BeLessThanOrEqualTo(median);
    median.Should().BeLessThanOrEqualTo(p75);
    p75.Should().BeLessThanOrEqualTo(p95);
  }

  [Fact]
  public async Task MonteCarlo_Histogram_Has20Bins()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_Histogram_Has20Bins));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new MonteCarloRequest
    {
      Iterations = 5_000,
      Seed = 42,
      Variables = new() { new McVariable { Name = "v", Distribution = "normal", Mean = 100000, Std = 10000 } }
    };

    var result = await ctrl.RunMonteCarloSimulation(request);
    var doc = Parse(((OkObjectResult)result).Value!);

    doc.RootElement.GetProperty("histogram").GetArrayLength().Should().Be(20);
  }

  [Fact]
  public async Task MonteCarlo_Seeded_IsDeterministic()
  {
    using var db1 = CreateDbContext(nameof(MonteCarlo_Seeded_IsDeterministic) + "_1");
    using var db2 = CreateDbContext(nameof(MonteCarlo_Seeded_IsDeterministic) + "_2");
    await SeedCounty(db1, BentonCountyId);
    await SeedCounty(db2, BentonCountyId);

    var request = new MonteCarloRequest
    {
      Iterations = 1_000,
      Seed = 123,
      Variables = new() { new McVariable { Name = "v", Distribution = "normal", Mean = 200000, Std = 15000 } }
    };

    var r1 = Parse(((OkObjectResult)(await CreateController(db1).RunMonteCarloSimulation(request))).Value!);
    var r2 = Parse(((OkObjectResult)(await CreateController(db2).RunMonteCarloSimulation(request))).Value!);

    r1.RootElement.GetProperty("mean").GetDouble()
      .Should().Be(r2.RootElement.GetProperty("mean").GetDouble());
  }

  [Fact]
  public async Task MonteCarlo_NoVariables_ReturnsBadRequest()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_NoVariables_ReturnsBadRequest));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new MonteCarloRequest { Iterations = 100, Variables = new() };
    var result = await ctrl.RunMonteCarloSimulation(request);
    result.Should().BeOfType<BadRequestObjectResult>();
  }

  [Fact]
  public async Task MonteCarlo_NoCounty_ReturnsUnauthorized()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_NoCounty_ReturnsUnauthorized));
    var ctrl = CreateController(db, CreateEmptyPrincipal());

    var request = new MonteCarloRequest
    {
      Variables = new() { new McVariable { Name = "v", Mean = 100, Std = 10 } }
    };
    var result = await ctrl.RunMonteCarloSimulation(request);
    result.Should().BeOfType<UnauthorizedObjectResult>();
  }

  [Fact]
  public async Task MonteCarlo_PersistsToDatabase()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_PersistsToDatabase));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new MonteCarloRequest
    {
      Iterations = 500,
      Seed = 42,
      SimulationName = "test_sim",
      Variables = new() { new McVariable { Name = "v", Distribution = "normal", Mean = 100000, Std = 5000 } }
    };

    await ctrl.RunMonteCarloSimulation(request);
    var stored = await db.MonteCarloSimulations.FirstOrDefaultAsync();
    stored.Should().NotBeNull();
    stored!.SimulationName.Should().Be("test_sim");
    stored.Iterations.Should().Be(500);
  }

  [Fact]
  public async Task MonteCarlo_GetById_ReturnsStored()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_GetById_ReturnsStored));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var runResult = await ctrl.RunMonteCarloSimulation(new MonteCarloRequest
    {
      Iterations = 500, Seed = 42,
      Variables = new() { new McVariable { Name = "v", Mean = 100000, Std = 5000 } }
    });
    var id = Parse(((OkObjectResult)runResult).Value!).RootElement.GetProperty("id").GetGuid();

    var getResult = await ctrl.GetMonteCarloResult(id);
    getResult.Should().BeOfType<OkObjectResult>();
  }

  [Fact]
  public async Task MonteCarlo_GetById_WrongCounty_ReturnsNotFound()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_GetById_WrongCounty_ReturnsNotFound));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var runResult = await ctrl.RunMonteCarloSimulation(new MonteCarloRequest
    {
      Iterations = 200, Seed = 42,
      Variables = new() { new McVariable { Name = "v", Mean = 100000, Std = 5000 } }
    });
    var id = Parse(((OkObjectResult)runResult).Value!).RootElement.GetProperty("id").GetGuid();

    var otherId = Guid.NewGuid();
    await SeedCounty(db, otherId);
    var other = CreateController(db, CreatePrincipal(otherId, "OTHER"));
    var result = await other.GetMonteCarloResult(id);
    result.Should().BeOfType<NotFoundObjectResult>();
  }

  [Fact]
  public async Task MonteCarlo_History_ReturnsEntries()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_History_ReturnsEntries));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    await ctrl.RunMonteCarloSimulation(new MonteCarloRequest
    {
      Iterations = 200, Seed = 42,
      Variables = new() { new McVariable { Name = "v", Mean = 100000, Std = 5000 } }
    });

    var result = await ctrl.GetMonteCarloHistory(10);
    var doc = Parse(((OkObjectResult)result).Value!);
    doc.RootElement.GetProperty("count").GetInt32().Should().Be(1);
  }

  [Fact]
  public async Task MonteCarlo_MultipleVariables_CombinesValues()
  {
    using var db = CreateDbContext(nameof(MonteCarlo_MultipleVariables_CombinesValues));
    await SeedCounty(db, BentonCountyId);
    var ctrl = CreateController(db);

    var request = new MonteCarloRequest
    {
      Iterations = 20_000,
      Seed = 42,
      Variables = new()
      {
        new McVariable { Name = "land", Distribution = "normal", Mean = 100000, Std = 10000 },
        new McVariable { Name = "improvement", Distribution = "normal", Mean = 200000, Std = 20000 }
      }
    };

    var result = await ctrl.RunMonteCarloSimulation(request);
    var doc = Parse(((OkObjectResult)result).Value!);

    // Mean should be about 300000 (sum of two means)
    doc.RootElement.GetProperty("mean").GetDouble()
      .Should().BeApproximately(300000, 10000);
  }

  // Helper
  private static System.Text.Json.JsonDocument Parse(object value)
    => System.Text.Json.JsonDocument.Parse(System.Text.Json.JsonSerializer.Serialize(value));
}
