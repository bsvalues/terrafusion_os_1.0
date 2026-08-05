using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using TerraFusion.API.Configuration;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services.Valuation;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Entities.Forge;
using TerraFusion.Core.Interfaces;
using Xunit;
using CostApproachResult = TerraFusion.Core.DTOs.CostApproachResult;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests.Controllers;

public sealed class ForgeCanonicalCostConsumerTests
{
    private static readonly Guid CountyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private const string ParcelId = "SYNTHETIC-001";
    private const int TaxYear = 2026;
    private const string CorrelationId = "shadow-test-001";

    [Fact]
    public void Options_DefaultToDisabled()
    {
        Assert.Equal(
            ForgeCanonicalConsumerMode.Disabled,
            new RustKernelsOptions().ForgeCanonicalConsumerMode);
    }

    [Fact]
    public async Task Disabled_PreservesLegacyResponseWithoutConsumerInvocation()
    {
        await using var db = CreateDb();
        var consumer = new Mock<IForgeCanonicalCostConsumer>(MockBehavior.Strict);
        var legacy = LegacyResult();
        var controller = CreateController(db, consumer.Object, ForgeCanonicalConsumerMode.Disabled, legacy);

        var response = Assert.IsType<OkObjectResult>(
            await controller.GetCostApproach(ParcelId, TaxYear, CancellationToken.None));

        Assert.Same(legacy, response.Value);
        consumer.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Shadow_InvokesCountyScopedConsumerAndReturnsSameLegacyResponse()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        ForgeCanonicalConsumerRequest? captured = null;
        var consumer = new Mock<IForgeCanonicalCostConsumer>();
        consumer.Setup(service => service.ConsumeAsync(
                It.IsAny<ForgeCanonicalConsumerRequest>(), It.IsAny<CancellationToken>()))
            .Callback<ForgeCanonicalConsumerRequest, CancellationToken>((request, _) => captured = request)
            .ReturnsAsync(ShadowResult());
        var legacy = LegacyResult();
        var controller = CreateController(db, consumer.Object, ForgeCanonicalConsumerMode.Shadow, legacy);

        var response = Assert.IsType<OkObjectResult>(
            await controller.GetCostApproach(ParcelId, TaxYear, CancellationToken.None));

        Assert.Same(legacy, response.Value);
        Assert.NotNull(captured);
        Assert.Equal(CorrelationId, captured.Identity.CorrelationId);
        Assert.Equal("access:forge", captured.Authorization.Permission);
        Assert.Single(captured.Properties);
        Assert.Single(captured.LandFacts);
        Assert.All(captured.Properties, item => Assert.Equal(CountyId, item.CountyId));
        Assert.All(captured.CamaFacts, item => Assert.Equal(CountyId, item.CountyId));
        Assert.All(captured.LandFacts, item => Assert.Equal(CountyId, item.CountyId));
        Assert.All(captured.CostFactorSets, item => Assert.Equal(CountyId, item.CountyId));
        Assert.All(captured.DepreciationSchedules, item => Assert.Equal(CountyId, item.CountyId));
    }

    [Fact]
    public async Task Shadow_MissingPermissionSkipsConsumerAndPreservesLegacyResponse()
    {
        await using var db = CreateDb();
        var consumer = new Mock<IForgeCanonicalCostConsumer>(MockBehavior.Strict);
        var legacy = LegacyResult();
        var controller = CreateController(
            db, consumer.Object, ForgeCanonicalConsumerMode.Shadow, legacy, includePermission: false);

        var response = Assert.IsType<OkObjectResult>(
            await controller.GetCostApproach(ParcelId, TaxYear, CancellationToken.None));

        Assert.Same(legacy, response.Value);
        consumer.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Shadow_FailureDoesNotRelabelOrReplaceLegacyResponse()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        var consumer = new Mock<IForgeCanonicalCostConsumer>();
        consumer.Setup(service => service.ConsumeAsync(
                It.IsAny<ForgeCanonicalConsumerRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("synthetic fail-closed proof"));
        var legacy = LegacyResult();
        var controller = CreateController(db, consumer.Object, ForgeCanonicalConsumerMode.Shadow, legacy);

        var response = Assert.IsType<OkObjectResult>(
            await controller.GetCostApproach(ParcelId, TaxYear, CancellationToken.None));

        Assert.Same(legacy, response.Value);
        Assert.Equal("legacy-db", Assert.IsType<CostApproachResult>(response.Value).Source);
    }

    [Fact]
    public async Task Shadow_AmbiguousPropertyFailsClosedWithoutConsumerInvocation()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        db.Properties.Add(new Property
        {
            CountyId = CountyId,
            PropertyId = "PROP-AMBIGUOUS",
            ParcelId = ParcelId,
            ParcelNumber = "ALIAS-AMBIGUOUS",
            Address = "synthetic",
            LandValue = 75m,
            TaxYear = TaxYear,
        });
        await db.SaveChangesAsync();
        var consumer = new Mock<IForgeCanonicalCostConsumer>(MockBehavior.Strict);
        var legacy = LegacyResult();
        var controller = CreateController(db, consumer.Object, ForgeCanonicalConsumerMode.Shadow, legacy);

        var response = Assert.IsType<OkObjectResult>(
            await controller.GetCostApproach(ParcelId, TaxYear, CancellationToken.None));

        Assert.Same(legacy, response.Value);
        consumer.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Shadow_AmbiguousScheduleFailsClosedWithoutConsumerInvocation()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        db.CostFactorSets.Add(new CostFactorSet
        {
            CountyId = CountyId,
            EffectiveYear = TaxYear,
            Version = "cost-ambiguous",
            ProvenanceAuthor = "synthetic",
        });
        await db.SaveChangesAsync();
        var consumer = new Mock<IForgeCanonicalCostConsumer>(MockBehavior.Strict);
        var legacy = LegacyResult();
        var controller = CreateController(db, consumer.Object, ForgeCanonicalConsumerMode.Shadow, legacy);

        var response = Assert.IsType<OkObjectResult>(
            await controller.GetCostApproach(ParcelId, TaxYear, CancellationToken.None));

        Assert.Same(legacy, response.Value);
        consumer.VerifyNoOtherCalls();
    }

    private static ForgeController CreateController(
        DataDbContext db,
        IForgeCanonicalCostConsumer consumer,
        ForgeCanonicalConsumerMode mode,
        CostApproachResult legacy,
        bool includePermission = true)
    {
        var valuation = new Mock<IValuationService>();
        valuation.Setup(service => service.CalculateCostApproachAsync(
                ParcelId, TaxYear, It.IsAny<CancellationToken>()))
            .ReturnsAsync(legacy);
        var controller = new ForgeController(
            valuation.Object,
            db,
            NullLogger<ForgeController>.Instance,
            consumer,
            Options.Create(new RustKernelsOptions { ForgeCanonicalConsumerMode = mode }));
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "synthetic-assessor"),
            new("countyId", CountyId.ToString()),
        };
        if (includePermission)
            claims.Add(new Claim("perm", "access:forge"));
        var context = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(claims, "SyntheticAuth")),
        };
        context.Items["CorrelationId"] = CorrelationId;
        controller.ControllerContext = new ControllerContext { HttpContext = context };
        return controller;
    }

    private static DataDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        return new DataDbContext(options, configuration);
    }

    private static async Task SeedAsync(DataDbContext db)
    {
        db.Properties.AddRange(
            new Property
            {
                CountyId = CountyId,
                PropertyId = "PROP-001",
                ParcelId = ParcelId,
                ParcelNumber = "ALIAS-001",
                Address = "synthetic",
                LandValue = 50m,
                TaxYear = TaxYear,
            },
            new Property
            {
                CountyId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                PropertyId = "OTHER-PROP",
                ParcelId = ParcelId,
                ParcelNumber = "OTHER-ALIAS",
                Address = "synthetic",
                LandValue = 999m,
                TaxYear = TaxYear,
            },
            new Property
            {
                CountyId = CountyId,
                PropertyId = "WRONG-YEAR-PROP",
                ParcelId = ParcelId,
                ParcelNumber = "WRONG-YEAR-ALIAS",
                Address = "synthetic",
                LandValue = 888m,
                TaxYear = TaxYear - 1,
            });
        db.CamaCharacteristics.Add(new CamaCharacteristic
        {
            CountyId = CountyId,
            ParcelId = ParcelId,
            TaxYear = TaxYear,
            BuildingType = "R1",
            SquareFeet = 100m,
            EffectiveAge = 10,
        });
        db.CostFactorSets.Add(new CostFactorSet
        {
            CountyId = CountyId,
            EffectiveYear = TaxYear,
            Version = "cost-2026",
            ProvenanceAuthor = "synthetic",
            Factors =
            [
                new TerraFusion.Core.Entities.Forge.CostFactor
                {
                    ImprovementClassCode = "R1",
                    UnitCostPerSqFt = 3m,
                },
            ],
        });
        db.DepreciationSchedules.Add(new DepreciationSchedule
        {
            CountyId = CountyId,
            EffectiveYear = TaxYear,
            Version = "depreciation-2026",
            ProvenanceAuthor = "synthetic",
            Factors =
            [
                new DepreciationFactor
                {
                    AgeMinYears = 0,
                    AgeMaxYears = 20,
                    DepreciationFraction = 0.1m,
                },
            ],
        });
        await db.SaveChangesAsync();
    }

    private static CostApproachResult LegacyResult() => new()
    {
        ParcelId = ParcelId,
        TaxYear = TaxYear,
        IndicatedValue = 320m,
        Source = "legacy-db",
    };

    private static ForgeCanonicalConsumerResult ShadowResult()
    {
        var pin = new ForgeCostSchedulePin(
            CountyId, TaxYear, Guid.NewGuid(), "cost-2026", new string('a', 64),
            Guid.NewGuid(), "depreciation-2026", new string('b', 64));
        var identity = new ForgeCanonicalRequestIdentity(CountyId, ParcelId, TaxYear, CorrelationId);
        var projection = new ForgeCanonicalCostConsumerProjectionResult(
            identity,
            pin,
            new string('c', 64),
            3m,
            0.1m,
            300m,
            30m,
            270m,
            50m,
            320m,
            new ForgeCanonicalValuationRequest(ParcelId, 300d, 30d, 270d, 50d));
        return new(
            new ForgeCanonicalCostConsumerValidatedResult(projection, 320m, 50m, 270m),
            new ForgeCanonicalConsumerEvidence(
                CorrelationId,
                new string('c', 64),
                new string('d', 64),
                new string('e', 64),
                "git:24059c3642339f36877cb454ca63683180915b71",
                "audit-synthetic",
                128,
                new string('f', 64),
                0,
                new string('0', 64)));
    }
}
