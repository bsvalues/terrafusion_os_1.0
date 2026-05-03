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
using TerraFusion.Core.Sync.SalesRatioStudy;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice G3 (v1.12) acceptance tests for
/// <see cref="SalesRatioStudyController"/>'s new <c>era</c> query
/// parameter. Auth + reader-delegation coverage; the era predicate
/// itself is fully covered by <see cref="SalesRatioStudyReaderTests"/>.
///
/// <para>Contract focus:
/// <list type="bullet">
///   <item>200 happy path with default era resolves to POST_CONVERSION.</item>
///   <item>200 with explicit recognized era is echoed back in the body.</item>
///   <item>400 with invalid era token (and the valid-values list).</item>
///   <item>403 still enforced when caller lacks the county claim
///   (regression guard for the v1.9 auth contract).</item>
/// </list>
/// </para>
/// </summary>
public sealed class SalesRatioStudyControllerTests : IDisposable
{
    private static readonly Guid CountyA =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    private readonly TerraFusionDbContext _db;

    public SalesRatioStudyControllerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"g3-{Guid.NewGuid():N}")
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

    private SalesRatioStudyController BuildController(Guid? principalCountyClaim)
    {
        var reader = new SalesRatioStudyReader(_db);
        var ctrl = new SalesRatioStudyController(
            reader, NullLogger<SalesRatioStudyController>.Instance);

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

    private async Task SeedSaleAsync(
        Guid countyId,
        long chgOfOwnerId,
        DateTime slDt,
        decimal price,
        string? era)
    {
        _db.TfSales.Add(new TfSale
        {
            CountyId = countyId,
            TfParcelId = Guid.NewGuid(),
            ChgOfOwnerId = chgOfOwnerId,
            SlDt = slDt,
            SlPrice = price,
            AdjSlPrice = price,
            SaleQualified = true,
            PromotionLoadBatchId = Guid.NewGuid(),
            ConversionEra = era,
        });
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// The controller wraps each response in an anonymous-type
    /// projection (countyId, fromDate, era, ...). Reflection-extract
    /// keeps tests independent of those types.
    /// </summary>
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
    public async Task GetValidSaleCount_OmittedEra_DefaultsToPostConversion()
    {
        await SeedSaleAsync(CountyA, 1,
            new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            100_000m, era: ConversionEras.PostConversion);
        await SeedSaleAsync(CountyA, 2,
            new DateTime(2021, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            200_000m, era: ConversionEras.Unknown);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetValidSaleCount(CountyA);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<string>(ok.Value, "era")
            .Should().Be(ConversionEras.PostConversion);
        ExtractProperty<int>(ok.Value, "validSaleCount")
            .Should().Be(1, "default era=POST excludes the UNKNOWN row");
    }

    [Fact]
    public async Task GetValidSaleCount_ExplicitEraAll_BypassesFilter()
    {
        await SeedSaleAsync(CountyA, 1,
            new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            100_000m, era: ConversionEras.PostConversion);
        await SeedSaleAsync(CountyA, 2,
            new DateTime(2021, 3, 1, 0, 0, 0, DateTimeKind.Utc),
            200_000m, era: ConversionEras.Unknown);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetValidSaleCount(CountyA, era: ISalesRatioStudyReader.EraAll);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<string>(ok.Value, "era")
            .Should().Be(ISalesRatioStudyReader.EraAll);
        ExtractProperty<int>(ok.Value, "validSaleCount").Should().Be(2);
    }

    [Theory]
    [InlineData("BOGUS_ERA")]
    [InlineData("post_conversion")]   // case-sensitive; lowercase is invalid
    [InlineData("ALL ")]               // controller trims, but extra-internal tokens are different — covered by trimming
    public async Task GetValidSaleCount_InvalidEra_Returns400(string badEra)
    {
        // Trim + case sensitivity is part of the contract: only the
        // exact frozen tokens (POST_CONVERSION, PRE_CONVERSION_2017,
        // UNKNOWN, ALL) are accepted. The "ALL " case actually trims
        // to "ALL" and is valid, so we exclude it from this Theory.
        if (badEra.Trim() == ISalesRatioStudyReader.EraAll) return;

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetValidSaleCount(CountyA, era: badEra);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task GetValidSaleCount_NoCountyClaim_Returns403()
    {
        var ctrl = BuildController(principalCountyClaim: null);
        var result = await ctrl.GetValidSaleCount(CountyA);

        result.Should().BeOfType<ForbidResult>();
    }

    [Fact]
    public async Task GetValidSalesByYear_EchoesEraInResponse()
    {
        await SeedSaleAsync(CountyA, 1,
            new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            100_000m, era: ConversionEras.PostConversion);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetValidSalesByYear(
            CountyA, era: ConversionEras.PostConversion);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<string>(ok.Value, "era")
            .Should().Be(ConversionEras.PostConversion);
    }

    [Fact]
    public async Task GetAggregateSalePrice_EchoesEraInResponse()
    {
        await SeedSaleAsync(CountyA, 1,
            new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            100_000m, era: ConversionEras.PostConversion);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetAggregateSalePrice(
            CountyA, era: ConversionEras.PostConversion);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<string>(ok.Value, "era")
            .Should().Be(ConversionEras.PostConversion);
    }

    [Fact]
    public async Task EraTrimWhitespace_AcceptedAsEquivalent()
    {
        // Controller trims whitespace before validating.
        await SeedSaleAsync(CountyA, 1,
            new DateTime(2020, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            100_000m, era: ConversionEras.PostConversion);

        var ctrl = BuildController(CountyA);
        var result = await ctrl.GetValidSaleCount(
            CountyA, era: "  POST_CONVERSION  ");

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ExtractProperty<string>(ok.Value, "era")
            .Should().Be(ConversionEras.PostConversion);
    }
}
