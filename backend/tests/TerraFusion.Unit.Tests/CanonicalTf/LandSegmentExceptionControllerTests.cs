using System;
using System.Collections.Generic;
using System.Reflection;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.LandSegmentException;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice F4 acceptance tests for
/// <see cref="LandSegmentExceptionController"/>. Auth + reader-
/// delegation coverage; the anomaly taxonomy and era predicate
/// are fully covered by
/// <see cref="LandSegmentExceptionReaderTests"/>.
///
/// <para>Contract focus:
/// <list type="bullet">
///   <item>200 happy path with default era resolves to POST_CONVERSION.</item>
///   <item>200 with explicit recognized era is echoed back in the body.</item>
///   <item>400 with invalid era token (and the valid-values list).</item>
///   <item>403 enforced when caller lacks the county claim.</item>
///   <item>maxResults clamping behavior.</item>
/// </list>
/// </para>
/// </summary>
public sealed class LandSegmentExceptionControllerTests : IDisposable
{
    private static readonly Guid CountyA =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid CountyB =
        Guid.Parse("48484848-4848-4848-4848-484848484848");

    private readonly TerraFusionDbContext _db;

    public LandSegmentExceptionControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"f4-ctrl-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private LandSegmentExceptionController BuildController(Guid? principalCountyClaim)
    {
        var reader = new LandSegmentExceptionReader(_db);
        var ctrl = new LandSegmentExceptionController(
            reader, NullLogger<LandSegmentExceptionController>.Instance);

        var identity = new ClaimsIdentity(
            authenticationType: principalCountyClaim is null ? null : "Test");
        if (principalCountyClaim is not null)
        {
            identity.AddClaim(new Claim("countyId", principalCountyClaim.Value.ToString()));
        }
        ctrl.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(identity),
            },
        };
        return ctrl;
    }

    private async Task SeedAnomalousLandAsync(
        Guid countyId,
        string? era = ConversionEras.PostConversion)
    {
        _db.TfLands.Add(new TfLand
        {
            CountyId = countyId,
            TfParcelId = Guid.NewGuid(),
            // null market val → MissingMarketVal anomaly fires
            LandSegMarketVal = null,
            SizeAcres = 5m,
            LandSegTypeCd = "RES",
            LandSegStateCd = "WA",
            ConversionEra = era,
            PromotionLoadBatchId = Guid.NewGuid(),
        });
        await _db.SaveChangesAsync();
    }

    private static T ExtractProperty<T>(object? body, string name)
    {
        body.Should().NotBeNull();
        var prop = body!.GetType().GetProperty(
            name, BindingFlags.Public | BindingFlags.Instance);
        prop.Should().NotBeNull($"response body should expose '{name}'");
        var value = prop!.GetValue(body);
        value.Should().BeOfType<T>();
        return (T)value!;
    }

    [Fact]
    public async Task GetExceptions_OmittedEra_DefaultsToPostConversion()
    {
        await SeedAnomalousLandAsync(CountyA, ConversionEras.PostConversion);
        await SeedAnomalousLandAsync(CountyA, ConversionEras.PreConversion2017);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetExceptions();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<string>(ok.Value, "era")
            .Should().Be(ConversionEras.PostConversion);
        ExtractProperty<int>(ok.Value, "count")
            .Should().Be(1, "default era=POST excludes the PRE row");
    }

    [Fact]
    public async Task GetExceptions_ExplicitEraAll_BypassesFilter()
    {
        await SeedAnomalousLandAsync(CountyA, ConversionEras.PostConversion);
        await SeedAnomalousLandAsync(CountyA, ConversionEras.PreConversion2017);
        await SeedAnomalousLandAsync(CountyA, ConversionEras.Unknown);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetExceptions(era: ILandSegmentExceptionReader.EraAll);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<string>(ok.Value, "era")
            .Should().Be(ILandSegmentExceptionReader.EraAll);
        ExtractProperty<int>(ok.Value, "count").Should().Be(3);
    }

    [Theory]
    [InlineData("BOGUS_ERA")]
    [InlineData("post_conversion")]
    public async Task GetExceptions_InvalidEra_Returns400(string badEra)
    {
        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetExceptions(era: badEra);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetExceptions_NoCountyClaim_Returns403()
    {
        var ctrl = BuildController(principalCountyClaim: null);
        var result = await ctrl.GetExceptions();

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetExceptions_CrossCounty_NotLeaked()
    {
        // Caller is CountyA; only CountyB has anomalies.
        // The endpoint resolves countyId from the claim, so the
        // caller can never see CountyB's rows.
        await SeedAnomalousLandAsync(CountyB);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetExceptions();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<int>(ok.Value, "count")
            .Should().Be(0, "claim-scoped query never crosses counties");
        ExtractProperty<Guid>(ok.Value, "countyId")
            .Should().Be(CountyA);
    }

    [Fact]
    public async Task GetExceptions_DefaultMaxResults_EchoedInResponse()
    {
        await SeedAnomalousLandAsync(CountyA);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetExceptions();

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<int>(ok.Value, "maxResults")
            .Should().Be(ILandSegmentExceptionReader.DefaultMaxResults);
    }

    [Fact]
    public async Task GetExceptions_MaxResultsAboveCeiling_ClampedTo1000()
    {
        await SeedAnomalousLandAsync(CountyA);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetExceptions(maxResults: 99_999);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<int>(ok.Value, "maxResults")
            .Should().Be(ILandSegmentExceptionReader.AbsoluteMaxResults);
    }

    [Fact]
    public async Task GetExceptions_NegativeMaxResults_ResolvedToDefault()
    {
        await SeedAnomalousLandAsync(CountyA);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetExceptions(maxResults: -1);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<int>(ok.Value, "maxResults")
            .Should().Be(ILandSegmentExceptionReader.DefaultMaxResults);
    }

    [Fact]
    public async Task EraTrimWhitespace_AcceptedAsEquivalent()
    {
        await SeedAnomalousLandAsync(CountyA);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetExceptions(era: "  POST_CONVERSION  ");

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<string>(ok.Value, "era")
            .Should().Be(ConversionEras.PostConversion);
    }
}
